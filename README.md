# Folia

### A home for your thoughts, projects, and days.

Folia is a thoughtfully designed digital second brain that helps you organize every part of your life without the stress of a blank page. It provides dedicated, structured spaces for your active projects, raw ideas, daily reflections, and long-term goals, allowing you to focus on what truly matters.

---

## Core Features

Folia is built around distinct "spaces," each tailored for a specific purpose:

-   **🏡 Dashboard Overview:** A customizable, widget-based homepage that gives you an at-a-glance view of your day. Widgets include a welcome greeting, a clock, a task inbox, a quick-add note, a journal prompt, and a goals overview.

-   **🌊 Flow:** The space for your active projects, courses, and endeavors. Each item can have its own notes and a dedicated task list, helping you track progress from start to finish.

-   **🌱 Garden:** A creative space to cultivate raw ideas and quick notes. Let your thoughts grow, find connections, and "promote" a seed of an idea into a full-fledged project in your Flow when it's ready.

-   **📖 Journal:** A private space for daily reflection. Use the calendar to navigate through your entries, track your mood, and capture your thoughts for the day.

-   **🔭 Horizon:** Your personal space for long-term planning. Set your sights on future goals, track skills you want to learn, books you want to read, or maintain a simple wishlist.

-   **📋 Loom:** A unified command center for all your tasks. See everything you need to do from your inbox and across all your projects in one organized view.

-   **🗄️ Archive:** A clean, organized record of your completed projects and endeavors. Items from your Flow are moved here once completed, keeping your active workspace clutter-free.

## Tech Stack

Folia is built with a modern, robust, and scalable tech stack:

-   **Frontend:** [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vitejs.dev/)
-   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Row Level Security)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **Routing:** [React Router](https://reactrouter.com/)
-   **State Management:** [TanStack Query](https://tanstack.com/query/latest)
-   **Form Handling:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later)
-   npm, yarn, or pnpm

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/folia.git
    cd folia
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up your environment variables:**
    -   Create a `.env` file in the root of the project by copying the example file:
        ```sh
        cp .env.example .env
        ```
    -   Log in to your [Supabase account](https://app.supabase.com) and create a new project.
    -   Navigate to **Project Settings > API**.
    -   Copy your **Project URL** and **anon (public) key** and paste them into your `.env` file.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

The application should now be running on `http://localhost:8080`.

---

This project was built with Dyad.