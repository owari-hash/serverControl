# Content admin API — full reference

**Only** the `/api/v2/content-admin` surface. For editors with a **client-admin** or **editor** project binding.

Authentication: **`Authorization: Bearer <access_token>`**  
Project scope: **`x-project-id: <projectName>`** (must match an active binding)

All successful responses use the usual v2 envelope:

```json
{
  "version": "2.0.0",
  "data": {
    "success": true,
    "components": [],
    "component": {}
  }
}
```

- List/tree: read `data.components`
- Writes: read `data.component`

---

## 1) Read blocks (find `instanceId`)

Every component instance in the database has an **`instanceId`** (string, unique per project). It is created when that block is first saved (often a UUID). The content-admin **GET** responses include it on **each** item or tree node — your UI reads `instanceId` from there and passes it into **`POST .../blocks/:instanceId/...`**. Nothing guesses it client-side; you always resolve it from a prior list/tree fetch (or from your own seed data if you control IDs).

### `GET /api/v2/content-admin/blocks`

**Query**

| Parameter   | Required | Description |
|------------|----------|-------------|
| `pageRoute` | No       | If set, filters to that route (e.g. `%2F` for `/`). If omitted, returns all routes for the project (may be large). |

**Headers:** `Authorization`, `x-project-id`

**Body:** none

**Response:** `data.components` — array of instances with `instanceId`, `componentType`, `pageRoute`, `parentId`, `slot`, `order`, `props`, etc.

### `GET /api/v2/content-admin/blocks/tree`

**Query**

| Parameter   | Required | Description |
|------------|----------|-------------|
| `pageRoute` | **Yes**  | URL-encoded path, e.g. `/about` → `pageRoute=%2Fabout` |

**Headers:** `Authorization`, `x-project-id`

**Body:** none

**Response:** `data.components` — nested tree for that page.

---

## 2) Update text (`props` string fields only)

### `POST /api/v2/content-admin/blocks/:instanceId/text`

Merges allowed keys into existing `props`. Other `props` keys are left unchanged. Keys not in the whitelist are ignored. Does **not** accept theme, layout, `links`, `buttons`, or nested objects.

**Headers:** `Authorization`, `Content-Type: application/json`, `x-project-id`

**Body**

```json
{
  "fields": {
    "title": "New title",
    "description": "New body text"
  }
}
```

**Whitelisted `fields` keys** (must be strings if present):

`title`, `subtitle`, `description`, `content`, `copyright`, `welcomeMessage`, `placeholder`, `sendButtonText`, `launcherLabel`, `openButtonText`, `closeButtonText`, `confirmButtonText`, `submitButtonText`, `cancelButtonText`, `loadingText`, `agentName`, `offlineMessage`

**Errors**

| Status | When |
|--------|------|
| 400 | Missing or invalid `fields`, or value not a string |
| 404 | Unknown `instanceId` for this project |

**Audit:** `content-admin.text`

---

## 3) Update images (URLs only, no upload)

### `POST /api/v2/content-admin/blocks/:instanceId/images`

Writes to **`props.images`**. Does not touch other `props`.

**Body**

```json
{
  "images": [
    { "url": "https://cdn.example.com/a.jpg", "alt": "Photo A" },
    { "url": "https://cdn.example.com/b.jpg" }
  ],
  "mode": "replace"
}
```

| Field | Required | Values |
|-------|----------|--------|
| `images` | Yes | Array of `{ "url": string, "alt"?: string }` |
| `mode` | No | `"replace"` (default) — set `props.images` to this list. `"append"` — push onto existing `props.images`. |

**Errors**

| Status | When |
|--------|------|
| 400 | `images` not an array, bad `url`, or `alt` not a string |
| 404 | Unknown instance |

**Audit:** `content-admin.images`

---

## 4) Update media (image URLs via `items`)

### `POST /api/v2/content-admin/blocks/:instanceId/media`

Same storage as **`props.images`** for items with `"kind": "image"`. Other kinds are ignored today (reserved).

**Body**

```json
{
  "items": [
    { "kind": "image", "url": "https://cdn.example.com/x.png", "alt": "X" }
  ],
  "mode": "append"
}
```

| Field | Required | Values |
|-------|----------|--------|
| `items` | Yes | Array; only `kind === "image"` entries are applied |
| `mode` | No | `"append"` (default) or `"replace"` |

**Audit:** `content-admin.media`

---

## 5) What this API does not do

- No multipart file upload — host files elsewhere, pass **HTTPS URLs**.
- No editing **`links`**, **`buttons`**, **`theme`**, **`align`**, **`spacing`**, or other non-whitelisted `props` via the text route (use a product-specific path or extend the whitelist in `contentAdminService.js` if you need that).
- No creating/deleting instances or reordering in this API (out of scope for these routes).

---

## 6) `@cms-builder/core` client

Base URL: `NEXT_PUBLIC_CMS_API_URL` → `.../api/v2`.

| Server route | Client method |
|--------------|----------------|
| `GET .../content-admin/blocks` | `cmsApi.getContentAdminBlocks(projectName, bearerToken, pageRoute?)` |
| `GET .../content-admin/blocks/tree` | `cmsApi.getContentAdminTree(projectName, pageRoute, bearerToken)` |
| `POST .../text` | `cmsApi.postContentAdminText(projectName, instanceId, fields, bearerToken)` |
| `POST .../images` | `cmsApi.postContentAdminImages(projectName, instanceId, payload, bearerToken)` |
| `POST .../media` | `cmsApi.postContentAdminMedia(projectName, instanceId, payload, bearerToken)` |

---

## 7) Bearer token

Every `/content-admin` request needs a valid **Bearer** token for a user who has a **client-admin** or **editor** binding on the project. How you obtain that token depends on your deployment’s sign-in flow; it is not part of the content-admin route list in this document.
