# Kinship — Production-Ready Implementation Blueprint
> **System Status:** Architecture Draft (v1.0.0)  
> **Target Environment:** Node.js (TypeScript) + Supabase (PostgreSQL) + Prisma ORM + React Native Web (Tailwind CSS)

---

## 1. Executive Summary & Core Concept

**Kinship** is a professional, high-scale private social network and historical knowledge base designed exclusively for families. Unlike traditional social networks that rely on explicit "friend requests" or flat, isolated family trees that don't scale, Kinship models human relationships as a dynamic, interconnected structural graph.

### The Problem with Flat Models
Traditional relational databases struggle with infinite nested hierarchies (e.g., finding a cousin's spouse's parents). Querying these structures usually requires expensive nested SQL `JOIN` statements that quickly degrade server performance as user data scales.

### The Kinship Architecture Solution
Kinship implements an **Inferred Circle Engine** using PostgreSQL Graph Theory. Users do not manually create or manage distinct "Family Circles." Instead, circles are calculated mathematically on-the-fly based on the structural paths and degrees of separation between nodes. When two long-lost relative threads connect, their networks instantly fuse into a single, unified extended family tree.

---

## 2. Core Architectural Pillars

### A. The Split-Profile Pattern
Security and business logic are entirely isolated. All user authentication, credential encryption, and session JWT operations are handled inside Supabase's protected `auth.users` system table. The core database links to this authentication engine via a public-facing `profiles` table using a Shared Unique Identifier (`UUID`).

### B. Inferred Relationship Graph
All human connections are captured in a single join table (`relationships`) that declares a directional structural connection (`person_id` $\rightarrow$ `relative_id`) assigned to a specific kinship designation type (`PARENT`, `CHILD`, `SPOUSE`).

### C. Recursive Authorization & View Filtering
To guarantee privacy, no data is globally accessible. When a user requests a social media feed post, a profile page, or an archival asset from the Heritage Vault, a recursive database middleware checks the relationship graph. The data is only returned if the requesting user's ID shares a valid structural connection path within a defined maximum boundary limit (degrees of separation).

---

## 3. Comprehensive Database Schema (Prisma Blueprint)

The following schema configuration file defines the complete database infrastructure using Prisma syntax. Copy this directly into your backend architecture file system setup.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-node"
}

enum RelationshipType {
  PARENT
  CHILD
  SPOUSE
}

enum VisibilityTier {
  CORE_CIRCLE      // 1 Degree of separation (Immediate Family Only)
  EXTENDED_CIRCLE  // 2-3 Degrees of separation (Cousins, Aunts, In-laws)
  HERITAGE_VAULT   // Connected to the tree graph boundary uniformly
}

enum PostType {
  DAILY_LIFE
  MILESTONE
  MEMORY
}

model Profile {
  id                String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email             String?        @unique @db.VarChar(255)
  firstName         String         @map("first_name") @db.VarChar(100)
  lastName          String         @map("last_name") @db.VarChar(100)
  avatarUrl         String?        @map("avatar_url") @db.VarChar(500)
  birthDate         DateTime?      @map("birth_date") @db.Date
  isDeceased        Boolean        @default(false) @map("is_deceased")
  familyBranchName  String?        @map("family_branch_name") @db.VarChar(100)
  isActive          Boolean        @default(false) @map("is_active")
  createdAt         DateTime       @default(now()) @map("created_at") @db.Timestamp(6)

  // Explicit Relations
  sourceRelationships Relationship[] @relation("SourcePerson")
  targetRelationships Relationship[] @relation("TargetPerson")
  posts               Post[]
  vaultItems          HeritageVault[]

  @@map("profiles")
}

model Relationship {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  personId         String           @map("person_id") @db.Uuid
  relativeId       String           @map("relative_id") @db.Uuid
  relationshipType RelationshipType @map("relationship_type")
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamp(6)

  // Graph Connections
  person           Profile          @relation("SourcePerson", fields: [personId], references: [id], onDelete: Cascade)
  relative         Profile          @relation("TargetPerson", fields: [relativeId], references: [id], onDelete: Cascade)

  @@unique([personId, relativeId, relationshipType], name: "unique_relationship_constraint")
  @@map("relationships")
}

model Post {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  authorId       String         @map("author_id") @db.Uuid
  content        String         @db.Text
  imageUrl       String?        @map("image_url") @db.VarChar(500)
  eventType      PostType       @default(DAILY_LIFE) @map("event_type")
  visibilityTier VisibilityTier @default(EXTENDED_CIRCLE) @map("visibility_tier")
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamp(6)

  author         Profile        @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("posts")
}

model HeritageVault {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String   @db.VarChar(255)
  description String   @db.Text
  eventDate   DateTime @map("event_date") @db.Date
  createdBy   String   @map("created_by") @db.Uuid
  mediaUrls   String[] @map("media_urls")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamp(6)

  creator     Profile  @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@map("heritage_vault")
}
```

---

## 4. Advanced Graph Traversal Logic (SQL Engine)

To resolve dynamic circles without flattening data into multiple intersecting user lists, we execute a **Recursive Common Table Expression (CTE)** query. This runs directly in PostgreSQL via our business layer.

```sql
CREATE OR REPLACE FUNCTION get_family_circle_ids(viewer_uuid UUID, max_separation_degrees INT DEFAULT 3)
RETURNS TABLE (profile_id UUID, path_degree INT) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE graph_crawler AS (
        -- Anchor Member: Target the initial profile requesting the data view
        SELECT 
            person_id AS current_node, 
            relative_id AS next_node, 
            1 AS current_degree
        FROM relationships
        WHERE person_id = viewer_uuid

        UNION

        -- Recursive Step: Branch outwards to evaluate connections of found connections
        SELECT 
            r.person_id, 
            r.relative_id, 
            gc.current_degree + 1
        FROM relationships r
        INNER JOIN graph_crawler gc ON r.person_id = gc.next_node
        WHERE gc.current_degree < max_separation_degrees
    )
    SELECT DISTINCT next_node, current_degree FROM graph_crawler;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Automated Onboarding & Node Fusion Protocol

