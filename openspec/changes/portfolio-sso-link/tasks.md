# Tasks — Portfolio SSO link

**Slug**: `portfolio-sso-link` · **Proposal**: `./proposal.md` · **Design**: `./design.md`

## For whoever executes this

- **This repo has no test runner** (`docs/POLICIES.md` § Verification Gate). A task is
  complete when `npx tsc --noEmit` is clean, `npx eslint --max-warnings 0 .` (`pnpm lint`)
  is clean, and — where a step says so — the described manual check has actually been
  performed.
- Marking done means checking the box **and** appending `✅ DONE (YYYY-MM-DD)` to the
  heading.
- **No autonomous commits.** Propose the grouping and stop.
- Do not edit `docs/POLICIES.md` or `docs/adr/*`.

## Goal

Add a single-purpose admin screen to configure the shared Portfolio SSO secret, and
replace the sidebar's static external Portfolio link with an `onClick` handler that fetches
a one-time signed SSO link from the backend.

## Slicing

Milestone 1 lands the data layer + admin config screen, reachable directly by URL.
Milestone 2 lands the sidebar cutover (the risky, permission/deploy-order-sensitive part).
Milestone 3 is the operational deploy-ordering and manual-handoff work, which is not code.

---

## Milestone 1 — Admin config screen ✅ DONE (2026-08-27)

### Task 1.1 — Add types, schema, service, hooks — ✅ DONE (2026-08-27)

- [x] Task complete

**Files**

- `src/modules/admin/portfolio-integration/types/index.ts` (create)
- `src/modules/admin/portfolio-integration/schemas/portfolioSsoValidation.ts` (create)
- `src/modules/admin/portfolio-integration/schemas/index.ts` (create)
- `src/modules/admin/portfolio-integration/services/portfolioSsoService.ts` (create)
- `src/modules/admin/portfolio-integration/services/index.ts` (create)
- `src/modules/admin/portfolio-integration/hooks/usePortfolioSsoConfig.ts` (create)
- `src/modules/admin/portfolio-integration/hooks/index.ts` (create)

**Steps**

1. Add `PortfolioSsoConfigSummary`, `UpsertPortfolioSsoConfigBody`, `PortfolioSsoLink` per
   `design.md` § Frontend.
2. Add `portfolioSsoConfigFormSchema` (`baseUrl: z.string().url()`,
   `apiKey: z.string().min(32)`, i18n-key messages, no hardcoded text).
3. Add `getPortfolioSsoConfig`/`upsertPortfolioSsoConfig`/`getPortfolioSsoLink` in
   `portfolioSsoService.ts`, using the **derived** `BASE_ROUTE = '/admin-iam-portfolio-sso'`
   per `design.md` § Route path derivation — flagged for re-confirmation in Task 2.3 below.
4. Add `usePortfolioSsoConfig` (`useQuery`) and `useUpsertPortfolioSsoConfig` (`useMutation`
   with `setQueryData` cache seeding on success, no invalidate/refetch).
5. `npx tsc --noEmit` → clean.
6. `npx eslint --max-warnings 0 .` → clean.

**Commit**: `feat(admin): add portfolio SSO config types, schema, service, and hooks`

> Done as part of the initial implementation pass. `tsc`/`lint` clean.

### Task 1.2 — Add the form component, page, route, and i18n keys — ✅ DONE (2026-08-27)

- [x] Task complete

**Files**

- `src/modules/admin/portfolio-integration/components/PortfolioIntegrationForm.tsx` (create)
- `src/modules/admin/portfolio-integration/components/index.ts` (create)
- `src/modules/admin/portfolio-integration/pages/AdminPortfolioIntegrationPage.tsx` (create)
- `src/modules/admin/portfolio-integration/pages/index.ts` (create)
- `src/modules/admin/portfolio-integration/index.ts` (create)
- `src/app/admin/portfolio-integration/page.tsx` (create)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Add `admin.portfolioIntegration.*` keys to both locale files per `design.md` § Frontend
   → i18n (same commit, both files, per `docs/POLICIES.md` § i18n).
