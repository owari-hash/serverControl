# Content admin app — backend handoff

**Naming:** The **content admin** app is the product: the UI that edits copy and media via **`/api/v2/content-admin`**. That is the same scope people sometimes call “client admin”; here we use **content admin** for the app. The platform role string **`client-admin`** (with a hyphen) is only the **RBAC role name** in bindings and JWTs—not a separate product.

This document is for **another team** building that **content admin** UI. They integrate **only** with `serverControl`; no other admin codebase is required.

## What to copy from this repo

| File | Purpose |
|------|---------|
| [CONTENT_ADMIN_API.md](./CONTENT_ADMIN_API.md) | Full HTTP reference (routes, bodies, errors, envelope). |
| [contentAdminContract.js](./contentAdminContract.js) | Authoritative **text field whitelist** (`CONTENT_ADMIN_TEXT_FIELD_KEYS`) and **relative URL paths** (`CONTENT_ADMIN_PATHS`) under the v2 API root. |

## Base URL

All paths below are relative to:

```text
{PM_SERVER_ORIGIN}/api/v2
```

Replace `{PM_SERVER_ORIGIN}` with your deployment (for example `https://control.example.com`). The platform mounts the API under **`/api`**.

## Authentication

1. **Login** (no auth header):

   ```http
   POST /api/v2/core/auth/login
   Content-Type: application/json

   { "email": "<user@domain>", "password": "<password>" }
   ```

2. Responses use the **v2 envelope**: top-level `version` and **`data`** object. Tokens and user fields live inside **`data`** (for example `data.accessToken`, `data.refreshToken`). Parse `data` on the client.

3. On **every** content-admin request, send:

   ```http
   Authorization: Bearer <accessToken>
   x-project-id: <projectName>
   ```

   - **`projectName`** must match the project the user is allowed to edit.
   - The user must have a **project binding** with role **`client-admin`** or **`editor`** for that project (configured on the platform; not part of this document).

4. **Refresh** (optional but recommended): `POST /api/v2/core/auth/refresh` with `{ "refreshToken": "..." }` — same envelope shape for new tokens.

## CORS and browser apps

If the **content admin** app runs **in the browser** on a different origin than `{PM_SERVER_ORIGIN}`, either:

- Enable **CORS** on `serverControl` for that admin origin (and allow headers `Authorization`, `Content-Type`, `x-project-id`), or  
- Add a **server-side proxy** in the admin app (Next.js route handler, etc.) so the browser only talks to same-origin; the proxy forwards to `{PM_SERVER_ORIGIN}` with the headers above.

## Content-admin routes (summary)

Prefix on the server: **`/api/v2/content-admin`**. Relative to the **`/api/v2`** base, paths are:

| Method | Relative path | Role |
|--------|----------------|------|
| `GET` | `/content-admin/component-types` | List supported component types (forms). |
| `GET` | `/content-admin/blocks?pageRoute=...` | Optional `pageRoute`; list instances. |
| `GET` | `/content-admin/blocks/tree?pageRoute=...` | **`pageRoute` required**; nested tree. |
| `POST` | `/content-admin/blocks/:instanceId/text` | Body `{ "fields": { ... } }` — whitelisted keys only. |
| `POST` | `/content-admin/blocks/:instanceId/images` | Body `{ "images": [...], "mode"?: "replace"|"append" }`. |
| `POST` | `/content-admin/blocks/:instanceId/media` | Body `{ "items": [...], "mode"?: "replace"|"append" }`. |

Resolve **`instanceId`** from a prior `GET .../blocks` or `.../blocks/tree` response — do not invent IDs client-side.

For request/response shapes, status codes, and audit names, use **[CONTENT_ADMIN_API.md](./CONTENT_ADMIN_API.md)**.

## Extending allowed text fields

Add keys only in **`contentAdminContract.js`** (`CONTENT_ADMIN_TEXT_FIELD_KEYS`) and implement merge behavior in **`contentAdminService.js`** if needed. Run **`npm test`** in `serverControl` so contract tests stay aligned.

## Out of scope for content-admin

Creating/deleting/reordering component instances, full component `PATCH`, designs, and deployment APIs live under other `/api/v2/...` routes. A **content-only** content admin app should **not** call those unless you explicitly expand scope.