To make graph acquisition friction-free, users can map un-onboarded family lines using a distinct lifecycle mechanism:

### Workflow Diagram
1. **Creation:** User A creates a tree record and attaches a new parent node. Because that parent is not an application user, the system creates a placeholder Profile row with `is_active = false` and `email = 'target@email.com'`.
2. **Invitation:** The server yields a cryptographically protected token mapping back to that placeholder profile identifier.
3. **Fusion Check:** The invited user opens the register view, passing their invite token. The server signs them up via Supabase Auth.
4. **Fusing Event:** Instead of spinning up a fresh profile record, the PostgreSQL database catches the initialization event, maps their new secure Supabase Auth `UUID` directly onto the old placeholder profile record, and flags `is_active = true`. The new user instantly inherits their entire connected family tree without manual data entry.

### Supabase Automation Trigger Script
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_fusing_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine if a placeholder profile node already stands ready for this targeted invite email
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = NEW.email AND is_active = false) THEN
    UPDATE public.profiles 
    SET id = NEW.id, is_active = true
    WHERE email = NEW.email;
  ELSE
    -- If no historical placeholder invite is present, initialize a standard base root profile node
    INSERT INTO public.profiles (id, email, first_name, last_name, is_active)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'First Name'), 
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'Last Name'),
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Database Fusing Strategy to Supabase Auth Pipeline Core Engine Execution Loops
CREATE OR REPLACE TRIGGER execution_on_supabase_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_fusing_registration();
```

---

## 6. Phase-by-Phase Development Roadmap

```text
┌────────────────────────────────────────────────────────┐
│ PHASE 1: LOCAL ENVIRONMENT SETUP & DOCKER CONTEXT       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 2: PRISMA MIGRATIONS & POSTGRESQL TRIGGERS       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 3: AUTH SECURITY GATEWAY & CONTROLLERS           │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 4: GRAPH ALGORITHM MIDDLEWARE INTEGRATION        │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 5: API CONNECTOR HOOKUP TO BASE44 FRONTEND      │
└────────────────────────────────────────────────────────┘
```

### Phase 1: Local Environment Setup & Docker Context
- Install Docker Desktop on your development laptop.
- Navigate to your `/backend` directory root and run the Supabase CLI initialization sequence:
  ```bash
  npx supabase init
  npx supabase start
  ```
- This launches a complete, local mirror instance of Supabase (PostgreSQL, Studio Dashboard, Auth, Storage) running right inside your laptop engine components at `http://localhost:54321`.

### Phase 2: Prisma Migrations & PostgreSQL Triggers
- Configure your local `.env` setup file, declaring your local database connection variable:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public"
  ```
- Write your schema rules inside `prisma/schema.prisma` using the code block provided in Section 3.
- Generate your type-safe database models and push the migration payload straight to your local system:
  ```bash
  npx prisma migrate dev --name initialize_kinship_graph_schema
  ```
- Open your local Supabase Studio panel, navigate to the Query Editor tab, and apply the triggers from Sections 4 and 5.

### Phase 3: Auth Security Gateway & Controllers
- Establish your foundational TypeScript API server layout using Express or Fastify frameworks.
- Implement an absolute Auth validation middleware layer (`/src/middleware/authFilter.ts`) that intercept incoming API requests:
  - Extract the raw Bearer JWT token from the `Authorization` standard request header.
  - Verify the validity of the session using the `@supabase/supabase-js` client tool wrapper library.
  - Inject the decrypted validation properties into the active pipeline context payload: `req.user = { id: payload.sub, email: payload.email }`.

### Phase 4: Graph Algorithm Middleware Integration
- Build out the automated circle computation routines. Create a specialized routing controller file `/src/middleware/graphGuard.ts`.
- Every time a user attempts to access a specific profile view route (`/api/profiles/:targetId`), the server intercept the request and calls our recursive database function:
  ```typescript
  const parsedRelationships = await prisma.$queryRaw`SELECT * FROM get_family_circle_ids(${req.user.id}::uuid, 3)`;
  ```
- Check if the requested target profile ID exists inside the generated list of accessible IDs. If it is not found, drop the connection immediately with a strict `403 Forbidden` response to protect privacy.

### Phase 5: API Connector Hookup to Base44 Frontend
- Open your pre-built frontend web interface repository (the code from your Base44 session).
- Locate the mock data objects defined at the top of your visual layout files.
- Replace those static placeholder arrays with modern asynchronous react hooks (`useEffect` or `TanStack Query`).
- Update your form submission buttons (e.g., "Add Relative", "Post Life Update") to dispatch `fetch()` or `axios.post()` network requests targeted directly at your active local API engine endpoints (`http://localhost:3000/api/v1/...`).