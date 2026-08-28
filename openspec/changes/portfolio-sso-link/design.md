# Design — Portfolio SSO link

**Slug**: `portfolio-sso-link`
**Proposal**: `./proposal.md`

## Read first

- `docs/POLICIES.md` § Verification Gate, § Data Fetching, § Components (Page Layout),
  § i18n, § TypeScript — no test runner (`tsc` + `lint` + a manual click-through), TanStack
  Query key rules, `PageHeader`/`Card`/`Input`/`Button` primitives, `t('key')` for every
  user-visible string.
- `docs/CONTEXT.md` § Data Fetching, § Directory Structure → Module Structure, § Related
  Repositories → Cross-repo change model.
- `src/modules/admin/parameters/components/PrefixParameterCard.tsx` +
  `hooks/useParameter.ts` + `services/parametersAdminService.ts` — the exact single-secret
  fetch/edit/`PUT`/cache-seed shape this change follows.
- `src/modules/admin/configuration/components/OpenPeriodDialog.tsx` +
  `src/modules/academic/schemas/performanceLevelSchema.ts` +
  `src/modules/evaluation/pages/PerformanceLevels.tsx` (line ~247) — the zod
  `.safeParse(form)` + `tryTranslate(t, result.error.issues[0].message)` validation pattern
  this change reuses, rather than `zodResolver`/`react-hook-form` (not used anywhere in
  this repo).
- `src/app/components/AppSidebar.tsx`, `src/shared/components/ui/Sidebar.tsx` — the
  `NavItem`/`SidebarItem` shapes this change modifies; `SidebarItem`'s `onClick`-only
  branch (no `href`) already exists and is exercised today by the footer's Logout item.
- `src/shared/hooks/useApiErrorToast.ts`, `src/shared/components/ui/Toast.tsx` — the
  shared toast pattern reused for both the new form and the sidebar's error path.
- `src/shared/lib/apiClient.ts` — `apiGet`/`apiPut` already send the `HttpOnly` cookie via
  `credentials: 'include'`; no manual auth header needed.
- `src/configs/env.config.ts`, `docs/CONTEXT.md` (Environment Variables table) —
  `NEXT_PUBLIC_PORTFOLIO_URL` removed from both in this change.
- **Backend** (`BACK-ACREDITACION-3.0`, read-only, not modified by this change):
  `src/modules/admin/iam/api-tokens/config/api-tokens.routes.ts` +
  `src/commons/base.decorator.ts` (`ControllerWithTags({ tag, route }) → @Controller(route)`)
  - `src/main.ts` (`app.setGlobalPrefix('api')`) — confirms a module's `route: 'x'` string
    becomes reachable at `/api/x/...`. `src/modules/admin/iam/integration-keys/config/integration-keys.routes.ts`
    (`route: 'admin-iam-integration-keys'`) — the only other IAM submodule added the same
    way as `portfolio-sso`, and the naming precedent this change's derived route follows.
    `src/modules/admin/iam/portfolio-sso/` itself had no `routes.ts`/controller/service at
    the time this was authored (only `core/`, `model/`, `config/strings/` existed) — the
    route below is a derivation, not a read of an authoritative source.

## ADR gate (walked, not skipped)

| Trigger                                       | Hit?                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datastore, broker or cache choice             | No                                                                                                                                                                                                      |
| Auth or payments provider                     | No — reuses the existing JWT/permission system; SSO signing is entirely backend-side                                                                                                                    |
| Public API contract change or breaking change | No — new, additive backend endpoints; nothing existing changes shape                                                                                                                                    |
| New module boundary or cross-repo split       | Borderline — new frontend module + a parallel new backend module, but both are additive, single-purpose, and follow existing module-shape conventions exactly. No new architectural pattern introduced. |
| Language, runtime or framework                | No                                                                                                                                                                                                      |
| Contradicting an existing ADR                 | No — `docs/adr/` has no recorded ADRs yet                                                                                                                                                               |

**Conclusion**: no ADR required.

## Route path derivation

