# Frontend Integration v2 - Mistakes and Fixes

This document replaces assumptions in `frontend_integration.md` and aligns with the current `serverControl` + `cmsBuilder` architecture.

## Purpose

- Point out what is incorrect in the old integration doc.
- Provide the corrected model, endpoints, and payloads.
- Give migration guidance from legacy payload shapes.

---

## 1) Mistake: Unsupported Component Types

### Old doc says

- Components like: `home`, `service`, `contact`, `text`, `slideshow`.

### Why this is wrong

- Current renderer only supports registered component types.
- Unknown types render `UnknownComponent` and are not first-class schema components.

### Correct component types (current)

- `header`
- `hero`
- `about`
- `footer`
- `twocolumn`
- `grid`
- `card`
- `container`
- `pagination`
- `button`
- `modal`
- `chatbot`
- `livechat`

---

## 2) Mistake: Section Placeholder XY Model

### Old doc says

- Store draggable `sections[]` with:
  - `position: {x,y}`
  - `size: {width,height}`
  - `content`

### Why this is wrong

- Current architecture is not absolute-position section JSON.
- It is a **component tree**, stored as flat instances with hierarchy links.

### Correct structure model

Each component instance uses:

- `instanceId`
- `projectName`
- `pageRoute`
- `componentType`
- `parentId` (`null` for root)
- `slot` (`null` for root, otherwise layout slot)
- `order`
- `props`

---

## 3) Mistake: Header/Footer Property Shapes

### Old doc says

- `header.props.pages`, `header.logoUrl`
- `footer.props.email`, `footer.phone`, `footer.address`

### Why this is wrong

- These are not the active schema contract fields.

### Correct minimum schema expectations

- `header`:
  - required: `title`
  - optional: `theme`, `links[]`, `button`
- `footer`:
  - required: `title`, `copyright`
  - optional: `theme`, `footerLinks`, `button`

---

## 4) Mistake: Save Strategy ("delete all and recreate")

### Old doc says

- Current implementation deletes all and recreates.

### Why this is wrong

- Current backend supports targeted CRUD and reorder:
  - create one
  - patch one
  - delete one (recursive for children)
  - reorder bulk

### Correct save strategy

- Use `POST /core/components` for new instance.
- Use `PATCH /core/components/:instanceId` for existing.
- Use `POST /core/components/reorder` for ordering.
- Use `DELETE /core/components/:instanceId` for removal.

---

## 5) Mistake: Project Context Handling is underspecified

### Old doc says

- Uses `projectId` in body/query in examples.

### Why this is incomplete

- Component operations are project-scoped and your runtime expects project context middleware.
- Primary reliable path is `x-project-id` header.

### Correct request headers for component writes

- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `x-project-id: <projectName>`

---

## 6) Correct API Reference (Current)

## Components

- `GET /api/v2/core/components?pageRoute=/...`
- `GET /api/v2/core/components/tree?pageRoute=/...`
- `POST /api/v2/core/components`
- `PATCH /api/v2/core/components/:instanceId`
- `POST /api/v2/core/components/reorder`
- `DELETE /api/v2/core/components/:instanceId`

## Designs

- `GET /api/v2/core/designs`
- `GET /api/v2/core/designs/:name`
- `POST /api/v2/core/designs` (upsert by `projectName`)
- `PATCH /api/v2/core/designs/:name`
- `DELETE /api/v2/core/designs/:name`

---

## 7) Correct Payload Examples

## 7.1 Create Hero

```json
{
  "instanceId": "hero-home-main",
  "componentType": "hero",
  "pageRoute": "/",
  "order": 0,
  "props": {
    "title": "Welcome to Acme",
    "subtitle": "Production-ready CMS platform",
    "align": "center",
    "theme": "primary",
    "spacing": "xl",
    "buttons": [
      { "text": "Book Demo", "href": "/contact", "variant": "primary", "size": "lg" }
    ]
  }
}
```

## 7.2 Create Grid + Child Cards (slot model)

Parent:

```json
{
  "instanceId": "grid-services",
  "componentType": "grid",
  "pageRoute": "/services",
  "order": 1,
  "props": {
    "columns": 3,
    "gap": "lg",
    "theme": "light"
  }
}
```

Child in `items` slot:

```json
{
  "instanceId": "service-card-1",
  "componentType": "card",
  "pageRoute": "/services",
  "parentId": "grid-services",
  "slot": "items",
  "order": 0,
  "props": {
    "title": "Platform Engineering",
    "subtitle": "Architecture and scale",
    "border": true,
    "shadow": "md",
    "padding": "md",
    "theme": "light"
  }
}
```

## 7.3 Update Component Content

```json
{
  "props": {
    "title": "Updated headline",
    "subtitle": "Updated subtext"
  }
}
```

## 7.4 Create Chatbot (UI-only)

```json
{
  "instanceId": "chatbot-global",
  "componentType": "chatbot",
  "pageRoute": "/",
  "order": 900,
  "props": {
    "title": "AI Assistant",
    "welcomeMessage": "Hi! I can help you navigate this site.",
    "placeholder": "Ask me anything...",
    "launcherLabel": "Chat",
    "position": "bottom-right",
    "theme": "primary",
    "defaultOpen": false,
    "showTimestamp": true,
    "quickReplies": ["Pricing", "Contact support", "Book demo"],
    "botReplies": [
      "Great question. You can find details in our Services page.",
      "Our team can help. Please share a bit more context."
    ]
  }
}
```

## 7.5 Create Livechat (UI-only)

