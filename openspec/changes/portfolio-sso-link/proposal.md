# Portfolio SSO link

**Slug**: `portfolio-sso-link`
**Branch**: `portfolio-audit-bbc-integration` (actual working branch — convention would be
`feat/portfolio-sso-link`, but no new branch was created for this change; see repo
constraints)
**Repos affected**: frontend, backend (parallel — see `contract.md` note below)
**Created**: 2026-08-27

## Problem

The sidebar's PORTFOLIO item currently links straight to `NEXT_PUBLIC_PORTFOLIO_URL`
(PORTFOLIO-AUDIT's public URL) with a plain `<a target="_blank">`. The user lands on
PORTFOLIO-AUDIT unauthenticated and has to log in separately there — there is no single
sign-on between the two apps, and no admin screen exists to configure one.

A companion backend change (`BACK-ACREDITACION-3.0`, same slug
`portfolio-sso-link`) adds `src/modules/admin/iam/portfolio-sso/` with three endpoints
gated by the existing `PERMISSION_MODULES.ADMIN` (config) and `PERMISSION_MODULES.PORTFOLIO`
(link) permissions:

- `GET /config` — returns `{ baseUrl, configured, updatedAt }` (never the plaintext key).
- `PUT /config` — upserts `{ baseUrl, apiKey }`, the shared secret used to sign SSO links.
- `GET /link` — returns `{ url }`, a one-time signed URL into PORTFOLIO-AUDIT that logs the
  current user in without a second password prompt.

## What already exists

- **`src/app/components/AppSidebar.tsx`** — the sidebar `NavItem[]` config. The PORTFOLIO
  entry currently carries both `href: '/portfolio'` (used only for `canAccessRoute`
  permission gating) and `externalHref: PORTFOLIO_URL`; `SidebarItem` renders it as an
  `<a target="_blank">` when `externalHref` is set.
- **`src/shared/components/ui/Sidebar.tsx`** — `SidebarItem` already supports an
  `onClick`-only item (no `href` at all): it renders a plain `<button onClick={onClick}>`
  in that case, the same branch the footer's Logout item already uses.
- **`src/configs/env.config.ts`** — `NEXT_PUBLIC_PORTFOLIO_URL: z.string().min(1)`,
  referenced nowhere in `src/` except `AppSidebar.tsx` (confirmed by grep).
- **`src/modules/admin/parameters/`** — the closest existing single-secret-field admin
  config precedent (`PrefixParameterCard.tsx` + `useParameter.ts` +
  `parametersAdminService.ts`): fetch-current-value → edit → `PUT` → seed the query cache
  with the response, no extra `GET` round-trip.
- **`src/modules/admin/iam/`**, **`src/modules/admin/notifications/`**,
  **`src/modules/admin/configuration/`** — the module-shape template this change follows
  (`pages/`, `components/`, `hooks/`, `services/`, `schemas/`, `types/`, barrel
  `index.ts`) and the concrete conventions reused here (TanStack Query hook shape, zod
  schema + `.safeParse` validation pattern from `performanceLevelFormSchema`, `apiGet`/
  `apiPut` + `getApiData`-style envelope unwrap, `useApiErrorToast` for mutation errors).
- **`src/shared/hooks/useApiErrorToast.ts`** — the shared toast/error hook, reused as-is
  for both the new admin form and the sidebar click's error path.

## Goals

- Add a single-purpose admin screen at `/admin/portfolio-integration` to view and update
  the shared Portfolio SSO `baseUrl` + `apiKey`, gated by `PERMISSION_MODULES.ADMIN` on the
  backend side (frontend gating follows the existing `/admin` prefix convention — see
  `design.md`).
- Replace the sidebar PORTFOLIO item's static external link with an `onClick` handler that
  fetches a one-time signed link (`GET .../link`) and opens it in a new tab, instead of
  linking straight to `NEXT_PUBLIC_PORTFOLIO_URL`.
- Remove `NEXT_PUBLIC_PORTFOLIO_URL` from the env schema and `AppSidebar.tsx` — the
  frontend no longer needs to know PORTFOLIO-AUDIT's URL directly; the backend resolves it
  from the stored config.

## Non-goals

- No change to PORTFOLIO-AUDIT itself (the receiving app) — how it validates the signed
  link/`apiKey` is out of scope for this repo.
- No automation of the manual step where an admin copies the generated `apiKey` into
  PORTFOLIO-AUDIT's own `acreditacion.config` parameter — that stays a documented
  operational step (see `tasks.md`).
- No retry/refresh UX beyond a single toast on failure — if `GET .../link` fails, the user
  sees an error and can click PORTFOLIO again; no auto-retry.

## Acceptance criteria

1. **AC-1** — An admin with `PERMISSION_MODULES.ADMIN` access can navigate to
   `/admin/portfolio-integration` from the sidebar's Administration group and sees the
   current `baseUrl` (if configured) and a `configured`/`updatedAt` status line; the
   `apiKey` field is always empty on load (the backend never returns the plaintext key).
2. **AC-2** — Clicking "Generar clave" fills the `apiKey` field with a 64-character random
   hex string generated client-side via `crypto.getRandomValues`, without any network call.
3. **AC-3** — Submitting the form with a valid `baseUrl` (URL) and `apiKey` (≥32 chars)
   calls `PUT .../config`, seeds the query cache with the response (no extra `GET`), shows
   a success toast, and clears the `apiKey` field regardless of outcome — a submitted
   secret never lingers visibly in the form.
4. **AC-4** — Submitting with an invalid `baseUrl` or `apiKey` shows an inline validation
   error (zod `.safeParse`) and does not call the backend.
5. **AC-5** — A user with `PERMISSION_MODULES.PORTFOLIO` (but not necessarily `ADMIN`)
   clicking the sidebar's PORTFOLIO item: a blank tab opens synchronously, `GET .../link`
   is called, and on success the tab navigates to the returned `url`.
6. **AC-6** — If `GET .../link` fails, the pre-opened blank tab is closed, an error toast
   renders (via `useApiErrorToast`), and the user stays on the current page — no dead tab,
   no navigation to a broken URL.
7. **AC-7** — `NEXT_PUBLIC_PORTFOLIO_URL` no longer exists in `env.config.ts` or
   `AppSidebar.tsx`; the app builds and runs without it being set.

### Traceability

| AC  | Criterion                               | Satisfied by                                                                                                        |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Config screen shows status, empty key   | `src/modules/admin/portfolio-integration/components/PortfolioIntegrationForm.tsx`, `hooks/usePortfolioSsoConfig.ts` |
| 2   | Client-side key generation              | `PortfolioIntegrationForm.tsx` (`generateApiKey`)                                                                   |
| 3   | Submit → PUT → cache seed → clear field | `PortfolioIntegrationForm.tsx`, `hooks/usePortfolioSsoConfig.ts` (`useUpsertPortfolioSsoConfig`)                    |
| 4   | Client-side validation                  | `schemas/portfolioSsoValidation.ts`                                                                                 |
| 5   | Sidebar click → link → new tab          | `src/app/components/AppSidebar.tsx` (`handlePortfolioClick`)                                                        |
| 6   | Sidebar click failure handling          | `src/app/components/AppSidebar.tsx` (`handlePortfolioClick`)                                                        |
| 7   | Env var removed                         | `src/configs/env.config.ts`, `src/app/components/AppSidebar.tsx`                                                    |

## Dependencies

- **Backend**: `BACK-ACREDITACION-3.0`'s `portfolio-sso` module (`GET /config`,
  `PUT /config`, `GET /link`). At the time this change was authored, the backend module
  had only its `core/`, `model/`, and `config/strings/` folders — no `routes.ts`,
  controller, or service yet (built in parallel by a different engineer). The exact route
  path (`admin-iam-portfolio-sso`) was **derived**, not read from an authoritative
  `routes.ts`, by following the naming precedent of the module's only existing IAM sibling
  added the same way (`admin-iam-integration-keys`) and the `ControllerWithTags({ route })`
  → `@Controller(route)` wiring confirmed in `api-tokens.routes.ts` /
  `base.decorator.ts`. **This must be re-confirmed against the backend's actual
  `portfolio-sso.routes.ts` once it lands** — see `tasks.md`.
- **Manual, operational**: after `PUT .../config` succeeds, an admin must copy the
  generated `apiKey` into PORTFOLIO-AUDIT's own `acreditacion.config` parameter by hand for
  SSO to actually authenticate. Not automatable from this repo.

## Risks

| Risk                                                               | Impact                                                                   | Mitigation                                                                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Derived route path (`admin-iam-portfolio-sso`) turns out wrong     | Every call 404s until fixed                                              | Single `BASE_ROUTE` constant in `portfolioSsoService.ts` — a one-line fix once the backend's real `routes.ts` is confirmed. See `tasks.md`. |
| Frontend deployed before the backend's `portfolio-sso` module      | Sidebar click and the new admin screen both fail with 404 in that window | Called out explicitly as a deploy-ordering task in `tasks.md` — not automatable, must be a manual release-sequencing step.                  |
| `apiKey` never copied into PORTFOLIO-AUDIT's `acreditacion.config` | SSO link opens but PORTFOLIO-AUDIT rejects/ignores the signature         | Documented as a required manual step in `tasks.md`; out of this PR's automatable scope.                                                     |

## Open questions

None.
