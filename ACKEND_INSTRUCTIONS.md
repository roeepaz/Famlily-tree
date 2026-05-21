# Project System Architecture: Kinship Backend (Node.js + Supabase)

You are an expert backend engineer tasked with building the robust database schema and API layer for "Kinship" — a private family network and knowledge base. 

The frontend UI components have already been generated using React Native Web/Tailwind. Your sole focus is building a secure, type-safe Node.js (TypeScript) API server and integrating it seamlessly with Supabase (PostgreSQL).

---

## Core Technical Stack Constraints
- **Language:** Node.js with TypeScript (`strict: true`)
- **Database / Auth / Storage:** Supabase (PostgreSQL)
- **Database Connector / ORM:** Prisma ORM
- **Framework:** Express.js or Fastify (Choose whichever allows cleaner TypeScript routing)

---

## Phase 1: Database Schema Architecture (Supabase PostgreSQL)
Initialize Prisma and define the following schema relations inside a robust, clean PostgreSQL structure. Ensure all foreign key deletions cascade appropriately.

1. **Profiles Table**
   - Linked to Supabase Auth (`auth.users`).
   - Fields: `id` (UUID, PK), `first_name`, `last_name`, `avatar_url`, `birth_date`, `is_deceased` (boolean), `family_branch_name` (e.g., "Smith Circle"), `created_at`.

2. **Relationships Table (The Network Graph)**
   - Maps connections between users.
   - Fields: `id` (UUID), `person_id` (References Profiles), `relative_id` (References Profiles), `relationship_type` (Enum: 'PARENT', 'CHILD', 'SPOUSE').
   - Unique Constraint: On combination of `(person_id, relative_id, relationship_type)`.

3. **Posts Table (The Social Feed)**
   - Fields: `id` (UUID), `author_id` (References Profiles), `content` (TEXT), `image_url` (nullable), `created_at`.

4. **Heritage_Vault Table (Historical Timeline)**
   - Fields: `id` (UUID), `title`, `description`, `event_date` (TIMESTAMP), `created_by` (References Profiles), `media_urls` (TEXT[] array for archived images/documents).

---

## Phase 2: Tasks to Execute Automatically
Please perform the following autonomous actions in the sandbox terminal and codebase:

1. **Scaffold Project Structure:** Create a clean `/src` folder holding separate directories for `/controllers`, `/routes`, `/models`, and `/middleware`.
2. **Configuration Setup:** Establish a `.env.example` file declaring necessary configurations (`DATABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`, etc.).
3. **Prisma & Dependencies Hookup:** Initialize npm, install TypeScript types, Express, Prisma, and `@supabase/supabase-js`. Generate the Prisma client.
4. **Implement Core Graph Query Logic:**
   - Create a service function `getFamilyCircle(userId)`. Write a performant query (using a recursive approach or multi-step join query) that accurately fetches immediate relatives and their branches.
   - Write a middleware validation check that ensures a user can *only* view a post or heritage event if they share a structural family link with the author.

---

## Phase 3: Deliverables Tracking
Before concluding, ensure you have verified your code compiles error-free with `tsc`. Generate an implementation plan artifact summarizing the created routes and database models.