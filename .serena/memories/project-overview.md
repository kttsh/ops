# Project Overview - ops

## What
Turborepo + pnpm monorepo for an operations management system (工数管理・人員配置).

## Structure
- `apps/backend/` - Hono v4 REST API (TypeScript, SQL Server, Zod v4)
- `apps/frontend/` - React 19 + Vite 7 SPA (TanStack Router/Query/Table/Form, Tailwind CSS v4, shadcn/ui, Zod v3)
- `packages/` - Shared packages (currently empty)
- `docs/` - Domain docs, DB schemas, dev rules
- `.kiro/` - Specs and steering

## Backend Architecture
Layered: routes → services → data, with transform and types layers.
- 20 entities implemented (businessUnits, projects, chartViews, etc.)
- Tests in `src/__tests__/` mirroring source structure

## Frontend Architecture
Feature-first: `src/features/[feature]/` with api, components, hooks, stores, types.
- TanStack Router file-based routing with auto-generated `routeTree.gen.ts`
- `src/components/ui/` for shadcn/ui primitives

## Key Conventions
- Backend files: camelCase (`businessUnitService.ts`)
- DB: snake_case, API response: camelCase
- `@/*` path alias for imports
- API responses follow RFC 9457 Problem Details for errors
- Vitest v4 for testing
