# Feature Specification: Kinship Spark Workflow & Onboarding

## 1. Executive Product Vision & Strategy

### 1.1 Core Strategy Insight
In every family, there is exactly **one person** who possesses the passion, energy, and motivation to preserve family history. The remaining family members are typically passive; if registration requires manual reconstruction or multi-layered forms, they abandon the process immediately. 

Instead of fighting user inertia, **Kinship Spark** builds the entire application architecture around this highly motivated **Tree Creator**. By empowering this single champion to plant the core structural infrastructure of the family network effortlessly, the platform minimizes friction for everyone else.

> *"If you make the setup effortless for the most motivated champion, they will build 90% of the initial tree infrastructure for the entire family circle."*

### 1.2 The "First Closeness" Design Methodology
Traditional genealogy software overwhelms users by demanding deep historical queries upfront. Kinship Spark flips this paradigm. The Tree Creator is strictly constrained at launch to document **only** their **Immediate First Closeness Circle**. Distant relatives are intentionally blocked in the initial onboarding phase to ensure maximum momentum.

```
                   [ Parents Nodes ]
                          │
  [ Siblings ] ───┼─── [ THE CREATOR ] ─── [ Spouse Node ]
                          │
                   [ Children Nodes ]
```

---

## 2. Core Functional Requirements & Step-by-Step Architecture

### Step 1: Spark the Root
* **Action:** The Tree Creator completes the initial application registration.
* **System Action:** The user names the primary family branch (e.g., *"Paz Family"*). 
* **Backend Requirement:** The system must instantly provision a secure, unique, globally isolated **Hidden Tree ID** (`tree_id`) to contain this network environment.

### Step 2: Plant the Immediate Nodes
* **Action:** A multi-directional, 3-axis interactive UI prompts the Creator to insert minimalist structural placeholder nodes for their immediate circle.
* **Data Structure:** Input fields are limited to: `First Name`, `Last Name`, and `Optional Email`.
* **Constrained Relations:** * **Upward Axis:** Mother, Father (Parents)
    * **Horizontal Axis:** Brothers, Sisters (Siblings), Partner (Spouse)
    * **Downward Axis:** Sons, Daughters (Children)

### Step 3: Pass the Torch (Viral Network Invitation)
* **Action:** The system automatically renders dynamic, copyable onboarding tokens linked to the placeholder nodes of living relatives.
* **Delivery System:** The Creator can copy an invitation link with one tap (e.g., *"Come join our private family tree circle."*) and distribute it via SMS, WhatsApp, or email.
* **Viral Chain Reaction:** When an invited relative (e.g., a sibling) accesses the link, they do not face an empty state. They inherit the pre-populated tree environment where they, their parents, and siblings are already mapped. The app then triggers *their* onboarding wizard to expand *their* immediate horizontal and downward axes, auto-fusing independent sub-circles into a unified, massive social graph.

---

## 3. UI/UX Design System: Guided Onboarding Tour

To achieve maximum retention, the application must feel lightweight, intuitive, and clear. Every micro-interaction must adhere to a **"Minimum Moves to Value"** philosophy.

### 3.1 Scenario A: The Tree Creator (The Root Setup)
The onboarding tour for a new Tree Creator must act as an interactive game-like builder rather than a data entry form.

* **The Landing Hero Moment:** Upon naming the tree, the screen transitions to an isolated canvas showing only a single, glowing node representing the Creator: `[ You ]`. All other interface elements are masked out with a soft dimmed overlay.
* **The 3-Axis Directional Pulse:** * Subtle animated arrows pulse outward from the Creator node in three directions (Up for Parents, Sideways for Spouse/Siblings, Down for Children).
    * A clean, friendly floating card at the bottom instructs: *"Let's build your immediate circle. Who is closest to you?"*
* **Single-Tap Node Spawning:** * Tapping an arrow instantly drops a clean, minimalistic card on that axis. 
    * Instead of opening a separate configuration page or full-screen modal, an **inline, compact dropdown form** expands smoothly within the canvas layer.
* **Frictionless Fields:** * The form focuses automatically on `First Name`. 
    * Hitting `Enter` or clicking a single prominent checkmark commits the entry, turns the node from a dashed placeholder into a solid family tile, and immediately opens the next logical relation.
* **Smart Defaults:** The system auto-fills the `Last Name` field based on the family branch or the Creator’s last name, allowing the user to skip it with a single keystroke if no change is needed.
* **The Magic Link Handoff:** Once the first closeness circle is drafted, the canvas pulls back slightly into an elegant bird's-eye view. The nodes for siblings or children light up with a subtle badge: `[ 🔗 Share Link ]`. A sleek bottom sheet slides up, offering a one-click *"Invite your family to fill the rest"* action sheet.

### 3.2 Scenario B: The Invited Member (The Pre-Populated Landing)
The onboarding flow for an invited user must capitalize on immediate emotional recognition.

* **The Familiar Welcome Page:** When the invitee clicks the tokenized URL, the landing screen features an explicit greeting card:
    > *"Hi [Invitee Name], your family member [Creator Name] has started your private family circle. Look who is already here!"*
* **The Instant Reveal:** Below the welcome message, a non-interactive, beautifully styled preview snippet of the family tree is displayed, showing the user’s name perfectly connected to their parents and siblings. This instantly validates the platform's utility.
* **Simplified Passwordless Authentication:** To avoid registration drop-off, the onboarding link contains a secure single-use token. The system verifies their identity based on the placeholder node details, prompting them to simply set a secure password or authenticate via OAuth (Google/Apple) to claim their node.
* **Inherited Context Tour:** Once logged in, a contextual tour points to their specific node. The app congratulates them on claiming their profile and applies a subtle ripple effect to the empty coordinate slots extending from *their* position (e.g., their spouse or children).
* **The Core Task Prompt:** A persistent but unobtrusive floating navigation tracker highlights the next action: *"You are connected to [Parents]. Tap below to add your children or partner to complete your branch."* ### 3.3 Universal UX/UI Optimization Standards
* **Zero Modal Fatigue:** Avoid deep nested popups or multi-step wizard screens that take the user away from the visual tree context. Use inline extensions or sliding bottom panels.
* **Micro-Movements:** Ensure every step takes no more than 1 or 2 taps/clicks. For example, typing a name and hitting enter should automatically save and point to the next node placeholder.
* **Optimistic UI Updates:** When a user creates a node or sends an invitation link, update the tree interface instantly on the client side before waiting for complete database round-trips to create an ultra-responsive, snappy user experience.
