# Modular Monolith Foundation

## API Layers
- Only modular API is exposed.
- Base endpoint `/api` returns API metadata.
- Feature endpoints are under `/api/v2/*`.
- Responses use unified envelope: `{ version, data }`.

## Request Context Rules
- `x-project-id` (or `projectId` query/body fallback) identifies tenant/project.
- `x-module` or mounted route sets module context.
- Module endpoints reject requests missing required context.
- Protected routes require `Authorization: Bearer <accessToken>`.

## Core/Shared/Modules
- Core: `src/core/auth`, `src/core/users`, `src/core/permissions`
- Core project lifecycle API: `src/core/projects` (`/api/v2/core/projects`)
- Core design API: `src/core/designs` (`/api/v2/core/designs`)
- Core component API: `src/core/components` (`/api/v2/core/components`, requires `x-project-id`)
- Shared services: `src/services/payment`, `src/services/ai`, `src/services/email`
- Product modules: `src/modules/ecommerce`, `src/modules/landing`, `src/modules/inventory`

## Multi-Server + Domain Infrastructure
- Server registry: `src/modules/infrastructure/servers`
- Domain binding: `src/modules/infrastructure/domains`
- Nginx config generation: `src/shared/infra/nginxConfigManager`
- Remote execution over SSH: `src/shared/infra/remoteExecutor`

## Database Isolation
- Control plane uses default mongoose connection.
- Project metadata stores `dbUri` + `dbName` and readiness status.
- `src/shared/db/projectConnectionRegistry` provides per-project lazy connections.

## Auth Hardening
- Access + refresh JWT token flow with rotation/revocation.
- Auth endpoints:
  - `/api/v2/core/auth/login`
  - `/api/v2/core/auth/refresh`
  - `/api/v2/core/auth/logout`
  - `/api/v2/core/auth/me`
- Refresh token sessions stored in `AuthSession` model.
- Login/refresh endpoints are rate-limited.
- Optional httpOnly refresh cookie support is configurable via env.

## Tenant Authorization
- `User` model stores identity and global role (`superadmin`, `client-admin`, `editor`).
- `UserProjectBinding` model stores per-project access and binding roles.
- `requireProjectAccess` middleware enforces project-scoped authorization.
- `requireRole` middleware enforces platform-level authorization.

## Authorization Matrix
- Project list/details/logs: authenticated users filtered by project bindings.
- Project create/delete/generate: `superadmin` only.
- Project build/stop/update: `client-admin` on assigned projects.
- Design and component writes: `client-admin`/`editor` on assigned projects.
- Domain bind/toggle: `client-admin` on assigned projects.
- Server registry and remote exec: `superadmin` only.
