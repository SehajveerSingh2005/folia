# Folia

### A home for your thoughts, projects, and days.

[VIDEO DEMO OF FOLIA IN ACTION]

Folia is a thoughtfully designed digital second brain that helps you organize every part of your life without the stress of a blank page. It provides dedicated, structured spaces for your active projects, raw ideas, daily reflections, and long-term goals, allowing you to focus on what truly matters.

---

## Live Demo

You can try out a live version of Folia here: **[https://folia-os.vercel.app](https://folia-os.vercel.app)**

---

## Core Features

Folia is built around distinct "spaces" and powerful tools, each tailored for a specific purpose:

### **AI-Powered Planning**

Describe a goal, and our AI planner will generate a complete project in your Flow, broken down into actionable tasks with smart deadlines. It intelligently decides whether your goal needs a long-term plan, a single project, or just a few simple tasks.

[VIDEO OF AI PLANNER IN ACTION]

### **Customizable Dashboard**

A widget-based homepage that gives you an at-a-glance view of your day. Arrange widgets like a clock, task inbox, quick notes, and goals overview to create the perfect command center.

<img width="1421" height="928" alt="screely-1761907939835" src="https://github.com/user-attachments/assets/37a8dfe0-7710-4c81-a6df-f6d06ced128f" />

### **Flow**

The space for your active projects, courses, and endeavors. Each item has its own notes and a dedicated task list, helping you track progress from start to finish.

<img width="1421" height="928" alt="screely-1761908060037" src="https://github.com/user-attachments/assets/e8fcd13f-d503-468f-ac6a-a19b2a32ba17" />

### **Garden**

A creative space to cultivate raw ideas and quick notes. Let your thoughts grow, find connections, and "promote" a seed of an idea into a full-fledged project in your Flow when it's ready.

<img width="1421" height="928" alt="screely-1761908359420" src="https://github.com/user-attachments/assets/35a835c9-e605-4cbb-9a7a-a2932efcc067" />

### **Journal**

A private space for daily reflection. Use the calendar to navigate through your entries, track your mood, and import completed tasks to get a clear picture of your progress.

<img width="1421" height="928" alt="screely-1761908392793" src="https://github.com/user-attachments/assets/9f528075-7239-4107-9d5b-f4a0775d15dc" />

### **Horizon**

Your personal space for long-term planning. Set your sights on future goals, track skills you want to learn, books you want to read, or maintain a simple wishlist.

<img width="1421" height="928" alt="screely-1761908420223" src="https://github.com/user-attachments/assets/4d902f1f-1d69-4cd2-a12c-48b254bceedf" />

### **Loom**

A unified command center for all your tasks. See everything you need to do from your inbox and across all your projects in one organized, filterable view.

<img width="1421" height="928" alt="screely-1761908463750" src="https://github.com/user-attachments/assets/8c596dad-6fad-4db6-a275-dda495db2a46" />

### **Archive**

A clean, organized record of your completed projects. Items from your Flow are moved here once completed, keeping your active workspace clutter-free.

---

## Tech Stack

Folia is built with a modern, robust, and scalable tech stack:

-   **Frontend:** [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vitejs.dev/)
-   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Row Level Security)
-   **AI Integration:** [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **Routing:** [React Router](https://reactrouter.com/)
-   **State Management:** [TanStack Query](https://tanstack.com/query/latest)
-   **Form Handling:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

---

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
    -   To enable the AI Planner, you will also need to add your Cloudflare Account ID and API Token as secrets in your Supabase project.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

The application should now be running on `http://localhost:8080`.

---

## License

This project is licensed under the GNU AGPLv3 License. See the [LICENSE](LICENSE) file for details.
