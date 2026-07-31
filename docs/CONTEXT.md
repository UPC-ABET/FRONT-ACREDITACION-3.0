# Context

Orientation for this repo: what exists, how it's organized, and what it talks to. For
mandatory rules ("you MUST"), see [`POLICIES.md`](./POLICIES.md).

This file and `POLICIES.md` are a split of what used to be a single `AGENTS.md`. See the
root [`AGENTS.md`](../AGENTS.md) for the pointer that every coding agent reads first.

---

## Stack

Verified against `package.json` on 2026-07-30 (do not trust prose over the lockfile — check
here first if something looks off):

- **Framework**: Next.js `^16.2.4` (App Router, Turbopack — Turbopack is the default
  bundler as of Next.js 16, no `--turbopack` flag needed)
- **Runtime**: React `^19.2.5` / React DOM `^19.2.5`
- **Language**: TypeScript `^5.9.3` (strict mode — see [`POLICIES.md`](./POLICIES.md#typescript))
- **State/Data**: TanStack Query `^5.100.10` for server state, TanStack Table `^8.21.3` for
  tabular data, React context for client state
- **Styling**: Tailwind CSS `^4` (`@import "tailwindcss"`)
- **Validation**: Zod `^4.4.3`
- **i18n**: Custom `useI18n()` hook with locale JSON files at `src/language/locales/{es,en}.json`
- **Components**: Custom UI primitives in `src/shared/components/ui/`, some based on
  shadcn/ui; `@base-ui/react`, `@headlessui/react`, `radix-ui` as headless building blocks
- **Other notable deps**: `exceljs` (Excel loads/exports), `jspdf` (PDF export), `recharts`
  (charts), `react-dropzone` (file upload), `react-select`, `js-cookie` (non-auth UX prefs only)
- **Tooling**: ESLint `^9` + `eslint-config-next` `16.2.2`, Prettier `^3.8.3`, Husky `^9.1.7`,
  lint-staged `^17.0.7`

No discrepancy found between AGENTS.md's stack claims and `package.json` (unlike the
backend repo, where AGENTS.md claimed NestJS 10 against an actual NestJS 11 — that class of
drift is exactly why this file says "verified against package.json").

---

## Related Repositories

- **`BACK-ACREDITACION-3.0`** — the NestJS backend. This repo's `NEXT_PUBLIC_API_URL`
  points at it (proxied through Nginx at `/api` in production, see
  [Environment Variables](#environment-variables)).
- The backend commits `openapi.json` at its repo root (`pnpm openapi:export`). It is this
  repo's source of truth for API request/response shapes.

**Fetch it remotely, never from a local checkout of the backend** — a colleague's working
tree may be on any branch with uncommitted changes:

```bash
gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=staging" \
  -H "Accept: application/vnd.github.raw"
```

### Cross-repo change model

Backend and frontend are separate repos. A change spanning both uses the **same slug** in
both repos' `openspec/changes/<slug>/` folders. `proposal.md` and `contract.md` (when
present) are identical copies across both repos; `design.md` and `tasks.md` hold only that
repo's own side. See [`openspec/README.md`](../openspec/README.md) for the full workflow.

- **Sequential** (one person, backend then frontend) — no `contract.md`; the backend's
  committed `openapi.json` IS the contract. This is the default.
- **Parallel** (two people, working at the same time) — `contract.md` is agreed before
  either side writes code.

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router — routes and layouts ONLY
│   ├── layout.tsx          # Root layout (providers wrapper)
│   ├── globals.css         # Global styles + CSS variables
│   ├── (protected)/        # Route group: authenticated-only layout wrapper
│   ├── [locale]/           # Locale route segment (layout placeholder)
│   └── <route>/page.tsx    # Route files import from modules
├── configs/                # Runtime config validation (env.config.ts — Zod-validated env)
├── modules/                # Domain modules (feature-sliced)
│   ├── academic/           # Academic periods, courses, programs, professors
│   ├── accreditation/      # Commissions, outcomes
│   ├── admin/              # Admin panels — sub-modules per concern, tabs split by domain
│   │   ├── chart-heads/    # Org-chart heads config (dean/directors) — helper module, no standalone route
│   │   ├── configuration/  # Academic periods & program commissions administration
│   │   ├── iam/            # Identity & access management (users, roles, permissions, modules)
│   │   ├── notifications/  # Notification config (IFC today; surveys, etc. as new tabs)
│   │   └── parameters/     # Parameter administration (IFC today; rubrics, general, academic as new tabs)
│   ├── ard/                 # ARD meeting/detail records — see Domain Vocabulary, needs a real definition
│   ├── auth/                # Authentication, login, session
│   ├── banner/              # Banner SIS scraping (departments, sections, login sessions)
│   ├── charts/               # Organization charts (org-chart rendering & maintenance)
│   ├── core/                # Shared backend entity types, services, constants
│   ├── evaluation/          # Rubrics, projects, grading
│   ├── ifcs/                # End-of-cycle reports (IFC)
│   ├── loads/                # Bulk Excel data loads & upload history
│   ├── organization/         # Hierarchical org-scope selection (ScopeTree) — see Domain Vocabulary
│   ├── planner/               # Planner scraping (courses, sessions)
│   ├── scraping-exports/      # Scraping export downloads
│   └── surveys/                # PPP, GRA, LCFC surveys
├── providers/              # Global React context providers
├── shared/                 # Cross-cutting utilities (truly no one's domain)
│   ├── components/ui/      # Reusable UI primitives
│   ├── constants/           # App-wide constants
│   ├── hooks/                # Generic hooks (useApiErrorToast, useLanguages)
│   ├── lib/                  # API client, error handling, logger, utils
│   ├── types/                 # Shared types (I18nText, ABETContextType, etc.)
│   └── utils/                  # Pure utility functions
└── language/locales/       # i18n JSON files (es.json, en.json)
```

> **Audit note (2026-07-30):** `src/modules/ard/`, `src/modules/organization/`, and
> `src/configs/` exist in the codebase but were absent from the previous AGENTS.md
> directory listing. They're added here from the actual `ls src/modules` /
> `ls src` output — not from the prior prose, which had drifted from the code.

### Module Structure

Every domain module follows this structure:

```
module-name/
├── components/         # UI components (subfolders by feature if needed)
│   └── index.ts
├── constants/          # Module-scoped constants
│   └── index.ts
├── hooks/              # React hooks
│   └── index.ts
├── pages/              # Page-level components (entry points for app/ routes)
│   └── index.ts
├── schemas/            # Validation logic (extracted from components)
│   └── index.ts
├── services/            # API calls only (no types here)
│   └── index.ts
├── types/               # ALL types — request, response, and domain
│   └── index.ts
└── index.ts             # Module barrel
```

Only create the folders/files a module actually needs — see
[`POLICIES.md`](./POLICIES.md#architecture-rules) for the "no empty placeholders" rule and
its interaction with `generator/create-module.ts`.

### Admin Modules and Tab Navigation

`modules/admin/` groups cross-cutting admin concerns (`configuration/`, `iam/`,
`notifications/`, `parameters/`, plus the route-less `chart-heads/` helper). Each routed
sub-module is a normal module — it owns one admin page that splits domain coverage via
**in-page tabs**, not via separate routes or sidebar entries.

Pattern:

- **One route per admin concern**: `/admin/configuration`, `/admin/iam`,
  `/admin/notifications`, `/admin/parameters`.
- **Top tabs select the domain**: IFC, Rubrics, General, Academic, Surveys, ... Adding a
  new domain = adding a tab entry, not a new route or sidebar item.
- **Sub-tabs only when a domain has multiple screens** (e.g., IFC parameters → Codes | Fields).
- **Tab state lives in the URL** via `?tab=<domain>` (and `?sub=<screen>` when needed).
  Shareable, no nested routes. Switching the top tab clears `?sub=` so sub-state doesn't
  leak across domains.

`admin/` is a namespace folder, not a module — see
[`POLICIES.md`](./POLICIES.md#admin-import-rule) for why it has no aggregate barrel and why
`@/modules/admin` is a blocked import.

### Sidebar Navigation

Admin currently exposes 4 leaf items: `Configuration`, `IAM`, `Notifications`, and
`Parameters` (the `chart-heads` helper module has no sidebar leaf). See
[`POLICIES.md`](./POLICIES.md#architecture-rules) for the max-2-levels rule this reflects.

---

## Import Rules Reference

See [`POLICIES.md`](./POLICIES.md#import-rules) for the allowed-direction rules and the
hard "never import another module's internal paths" rule. Known cross-module imports today
(consuming domain-owned exports through a public barrel):

- `admin/notifications` → `@/modules/academic/components` (for `AcademicPeriodSelect`)
- `admin/notifications` → `@/modules/core` (for `TYPE_GROUP_CODES`, `getTypesByGroupCode`)
- `evaluation` → `@/modules/academic` (for DTOs)
- `evaluation` → `@/modules/core` (for `TYPE_CODES`, `TYPE_GROUP_CODES`)
- `ifcs` → `@/modules/core` (for constants and services)

For nested modules like `admin/parameters`, the barrel is `@/modules/admin/parameters` —
`admin/` itself has no barrel (see above).

### `shared/` import audit

Verified 2026-07-30 with `rg "from '@/modules" src/shared/` — **zero matches**. No current
violations of the `shared/` → `modules/` import ban. (This was a known risk in the backend
repo; the frontend is currently clean. Re-run the same `rg` check periodically — see
[`POLICIES.md`](./POLICIES.md#import-rules) for the rule itself.)

---

## Core Module (`@/modules/core`)

The core module owns shared backend entity constants and lookup services that multiple
modules consume.

### Constants

- **`TYPE_GROUP_CODES`** — Type group identifiers (e.g., `IFC_STATUS: 'TG701'`,
  `PROGRAM_MODALITY: 'TG102'`)
- **`TYPE_CODES`** — Individual type item codes (e.g., `IFC_STATUS.SAVED: 'TG701-T001'`)
- **`PARAMETER_CODES`** — Parameter lookup keys (e.g., `LANGUAGES: 'PARAMETER_LANGUAGES'`)

### Services

- **`getTypesByGroupCode(groupCode)`** — Fetches type options from `/types/by-group-code/`
- **`getParameterByCode<T>(code)`** — Fetches parameter value from `/parameters/get-by-filters`

All modules import these from `@/modules/core` rather than duplicating codes locally — see
[`POLICIES.md`](./POLICIES.md#core-module) for the rule.

---

## Authentication Architecture

- **Backend** sets an `HttpOnly; Secure; SameSite=Lax` cookie on login. The frontend never
  reads or writes auth tokens.
- **`AuthProvider`** (`src/providers/AuthProvider.tsx`) calls `GET /users/me` on mount and
  stores the user in context.
- **`useAuth()`** hook exposes: `user`, `roles`, `permissions`, `schoolId`,
  `isAuthenticated`, `isLoading`, `refreshUser`, `clearUser`.
- **`SessionGuard`** (`src/providers/SessionGuard.tsx`) handles route guarding, session
  expiry, and auth redirects.
- **`LayoutClient`** (`src/app/components/LayoutClient.tsx`) is a thin layout shell — no
  business logic.

Rules governing this architecture (cookie-only tokens, `safeRedirect()`, login flow order)
are in [`POLICIES.md`](./POLICIES.md#authentication).

> **Note:** `README.md` at the repo root still describes an older `bearerToken` /
> `localStorage` auth flow with a mock login service. That description is stale — the
> architecture above (`AuthProvider` + HttpOnly cookie) is what's actually implemented.
> Don't use `README.md` as a source of truth; it needs a rewrite (not done in this change).

---

## Global Academic Context (Top Bar)

**School, Modality, and Academic Period are global selectors that live in the top bar.**
Read them from `useABET()` (`@/providers`):

```ts
const { schoolId, modalityTypeId, academicPeriodId } = useABET();
```

These three values flow from the navbar/academic-filters bar into every screen via
`AbetProvider`. The API client also forwards them as `X-School-Id`, `X-Modality-Type-Id`,
and `X-Academic-Period-Id` headers automatically. Other cascading filters specific to a
screen (program/carrera, commission, accreditor, course, …) are screen-local and live in
the page — those are not in the top bar.

The rules for when to build a screen-local selector, and the query-key correctness rule
this implies, are in [`POLICIES.md`](./POLICIES.md#global-academic-context-top-bar).

---

## Data Fetching

### TanStack Query

Query-key factories are defined per module:

```ts
const notificationConfigsKeys = {
	all: ['notification-configs'] as const,
	bundle: (periodId: number) => [...notificationConfigsKeys.all, 'bundle', periodId] as const,
};
```

Global default `staleTime` is `0`, set in `QueryProvider` (queries are considered stale
immediately and refetch on the next mount; `refetchOnWindowFocus` is off and `gcTime` is 5
minutes). `staleTime: Infinity` is used for static lookups (types, modalities, parameters,
languages), always paired with explicit invalidation.

The hard rule this factory pattern must satisfy (every `useABET()` scope variable present
in the key) is in [`POLICIES.md`](./POLICIES.md#tanstack-query).

### API Client

All API calls go through `src/shared/lib/apiClient.ts` (`apiGet`, `apiPost`, `apiPut`,
`apiPatch`, `apiDelete`, `apiPostBlob`). Requests use `credentials: 'include'` to send the
`HttpOnly` cookie. Non-OK responses throw `ApiError` with the backend's `message` field (an
i18n key like `error.ifc.notFound`).

There are currently no BFF route handlers in the app (see
[`POLICIES.md`](./POLICIES.md#api-client) for the one sanctioned exception to "never use
raw `fetch()`").

---

## Components

### Domain Components

Live in their module's `components/` folder. Organized into subfolders by feature when
they grow (e.g., `ifcs/components/form/`, `ifcs/components/view/`).

Rules for UI primitives and page layout (PageHeader, Tabs, DataTable, Card, etc.) are in
[`POLICIES.md`](./POLICIES.md#components).

---

## Git & Commits

### Pre-commit Hook

A Husky `pre-commit` hook runs `lint-staged` on staged files (config in
`.lintstagedrc.json`): `eslint --fix` + `prettier --write` on `*.{ts,tsx}`,
`prettier --write` on `*.{json,md,css}`. If ESLint reports an unfixable error, the commit
is aborted until it's fixed. Auto-fixable lint/format issues are applied and re-staged
automatically. The hook is installed via the `prepare` script on `pnpm install`; `prepare`
is guarded as `husky || true` so it doesn't fail in production/Docker (e.g.
`pnpm prune --prod`, where `husky` is no longer present).

As of this change, `commit-msg` and `pre-push` hooks were added alongside it — see
[`POLICIES.md`](./POLICIES.md#git--commits) for what they enforce.

---

## Commands

```bash
# Type check
npx tsc --noEmit

# Dev server
pnpm dev

# Build
pnpm build

# Lint
pnpm lint
```

**There is no test runner in this repo** — no Jest, Vitest, or Playwright config or
dependency exists. See [`POLICIES.md`](./POLICIES.md#verification-gate) for what this
means for how a task is verified, and treat this as a real gap worth closing, not a
permanent state.

---

## Environment Variables

From `.env.example` and `src/configs/env.config.ts` (Zod-validated at runtime):

| Variable                    | Required  | Purpose                                                                                                                                                                                                                      |
| --------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | Yes (Zod) | Public base path the browser uses to reach the API. `/api` = same origin; Nginx routes `/api` to the backend container in production (no CORS).                                                                              |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Yes (Zod) | External Portfolio app the sidebar button links to.                                                                                                                                                                          |
| `API_PROXY_URL`             | No        | Local-only dev proxy. When set and `NODE_ENV !== 'production'`, Next rewrites `/api/*` to this origin so the browser can reach a backend on another port without CORS. Ignored in production. Not covered by the Zod schema. |

`validateEnv()` throws at startup if either Zod-required variable is missing — see
`src/configs/env.config.ts`.

---

## Domain Vocabulary

Derived from module names, type definitions, and locale files
(`src/language/locales/es.json`). Where a term's full business definition isn't knowable
from the code, it's flagged below rather than guessed.

| Term                                    | Meaning (as used in code)                                                                                                                                                                                                                                                                                     | Source                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **IFC**                                 | "End-of-cycle report" (`ifcs/` module comment in the prior AGENTS.md; `TYPE_GROUP_CODES.IFC_STATUS`). Full expansion of the acronym not found in code or locale files — locale only shows the label `"IFC"`. **Needs a real definition.**                                                                     | `src/modules/ifcs/`, `es.json:20`                          |
| **ARD**                                 | A record tied to a specific campus (`sede`), program, and meeting date (`meetingDate`), aggregating detail rows that reference a student, course, and professor (`ArdDetailView`). Locale only shows the label `"ARD"` — the acronym's full expansion isn't in code. **Needs a real definition.**             | `src/modules/ard/types/index.ts`, `es.json:1350-1358`      |
| **PPP**                                 | Survey type — locale label `"PPP — Prácticas Pre-Prof."` (Pre-Professional Practices).                                                                                                                                                                                                                        | `es.json:32`                                               |
| **GRA**                                 | Survey type — locale label `"GRA — Graduandos"` (Graduating students).                                                                                                                                                                                                                                        | `es.json:33`                                               |
| **LCFC**                                | Survey type — locale label `"LCFC — Fin de Ciclo"` (End of cycle). Full acronym expansion not found. **Needs a real definition.**                                                                                                                                                                             | `es.json:34`                                               |
| **Modality** (`modalityTypeId`)         | A global scope selector alongside School and Academic Period, forwarded as `X-Modality-Type-Id`. Its domain meaning (e.g. distance vs in-person) is implied by `PROGRAM_MODALITY: 'TG102'` but not spelled out in code.                                                                                       | `src/modules/core`, `useABET()`                            |
| **Scope tree / ScopeLevel / canNotify** | Hierarchical org-chart scope selection (`organization/types`). Each `ScopeLevel` has a `levelNum` and `ScopeOption[]`; each option can be flagged `canNotify`, gating notification eligibility. Business meaning of what "notify" targets isn't derivable beyond the type shape. **Needs a real definition.** | `src/modules/organization/types/index.ts`                  |
| **Chart heads** (`admin/chart-heads`)   | Org-chart heads configuration (dean/directors) — a route-less helper module consumed by `admin/` sub-modules, not domain-defined further in code.                                                                                                                                                             | `src/modules/admin/chart-heads/`                           |
| **RawUser**                             | Exported independently by both `admin/iam` and `admin/chart-heads` with different shapes — this is why `admin/` has no aggregate barrel (see [`POLICIES.md`](./POLICIES.md#admin-import-rule)).                                                                                                               | `src/modules/admin/iam/`, `src/modules/admin/chart-heads/` |

---

## Business Rules

Only rules directly derivable from code — kept short on purpose. A guessed business rule
here would later be read as authoritative.

1. **An ARD is unique per (academic period, campus, program, meeting date).** Creating a
   duplicate is rejected with `error.ard.duplicateArd` ("Ya existe una ARD para este
   periodo, sede, programa y fecha de reunión."). — `es.json:1356`
2. **An ARD detail row is unique per (student, course, professor) within its ARD.**
   Duplicate detail rows are rejected with `error.ard.duplicateDetail`. — `es.json:1357`
3. **IFC status is a backend-defined lookup value, not a hardcoded enum.** Status values
   like "saved" resolve through `TYPE_GROUP_CODES.IFC_STATUS` (`'TG701'`) +
   `TYPE_CODES.IFC_STATUS.SAVED` (`'TG701-T001'`) via `getTypesByGroupCode()` — the set of
   valid statuses and their order is backend data, not frontend code. —
   `src/modules/core`

---

## Known Gaps

Things that are still true today — not fixed, not fixable in this change's scope.

- **No test runner** (see [Commands](#commands) and
  [`POLICIES.md`](./POLICIES.md#verification-gate)).
- **`README.md` is stale** — describes a `bearerToken`/`localStorage` auth flow and a
  `/tests/*` demo area that no longer match the implemented architecture (see
  [Authentication Architecture](#authentication-architecture)). Not rewritten in this
  change; flagging so it isn't mistaken for current documentation.
- **`src/shared/constants/app.ts`'s `APP_NAME`/`APP_DESCRIPTION` are not locale-aware**
  (no `{en, es}` pair) and feed the page `<title>` for every visitor regardless of locale.
  This is a genuine architectural constraint, not an oversight: it's consumed by the static
  `metadata` export in the root `src/app/layout.tsx`, which Next.js evaluates server-side
  before any client locale context exists (`LocaleProvider` is a `'use client'` provider
  mounted inside that same layout). Making it locale-aware would require adopting
  per-locale routing (`generateMetadata()` under a `[locale]` segment — the
  `src/app/[locale]/` folder exists today only as an unused placeholder) — a real feature,
  not a docs-scope fix. Left as Spanish-only; translating the literal string to English
  would just change the app's visible name for its Spanish-speaking default audience
  without fixing the underlying gap.

## Contradictions Found and Resolved

Things this change found broken and fixed, kept here as the record of what changed and
why — not current gaps.

- **`generator/create-module.ts` contradicted AGENTS.md.** It scaffolded every module
  folder with a docblock-commented `export {}` placeholder, wrote Spanish console output,
  and generated `export default function Page()`. Fixed to scaffold only the folders that
  get real content, drop the docblocks, use English output, and keep the page component a
  named export (with the `app/**/page.tsx` route file re-exporting it as default, since
  Next.js requires that). See [`POLICIES.md`](./POLICIES.md#generator-vs-policy).
- **The generator's sidebar-patching was silently broken, found by actually running it.**
  Two bugs, both fixed: (1) it looked for `src/app/components/app-sidebar.tsx`, but the
  file is `AppSidebar.tsx` — every run silently skipped the sidebar entirely and logged a
  warning easy to miss. (2) Its `FolderIcon` import check ran _after_ the nav entry (which
  itself contains the literal string `"FolderIcon"`) was already inserted into
  `sidebarContent`, so `!sidebarContent.includes('FolderIcon')` was always false — the
  import was never added, breaking `tsc` for every generated module's first run. Manually
  verified after both fixes: `node dist-scripts/generator/create-module.js scratchcheck`
  now produces a clean `tsc --noEmit` and correctly patches the sidebar.
- **A second, ad-hoc i18n pattern existed alongside `t('key')` + locale JSON.** Several
  `ifcs`/`admin` modules defined local `{ en: '...', es: '...' }` label-pair objects
  instead of adding keys to `src/language/locales/{es,en}.json` — `ifcLabels.ts`,
  `{view,form,finding-view,consult,shared}/*Labels.ts`, and `adminLabels.ts`. All were
  migrated to `t('key')` + locale JSON; the constant files were deleted and their consuming
  components updated. `evaluation/constants/competencyScope.ts` had the same pattern for a
  different reason (see the comment in that file) and was migrated to source its strings
  from the locale JSON instead of hardcoding them, while keeping the constant itself.
