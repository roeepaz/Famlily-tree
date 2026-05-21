# KINSHIP — MASTER SYSTEM ARCHITECTURE & AI INSTRUCTIONS
> This file is a permanent, living document. It serves as the absolute source of truth for all AI agents, engineers, and autonomous code assistants working on this repository. Read this file before writing, modifying, or refactoring any code.

---

## 1. PRODUCT VISION & CORE INTENT
"Kinship" is a highly secure, private digital space designed exclusively for extended families to build a collective knowledge base and stay connected. It is a "Social Network meets Family Tree" where the family unit is the absolute center.

### Core Philosophy:
- **Closeness over Clutter:** The UI/UX must feel warm, emotionally grounding, and safe. It should encourage sharing life updates, archiving history, and keeping track of family connections.
- **Privacy by Default:** Data is strictly guarded. Users can only see information, social feeds, or historical content if they share a structural family link (connection path) to the author.
- **Dynamic Growth:** The application must scale as families grow. Instead of isolated family trees, the system relies on a unified relationship graph where connecting two users automatically merges their respective "Family Circles".

---

## 2. TECHNICAL STACK BOUNDARIES
To maintain clean separation and robust scalability, the project is strictly decoupled:

- **Frontend:** Built via React Native Web + Tailwind CSS (Initialized via Base44). It is a unified codebase capable of targeting Web today, and native iOS/Android mobile apps in the future.
- **Backend:** Node.js API server written in structured, strict TypeScript (`strict: true`).
- **Database / Infrastructure:** Supabase (PostgreSQL) managed via Prisma ORM.
- **Authentication:** Supabase Auth handles user sessions, invitations, and secure routing.

---

## 3. FILE LAYOUT & CODEBASE STRUCTURE
AI agents must adhere to this structural blueprint when editing or adding files:

```text
├── /backend           # Node.js + TypeScript API Layer
│   ├── /src
│   │   ├── /config       # Supabase & environment variables setup
│   │   ├── /controllers  # Request handling & input validation logic
│   │   ├── /routes       # API Endpoints (Express/Fastify routing)
│   │   ├── /services     # Core business logic & database queries
│   │   ├── /middleware   # Security, Auth state validation, Family Graph authorization
│   │   └── app.ts        # Server entry point
│   ├── prisma/           # Prisma migrations and relational schema configuration
│   ├── tsconfig.json
│   └── package.json
└── AGENTS.md          # This file (System Source of Truth)