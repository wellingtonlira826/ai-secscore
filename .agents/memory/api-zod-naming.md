---
name: api-zod Zod schema naming for mobile auth
description: Correct Zod schema names for mobile authentication routes in auth.ts
---

The generated Zod schema names for mobile auth endpoints differ from what the route file originally used.

**Correct names** (from `lib/api-zod/src/generated/api.ts`):
- `ExchangeMobileTokenBody` — request body for `/mobile-auth/token-exchange`
- `ExchangeMobileTokenResponse` — response for token exchange
- `LogoutResponse` — response for `/mobile-auth/logout`

**Wrong names** (were in auth.ts before fix, came from old types-only imports):
- `ExchangeMobileAuthorizationCodeBody` ❌
- `ExchangeMobileAuthorizationCodeResponse` ❌
- `LogoutMobileSessionResponse` ❌

**Why:** When the types barrel was still exported alongside Zod schemas, TypeScript interfaces had different names than the Zod schemas. The auth.ts was importing the TypeScript interface names (from types/) thinking they were Zod schemas. After removing the types barrel, only Zod schema names remain valid imports.

**How to apply:** Always verify actual schema names with `grep -n "export const" lib/api-zod/src/generated/api.ts` when auth imports break after a codegen run.
