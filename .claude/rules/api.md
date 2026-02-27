---
glob: "src/app/api/**/*.ts"
---

# API Rules

## All API routes must follow these patterns

### Input Validation
Every API route MUST validate inputs with Zod before processing:
```typescript
import { z } from 'zod';

const schema = z.object({
  // define expected inputs
});

const parsed = schema.safeParse(input);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
```

### Typed Responses
All responses must use `NextResponse.json()` with proper types:
```typescript
return NextResponse.json<ApiResponse<Card[]>>({ data: cards });
```

### Authentication
Protected routes must check auth:
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Error Handling
Use proper HTTP status codes:
- 400: Bad request (validation failed)
- 401: Unauthorized (not logged in)
- 403: Forbidden (not allowed)
- 404: Not found
- 500: Internal server error

### Rules
1. NEVER return raw Prisma errors to the client
2. ALWAYS use the Prisma singleton from `@/lib/prisma`
3. ALWAYS validate with Zod before any database operation
4. Business logic belongs in `src/lib/services/`, not in route handlers
5. Use `try/catch` around database operations
