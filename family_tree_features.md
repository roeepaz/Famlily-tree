# Feature Implementation Specification - Family Tree Application

This document outlines several product enhancements and bug fixes to be implemented in the family tree application. Please follow the technical details and design requirements below to execute the changes.

---

## 1. Remove Mandatory Phone Number Requirement from Onboarding
### Context & Motivation
Currently, users are forced to provide a phone number during the initial registration/onboarding flow. This creates high friction and drops conversion. The phone number should be optional at this stage, allowing users to explore the application and add personal details later when they are fully committed or when sharing features require it.

### Requirements
- **Database/Schema Changes:** - Update the user profile schema (e.g., Prisma schema, MongoDB collection, or Supabase tables) to make the `phoneNumber` / `phone` field **optional** (`nullable`).
- **Backend API Validation:**
  - Modify registration and onboarding DTOs/validation logic (e.g., Zod schemas, Joi, or built-in framework validators) to remove the mandatory constraint on the phone field.
- **Frontend/UI Changes:**
  - Remove the "required" indicator (asterisk `*`) from the phone number input field.
  - Allow form submission if the phone number field is blank.
  - Ensure clear placeholders or helper texts indicating that this field is optional (e.g., `"מספר טלפון (אופציונלי)"`).

---

## 2. Implement Person Deletion Functionality in the Tree Creation Screen
### Context & Motivation
In the tree creation/editing wizard, users can currently add family nodes, but there is no mechanism to remove or delete a person if an error is made. Users must be able to remove accidentally created nodes seamlessly.

### Requirements
- **Frontend UI:**
  - Add a visible deletion interactive element (e.g., a "Trash" icon `🗑️` or a "Delete/מחק" button) inside the person's card/node wrapper or within the modal where person details are updated.
  - Ensure the action is intuitive and available directly from the tree creation/editing viewport.
- **State Management & Logic:**
  - Implement a handler (e.g., `handleDeletePerson(personId)`) that updates the local frontend state representation of the family tree structure.
  - **Tree Integrity Rule:** Ensure that deleting a person correctly handles or warns about orphan nodes or broken connections (e.g., deleting a parent should cleanly unlink their relationship or prompt confirmation if it invalidates child paths).
- **UX Safeguard:**
  - Add a confirmation dialog/pop-up asking: `"האם אתה בטוח שברצונך למחוק אדם זה מהעץ?"` before finalizing deletion.

---

## 3. Visual Separation for Spouses in Tree Structure (Adjacent Layout)
### Context & Motivation
To clearly differentiate between a user's *siblings* and their *spouse* (partner), the visual layout must explicitly reflect the nature of the relationship. Spouses should not be stacked or aligned identically to siblings.

### Requirements
- **Layout & Positioning:**
  - Render the spouse/partner node in an **adjacent, side-by-side slot** connected directly to the primary node, distinct from the branch containing siblings.
  - Use visual connectors (lines/links) that indicate a marital/partnership bond rather than a sibling/generational line.
- **CSS / Component Structure:**
  - Update the node rendering logic so that a "Couple" unit forms a consolidated horizontal block.
  - Ensure appropriate padding and margin rules so that even when multiple siblings and spouses are rendered simultaneously, nodes do not overlap or misalign.

---

## 4. Set the Default Landing View to the Family Tree Screen
### Context & Motivation
The initial screen after a user logs in should be immediately engaging and showcase the core value proposition of the app. Starting directly on the visual Family Tree view is much more inviting and dynamic than a static dashboard or empty state.

### Requirements
- **Routing & Navigation:**
  - Change the default protected post-login route redirection logic.
  - Set the root authenticated path (`/dashboard`, `/home`, or `/`) to serve the **Family Tree component** directly.
- **State Initialization:**
  - Ensure that upon landing, the tree data loads asynchronously with smooth loading skeletons or states so the initial experience feels fast and polished.

---

## 5. Unified & High-Quality Tree Styling in View/Read-Only Mode
### Context & Motivation
The visual aesthetics of the family tree should not degrade when switching from "Edit Mode" to "View/Read-Only Mode". The tree must remain clear, beautiful, structured, and consistent across all states.

### Requirements
- **Design Uniformity:**
  - Port over the design system elements (background styles, node shadows, custom canvas colors, fonts, and node dimensions) from the edit screen into the view screen.
  - Maintain the clean background texture, grid canvas, or stylized container environments.
- **Read-Only Adjustments:**
  - Hide all editing controls (e.g., dragging handles, "add relative" buttons, or "delete" icons) when in read-only mode, but preserve the exact same card spacing, typography, and canvas scaling/panning performance.
  - Ensure the read-only tree is fully responsive and feels immersive.
