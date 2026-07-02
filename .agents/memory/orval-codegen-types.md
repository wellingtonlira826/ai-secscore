---
name: Orval codegen types conflict
description: How to prevent TS2308 duplicate-export error when orval generates both Zod schemas and TypeScript interfaces with identical names
---

When orval runs in `mode: "split"` with `schemas: { path: "generated/types", type: "typescript" }`, it generates `lib/api-zod/src/index.ts` that exports from BOTH `./generated/api` (Zod values) AND `./generated/types` (TS interfaces). If any schema name appears in both, TypeScript raises TS2308 (duplicate export).

**Fix:** A post-codegen patch in `lib/api-spec/package.json` removes the types barrel line from the generated index.ts entirely:

```
node -e "const fs=require('fs'),f='../../lib/api-zod/src/index.ts',c=fs.readFileSync(f,'utf8').replace(/export (?:type )?\* from ['\"].+generated.types['\"];?\n?/,'');fs.writeFileSync(f,c);"
```

**Why:** The Zod schemas (`z.object(...)`) are runtime values. TypeScript interfaces are compile-time types. When they share the same name in the same barrel, `export *` causes TS2308. Removing the types barrel is safe because the api-server only needs Zod schemas (not TS interfaces), and the frontend uses `@workspace/api-client-react` which has its own types.

**How to apply:** This patch is already in `lib/api-spec/package.json` codegen script. Any time you run `pnpm --filter @workspace/api-spec run codegen`, it patches automatically. If the pattern changes (orval version bump), update the regex.
