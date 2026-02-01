# 🐋 Moby Kanban

[![CI](https://github.com/skadauke/moby-kanban/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/skadauke/moby-kanban/actions/workflows/pr-checks.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-Human Project Tracker — A visual kanban board for managing tasks between humans and AI collaborators.

## Features

- 📋 Drag-and-drop kanban board (Backlog → In Progress → Done)
- 📁 Project organization with color-coded sidebar
- 👥 Task assignment (Moby 🐋 or Stephan 👤)
- 🚩 Flag tasks for review
- 🔐 GitHub OAuth authentication
- 📱 Responsive design

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** NextAuth.js with GitHub provider
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account
- GitHub OAuth app

### Installation

```bash
# Clone the repo
git clone https://github.com/skadauke/moby-kanban.git
cd moby-kanban

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# NextAuth
AUTH_SECRET=
NEXTAUTH_URL=

# Access Control
ALLOWED_GITHUB_USERS=username1,username2
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm test         # Run tests
```

## API

### Tasks
- `GET /api/tasks` — List all tasks
- `POST /api/tasks` — Create task
- `PATCH /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task

### Projects
- `GET /api/projects` — List all projects
- `POST /api/projects` — Create project
- `PATCH /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

MIT — see [LICENSE](LICENSE) for details.

# Test
