# Vibe² Coding Workflow

A production-grade approach to AI-human collaborative development.

## Overview

Vibe² (Vibe Squared) is a workflow where an AI and human collaborate to build software. The AI handles implementation while the human provides direction, reviews, and makes key decisions.

## Workflow Phases

### 1. Specification (Human-led)

**Create a SPEC.md with:**
- Clear problem statement
- User stories
- Feature requirements (MVP vs future)
- Technical constraints
- Success criteria
- Non-functional requirements (performance, security)

**Template:**
```markdown
# Project Name - Specification

## Problem
What problem are we solving?

## Users
Who uses this? What are their needs?

## MVP Features
- [ ] Feature 1
- [ ] Feature 2

## Future Features
- [ ] Feature 3

## Technical Constraints
- Stack: Next.js, TypeScript, etc.
- Hosting: Vercel
- Database: Turso/Postgres

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Non-Functional Requirements
- Performance: < 1s load time
- Security: Input validation, CSRF protection
- Accessibility: WCAG AA
```

### 2. Implementation (AI-led)

The AI:
1. Reads and understands the spec
2. Sets up project structure
3. Implements features incrementally
4. Commits with descriptive messages
5. Deploys to preview environment
6. Reports progress

**Commit message format:**
- 🎉 Initial / milestone
- ✨ New feature
- 🐛 Bug fix
- 🎨 UI/styling
- ♻️ Refactor
- 🛡️ Security/hardening
- ✅ Tests
- 📝 Documentation

### 3. Review (Human-led)

Human reviews:
- Deployed preview
- Code changes (via GitHub)
- Test coverage
- Security considerations

Use the Kanban board to track:
- Flag tasks needing review 🚩
- Move to Done when approved

### 4. Iteration

Repeat until MVP complete, then:
- Ship to production
- Monitor for issues
- Plan next iteration

## Production Checklist

### Security
- [ ] Input validation (Zod schemas)
- [ ] XSS prevention (sanitize output)
- [ ] CSRF protection (if forms)
- [ ] Rate limiting (if public API)
- [ ] Environment variables for secrets
- [ ] No secrets in code/logs

### Error Handling
- [ ] Error boundaries in React
- [ ] Graceful API error responses
- [ ] User-friendly error messages
- [ ] Error logging (not sensitive data)

### Performance
- [ ] Loading states/skeletons
- [ ] Optimistic updates where appropriate
- [ ] Database indexes on queried fields
- [ ] Image optimization
- [ ] Code splitting

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API
- [ ] E2E tests for critical paths
- [ ] Manual testing on mobile

### Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Preview deployment tested
- [ ] Production deployment verified
- [ ] Monitoring/alerts set up

### Documentation
- [ ] README with setup instructions
- [ ] API documentation
- [ ] Architecture decisions recorded
- [ ] Runbook for common issues

## Tools

### Required
- **Git** - Version control
- **GitHub** - Code hosting, PRs
- **Vercel** - Deployment
- **Turso/Postgres** - Database

### Recommended
- **Kanban board** - Task tracking (this app!)
- **Zod** - Input validation
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Anti-Patterns to Avoid

❌ **No spec** - Don't start coding without clear requirements
❌ **No commits** - Commit frequently, not one big commit
❌ **No tests** - Write tests as you build
❌ **No preview** - Always deploy to preview before prod
❌ **Localhost only** - Deploy to Vercel for real testing
❌ **Secrets in code** - Always use environment variables

## Example Flow

1. Human creates SPEC.md
2. AI sets up project, initial commit
3. AI implements feature 1, deploys preview
4. Human reviews, requests changes
5. AI fixes issues, redeploys
6. Human approves, AI moves to Done
7. Repeat for feature 2, 3...
8. Human does final review
9. Ship to production

## Communication

- AI reports progress proactively
- AI flags blockers immediately
- Human reviews within reasonable time
- Use Kanban board for status visibility
- Document decisions in code/docs

---

*This workflow evolves. Update as we learn what works.*