`openspec/README.md` calls this the **parallel cross-repo model** (backend and frontend
built at the same time by different engineers), which normally wants a `contract.md`
agreed before either side writes code. That agreement did not happen before this change
was authored — the backend module was mid-flight with no `routes.ts` yet. Rather than
block, the route was derived from the backend's own, already-established conventions:

1. `ControllerWithTags({ tag, route })` (`base.decorator.ts`) resolves to
   `@Controller(route)` — a module's `route:` string in its `*.routes.ts` file is used
   verbatim as the controller's path segment.
2. `main.ts` calls `app.setGlobalPrefix(API_GLOBAL_PREFIX)` with
   `API_GLOBAL_PREFIX = 'api'` (`src/shared/constants/app.constants.ts`), so the full
   server-side path is `/api/<route>/...`.
3. Sibling `*.routes.ts` files under `admin/iam/` use two different naming shapes:
   short (`admin-api-tokens`, `admin-user-roles`, `admin-roles`,
   `admin-role-module-permissions`) for modules that predate a stricter convention, and
   the fuller `admin-iam-<name>` (`admin-iam-integration-keys`) for the one submodule
   added most recently, alongside `portfolio-sso`. `portfolio-sso` is treated as following
   that same recent precedent: **`route: 'admin-iam-portfolio-sso'`**.
4. This repo's `NEXT_PUBLIC_API_URL` already includes the `/api` segment
   (`http://localhost:7777/api` locally; `docs/CONTEXT.md` confirms `/api` is the
   same-origin Nginx-proxied path in production), and `apiClient.ts`'s `joinUrl` just
   concatenates it with the path passed to `apiGet`/`apiPut`. So the frontend calls use
   the route **without** an `/api` prefix:
   - `GET /admin-iam-portfolio-sso/config`
   - `PUT /admin-iam-portfolio-sso/config`
   - `GET /admin-iam-portfolio-sso/link`

This is captured in one place — `BASE_ROUTE` in `services/portfolioSsoService.ts` — so
that if the backend's actual `portfolio-sso.routes.ts` lands with a different `route:`
string, fixing it is a one-line change with no ripple into hooks/components/types. See
`tasks.md` for the explicit re-confirmation task.

## Approach

### AC-1 — Admin screen, status display

New module `src/modules/admin/portfolio-integration/` (kebab-case folder, matching the
existing `admin/configuration`, `admin/notifications` siblings — not `admin/iam`'s
sub-path, since this is a standalone routed screen, not a tab inside `iam`).

`usePortfolioSsoConfig()` wraps `getPortfolioSsoConfig` (→ `GET .../config`) in a plain
`useQuery`. `PortfolioIntegrationForm` renders a status line above the form:
`configured ? interpolate(t('...status.configured'), { date: formatDateTime(updatedAt) }) : t('...status.notConfigured')`
— `t()` in this repo has no built-in interpolation (`resolveMessage` in
`LocaleProvider.tsx` does plain key lookup), so the existing `interpolate()` util
(`src/shared/utils/interpolate.ts`, already used by ~15 other components for the same
`{{var}}`-in-locale-string pattern) is reused rather than hand-rolling string
concatenation.

`baseUrl` is seeded from the query response via a `useEffect` (mirrors
`PrefixParameterCard`'s `useEffect(() => setValue(parameter.value ?? ''), [parameter.value])`).
`apiKey` starts `''` and is never seeded from the response, per the proposal's explicit
constraint (the backend never returns the plaintext key at all).

### AC-2 — Client-side key generation

`generateApiKey()` in `PortfolioIntegrationForm.tsx`:

```ts
Array.from(crypto.getRandomValues(new Uint8Array(32)))
	.map((byte) => byte.toString(16).padStart(2, '0'))
	.join('');
```

64 hex characters, no network call, no state beyond the local `apiKey` field. The
"Generar clave" button is `type="button"` (inside a `<form>`) so it never triggers
submission.

### AC-3, AC-4 — Submit, validation, cache seed, field clearing

`schemas/portfolioSsoValidation.ts`: `portfolioSsoConfigFormSchema = z.object({ baseUrl:
z.string().url(...), apiKey: z.string().min(32, ...) })`, following
`performanceLevelFormSchema`'s shape exactly (message strings are i18n keys, not literal
text — resolved via `tryTranslate` at the render site, never hardcoded Spanish/English in
the schema file itself).

