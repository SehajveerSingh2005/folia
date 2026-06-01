<p align="center">
  <img src="./public/logo.png" alt="Folia Logo" width="80" />
</p>

# Folia

> A thoughtfully designed digital second brain. Organize your thoughts, projects, and days without the friction.

Folia is a structured workspace that brings order to your thoughts, tasks, and future plans. It is built around dedicated "spaces" that keep your mind clear and your workflow focused.

---

## 🌌 The Spaces

*   **AI Planner** — Type a goal, and AI generates structured project tasks & timelines automatically.
*   **Dashboard** — A custom, widget-based command center (Clock, GitHub Heatmap, PRs, Tasks, and more).
*   **Flow** — Your active projects workspace. Add tasks, take notes, and track progress.
*   **Garden** — Cultivate raw ideas, seeds, and notes. Link them and promote them to projects when ready.
*   **Journal** — Private daily logs with mood tracking, auto-imported completed tasks, and weekly reviews.
*   **Horizon** — Set your sights on long-term goals, skill trees, readlists, and bucket lists.
*   **Loom** — A unified, filterable task manager consolidating all project and personal tasks.
*   **Shipped (Archive)** — A clean shelf for your completed projects and milestones.

---

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Database & Auth:** Supabase (Postgres RLS)
- **AI Engine:** Cloudflare Workers AI
- **Styling:** Tailwind CSS + Radix UI
- **State Management:** React Query (TanStack)

---

## Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/SehajveerSingh2005/folia.git
   cd folia
   pnpm install
   ```

2. **Configure Environment**
   Rename `.env.example` to `.env` and add your Supabase details:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Dev Server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or specified port) to explore Folia.

---

## License

Licensed under the [GNU AGPLv3](LICENSE).