```json
{
  "instanceId": "livechat-global",
  "componentType": "livechat",
  "pageRoute": "/",
  "order": 901,
  "props": {
    "title": "Live Support",
    "subtitle": "Average response: 3 min",
    "agentName": "Support Team",
    "agentStatus": "online",
    "welcomeMessage": "Hello! An agent is ready to help.",
    "placeholder": "Type your message...",
    "launcherLabel": "Live Chat",
    "position": "bottom-right",
    "theme": "secondary",
    "defaultOpen": false,
    "showTimestamp": true,
    "offlineMessage": "We are currently offline. Leave a message and we will reply soon."
  }
}
```

---

## 8) Migration Guide from Old Doc

Map old concepts to current architecture:

- Old `home/service/contact` pseudo types -> use real registered components per page (`hero`, `about`, `grid`, etc.)
- Old `sections[]` freeform blocks -> create actual component instances with `parentId/slot/order`
- Old `cards[]` inside one `card` prop -> create one `grid` + many child `card` instances in `items` slot
- Old slideshow object -> use current available components (`hero` images, grid cards, or modal/image composition) until slideshow component is officially added

---

## 9) Validation Rules to Enforce in Frontend Save

Before calling backend:

- `componentType` must be one of current registry types.
- required fields by type:
  - `header.props.title`
  - `hero.props.title`
  - `footer.props.title` and `footer.props.copyright`
  - `about.props.description`
- if child component:
  - provide valid `parentId`
  - provide valid `slot` matching parent layout contract
- always send:
  - `x-project-id` header
  - auth token on protected writes

---

## 10) Final Recommendation

Treat `frontend_integration.md` as legacy reference only.
Use this file (`frontend_integration_v2_fix.md`) as the active source for implementation.

---

## 11) Design Schema v2 (Backward-Compatible)

`WebsiteDesign` now supports optional canonical fields for Wix-style templates while preserving existing payload compatibility.

### New optional fields

- `template.name` (string)
- `template.version` (string)
- `template.layoutMode` (`absolute` | `grid`)
- `theme.tokens` (map of canonical tokens)
- `responsive.breakpoints.mobile` (number)
- `responsive.breakpoints.tablet` (number)
- `responsive.breakpoints.desktop` (number)
- `responsive.pages[]` (per-route responsive overrides)

### Compatibility contract

- Existing `theme.customTokens` is still accepted and written.
- Service normalization mirrors both namespaces:
  - `theme.tokens <- merge(theme.customTokens, theme.tokens)`
  - `theme.customTokens <- merge(theme.tokens, theme.customTokens)`
- Existing clients that only write `customTokens` continue to work.

### Patch example (v2)

```json
{
  "template.name": "Business Landing",
  "template.version": "1.0.0",
  "template.layoutMode": "grid",
  "theme.tokens.surface-default": "bg-white text-slate-900",
  "theme.tokens.text-primary": "text-slate-900",
  "responsive.breakpoints.mobile": 375,
  "responsive.breakpoints.tablet": 768,
  "responsive.breakpoints.desktop": 1440
}
```

---

## 12) Token Resolution Precedence (Runtime)

`cmsBuilder` token engine now resolves style values with this precedence:

1. Explicit component props
2. `theme.tokens` (canonical v2)
3. `theme.customTokens` (legacy)
4. Base defaults from renderer

This ensures predictable rendering while keeping old projects valid.

---

## 13) Template Preset Apply Flow

`cmssuperadmincanvas` now supports one-click preset apply:

1. Patch design token/template fields.
2. Replace route components with deterministic preset blocks.
3. Reorder roots to keep shell-safe ordering (`header` first, `footer` last).

Current presets:

- `business-landing`
- `saas-landing`

---

## 14) Cross-Repo Verification Checklist

### Editor (`cmssuperadmincanvas`)

- Switch `desktop/tablet/mobile` and verify preview width changes.
- Save breakpoints and refresh: ensure values persist from `design.responsive.breakpoints`.
- Apply each preset and verify the route is replaced deterministically.

### API (`serverControl`)

- `PATCH /core/designs/:name` with v2 fields returns persisted values.
- Confirm both `theme.tokens` and `theme.customTokens` are present after patch.
- Verify component reorder places `header` before body sections and `footer` last.

### Runtime (`cmsBuilder`)

- Render route with only global shell components and verify runtime fallback injects header/footer.
- In dev mode, confirm console warnings for missing required props.
- In dev mode, confirm unknown `token:*` references produce diagnostics warnings.

---

## 15) Superadmin Governance APIs (New)

### Templates

- `GET /api/v2/core/templates`
- `POST /api/v2/core/templates`
- `PATCH /api/v2/core/templates/:id`
- `POST /api/v2/core/templates/:id/duplicate`
- `POST /api/v2/core/templates/:id/activate`
- `POST /api/v2/core/templates/:id/rollback`
- `POST /api/v2/core/templates/:id/apply`
- `GET /api/v2/core/templates/:id/export`
- `POST /api/v2/core/templates/import`
- `DELETE /api/v2/core/templates/:id`

### Component Registry

- `GET /api/v2/core/registry`
- `PUT /api/v2/core/registry/:type`
- `DELETE /api/v2/core/registry/:type`

### Media Library

- `GET /api/v2/core/media`
- `POST /api/v2/core/media`
- `DELETE /api/v2/core/media/:id`

### Governance Analytics

- `GET /api/v2/core/analytics/overview`

All routes above are superadmin-protected and require:

- `Authorization: Bearer <token>`