`handleSubmit` calls `portfolioSsoConfigFormSchema.safeParse({ baseUrl, apiKey })`; on
failure, `setFormError(tryTranslate(t, result.error.issues[0].message))` and returns
without calling the backend (AC-4). On success, `useUpsertPortfolioSsoConfig().mutate(...)`
— `onSuccess` calls `queryClient.setQueryData(portfolioSsoQueryKeys.config(), data)`
(seed, no invalidate-then-refetch round-trip, per the proposal) and shows a success toast;
`onError` shows an error toast via `getErrorMessage`. **Both** branches call
`setApiKey('')` — the field is cleared on success or failure alike, so a submitted secret
never lingers visibly, matching the proposal's explicit requirement.

The submit `<Button>` is `disabled={upsertConfig.isPending}` and swaps its label to a
"Guardando…"/"Saving…" string while pending, mirroring `OpenPeriodDialog`'s
`createPeriod.isPending` handling.

### AC-5, AC-6 — Sidebar click, link fetch, popup handling

`AppSidebar.tsx`'s `NavItem` type gains `onClick?: () => void` and loses `externalHref`
(now unused anywhere). The PORTFOLIO item keeps `href: '/portfolio'` — used only by
`canAccessRoute(item.href ?? '#')` for visibility gating, exactly as before — and adds
`onClick: handlePortfolioClick`. The render branch that used to check
`item.externalHref` now checks `item.onClick` first and renders a `href`-less
`SidebarItem` (the existing `onClick`-only/button branch in `Sidebar.tsx`, already proven
by the Logout item).

```ts
async function handlePortfolioClick() {
	const popup = window.open('', '_blank');
	try {
		const { url } = await getPortfolioSsoLink();
		if (popup) popup.location.href = url;
		else window.open(url, '_blank');
	} catch (err) {
		popup?.close();
		showToast(getErrorMessage(err, 'admin.portfolioIntegration.error.linkFailed'), 'error');
	}
}
```

The blank tab opens **synchronously**, before the `await`, specifically to dodge popup
blockers — most browsers only allow `window.open` without a blocked-popup warning when
called directly inside a click handler's synchronous execution, not after an `await`. If
the popup was blocked anyway (`popup` is `null`, e.g. some mobile browsers), the success
path falls back to `window.open(url, '_blank')` after the fetch resolves; the error path
simply skips the close (`popup?.close()` is a no-op on `null`).

`getPortfolioSsoLink()` lives in `services/portfolioSsoService.ts` (not duplicated inline
in `AppSidebar.tsx`) since it's the same backend module as the admin config screen, and
`AppSidebar.tsx` imports it from the module's barrel — the same cross-module-via-barrel
import style `PrefixParameterCard.tsx` already uses for `updateParameter` from
`@/modules/admin/parameters`.

`AppSidebar.tsx` renders one `<Toast>` (via `useApiErrorToast()`) for this error path,
alongside the existing `Sidebar`/`SidebarHeader`/... tree — wrapped in a fragment since
`Toast` is self-positioned (`fixed bottom-5 right-5`, per `Toast.tsx`) and needs no shared
layout parent.

### AC-7 — Env var removal

`NEXT_PUBLIC_PORTFOLIO_URL: z.string().min(1)` removed from `envSchema` in
`env.config.ts`; the `const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? '';`
line and its only other reference (`externalHref: PORTFOLIO_URL`) removed from
`AppSidebar.tsx`. `docs/CONTEXT.md`'s Environment Variables table row for this var is
removed in the same change (it directly documents the schema entry being deleted; leaving
it would make the docs immediately stale). `.env.local`'s existing
`NEXT_PUBLIC_PORTFOLIO_URL=...` line is left alone — it's an untracked local file and a
stray, now-unvalidated env var there is harmless.

## Frontend

- **Routes**: `src/app/admin/portfolio-integration/page.tsx` (new) — thin
  `dynamic(() => import('@/modules/admin/portfolio-integration').then((m) => m.AdminPortfolioIntegrationPage))`
  shell, matching every other `src/app/admin/*/page.tsx`.