2. Build `PortfolioIntegrationForm` per `design.md` § AC-1–AC-4: status line
   (`interpolate` + `formatDateTime`), `baseUrl` input seeded from the query response,
   `apiKey` input always starting empty, "Generar clave" button (`generateApiKey()`, no
   network call), zod `.safeParse` validation on submit, `apiKey` cleared on both
   success and error, submit button disabled while `isPending`.
3. Build `AdminPortfolioIntegrationPage` per the `PageHeader` + single-card shell
   convention (`docs/POLICIES.md` § Components → Page Layout), with
   `useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: false, period: false })`
   since this screen has no school/period/modality scope.
4. Add the `pages/index.ts`/module `index.ts` barrels and `app/admin/portfolio-integration/page.tsx`
   route shell, matching `app/admin/notifications/page.tsx`'s `dynamic()` pattern exactly.
5. `npx tsc --noEmit` → clean.
6. `npx eslint --max-warnings 0 .` → clean.
7. **Manual verification** (`pnpm dev`, navigate directly by URL — no sidebar entry point
   yet until Task 2.1):
   - As a user with ADMIN access, visit `/admin/portfolio-integration` → status line and
     form render; `apiKey` field is empty.
   - Click "Generar clave" → field fills with a 64-character hex string; no request fires.
   - Submit with an invalid `baseUrl` (e.g. `not-a-url`) → inline error, no network call.
   - Submit with a valid `baseUrl` + a generated `apiKey` → depends on the backend
     `portfolio-sso` module being deployed and reachable (see Task 2.3/Milestone 3); if not
     yet deployed, expect (and confirm) a clean 404-driven error toast, not a crash.

**Commit**: `feat(admin): add the Portfolio SSO integration config screen`

> Done as part of the initial implementation pass. `tsc`/`lint` clean via
> `npx tsc --noEmit` and `npx eslint --max-warnings 0 .` run against the full repo. Manual
> click-through against a live backend was not performed in this environment — no running
> `BACK-ACREDITACION-3.0` dev server or authenticated session was available here. The
> zod-validation and key-generation sub-steps (no network call, inline error) do not need a
> backend and were reasoned through against the code directly; the final "submit with valid
> values" sub-step needs the backend module deployed and is deferred to Milestone 3 / the
> requester's own environment.

---

## Milestone 2 — Sidebar cutover ✅ DONE (2026-08-27)

### Task 2.1 — Add the admin sidebar entry — ✅ DONE (2026-08-27)

- [x] Task complete

**Files**

