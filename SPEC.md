# Moby Kanban - Product Specification

## Overview

A beautiful, modern Kanban board web application for tracking projects built by Moby (AI assistant) and Stephan (human). This is the first major project using the Vibe² Coding workflow.

## Core Philosophy

- **Simplicity first**: Clean UI, obvious interactions
- **Real-time feel**: Instant updates, smooth animations
- **Mobile-friendly**: Works great on phone and desktop
- **Dark mode default**: Easy on the eyes for late-night coding sessions

---

## User Stories

### As Stephan (Human)
- I can see all tasks at a glance organized by status
- I can add new tasks to the backlog
- I can drag tasks between columns
- I can flag tasks that need my review
- I can organize tasks into projects
- I can see which tasks Moby created vs which I created
- I can filter tasks by creator, priority, or project

### As Moby (AI)
- I can add tasks programmatically via API (using API key)
- I can update task status as I complete work
- I can flag tasks for Stephan's review
- I can organize work into projects

---

## Features

### Implemented ✅

#### Board View
- [x] Three default columns: **Backlog** → **In Progress** → **Done**
- [x] Drag and drop tasks between columns
- [x] Tasks show: title, description preview, creator avatar, priority badge
- [x] Click task to open detail modal
- [x] Smooth animations on all interactions

#### Task Management
- [x] Create new task (title, description, priority)
- [x] Edit task details
- [x] Delete task (with confirmation)
- [x] Priority levels: Low, Medium, High, Urgent
- [x] Creator tracking (Moby 🐋 or Stephan 👤)
- [x] Position ordering within columns

#### Review Flag System
- [x] Tasks can be flagged "Needs Review" 🚩
- [x] Flagged tasks have visual indicator
- [x] Filter to show only flagged tasks
- [x] One-click to clear flag after review

#### Projects
- [x] Create/edit/delete projects
- [x] Assign tasks to projects
- [x] Filter board by project
- [x] Project sidebar with task counts
- [x] Drag to reorder projects

#### Authentication & Access
- [x] GitHub OAuth login (NextAuth)
- [x] Allowlist of permitted GitHub users
- [x] API key authentication for programmatic access (bots)
- [x] Protected API routes

### Future Ideas

- [ ] Tags/labels with colors
- [ ] Due dates with reminders
- [ ] GitHub integration (link PRs, auto-update status)
- [ ] Comments/activity feed on tasks
- [ ] Search across all tasks
- [ ] Keyboard shortcuts

---

## Technical Architecture

### Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js with GitHub OAuth
- **Drag & Drop**: @dnd-kit/core
- **State**: React hooks + optimistic updates
- **Deployment**: Vercel

### Project Structure
```
moby-kanban/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Main board view
│   │   ├── login/              # Login page
│   │   └── api/
│   │       ├── tasks/          # Task CRUD endpoints
│   │       ├── projects/       # Project CRUD endpoints
│   │       └── logs/           # Activity logging
│   ├── components/
│   │   ├── Board.tsx           # Main board with columns
│   │   ├── Column.tsx          # Single column container
│   │   ├── TaskCard.tsx        # Draggable task card
│   │   ├── TaskModal.tsx       # Task detail/edit modal
│   │   ├── CreateTaskModal.tsx # New task form
│   │   ├── Header.tsx          # App header with filters
│   │   └── ProjectSidebar.tsx  # Project list sidebar
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── api-client.ts       # Frontend API calls
│   │   ├── api-store.ts        # Server-side task operations
│   │   ├── projects-store.ts   # Server-side project operations
│   │   ├── validation.ts       # Zod schemas
│   │   ├── logger.ts           # Activity logging
│   │   └── types.ts            # TypeScript types
│   └── middleware.ts           # Auth middleware
├── tests/
│   └── unit/                   # Vitest unit tests
└── docs/
    └── ...
```

### Database Schema (Supabase)

```sql
-- Tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'BACKLOG',
  priority text not null default 'MEDIUM',
  creator text not null default 'MOBY',
  needs_review boolean default false,
  position integer default 0,
  project_id uuid references projects(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text default '#3b82f6',
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity logs table
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  message text not null,
  path text,
  method text,
  status_code integer,
  duration integer,
  context jsonb,
  created_at timestamptz default now()
);
```

### API Endpoints

All endpoints require authentication (GitHub OAuth session or API key header).

#### Tasks
```
GET    /api/tasks          # List all tasks
POST   /api/tasks          # Create task
GET    /api/tasks/:id      # Get single task
PATCH  /api/tasks/:id      # Update task
DELETE /api/tasks/:id      # Delete task
POST   /api/tasks/:id/flag # Toggle review flag
```

#### Projects
```
GET    /api/projects          # List all projects
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get single project
PATCH  /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
POST   /api/projects/reorder  # Reorder projects
```

### Authentication

#### Browser Access
- GitHub OAuth via NextAuth.js
- Only users in `ALLOWED_GITHUB_USERS` env var can access
- Session-based authentication

#### API Access (for bots like Moby)
```bash
curl -X POST https://moby-kanban.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"title": "New task", "creator": "MOBY"}'
```

---

## Environment Variables

```bash
# Supabase (server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# NextAuth
AUTH_SECRET=generate-with-openssl-rand-base64-32

# Access Control
ALLOWED_GITHUB_USERS=username1,username2

# API Key (for programmatic access)
API_KEY=generate-a-secure-random-key
```

---

## Design System

### Colors (Dark Mode)
```
Background:    #0a0a0f (near black)
Surface:       #16161d (card backgrounds)
Border:        #2a2a35 (subtle borders)
Primary:       #3b82f6 (blue accent)
Success:       #22c55e (green - done)
Warning:       #f59e0b (amber - needs review)
Urgent:        #ef4444 (red - urgent priority)
Text:          #f1f5f9 (light gray)
Text Muted:    #94a3b8 (medium gray)
```

### Animations
- Cards: Scale up slightly on hover
- Drag: Rotate slightly when dragging
- Transitions: 150ms ease-out for all
- Optimistic updates for instant feedback

---

## Testing

### Unit Tests (Vitest)
- Validation schemas
- Type definitions
- Utility functions

### Coverage
- `npm run test` — watch mode
- `npm run test:run` — single run
- `npm run test:coverage` — with coverage report

---

## Deployment

### Vercel
- Framework: Next.js
- Build: `npm run build`
- Preview deployments on every PR

### GitHub Actions
- PR Checks: lint, typecheck, test, build
- Codex Review: AI code review on PRs

---

*Spec v2.0 - Updated February 2026*
