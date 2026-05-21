# 🌲 Kinship — Family Tree

Kinship is a modern, standalone React and Vite-based web application designed to help families map their ancestry, share memories, and document their shared history. 

Originally built as a platform-dependent application, it has been fully decoupled and is now a standalone web application driven by local mock data. It can be easily deployed to any static hosting provider.

---

## ✨ Features

- **🌲 Interactive Tree Explorer**: View and navigate the family tree dynamically with visual nodes.
- **📸 Family Hub & Timeline**: Post updates, share photos, and view a chronological timeline of family events.
- **💼 Heritage Vault**: Store and view documents, records, and heirloom details.
- **👤 Profile Drawer**: View detailed profile information for any relative, including dates, relations, and bio.
- **🔒 Mock Authentication**: Instantly authenticated out of the box using local session simulation.

---

## 🛠️ Technology Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vite.dev/) (Javascript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: Radix UI primitives & custom styled components (accordion, avatar, dialog, drawer, toast, etc.)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation

1. Clone this repository (or download the source):
   ```bash
   git clone https://github.com/roeepaz/Famlily-tree.git
   cd "family tree"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📦 Building & Deployment

Since Kinship is a standard Single Page Application (SPA) with mock authentication and mock database storage in the client, you can build and host it anywhere for free.

### Production Build

Generate the static production bundle:
```bash
npm run build
```
This compiles the application into the `dist/` directory.

### Hosting Options

- **Netlify / Vercel / Cloudflare Pages**: Connect your GitHub repository, choose "Vite" as the build preset, and point the publish directory to `dist`.
- **GitHub Pages**: You can use GitHub Pages action or manually push the `dist` folder to a `gh-pages` branch.
- **Nginx / Apache / S3**: Upload the contents of the `dist/` folder directly to your web server.
