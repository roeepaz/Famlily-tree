# MASTER AGENT INSTRUCTION ENGINE: KINSHIP GRAPH & MULTI-TENANT ARCHITECTURE
> **File Role:** `AGENTS.md` / `BACKEND_PROPULSION.md`  
> **Target Execution Layer:** Antigravity 2.0 Autonomous Agent Sandbox Loop  
> **Systems Scope:** Node.js (TypeScript Server) + Supabase (PostgreSQL Federated Layers) + Prisma ORM Client

This document serves as an immutable, step-by-step technical implementation instruction script for the Antigravity agent. It details the precise algorithmic and architectural steps required to deploy a multi-tenant family graph structure using **Hidden Tree IDs** and **Inferred Relationship Graph Traversal**.

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

To achieve massive scale and eliminate redundant relational entry pipelines, the system avoids flat relational mapping and hardcoded multi-degree connections. The infrastructure relies on two core design paradigms:
1. **The Isolation Barrier (Hidden Tree ID):** Multi-tenant partition strategy isolating families securely through an absolute, index-optimized space identifier (`tree_id`).
2. **Immediate Node Graph Adjacency:** Storing exclusively zero-hop, direct dependencies (`PARENT`, `CHILD`, `SPOUSE`) while calculating complex relative identities dynamically on runtime requests using algorithmic matrix sweeps.

---

## 2. COMPREHENSIVE STEP-BY-STEP TASK MATRIX

### PHASE 1: SYSTEM SPECIFICATION & SCHEMA CONFIGURATION
#### THE WHY:
To support thousands of independent family networks sharing identical namespace properties (e.g., separate networks both choosing the string name "Smith Family") without cross-contamination. Storing explicit relationship rows for every extended degree (uncles, second cousins twice removed) creates combinatorial data bloat and makes manual error correction statistically impossible. Storing only direct adjacencies guarantees an tidy structure where corrections require only a single row update.

#### THE HOW:
Configure your `prisma/schema.prisma` file to map precisely to the target definition blocks below:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum KinshipDesignation {
  PARENT
  CHILD
  SPOUSE
}

enum VisibilityScope {
  CORE_CIRCLE
  EXTENDED_CIRCLE
  HERITAGE_VAULT
}

enum NarrativeType {
  DAILY_LIFE
  MILESTONE
  MEMORY
}

model FamilyTree {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String    @db.VarChar(100)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  profiles  Profile[]

  @@map("family_trees")
}

model Profile {
  id               String    @id @db.Uuid
  treeId           String?   @map("tree_id") @db.Uuid
  email            String?   @unique @db.VarChar(255)
  firstName        String    @map("first_name") @db.VarChar(100)
  lastName         String    @map("last_name") @db.VarChar(100)
  avatarUrl        String?   @map("avatar_url") @db.VarChar(500)
  birthDate        DateTime? @map("birth_date") @db.Date
  isDeceased       Boolean   @default(false) @map("is_deceased")
  isActive         Boolean   @default(false) @map("is_active")
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamp(6)

  familyTree          FamilyTree?    @relation(fields: [treeId], references: [id], onDelete: SetNull)
  sourceRelationships Relationship[] @relation("OriginatingNode")
  targetRelationships Relationship[] @relation("DestinationNode")
  posts               Post[]
  vaultItems          HeritageVault[]

  @@index([treeId])
  @@map("profiles")
}

model Relationship {
  id          String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  personId    String             @map("person_id") @db.Uuid
  relativeId  String             @map("relative_id") @db.Uuid
  kinshipType KinshipDesignation @map("kinship_type")
  createdAt   DateTime           @default(now()) @map("created_at") @db.Timestamp(6)

  person   Profile @relation("OriginatingNode", fields: [personId], references: [id], onDelete: Cascade)
  relative Profile @relation("DestinationNode", fields: [relativeId], references: [id], onDelete: Cascade)

  @@unique([personId, relativeId, kinshipType], name: "unique_adjacency_constraint")
  @@index([personId])
  @@index([relativeId])
  @@map("relationships")
}

model Post {
  id             String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  authorId       String          @map("author_id") @db.Uuid
  treeId         String          @map("tree_id") @db.Uuid
  content        String          @db.Text
  imageUrl       String?         @map("image_url") @db.VarChar(500)
  narrativeType  NarrativeType   @default(DAILY_LIFE) @map("narrative_type")
  visibilityScope VisibilityScope @default(EXTENDED_CIRCLE) @map("visibility_scope")
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamp(6)

  author Profile @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([treeId])
  @@index([authorId])
  @@map("posts")
}

