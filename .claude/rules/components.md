---
glob: "src/components/**/*.tsx"
---

# Component Rules

## Server Components First
By default, all components are Server Components. Only add `"use client"` when the component needs:
- React hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange, etc.)
- Browser APIs (window, document, etc.)
- Third-party client libraries

## Mobile-First Design
Always design for 375px width first, then scale up:
```tsx
// ✅ Correct: mobile-first
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// ❌ Wrong: desktop-first
<div className="grid grid-cols-4 md:grid-cols-2 sm:grid-cols-1">
```

## shadcn/ui Components
- Use shadcn/ui as the base component library
- Import from `@/components/ui/`
- Customize via Tailwind classes, don't modify shadcn internals
- Extend shadcn components by composition, not modification

## Rules
1. Props must be fully typed — no `any` types
2. Use Prisma-generated types for data props
3. Prefer composition over prop drilling
4. Keep components focused — one responsibility per component
5. Extract reusable logic into custom hooks in `src/hooks/`
6. Image components must specify width/height or use `fill` with `sizes`
7. Lists must use proper `key` props (never use array index)
