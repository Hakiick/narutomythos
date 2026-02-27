# Validate Command

Run a complete quality check on the Naruto Mythos project.

## Usage
`/validate`

## Instructions

When invoked, run the following checks in order:

### 1. Lint Check
```bash
pnpm lint
```
- Fix any ESLint errors automatically if possible (`pnpm lint --fix`)
- Report remaining issues

### 2. Type Check
```bash
pnpm typecheck
```
- Report any TypeScript errors
- Fix type issues if straightforward

### 3. Unit Tests
```bash
pnpm test
```
- Report test results
- Fix failing tests if the fix is obvious

### 4. Build Check
```bash
pnpm build
```
- Report build errors
- Fix build issues

### 5. Summary
Report a summary:
```
✅ Lint: PASS
✅ TypeCheck: PASS
✅ Tests: X passed, Y failed
✅ Build: PASS

Overall: PASS/FAIL
```

If any check fails, attempt to fix the issue and re-run the failing check. If the fix is not obvious, report the error details to the user.