model HeritageVault {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  treeId      String   @map("tree_id") @db.Uuid
  title       String   @db.VarChar(255)
  description String   @db.Text
  eventDate   DateTime @map("event_date") @db.Date
  createdBy   String   @map("created_by") @db.Uuid
  mediaUrls   String[] @map("media_urls")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamp(6)

  creator Profile @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@index([treeId])
  @@map("heritage_vault")
}
```

---

### PHASE 2: ALGORITHMIC INFERRED RELATIONSHIP ENGINE (POSTGRESQL FUNCTIONS)
#### THE WHY:
Instead of running hundreds of complex nested Javascript filtering matrices in memory at the Node server layer, processing graph paths natively within PostgreSQL using index-optimized memory registers drops calculation overhead down to sub-millisecond execution tiers.

#### THE HOW:
Inject the following native PL/pgSQL function straight into your Supabase database migration execution stream. This extracts all connected nodes inside the target boundaries of the requesting user's private hidden `tree_id`:

```sql
CREATE OR REPLACE FUNCTION public.calculate_inferred_network(viewer_uuid UUID, boundary_limit INT DEFAULT 3)
RETURNS TABLE (target_profile_id UUID, path_distance INT) AS $$
DECLARE
    target_tree_id UUID;
BEGIN
    SELECT tree_id INTO target_tree_id FROM public.profiles WHERE id = viewer_uuid;

    RETURN QUERY
    WITH RECURSIVE graph_crawler AS (
        SELECT 
            person_id AS active_node, 
            relative_id AS next_hop, 
            1 AS separation_degree
        FROM public.relationships
        WHERE person_id = viewer_uuid

        UNION

        SELECT 
            r.person_id, 
            r.relative_id, 
            gc.separation_degree + 1
        FROM public.relationships r
        INNER JOIN graph_crawler gc ON r.person_id = gc.next_hop
        INNER JOIN public.profiles p ON r.relative_id = p.id
        WHERE gc.separation_degree < boundary_limit
          AND p.tree_id = target_tree_id 
    )
    SELECT DISTINCT next_hop, separation_degree FROM graph_crawler;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### PHASE 3: AUTOMATED INHERITANCE TRIGGER & NODE FUSION SYSTEM
#### THE WHY:
When a new family member joins an active cluster, forcing them to manually configure their entire ancestor network causes interaction friction and risks broken data threads. By catching the registration session hook, we can seamlessly switch out placeholder entities and preserve the graph line automatically.

#### THE HOW:
Execute this trigger deployment script within the database management shell context to establish clean profile provisioning:

```sql
CREATE OR REPLACE FUNCTION public.handle_user_onboarding_fusion()
RETURNS TRIGGER AS $$
DECLARE
    placeholder_record RECORD;
BEGIN
  SELECT * INTO placeholder_record FROM public.profiles WHERE email = NEW.email AND is_active = false LIMIT 1;

  IF placeholder_record.id IS NOT NULL THEN
    UPDATE public.profiles 
    SET id = NEW.id, is_active = true
    WHERE email = NEW.email;

    UPDATE public.relationships SET person_id = NEW.id WHERE person_id = placeholder_record.id;
    UPDATE public.relationships SET relative_id = NEW.id WHERE relative_id = placeholder_record.id;
  ELSE
    INSERT INTO public.profiles (id, email, first_name, last_name, is_active)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'First'), 
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_on_auth_registration
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_onboarding_fusion();
```

---

### PHASE 4: THE AUTHENTICATION & SECURITY MIDDLEWARE MATRIX
#### THE WHY:
To protect private data and prevent unauthorized actors from reading private family posts or viewing trees across tenant boundaries.

#### THE HOW:
Implement a strict, type-safe security interceptor within `/src/middleware/graphGuard.ts` checking both the hidden `tree_id` and structural connectivity before exposing data vectors:

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedUserRequest extends Request {
  user?: {
    id: string;
    email: string;
    treeId: string;
  };
}

export async function verifyGraphAccessAuthorization(
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    const targetResourceId = req.params.id; 

    if (!viewerId) {
      return res.status(401).json({ error: "Missing authentication session context credentials" });
    }

    const targetResource = await prisma.post.findUnique({
      where: { id: targetResourceId },
      select: { treeId: true, authorId: true, visibilityScope: true }
    });

    if (!targetResource) {
      return res.status(404).json({ error: "The targeted resource record does not exist within this system" });
    }

    if (targetResource.treeId !== req.user?.treeId) {
      return res.status(403).json({ error: "Access Denied: Tenant boundary cross-contamination intercepted" });
    }

    if (targetResource.visibilityScope === 'CORE_CIRCLE') {
      const inferredCircle: any[] = await prisma.$queryRaw`
        SELECT * FROM public.calculate_inferred_network(${viewerId}::uuid, 1)
        WHERE target_profile_id = ${targetResource.authorId}::uuid
      `;
      if (inferredCircle.length === 0 && targetResource.authorId !== viewerId) {
        return res.status(403).json({ error: "Access Denied: Resource is locked to Immediate Core Circle nodes only" });
      }
    }

    return next();
  } catch (error) {
    return res.status(500).json({ error: "Internal algorithmic system evaluation failure encountered" });
  }
}
```

---

## 3. ACTIONABLE RUNTIME COMMAND DIRECTIVE FOR ANTIGRAVITY AGENT
"Read this document fully to comprehend the graph topology design pattern for the Kinship platform. Autonomously provision the local node infrastructure context, execute the necessary Prisma configurations using the multi-tenant models detailed here, establish local Dockerized PostgreSQL triggers matching the onboarding data layers, and implement the routing middleware matrices. Validate all typescript components pass zero-error compiler executions before finalizing the sweeping cycle."