# Contributing to Big Starz

Thank you for your interest in contributing to the Big Starz Casting Platform! This guide will help you get started.

---

## Code Style

### TypeScript/JavaScript
- Use **TypeScript** for all new code
- Follow the project's **ESLint** and **Prettier** configurations
- Run `npm run lint` before committing
- Run `npm run format` to auto-fix formatting

### Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `TalentProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| API routes | kebab-case | `casting-calls.ts` |
| Database fields (schema) | snake_case | `user_id` |
| Database fields (code) | camelCase | `userId` |
| Constants | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| Files | kebab-case for non-components | `api-client.ts` |

### Code Quality
- Write meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions under 50 lines when possible
- Avoid nested callbacks; use async/await
- Prefer `const` and `let` over `var`

---

## Branch Naming

Use the following prefixes for branch names:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/ai-scene-generator` |
| `fix/` | Bug fix | `fix/auth-redirect-loop` |
| `docs/` | Documentation | `docs/api-examples` |
| `refactor/` | Code refactoring | `refactor/user-service` |
| `test/` | Tests only | `test/casting-api` |
| `chore/` | Maintenance | `chore/update-deps` |
| `hotfix/` | Critical production fix | `hotfix/payment-webhook` |

Format: `<prefix>/<short-description>`

---

## Pull Request Process

### 1. Before Starting
- Check existing issues and PRs to avoid duplicates
- Open an issue to discuss major changes
- Ensure you have the latest code from `main`

### 2. Making Changes
```bash
# Create a new branch
git checkout -b feat/my-feature

# Make your changes
# ... edit files ...

# Run tests and linting
npm run test
npm run lint

# Commit your changes
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feat/my-feature
```

### 3. Submitting a PR
- Fill out the PR template completely
- Link related issues with `Closes #123` or `Fixes #456`
- Include screenshots for UI changes
- Ensure CI checks pass
- Request review from maintainers

### 4. PR Review
- Address review comments promptly
- Keep discussion focused and professional
- Update your branch if `main` has moved forward
- Squash commits if requested

### 5. Merging
- PRs require **2 approving reviews**
- All CI checks must pass
- Branch must be up-to-date with `main`
- Use **Squash and Merge** for feature branches
- Use **Rebase and Merge** for documentation updates

---

## Testing Requirements

### Minimum Coverage
- New features: **80%** code coverage
- Bug fixes: Include a test that reproduces the bug
- Refactors: Maintain or improve existing coverage

### Test Types
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test
```

### Writing Tests
- Use descriptive test names: `it('should reject invalid email format')`
- Test both success and failure cases
- Mock external APIs and services
- Use test factories for generating test data
- Clean up test data after each test

---

## Commit Message Format

We follow the **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, missing semi-colons, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, etc. |
| `ci` | CI/CD changes |

### Examples
```
feat(auth): add password reset flow

- Add email-based password reset
- Implement token expiry (24 hours)
- Add rate limiting (3 attempts per hour)

Fixes #234
```

```
fix(casting): correct deadline timezone handling

Casting call deadlines were stored in UTC but displayed in local
time without proper conversion. This fix ensures consistent
timezone handling across all deadline operations.

Closes #456
```

### Rules
- Use imperative mood ("add" not "added")
- Keep subject line under 50 characters
- Wrap body at 72 characters
- Reference issues in footer

---

## Development Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Web
```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

---

## Questions?

- Open an issue for bugs or feature requests
- Join our Discord community (link in README)
- Email the team: dev@bigstarz.com

---

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive criticism
- Respect different viewpoints and experiences

Harassment, discrimination, or abusive behavior will not be tolerated.
