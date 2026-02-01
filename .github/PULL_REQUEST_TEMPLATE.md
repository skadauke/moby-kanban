# Description

<!-- What does this PR do? Why is it needed? -->

## Changes

<!-- List key changes in bullet format -->
- 

## Screenshots/Videos

<!-- For UI changes, add screenshots or screen recordings -->

## Issue

<!-- Link related issue(s) -->
Closes #

---

## PR Checklist

### Code Quality
- [ ] Functions are focused and reasonably sized
- [ ] No duplicate code (DRY principle)
- [ ] Naming follows project conventions
- [ ] Complex logic has explanatory comments
- [ ] Meaningful error handling throughout
- [ ] No debug artifacts (`console.log`, `debugger`, etc.)

### Security
- [ ] No hardcoded secrets or credentials
- [ ] User input is validated and sanitized
- [ ] Auth checks on all protected routes/endpoints
- [ ] No sensitive data exposed in logs
- [ ] Dependencies free of critical vulnerabilities (`npm audit`)

### Testing
- [ ] New functionality has corresponding tests
- [ ] Test coverage maintained or improved
- [ ] Edge cases and error paths covered
- [ ] All tests pass

### Performance
- [ ] No N+1 query patterns
- [ ] Heavy computations memoized where appropriate
- [ ] Large data sets paginated/virtualized

### Documentation
- [ ] README updated if public interface changed
- [ ] Breaking changes documented
- [ ] API documentation updated (if applicable)
- [ ] CHANGELOG entry added (for releases)

### Repo Health
- [ ] Linked to GitHub Issue
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with main

### Project-Specific Gotchas
<!-- Add your project's known gotchas here -->
- [ ] Using `printf '%s'` not `echo` when piping values
- [ ] No trailing newlines in credentials/env vars
