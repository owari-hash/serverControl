# Modular Monolith Foundation

## API Layers
- Only modular API is exposed.
- Base endpoint `/api` returns API metadata.
- Feature endpoints are under `/api/v2/*`.

## Request Context Rules
- `x-project-id` (or `projectId` query/body fallback) identifies tenant/project.
- `x-module` or mounted route sets module context.
- Module endpoints reject requests missing required context.

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
- Remote execution abstraction: `src/shared/infra/remoteExecutor`

## Database Isolation
- Control plane uses default mongoose connection.
- Project metadata stores `dbUri` + `dbName` and readiness status.
- `src/shared/db/projectConnectionRegistry` provides per-project lazy connections.
