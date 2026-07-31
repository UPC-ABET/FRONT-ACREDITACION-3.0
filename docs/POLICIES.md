# Policies

Mandatory rules — everything a reviewer would block a PR on. If you're looking for
descriptive orientation ("what exists, how it's structured") instead, see
[`CONTEXT.md`](./CONTEXT.md).

This file and `CONTEXT.md` are a split of what used to be a single `AGENTS.md`. See the
root [`AGENTS.md`](../AGENTS.md) for the pointer every coding agent reads first.

---

## Verification Gate

**There is no test runner in this repo** (no Jest, Vitest, Playwright — verified against
`package.json`). This is a real gap, not a design choice — treat "add tests" as valid scope
whenever a change touches logic worth covering.

Until that gap is closed, a task is complete when:

1. `npx tsc --noEmit` is clean.
2. `pnpm lint` is clean.
3. The manual verification step for the change has actually been performed and described.

**Not** "when its test passes" — there are no tests to pass. Do not report a task done on
the basis of typecheck/lint alone if a manual step was called for and skipped.

---

## Architecture Rules

- **`app/` is a thin shell.** Route files only import a page component from a module and
  render it. No business logic, no data fetching, no auth checks in `app/`.
- **`shared/` is for truly cross-cutting utilities.** If something belongs to a domain
  (academic periods, type codes, parameters), it goes in that domain's module — not in
  shared.
- **Domain creates it, domain exports it.** The module that owns a concept exports it.
  Other modules import from that module. Example: `AcademicPeriodSelect` lives in
  `@/modules/academic/components/`, not in shared.
