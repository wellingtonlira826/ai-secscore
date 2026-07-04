---
name: api-zod codegen strips generated type exports
description: Why generated TS types aren't exported from @workspace/api-zod, and why typecheck must be run explicitly
---

# Generated TS types are not exported from @workspace/api-zod by default

The Orval codegen step strips any star export of the `generated/types` barrel from the api-zod index (to avoid the zod-const vs same-named-interface collision). So generated **types** are unavailable to consumers unless re-exported explicitly.

**Rule:** to expose a generated type, add a *named* `export type { X } from "./generated/types";` in the index — named re-exports survive the strip; star exports do not.

**Why it bites silently:** the api-server build uses esbuild, which skips typechecking, so a broken `tsc` never blocks the dev server or deploy. A running app is NOT proof the types resolve.
**How to apply:** always run `pnpm run typecheck` after any codegen run or auth/shared-type change — do not rely on the app running.