- **New module** `src/modules/admin/portfolio-integration/`:
  - `types/index.ts` — `PortfolioSsoConfigSummary`, `UpsertPortfolioSsoConfigBody`,
    `PortfolioSsoLink`.
  - `schemas/portfolioSsoValidation.ts` + `schemas/index.ts` — `portfolioSsoConfigFormSchema`.
  - `services/portfolioSsoService.ts` + `services/index.ts` — `getPortfolioSsoConfig`,
    `upsertPortfolioSsoConfig`, `getPortfolioSsoLink`.
  - `hooks/usePortfolioSsoConfig.ts` + `hooks/index.ts` — `usePortfolioSsoConfig`,
    `useUpsertPortfolioSsoConfig`.
  - `components/PortfolioIntegrationForm.tsx` + `components/index.ts`.
  - `pages/AdminPortfolioIntegrationPage.tsx` + `pages/index.ts`.
  - `index.ts` — barrel (`components`, `hooks`, `pages`, `schemas`, `services`, `types`).
- **Modified**: `src/app/components/AppSidebar.tsx` (PORTFOLIO item + admin children +
  `handlePortfolioClick` + `Toast`), `src/configs/env.config.ts`, `docs/CONTEXT.md`.
- **i18n**: `src/language/locales/{es,en}.json` —
  - `nav.admin.portfolioIntegration` (new, alongside the existing `nav.admin.*` block).
  - `admin.portfolioIntegration.*` (new top-level admin section, sibling to
    `admin.params`): `page.title`/`page.subtitle`, `status.configured`/`.notConfigured`
    (the former using the `{{date}}` interpolation placeholder), `form.baseUrl`/
    `.baseUrlPlaceholder`/`.apiKey`/`.apiKeyPlaceholder`/`.apiKeyHint`,
    `form.btn.generate`/`.submit`/`.submitting`, `form.toast.saved`,
    `form.error.baseUrlInvalid`/`.apiKeyInvalid`/`.saveFailed`, and
    `error.loadFailed`/`.saveFailed`/`.linkFailed` (the last one reused as the sidebar
    click's error-toast fallback key, since it's the same backend module).

## Testing strategy

No test runner in this repo (`docs/POLICIES.md` § Verification Gate). Every AC is verified
by `npx tsc --noEmit` + `pnpm lint` (here run as `npx eslint --max-warnings 0 .`) being
clean, plus manual click-through:

| AC   | Covered by                                                                                                                                                                    | Kind   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | Manual: visit `/admin/portfolio-integration` as an ADMIN-permitted user → status line + empty `apiKey` field                                                                  | manual |
| 2    | Manual: click "Generar clave" → field fills with a 64-hex-char string, no network call in the Network tab                                                                     | manual |
| 3, 4 | Manual: submit valid/invalid values → success toast + field cleared / inline validation error, no backend call on invalid input                                               | manual |
| 5, 6 | Manual: click PORTFOLIO in the sidebar with the backend module deployed / not deployed → new tab navigates to the signed URL, or an error toast shows and no dead tab remains | manual |
| 7    | `tsc`/`lint` clean with the var removed; `grep -r NEXT_PUBLIC_PORTFOLIO_URL src` returns nothing                                                                              | manual |

AC-5/AC-6's full happy path cannot be exercised until the backend's `portfolio-sso` module
is actually deployed (see `proposal.md` § Risks) — see `tasks.md` for how that's sequenced.

## Risks

See `proposal.md` § Risks — the same three (derived route path, deploy ordering, manual
`apiKey` handoff) are the operative ones for this design; nothing new introduced here.

## Docs to update in this PR

- `docs/CONTEXT.md` — Environment Variables table (`NEXT_PUBLIC_PORTFOLIO_URL` row
  removed, done in this change). Directory Structure's `modules/admin/` listing is left
  as-is; adding one line for `portfolio-integration/` there is a reasonable following-PR
  cleanup but not required for this change to be correct (the existing listing already
  says "sub-modules per concern" without claiming to be exhaustive).
