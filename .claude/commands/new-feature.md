# New Feature Command

Plan and implement a new feature for the Naruto Mythos project.

## Usage
`/new-feature [feature description]`

## Instructions

When invoked, follow this workflow:

### Phase 1 — Planning
1. **Analyze** the feature request
2. **Identify** which parts of the codebase are affected:
   - Frontend (pages, components, styles)
   - Backend (API routes, services)
   - Database (schema changes, migrations)
   - i18n (new translation keys)
3. **Break down** into atomic tasks, ordered by dependencies
4. **Present the plan** to the user for approval before starting

### Phase 2 — Implementation
5. **For each task**, delegate to the appropriate subagent:
   - `frontend-dev` for UI work
   - `backend-dev` for API/database work
   - `data-specialist` for data operations
   - `deck-validator` for game rule logic
   - `pricing-agent` for pricing features
6. **Parallelize** independent tasks using agent teams where possible
7. **Verify** after each task: `pnpm lint && pnpm typecheck`

### Phase 3 — Validation
8. **Run full validation**: `pnpm lint && pnpm typecheck && pnpm build`
9. **Test** the feature manually if applicable
10. **Commit** with conventional commit message: `feat: [description]`

## Checklist for every feature
- [ ] i18n: All strings in FR + EN via next-intl
- [ ] Mobile-first: Responsive from 375px
- [ ] Server Components: `"use client"` only when needed
- [ ] Zod validation: All API inputs validated
- [ ] Types: All data typed with Prisma types
- [ ] Accessibility: Keyboard-accessible, semantic HTML
