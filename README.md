Full Workspace Architecture (Platform + CMS Ecosystem)

## 1) Workspace Overview

This workspace currently contains 3 active projects and 1 missing project:

1. `serverControl` (Backend / platform brain / superadmin API surface)
2. `cmsBuilder` (Shared CMS framework package: `@cms-builder/core`)
3. `clientCmsTemplate` (Client-facing Next.js template app using `@cms-builder/core`)
4. `clientCmsAdmin` (Missing project - should be created as content CRUD admin app)

---

## 2) System Vision

- **One shared backend** (`serverControl`) for all projects.
- **Modular monolith** backend, split by bounded contexts (`core`, `modules`, `infrastructure`).
- **Shared frontend framework** (`cmsBuilder`) used by multiple client apps.
- **Per-client website runtime** (`clientCmsTemplate`) that renders CMS-managed content.
- **Admin UI** (`clientCmsAdmin`) for CRUD content, publishing, and project operations.
- **Superadmin capabilities** for server/domain/deployment management through infrastructure APIs.

---

## 3) Current Project-by-Project Architecture

## 3.1 `serverControl` (Backend, Superadmin API, Deployment Control)

### Role

Main platform backend handling:

- Auth
- Projects lifecycle
- Design/content APIs
- Module health checks
- Infrastructure operations (servers, domains, nginx config generation)

### Current API shape

Base:

- `/api` (metadata)
- `/api/v2/*` (all active APIs)
  Core endpoints:
- `/api/v2/core/auth`
- `/api/v2/core/projects`
- `/api/v2/core/designs`
- `/api/v2/core/components`
- `/api/v2/core/users`
- `/api/v2/core/permissions`
  Module endpoints:
- `/api/v2/modules/ecommerce`
- `/api/v2/modules/landing`
- `/api/v2/modules/inventory`
  Infrastructure endpoints:
- `/api/v2/infrastructure/servers`
- `/api/v2/infrastructure/domains`

### Data isolation strategy

- Project-aware context via `x-project-id` (or fallback `projectId`).
- DB metadata stored per project in project records (`dbUri`, `dbName`, status).
- Registry prepared for per-project connections.

### Superadmin capabilities (already in backend)

- Register server targets
- Execute remote commands via abstraction layer
- Bind domain to project and generate nginx candidate configs
- Enable/disable domain mappings

---

## 3.2 `cmsBuilder` (`@cms-builder/core` shared package)

### Role

Reusable framework consumed by client apps:

- API client (`cmsApi`)
- Content service
- CMS page renderer
- component registry / theme provider / schemas / types

### Current status

- Package is active and versioned (`@cms-builder/core`).
- Client template imports it successfully.
- **Important gap**: API client still points to **legacy endpoints** (`/api/sites/...`, `/api/components/...`) and must be aligned with new `/api/v2` routes.

### Why this matters

Without endpoint alignment, frontend apps may show:

- “CMS data unavailable”
- Missing component instances
- Failed content fetches

---

## 3.3 `clientCmsTemplate` (Client website runtime)

### Role

Next.js frontend that renders project pages from CMS data.

### Current behavior

- Fetches design + component instances via `@cms-builder/core` API client.
- Uses `NEXT_PUBLIC_PROJECT_NAME` to identify tenant/project.
- Renders via `CMSPage`.

### Dependency

Hard dependency on `cmsBuilder` API contract.  
If `cmsBuilder` uses outdated routes, this app cannot fully operate against current backend.

---

## 3.4 Missing: `clientCmsAdmin` (Content CRUD admin app)

### Required role

Tenant-level admin UI for:

- Editing design/pages/theme
- CRUD for component instances
- Reordering components
- Triggering project build/generate actions
- (Optional) domain binding and deployment actions depending on role

---

## 4) Logical Architecture (Target State)

## 4.1 Backend domain boundaries (`serverControl`)

- **Core**
  - `auth`
  - `projects`
  - `designs`
  - `components`
  - `users`
  - `permissions`
- **Product modules**
  - `landing`
  - `ecommerce`
  - `inventory`
- **Infrastructure**
  - `servers`
  - `domains`
  - nginx config manager
  - remote executor abstraction
- **Shared**
  - request context middleware
  - db registry
  - service abstractions (payment/ai/email)

## 4.2 Frontend roles

- `cmsBuilder`: framework/toolkit only (no business ownership).
- `clientCmsTemplate`: public site runtime.
- `clientCmsAdmin`: tenant content management UI.
- Superadmin UI can be:
  - either inside `clientCmsAdmin` with role gates, or
  - separate app (`superadmin-console`) for platform operations.

---

## 5) API Contract Baseline for All Frontends

## 5.1 Mandatory headers/params

- `x-project-id` required for project-scoped endpoints:
  - `/api/v2/core/components`
  - `/api/v2/modules/*`
  - `/api/v2/infrastructure/domains`

## 5.2 Core content CRUD

- Designs:
  - `POST /api/v2/core/designs`
  - `GET /api/v2/core/designs/:name`
  - `PATCH /api/v2/core/designs/:name`
  - `DELETE /api/v2/core/designs/:name`
- Components:
  - `POST /api/v2/core/components`
  - `GET /api/v2/core/components?pageRoute=/...`
  - `GET /api/v2/core/components/tree?pageRoute=/...`
  - `PATCH /api/v2/core/components/:instanceId`
  - `DELETE /api/v2/core/components/:instanceId`
  - `POST /api/v2/core/components/reorder`

## 5.3 Project lifecycle

- `POST /api/v2/core/projects/generate`
- `GET /api/v2/core/projects`
- `GET /api/v2/core/projects/:name`
- `PATCH /api/v2/core/projects/:name`
- `POST /api/v2/core/projects/:name/build`
- `POST /api/v2/core/projects/:name/stop`
- `DELETE /api/v2/core/projects/:name`

## 5.4 Superadmin/infrastructure

- Servers:
  - `POST /api/v2/infrastructure/servers`
  - `GET /api/v2/infrastructure/servers`
  - `POST /api/v2/infrastructure/servers/:id/exec`
- Domains:
  - `POST /api/v2/infrastructure/domains/bind`
  - `GET /api/v2/infrastructure/domains`
  - `PATCH /api/v2/infrastructure/domains/:domain/enabled`

---

## 6) `clientCmsAdmin` Blueprint (Missing Project)

## 6.1 Recommended stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind
- Reuse `@cms-builder/core` where useful, but add admin-specific API layer (`adminApi`)

## 6.2 Suggested folder structure

```text
clientCmsAdmin/
  src/
    app/
      (auth)/
        login/page.tsx
      (dashboard)/
        page.tsx
        projects/page.tsx
        projects/[project]/page.tsx
        projects/[project]/design/page.tsx
        projects/[project]/components/page.tsx
        projects/[project]/components/[instanceId]/page.tsx
        projects/[project]/deploy/page.tsx
        infrastructure/servers/page.tsx
        infrastructure/domains/page.tsx
      api-health/page.tsx
    lib/
      api/
        auth.ts
        projects.ts
        designs.ts
        components.ts
        infrastructure.ts
      state/
      validators/
      utils/
    components/
      forms/
      tables/
      editors/
      dnd/
6.3 Core pages/features
Login page
Project list/create
Project detail (status, actions)
Design editor (theme/pages)
```
