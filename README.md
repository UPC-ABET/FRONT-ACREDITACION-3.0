# ABET Frontend

Next.js (App Router) frontend for the ABET accreditation system. This README describes how
the generator works, the app structure, i18n, providers, and the global pieces.

> **This file predates the current architecture in places** (see the Auth guard section
> below, which still describes a `bearerToken`/`localStorage` flow). For the current,
> verified state of the codebase, see [`docs/CONTEXT.md`](./docs/CONTEXT.md) and
> [`docs/POLICIES.md`](./docs/POLICIES.md) — those are kept accurate; this file is a
> narrative walkthrough that hasn't been fully reconciled with them yet.

## Requirements

- Node.js 18+ (recommended)
- npm / yarn / pnpm

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Main structure

```
src/
  app/                # Next.js routes and layouts (App Router)
  modules/            # Domain modules (auth, tests, etc.)
  shared/              # Shared UI and utilities
  providers/           # Global contexts
  language/            # i18n (translation json)
public/
  assets/              # Static images (logo, etc.)
```

Notes:

- `src/app` only orchestrates screens and wires up modules (no complex business logic).
- `src/modules` contains domain logic, services, and reusable pages.
- `src/shared` contains global UI, hooks, utils, and types.
- `src/providers` centralizes global contexts.
- `src/language` contains the i18n messages.

## Routes and layouts (App Router)

- `src/app/layout.tsx`: root layout. Injects `LocaleProvider` and `LayoutClient`.
- `src/app/(protected)/layout.tsx`: client layout for protected routes.
- `src/app/[locale]/layout.tsx`: locale layout (current placeholder).
- `src/app/page.tsx`: home. Renders `HomeClient`.
- `src/app/auth/login/page.tsx`: login.
- `src/app/tests/*`: demo pages for UI (modals, charts, tables, public).

### Auth guard and middleware

- `middleware.ts` redirects to `/auth/login` if the `bearerToken` cookie doesn't exist and
  the route isn't `/auth/*`.
- `useAuthGuard` (in `src/shared/hooks/useAuthGuard.ts`) checks `bearerToken` in
  `localStorage` and redirects to login.
- `LayoutClient` applies the guard on non-auth routes and mounts `Navbar` + `AppSidebar`.

## Global providers

- `LocaleProvider` (i18n) in `src/providers/locale-provider.tsx`.
- `ABETProvider` in `src/providers/abet-provider.tsx` (global modality state).
- `SidebarProvider` re-exports the UI provider.

`LayoutClient` is the composition point for global providers and the visual layout.

## i18n (language / locales)

Messages live in:

- `src/language/locales/es.json`
- `src/language/locales/en.json`

`LocaleProvider` exposes:

- `locale`: `es` or `en`
- `setLocale(nextLocale)`
- `t('path.key')`

The locale is persisted in:

- `localStorage` under the key `app_locale`
- `document.documentElement.lang`
- an `app_locale` cookie (max-age 1 year)

### Adding a new translation

1. Add the key to `es.json` and `en.json`.
2. Use `t('your.key')` from components or modules.
3. If it's global UI text, prefer putting it in `shared/components`.

## Sidebar and navigation

- `AppSidebar` builds the menu using `t('nav.*')`.
- For new routes, add an item to `navigation` or use the generator (see below).

## Modules

### Standard module structure

```
src/modules/<module>/
  components/
  constants/
  hooks/
  pages/
  schemas/
  services/
  index.ts
```

### `auth` module

- `src/modules/auth/Login.tsx`: login screen.
- `LoginForm` uses `loginMock` (a local service) and stores `bearerToken` in
  `localStorage`.
- Current demo credentials (per `authService.ts`):
  - `codigo=demo`, `password=demo`
  - `codigo=Admi`, `password=abet123`

### `tests` module

Contains demo UI pages for validating shared components:

- `charts`, `tables`, `modals`, `public`

## Module generator

The generator creates a full module and its associated route.

### Build the scripts

```bash
npx tsc -p tsconfig.scripts.json
```

### Create a module

```bash
node dist-scripts/generator/create-module.js <module-name>
```

### What it generates

For `rubricas`, it creates:

- `src/modules/rubricas/types/index.ts` and `src/modules/rubricas/services/` (CRUD service
  using `NEXT_PUBLIC_API_URL`) and `src/modules/rubricas/pages/` (a named-export page
  component) — only the folders that get real content, per
  [`docs/POLICIES.md`](./docs/POLICIES.md#code-style) ("no empty placeholder files").
- `src/modules/rubricas/index.ts` (barrel, re-exporting `pages`/`services`/`types`).
- `src/app/rubricas/page.tsx`, a thin route file with a default export that re-exports the
  module's named page component (Next.js requires the route file's default export; the
  module's own component stays a named export).
- An item added to `navigation` in `src/app/components/app-sidebar.tsx` (uses `FolderIcon`).

### Generator notes

- If the route already exists in the sidebar, it isn't duplicated.
- If `const navigation` isn't found, it warns in the console.
- To customize the service, edit the generated file in `services/`.

## Global configuration and constants

- `src/shared/constants/app.ts` defines `APP_NAME`, `APP_DESCRIPTION`, `DEFAULT_LOCALE`,
  `STORAGE_KEYS`, etc.
- `src/app/layout.tsx` consumes those constants for `metadata`.

## Shared UI

`src/shared/components` contains:

- Base components (Button, Card, Input, Select, Table, Dialogs, etc.)
- Layout (Navbar, Sidebar)
- `LanguageSwitcher` for switching language

## Assets

- Logo at `public/assets/ABETLogo.png`.

## Environment variables

Currently in use:

- `NEXT_PUBLIC_API_URL` (used by the generator to build service URLs).

See [`docs/CONTEXT.md`](./docs/CONTEXT.md#environment-variables) for the full,
Zod-validated list.

## Quick development flow

1. Start the dev server.
2. Use the demo login to sign in.
3. Explore `/tests/*` to see components.
4. Create new modules with the generator when possible.