- **No empty placeholder files.** Don't create `schemas/index.ts` with just `export {}`.
  Create the folder when you have actual content. This applies to output from
  `generator/create-module.ts` too — see [Generator vs Policy](#generator-vs-policy) below;
  the generator was previously non-compliant and has been fixed to stop scaffolding
  placeholder folders it doesn't populate.

### Admin import rule

- **One route per admin concern.** `/admin/configuration`, `/admin/iam`,
  `/admin/notifications`, `/admin/parameters`. Never `/admin/<concern>/<domain>`.
- **`admin/` is a namespace folder, not a module — it has no aggregate barrel by design.**
  There is intentionally no `src/modules/admin/index.ts`; importing the whole group would
  conflate independent concerns whose public surfaces overlap (e.g. both `admin/iam` and
  `admin/chart-heads` export a `RawUser` type, which an `export *` aggregate would silently
  drop).
- **Always import the concern sub-module barrel directly**: `@/modules/admin/iam`,
  `@/modules/admin/notifications`, etc. — **never `@/modules/admin`.** This is a hard
  blocker, not a style preference — a reviewer should reject the import outright, not ask
  for a style fix.

### Sidebar navigation

- **Max 2 levels** in the sidebar: top-level group → leaf items. No third level.
- When a feature has more sub-screens than fit cleanly as siblings, push the split **into
  the page as tabs**, not into the sidebar as a third level.
- Adding a new admin concern means a new leaf, not nesting.

---

## Import Rules

### Allowed import directions

```
app/ → modules/, providers/, shared/
modules/ → shared/, providers/, other modules/ (for shared domain types)
providers/ → shared/, modules/ (for auth services)
shared/ → shared/ only (NEVER import from modules/)
```

### Cross-module imports

Modules CAN import from other modules when consuming domain-owned exports — always through
the module's public barrel (`@/modules/X`) or a specific public folder
(`@/modules/X/components`), never another module's internal paths. For nested modules like
`admin/parameters`, the barrel is `@/modules/admin/parameters` — `admin/` itself has no
barrel (see [Admin import rule](#admin-import-rule)). Known current examples are in
[`CONTEXT.md`](./CONTEXT.md#import-rules-reference).

### `shared/` must not import from `modules/`

`shared/` is the bottom of the dependency tree. It never imports from `modules/`. If shared
code needs something from a module, that thing should be moved to shared or the code should
be moved to the module. Verified clean as of 2026-07-30 — see
[`CONTEXT.md`](./CONTEXT.md#shared-import-audit) for the audit command and result.

---

## Naming Conventions

### Files

| Type                | Convention                      | Example                                      |
| ------------------- | ------------------------------- | -------------------------------------------- |
| Folders             | `kebab-case`                    | `finding-view/`, `rubric-editor/`            |
| Components (`.tsx`) | `PascalCase`                    | `IFCDashboard.tsx`, `LoginForm.tsx`          |
| Hooks (`.ts`)       | `camelCase` starting with `use` | `useIFCView.ts`, `useAuth.ts`                |
| Services (`.ts`)    | `camelCase`                     | `authService.ts`, `ifcsService.ts`           |
| Schemas (`.ts`)     | `camelCase`                     | `ifcFormSchema.ts`, `createProjectSchema.ts` |
| Types (`.ts`)       | `camelCase`                     | `rubricEditor.ts`, `commissionTab.ts`        |
| Constants (`.ts`)   | `camelCase`                     | `typeCodes.ts`, `ifcLabels.ts`               |
| Utils (`.ts`)       | `camelCase`                     | `tryTranslate.ts`, `formatDate.ts`           |
| Barrel files        | `index.ts`                      | Always `index.ts`                            |
| Next.js route files | Next.js convention              | `page.tsx`, `layout.tsx`, `not-found.tsx`    |

### Code

| Type             | Convention                    | Example                                      |
| ---------------- | ----------------------------- | -------------------------------------------- |
| Constants        | `SCREAMING_SNAKE_CASE`        | `SCHOOL_OPTIONS`, `TYPE_GROUP_CODES`         |
| Types/Interfaces | `PascalCase`                  | `AuthUser`, `IFCRow`, `LoginPayload`         |
| Functions        | `camelCase`                   | `getTypesByGroupCode`, `validatePrefixValue` |
| React components | `PascalCase`                  | `function AcademicPeriodSelect()`            |
| Hooks            | `camelCase` with `use` prefix | `useAuth`, `useIFCView`                      |
| Enums (avoid)    | Prefer `as const` objects     | `TYPE_CODES.IFC_STATUS.SAVED`                |

---

## Core Module

Never duplicate type/parameter codes as local constants — always import `TYPE_GROUP_CODES`,
`TYPE_CODES`, and `PARAMETER_CODES` from `@/modules/core`. See
[`CONTEXT.md`](./CONTEXT.md#core-module-modulescore) for what each export actually contains.

---

## Authentication

- `js-cookie` is used only for non-sensitive UX preferences (school selector). **Never for
  auth tokens.**
- All redirects go through `safeRedirect()` from `@/shared/lib/utils` which validates
  against trusted hosts.
- Login flow: `loginByCredentials()` → backend sets cookie → `refreshUser()` → redirect.

See [`CONTEXT.md`](./CONTEXT.md#authentication-architecture) for the surrounding
architecture (`AuthProvider`, `useAuth()`, `SessionGuard`).

---

## Global Academic Context (Top Bar)

- A feature filters by the active school/modality/period by consuming `useABET()`
  (`@/providers`). When the value is `null`, show a notice telling the user to pick it in
  the top bar (e.g. `t('...selectPeriod')`) — **don't render your own picker.**
- **Only add a screen-local School / Modality / Academic Period selector when the task
  explicitly asks for one** (e.g. comparing two periods side by side). Otherwise it's the
  top bar, full stop.
- Other cascading filters specific to the screen (program/carrera, commission, accreditor,
  course, …) are screen-local and live in the page — those are not in the top bar.

---

## Data Fetching

### TanStack Query

- All data fetching uses `useQuery` / `useMutation`. **Never use `useEffect` + `useState`
  for API calls.**
- Define query-key factories per module (see [`CONTEXT.md`](./CONTEXT.md#tanstack-query)
  for the shape).
- **Every query key that reads scope-dependent data MUST include every `useABET()` scope
  variable it depends on** (`schoolId`, `modalityTypeId`, `academicPeriodId`). A key
  missing one serves stale data after the user switches period or school — this is a
  correctness bug that looks like a caching bug, not a caching bug. When adding a query
  that reads or is filtered by any of these three values, put all of them (not just the
  ones that "seem relevant") in the key.
- Use `staleTime: Infinity` for static lookups (types, modalities, parameters, languages);
  always pair it with explicit invalidation if the data can change. Rely on the `0` default
  for list/detail data that mutates.

### API Client

- All API calls go through `src/shared/lib/apiClient.ts` (`apiGet`, `apiPost`, `apiPut`,
  `apiPatch`, `apiDelete`, `apiPostBlob`).
- **Never use raw `fetch()`** outside the API client.
  - **Exception — internal Next.js route handlers (BFF).** `apiClient` targets the
    external backend (`NEXT_PUBLIC_API_URL`), so it cannot call our own `/api/*` route
    handlers. Code that talks to a local route handler, and a route handler calling the
    backend server-to-server, use raw `fetch()` by necessity. These are the only sanctioned
    `fetch()` sites. (There are currently no BFF route handlers in the app.)
- Requests use `credentials: 'include'` to send the `HttpOnly` cookie.
- Non-OK responses throw `ApiError` with the backend's `message` field (an i18n key like
  `error.ifc.notFound`).

### Error Handling

- Backend sends error codes as `{ message: "error.ifc.notFound" }`.
- Frontend passes these through `tryTranslate(t, errorCode)` — if the locale file has a
  translation, it shows the translated text; otherwise it shows the raw key.
- **Silent catches are not allowed.** All catch blocks must either handle the error
  visibly or log via `logger.warn`.

---

## i18n

- All user-visible text must use `t('key')` from `useI18n()`.
- Locale files: `src/language/locales/es.json` and `src/language/locales/en.json`.
- Error codes from the backend (like `error.ifc.notFound`) are also i18n keys — add them to
  both locale files.
- **Never hardcode Spanish (or English) strings** in components, services, or toasts,
  including in server-run code (route `page.tsx` files, the root layout) — use
  `translateServer()` / `getServerLocale()` from `@/shared/lib/serverLocale` there, since
  `useI18n()` only works in a `'use client'` component. Don't introduce a local
  `{ en, es }` label-object constant as an alternative to `t('key')` + locale JSON — some
  `ifcs`/`admin` files did this before this file existed; they've since been migrated. See
  [`CONTEXT.md`](./CONTEXT.md#contradictions-found-and-resolved) for what was found and
  fixed.
- Services throw i18n keys, never localized text: `throw new ApiError('ifcs.error.createFailed')`.

---

## Styling

- **Tailwind only.** No inline `style={}` attributes. Use CSS variables in `globals.css` if
  needed (e.g., `--login-bg`), then reference via `bg-[image:var(--login-bg)]`.
- **Neutral palette is `zinc-*`, app-wide.** Never use `gray-*` for neutrals — it reads as a
  different shade next to every other screen.
- `globals.css` uses `@source not "../../*.md"` to prevent Tailwind from scanning markdown
  files for class patterns.
- CSS variable naming: `--brand`, `--brand-border`, `--login-bg`, `--background`,
  `--foreground`.
- Use `cn()` from `@/shared/lib/utils` for conditional class merging.

---

## Components

### UI Primitives (`src/shared/components/ui/`)

- **`title=` attribute**: Only on icon-only buttons. Never on text buttons or to explain
  disabled state.
- **Buttons are always the shared `<Button>`.** Don't build a raw `<button className=...>`
  or a `<Link className={cn(buttonVariants(...))}>` for a normal action — pass a real
  `<Button>` (or, for a navigating action, a `<Link>` only where a Button can't be used).
  Pick the variant by intent: `primary` for the main action, `secondary`/`surface`/`ghost`
  for neutral, and **`danger` for destructive actions** (delete/remove confirms). Never
  style a destructive button with a `className="bg-red-600 ..."` override or the amber
  `warning` variant.
- **`Select` styles**: Memoized via `useMemo([size, error])` for reference stability.
- Components use `PascalCase.tsx` file names.

### Page Layout

Top-level pages follow one consistent shell so card usage is uniform across the app:

- **Page shell**: `<div className="space-y-6">` wrapping a `<PageHeader>` then the content.
  Never wrap the whole page (including its title) in a single `<Card>` — the page title is
  a real `h1`, not a card header. The shell spacing is always `space-y-6` (not
  `space-y-8`) and the root has no `w-full`.
- **`PageHeader`** (`@/shared/components/ui`): renders the `h1` (`text-3xl`) + optional
  `description` + optional `action` slot (buttons/links on the right). Use it for every
  page title. Every top-level page (one route) has **exactly one** `PageHeader` — title
  then subtitle. **This applies to detail, form, wizard, and editor pages too** — never
  hand-roll a page title with `Title`/`SubTitle` (which render `h2`/`h3`), and never style
  an `h2` up to `text-3xl` to fake a page heading. A detail/form page with no `PageHeader`
  is the "no `h1`" bug.
- **Tabs go directly under the `PageHeader`, before any card.** Order is always title →
  subtitle → `Tabs` → card content. Never put a card above the tabs, and never render the
  `Tabs` (or the `PageHeader`) **inside** a `<Card>` — the tabs live in the page shell,
  outside every card.
- **Tab state lives in the URL**, via the shared `useTabParam(defaultTab, { clearParams })`
  hook (`@/shared`). Never keep the active tab in `useState`, and never hand-roll a
  `<nav>`/`<button role="tab">` strip — use the shared `<Tabs>` primitive.
- **Tab content carries no page header.** A component rendered as tab content (or otherwise
  nested inside a page that already has a `PageHeader`) must not add its own `PageHeader` —
  the page header plus the active tab label already name it. A second page-level title is
  the double-title bug. If the tab content needs an action (e.g. a "New" button), put it in
  a right-aligned action row, not a header. (A `DataTable`'s `title`/`description` props
  count as a title — omit them when the page header already covers it.)
- **Filters in a `<Card>`**: filter bars (selects + clear button) go inside a `<Card>`, not
  bare. `Select` menus portal to `document.body`, so the Card's `overflow-hidden` does not
  clip them.
- **Results region is one box**: the `Table`/`DataTable` primitive already renders its own
  bordered box, so it needs no extra wrapper. For the non-table states use the shared
  placeholders so every state shares the same box shape: `TableLoadingState`,
  `TableEmptyState`, `TableErrorState` (or `DataTable`'s built-in
  `isLoading`/`emptyMessage`/`errorMessage`). Never hand-roll a
  `rounded-xl border ... bg-white shadow-sm` loading/empty/error div, a dashed-border empty
  box, or an `animate-pulse` text "spinner". `LoadingDialog` is for blocking mutation
  modals only — never for in-page content loading.
- **One table stack**: list/tabular data uses the shared `DataTable` (it brings search,
  pagination, and the loading/empty/error states). Don't hand-roll a `<Table>` + manual
  search `<input>` + manual pagination + manual states — that is a second, divergent table
  system.
- **Never hand-roll a `<Card>` equivalent.** A `rounded-xl border border-zinc-200 bg-white
shadow-sm` wrapper is just `<Card>` — use the primitive. Status pills are `<Badge>`;
  alert/banner boxes are `<Alert variant="default|destructive|warning|success">` — never a
  hand-rolled `bg-red-50 border ...` div.
- **Embedded widgets** (maintenance views rendered inside a tab page) are the exception:
  they are self-contained `<Card>` sections with their own `h2` header, not top-level pages.

---

## Accessibility

- **One `<h1>` per page.** The page title is a real `h1`, emitted by `PageHeader`
  (`Title as="h1"`). Card and section titles are `<h2>`; subtitles `<h3>`. Never skip
  levels or emit a second page-level `h1`.
- **Every interactive control has an accessible name.** Icon-only buttons need an
  `aria-label` (or a `title`, which doubles as the tooltip — see the `title=` rule), or a
  visually-hidden `<span className="sr-only">{t(...)}</span>`. Decorative icons inside a
  labelled control get `aria-hidden`.
- **Prefer native elements.** Use `<button type="button">` / `<a>` for clickable things,
  not `<div onClick>`. Tailwind's preflight strips native button chrome, so a styled
  `<button>` looks identical to a styled `<div>` — there is no reason to reach for a div.
- **Custom interactives must be keyboard-operable.** If a non-native element (e.g. an SVG
  `<g>`) must be interactive, give it `role="button"`, `tabIndex={0}`, and an `onKeyDown`
  that fires on `Enter`/`Space` (call `preventDefault()`). Collapsibles expose
  `aria-expanded`.
- **Every `Dialog` renders a `<DialogTitle>`** for its accessible name. `DialogContent`
  warns (dev-only, via `logger.warn`) when the title is missing — do not ignore the
  warning.
- **Color is never the only signal.** Pair status color with a text label or icon.
  User-visible text must meet WCAG AA contrast (4.5:1 for normal text, 3:1 for large). The
  `Badge` color variant auto-darkens its label toward AA against the tinted background, so
  backend-supplied colors stay legible.

---

## TypeScript

- **No `any` or `as any`.** Use `unknown`, generics, or specific types. Catch blocks use
  `catch (err: unknown)` + `instanceof Error`.
- **No `export {}`** in files that have real exports. Only use it if a file truly needs to
  be an empty ES module (which should be rare — delete empty files instead).
- Prefer `as const` objects over enums.
- Types go in `types/index.ts` per module, not alongside services.

---

## Code Style

- **All code and comments in English.** No Spanish in source files.
- **Default to no comments. Code must be self-explanatory.** Make names and structure
  carry the meaning instead of a comment. Comments are reserved ONLY for complex,
  high-reasoning logic (non-obvious algorithms, tricky edge cases, business rules that
  can't be inferred from the code) where the WHY genuinely can't be expressed in the code
  itself. If you reach for a comment to explain WHAT the code does, rewrite the code
  instead.
- **No docblocks on barrel files.** Barrel `index.ts` files are pure re-exports, nothing
  else.
- **No empty placeholder files.** Don't create folders/files until they have content.
- **Use descriptive variable names.** Never abbreviate (`controlHeight`, not `h`;
  `fontSize`, not `fs`).
- **Named exports for components and pages** — no `export default function Page()`. Import
  shared code from the `@/shared` barrel, not deep paths like `@/shared/components`.

### Generator vs policy

`generator/create-module.ts` previously contradicted several of the rules above: it
scaffolded every module folder with a docblock-commented `export {}` placeholder
(violates "no empty placeholder files" and "no docblocks on barrel files"), wrote its
docblocks and console output in Spanish (violates "all code and comments in English"), and
generated `export default function Page()` (violates "named exports for components and
pages"). **The generator was the one that was wrong — it has been fixed to match this
file, not the other way around.** If you see generator output that still does any of the
above, treat it as a bug in the generator, not a precedent to follow.

---

## Git & Commits

- Base branch for every PR is `develop`. Promotion is `develop` → `staging` → `production`,
  fast-forward only.
- **Commit messages are Conventional Commits, subject only** — single line, no body, no
  bullet points, no blank-line description, no trailers, no `Co-Authored-By`. Concise,
  focused on the "why".
- Prefer new commits over amending.
- **Never `--no-verify`.**
- **Never push directly to `develop`, `staging`, or `production`.**
- Force-push only with `--force-with-lease`, and never to `main`/`master`.

### Hooks

- **`pre-commit`** (pre-existing): runs `lint-staged` — `eslint --fix` + `prettier --write`
  on staged `*.{ts,tsx}`, `prettier --write` on `*.{json,md,css}`. See
  [`CONTEXT.md`](./CONTEXT.md#pre-commit-hook) for details.
- **`commit-msg`** (added in this change): rejects commits whose subject line doesn't
  match Conventional Commits format, and rejects multi-line commit messages.
- **`pre-push`** (added in this change): rejects pushes whose target ref is `develop`,
  `staging`, or `production`.

Hooks run in order; the `pre-commit` block stays first so lint-staged's auto-fixes are
already staged before `commit-msg` sees the final message.
