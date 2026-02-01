# Contributing

## Development Workflow

This project uses **vibe² coding** — AI-driven development with automated quality gates.

### Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all checks pass locally:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```
4. Open a Pull Request
5. Wait for automated checks:
   - Lint & type check
   - Tests & coverage
   - Security scan
   - AI code review (CodeRabbit)
6. Address any issues flagged
7. Merge when all checks pass

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: restructure code
test: add tests
chore: maintenance tasks
```

### Pull Request Guidelines

- Keep PRs focused on a single concern
- Link to related GitHub Issues
- Include screenshots for UI changes
- Update documentation as needed

### Code Standards

- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting
- Tests for new functionality

### Checking for Dead Code

Before major PRs, check for unused dependencies:

```bash
npx depcheck
```

Note: This may report false positives (e.g., Tailwind, dotenv, semantic-release). Use judgment — if a dependency isn't imported anywhere in `src/`, it's probably safe to remove.

Also review for:
- Unused files (check imports)
- Stale documentation (e.g., outdated tech stack references)
- Commented-out code blocks

### Project-Specific Notes

<!-- Add project-specific contribution notes here -->

## Questions?

Open an issue or start a discussion.
