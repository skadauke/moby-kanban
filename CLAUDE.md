# CLAUDE.md - Instructions for Claude Code

## Project: Moby Kanban

A beautiful Kanban board web app for tracking AI-human collaborative projects.

## Tech Stack (MUST USE)
- Next.js 14+ with App Router
- TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Prisma with SQLite
- @dnd-kit/core for drag and drop
- Vitest for unit tests
- Playwright for E2E tests

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run test     # Run all tests
npm run lint     # Lint code
npx prisma db push   # Push schema
npx prisma generate  # Generate client
```

## Key Files
- `SPEC.md` - Full product specification (READ THIS FIRST)
- `prisma/schema.prisma` - Database schema
- `app/page.tsx` - Main board view

## Style Guidelines
- Dark mode by default
- Use shadcn/ui components
- Tailwind for styling
- 150ms ease-out transitions
- Mobile-first responsive

## Important Notes
1. Read SPEC.md completely before starting
2. Commit frequently with descriptive messages
3. Write tests as you build
4. Focus on MVP features first
5. Make it beautiful!

## Commit Message Format
- 🎉 Initial / milestone
- ✨ New feature
- 🐛 Bug fix
- 🎨 UI/styling
- ♻️ Refactor
- 📝 Documentation
- ✅ Tests
- 🔧 Config
