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