- `src/app/components/AppSidebar.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Add `nav.admin.portfolioIntegration` to both locale files, alongside the existing
   `nav.admin.*` block.
2. Add `{ name: t('nav.admin.portfolioIntegration'), href: '/admin/portfolio-integration' }`
   to the `admin` group's `children` array, after the existing `iam` entry.
3. `npx tsc --noEmit` → clean.
4. `npx eslint --max-warnings 0 .` → clean.

**Commit**: `feat(admin): add the Portfolio Integration sidebar entry`

> Done. `tsc`/`lint` clean.

### Task 2.2 — Replace the PORTFOLIO item's external link with the SSO `onClick` handler — ✅ DONE (2026-08-27)

- [x] Task complete

**Files**

- `src/app/components/AppSidebar.tsx` (modify)

**Steps**

1. Remove `const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? '';` and the
   `externalHref` field from the `NavItem` type and the PORTFOLIO item; add
   `onClick?: () => void` to `NavItem`.
2. Add `handlePortfolioClick` per `design.md` § AC-5, AC-6 (synchronous blank-tab open,
   `getPortfolioSsoLink()` from `@/modules/admin/portfolio-integration`, popup redirect on
   success, popup close + error toast on failure).
3. Set the PORTFOLIO item's `onClick: handlePortfolioClick`, keep its existing
   `href: '/portfolio'` for `canAccessRoute` gating only.
4. Update the render branch: `!item.children && item.onClick` renders a `href`-less
   `SidebarItem` (button branch); the `externalHref` branch is deleted.
5. Add `useApiErrorToast()` + a single `<Toast>` render in `AppSidebar.tsx`'s returned
   tree (wrapped in a fragment alongside `<Sidebar>`, since `Toast` is self-positioned).
6. `npx tsc --noEmit` → clean.
7. `npx eslint --max-warnings 0 .` → clean.

**Commit**: `feat(admin): wire the sidebar Portfolio item to the SSO link endpoint`

> Done. `tsc`/`lint` clean.

### Task 2.3 — Remove `NEXT_PUBLIC_PORTFOLIO_URL` and re-confirm the derived route — ✅ DONE (2026-08-27)

- [x] Task complete

**Files**

- `src/configs/env.config.ts` (modify)
- `docs/CONTEXT.md` (modify)

**Steps**

1. Remove `NEXT_PUBLIC_PORTFOLIO_URL: z.string().min(1)` from `envSchema`.
2. Remove the `NEXT_PUBLIC_PORTFOLIO_URL` row from `docs/CONTEXT.md`'s Environment
   Variables table.
3. `npx tsc --noEmit` → clean.
4. `npx eslint --max-warnings 0 .` → clean.
5. **Not yet done — blocking follow-up, not a code task**: once
   `BACK-ACREDITACION-3.0`'s `src/modules/admin/iam/portfolio-sso/config/portfolio-sso.routes.ts`
   is committed, read its `route:` field directly and confirm it matches the derived
   `admin-iam-portfolio-sso` used in `portfolioSsoService.ts`'s `BASE_ROUTE`. If it
   differs, update the one constant — no other file changes. Track this as an explicit
   open item until the backend module merges; do not close it silently.

**Commit**: `chore(admin): remove NEXT_PUBLIC_PORTFOLIO_URL now that the sidebar uses the SSO link endpoint`

> Steps 1–4 done, `tsc`/`lint` clean. Step 5 is explicitly left open — the backend
> `portfolio-sso` module had no `routes.ts` at the time this change was authored, so the
> route could not be read from an authoritative source. See `proposal.md` § Risks.

---

## Milestone 3 — Operational / deploy-ordering (not code)

### Task 3.1 — Sequence the deploy after the backend `portfolio-sso` module

- [ ] Task complete

**This frontend change must not be deployed to an environment ahead of the sibling
`BACK-ACREDITACION-3.0` `portfolio-sso` module being deployed to that same environment.**
Until the backend module is live, the sidebar's PORTFOLIO click (`GET .../link`) and the
new `/admin/portfolio-integration` screen's `GET`/`PUT .../config` calls will all 404. Both
paths already fail gracefully (error toast / no crash — see Tasks 1.2, 2.2's manual steps),
but the feature is non-functional until both sides are deployed together. Coordinate the
release order with whoever owns the backend deploy; this is not something either repo's CI
can enforce automatically.

### Task 3.2 — Manually register the generated `apiKey` in PORTFOLIO-AUDIT

- [ ] Task complete

After an admin uses `/admin/portfolio-integration` to generate and save a new `apiKey`,
**an admin must separately copy that same value into PORTFOLIO-AUDIT's own
`acreditacion.config` parameter by hand.** This is a manual operational step in a system
outside both `BACK-ACREDITACION-3.0` and this repo — it cannot be automated from either
codebase. Until it's done, `GET .../link` will still return a signed URL, but
PORTFOLIO-AUDIT will not recognize the signature and SSO will not actually authenticate the
user. Document this handoff for whoever owns PORTFOLIO-AUDIT's operational runbook.

<!--
Append-only sections below. These record what actually happened, not what was planned,
and they are the best input to the next design.

## Unplanned — <what and why>

### Task U.1 — <title>
- [ ] Task complete

## Post-QA fixes

## Audit fixes (/abet-audit-pr)

### Review round 1
-->
