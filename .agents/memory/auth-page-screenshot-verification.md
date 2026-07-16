---
name: Verifying authenticated pages via screenshot
description: How to visually verify login-protected frontend pages when the screenshot browser has no session
---

The screenshot browser is unauthenticated, so protected pages render the login screen. Working recipe:

1. Insert a session row directly into the `sessions` table (sid + `sess` jsonb with `{user, access_token}`-shaped payload matching what `lib/auth.ts` expects, `expire` in the future).
2. Add a TEMPORARY dev-only route in `app.ts` gated on `NODE_ENV !== "production"`, e.g. `GET /api/dev-login?sid=&to=` that sets the `sid` cookie (httpOnly, secure, sameSite lax, path `/`) and redirects to `to`.
3. Screenshot with path `/api/dev-login?sid=...&to=%2F<target-page>` (URL-encode `to` if it contains its own query params — a raw `&` splits the outer query string).
4. **Always clean up**: remove the temp route, restart the workflow, confirm it returns 404, and delete the session row.

**Why:** there is no other way to drive the screenshot tool through Replit OIDC login.

**How to apply:** any time visual verification of an authenticated page is needed in this project.
