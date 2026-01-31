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
- I can add comments/notes to tasks
- I can see which tasks Moby created vs which I created
- I can filter tasks by creator, priority, or tags

### As Moby (AI)
- I can add tasks programmatically via API
- I can update task status as I complete work
- I can flag tasks for Stephan's review
- I can add progress notes to tasks
- I can link tasks to GitHub PRs/commits

---

## Features

### MVP (Phase 1)

#### Board View
- [ ] Three default columns: **Backlog** → **In Progress** → **Done**
- [ ] Drag and drop tasks between columns
- [ ] Tasks show: title, description preview, creator avatar, priority badge
- [ ] Click task to open detail modal
- [ ] Smooth animations on all interactions

#### Task Management
- [ ] Create new task (title, description, priority)
- [ ] Edit task details
- [ ] Delete task (with confirmation)
- [ ] Priority levels: Low, Medium, High, Urgent
- [ ] Creator tracking (Moby 🐋 or Stephan 👤)

#### Review Flag System
- [ ] Tasks can be flagged "Needs Review" 🚩
- [ ] Flagged tasks have visual indicator
- [ ] Filter to show only flagged tasks
- [ ] One-click to clear flag after review

#### Persistence
- [ ] SQLite database (local-first)
- [ ] All changes saved immediately
- [ ] Works offline, syncs when online

### Phase 2 (Future)

- [ ] Tags/labels with colors
- [ ] Due dates with reminders
- [ ] GitHub integration (link PRs, auto-update status)
- [ ] Comments/activity feed on tasks
- [ ] Multiple boards
- [ ] Search across all tasks
- [ ] Keyboard shortcuts
- [ ] API for Moby to interact programmatically

---

## Technical Architecture

### Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: SQLite via Prisma
- **Drag & Drop**: @dnd-kit/core
- **State**: React hooks + Server Actions
- **Deployment**: Vercel

### Project Structure
```
moby-kanban/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main board view
│   ├── api/
│   │   └── tasks/          # REST API for programmatic access
│   └── components/
│       ├── Board.tsx       # Main board with columns
│       ├── Column.tsx      # Single column container
│       ├── TaskCard.tsx    # Draggable task card
│       ├── TaskModal.tsx   # Task detail/edit modal
│       ├── CreateTask.tsx  # New task form
│       └── Header.tsx      # App header with filters
├── lib/
│   ├── db.ts              # Prisma client
│   ├── actions.ts         # Server actions
│   └── types.ts           # TypeScript types
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data
├── public/
│   └── ...                # Static assets
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # API tests
│   └── e2e/               # Playwright E2E tests
└── docs/
    ├── API.md             # API documentation
    └── DEPLOYMENT.md      # Deployment guide
```

### Database Schema
```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      Status   @default(BACKLOG)
  priority    Priority @default(MEDIUM)
  creator     Creator  @default(MOBY)
  needsReview Boolean  @default(false)
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Future: relations
  // comments Comment[]
  // tags     Tag[]
}

enum Status {
  BACKLOG
  IN_PROGRESS
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum Creator {
  MOBY
  STEPHAN
}
```

### API Endpoints
```
GET    /api/tasks          # List all tasks
POST   /api/tasks          # Create task
GET    /api/tasks/:id      # Get single task
PATCH  /api/tasks/:id      # Update task
DELETE /api/tasks/:id      # Delete task
POST   /api/tasks/:id/flag # Toggle review flag
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

### Typography
- Font: Inter (system fallback: system-ui)
- Headings: Bold, tight tracking
- Body: Regular weight, relaxed line height

### Components (shadcn/ui)
- Card (for task cards)
- Button (actions)
- Dialog (modals)
- Badge (priority, status)
- DropdownMenu (task actions)
- Tooltip (hover info)

### Animations
- Cards: Scale up slightly on hover
- Drag: Rotate slightly when dragging
- Transitions: 150ms ease-out for all
- Column drop: Subtle pulse animation

---

## Testing Strategy

### Unit Tests (Vitest)
- Task CRUD operations
- Status transitions
- Priority sorting
- Flag toggling

### Integration Tests
- API endpoints
- Database operations
- Server actions

### E2E Tests (Playwright)
- Create and move tasks
- Edit task details
- Flag for review workflow
- Mobile responsiveness

### Coverage Target
- Minimum 80% code coverage
- 100% coverage on critical paths (CRUD, drag-drop)

---

## Performance Requirements

- Initial load: < 1s (on fast 3G)
- Interaction response: < 100ms
- Drag feedback: < 16ms (60fps)
- Database queries: < 50ms

---

## Accessibility

- Full keyboard navigation
- ARIA labels on interactive elements
- Focus visible indicators
- Color contrast WCAG AA compliant
- Screen reader friendly

---

## Deployment

### Vercel Configuration
- Framework: Next.js
- Build: `npm run build`
- Output: Standalone
- Environment: Production

### Environment Variables
```
DATABASE_URL=file:./dev.db
```

### Preview Deployments
- Every PR gets a preview URL
- Preview uses separate database instance

---

## Success Criteria

1. ✅ Board displays with three columns
2. ✅ Tasks can be created, edited, deleted
3. ✅ Drag and drop works smoothly
4. ✅ Review flag system works
5. ✅ Mobile responsive
6. ✅ All tests passing
7. ✅ Deployed to Vercel
8. ✅ Documentation complete

---

## Timeline

- **Hour 1-2**: Project setup, database, basic UI
- **Hour 2-3**: Drag and drop, task modal
- **Hour 3-4**: Polish, tests, documentation
- **Hour 4+**: Review, iterate, ship

---

*Spec v1.0 - Created by Moby 🐋*
