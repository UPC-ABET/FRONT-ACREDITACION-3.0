# Design — Planner credentials UI

**Slug**: `planner-credentials-ui`
**Proposal**: `./proposal.md`

## Read first

- `./proposal.md` — the 15 ACs this design satisfies.
- `docs/POLICIES.md` § Data Fetching (TanStack Query rules, `staleTime`/invalidation), §
  Components → Page Layout ("Embedded widgets" exception for self-contained `<Card>`
  sections), § i18n, § TypeScript (no `any`), § Accessibility (labels, color-not-only-signal).
- `docs/CONTEXT.md` § Related Repositories (cross-repo change model, sequential mode), §
  Global Academic Context (why this screen needs no school/period/modality selector).
- `docs/adr/` — indexed; only `README.md` exists, no ADR touches Planner or session
  handling.
- `openspec/specs/` — empty, no prior art to build on.
- Backend contract, fetched remotely (not from a local checkout) via:
  `gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=develop" -H "Accept: application/vnd.github.raw"`
  — paths `/planner/session/status`, `/planner/session/refresh`,
  `/planner/session/credentials` (GET+POST), schemas `PlannerSessionStatusDto`,
  `PlannerCredentialsResponseDto`, `SavePlannerCredentialsDto`.
- `src/modules/planner/` — the module being extended: `types/index.ts`,
  `services/plannerService.ts`, `hooks/usePlanner.ts`, `constants/index.ts`,
  `components/PlannerSessionStatusCard.tsx`, `components/PlannerManagementView.tsx`.
- `src/shared/lib/apiError.ts` (`ApiError`, `getApiErrorReasons`) and
  `src/shared/utils/tryTranslate.ts` (`resolveApiErrorContent`) — the existing generic
  error-to-UI-content utilities this design reuses rather than reinventing.
- `src/modules/ifcs/components/form/IFCForm.tsx` (lines ~51, ~118, ~218) — the prior art
  in this codebase for the exact pattern this design follows: a form keeps its own
  `ApiErrorContent | null` state, populates it via `resolveApiErrorContent(t, e,
fallbackKey)` in the `catch`, and renders it through a manually-controlled `<Toast
isOpen reasons=... />` closed by the user, not an auto-dismiss timer.

## ADR gate (walked, not skipped)

| Trigger                                       | Hit?                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datastore, broker or cache choice             | No                                                                                                                                                                                          |
| Auth or payments provider                     | No                                                                                                                                                                                          |
| Public API contract change or breaking change | No — the contract was already decided and merged in the backend repo (`planner-api-login`, BACK-ACREDITACION-3.0#99). This repo only consumes it; it does not decide or alter the contract. |
| New module boundary or cross-repo split       | No — extends the existing `src/modules/planner/` module; no new module, no new route.                                                                                                       |
| Language, runtime or framework                | No                                                                                                                                                                                          |
| Contradicting an existing ADR                 | No — `docs/adr/` has no ADRs yet.                                                                                                                                                           |

**Conclusion**: no ADR required.

## Approach

### AC-1 — `not_configured` renders as setup, not error

`PlannerSessionStatusValue` widens to include `'not_configured'`. In
`PlannerSessionStatusCard`, that status gets its own badge color and hint text (added to
`PLANNER_SESSION_STATUS_COLORS` and the `planner.session.hint.*` / `status.*` i18n keys) —
neutral/informational styling, not the red "expired" treatment. The refresh button is
hidden whenever `status === 'not_configured'` (there is nothing to refresh yet, and
pressing it would only produce `credentialsNotConfigured`). The actual "setup form" is the
always-rendered `PlannerCredentialsCard` (AC-2/3) placed directly below the status card —
there is no separate empty-state screen or conditional mount to get wrong.

### AC-2 / AC-3 — Credentials view: configured vs never-configured

New `usePlannerCredentials()` query (`GET /planner/session/credentials`) backs a read-only
summary in `PlannerCredentialsCard`: when `configured` is `true`, show `username` and a
localized `updatedAt`; when `false`, show a "not configured yet" line instead of blank
space or a false error. Loading/error states mirror the sibling
`PlannerSessionStatusCard` exactly (`Spinner` + text; italic red text on error) — no new
visual language introduced. The password is never part of this response (backend contract
guarantees it), so there is nothing to accidentally render.

### AC-4 — Save success updates status without a second GET

`useSavePlannerCredentials()` wraps `POST /planner/session/credentials`. Its `onSuccess`
does exactly what `useRefreshPlannerSession` already does today: `queryClient.setQueryData(
plannerQueryKeys.sessionStatus(), data)` — the response body _is_ a `PlannerSessionStatusDto`,
so the token-status card updates immediately from the mutation response. Separately, it
invalidates `plannerQueryKeys.credentials()` (a different query, not the forbidden one) so
the just-saved `username`/`updatedAt` are re-fetched from the read endpoint rather than
guessed client-side (the server clock, not the browser, owns `updatedAt`).

### AC-5 / AC-6 / AC-8 — invalidCredentials vs verificationCooldown vs saveFailed

These three are visually and textually distinct **purely through i18n content**, with no
branching logic: `ApiError.message` already _is_ the backend's key (see
`apiClient.ts`'s `request()` — `message = errorBody.message`), and
`resolveApiErrorContent(t, error, fallbackKey)` translates it directly. Adding three
distinct entries under `error.planner.invalidCredentials`,
`error.planner.verificationCooldown`, and `error.scraperCredential.saveFailed` in both
locale files is what makes them read differently — one says the password was rejected and
that nothing was overwritten, one says "still checking, try again shortly" with no mention
of correctness, one describes a structurally unusable pair. No `switch` statement is
needed for these three; a missing/wrong translation would surface as a stale/generic
message, not a compile error, which is why AC-15 (both locale files updated) is its own
acceptance criterion and its own task.

### AC-7 — invalidCredentialsPayload surfaces `data[]`

Already-generic machinery: `getApiErrorReasons(error)` reads `error.body.data` (used
today for 409 "in use" blockers elsewhere in the app) and `resolveApiErrorContent`
threads it into `{ title, reasons }`. `PlannerCredentialsCard` renders `reasons` through
`<Toast reasons={...} />`, which already supports a bullet list (see
`IFCForm.tsx:218-224`). No Planner-specific code is needed for this AC beyond calling the
existing helper.

### AC-9 / AC-10 — the two 503s, routed by key not status

Both `error.planner.unreachable` and `error.scraperCredential.decryptionFailed` arrive as
HTTP 503. Because every error path in this design keys off `ApiError.message` (the
backend's string key) and never off `ApiError.status`, there is no code path that could
conflate them — the distinction is enforced by construction, not by a status-code check
that has to remember to exclude 503. Each gets its own locale entry so the message differs
too (AC-15).

### AC-11 — refresh with `credentialsNotConfigured` falls back to setup, not an error

`PlannerSessionStatusCard`'s refresh call intercepts this one key specifically, before it
would otherwise reach the generic error Toast:

```ts
refreshSession.mutate(undefined, {
	onError: (error) => {
		if (error instanceof ApiError && error.message === PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY) {
			queryClient.invalidateQueries({ queryKey: plannerQueryKeys.sessionStatus() });
			return; // no toast — AC-1's not_configured rendering takes over on refetch
		}
		setRefreshError(resolveApiErrorContent(t, error, 'planner.session.refreshError'));
	},
});
```

This is reachable only defensively (AC-1 already hides the refresh button in this state),
e.g. a race where credentials are cleared in another session between page load and click.
`PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY` is the one error key that needs a named constant
in code (`constants/index.ts`) rather than living only in locale files, because it is the
only key any component branches on.

### AC-12 — submit disabled for the full request duration

`<Button loading={saveCredentials.isPending}>` — `Button` already sets `disabled={disabled
|| loading}` (see `Button.tsx:56`), so this is the existing primitive's behavior, not new
logic. No client-side cooldown timer is built to mirror the server's 30s window; the
server enforces it and owns the verdict (per the proposal, a client-guessed countdown
could show "ready" while the server still refuses, or vice versa) — the UI only ever
reacts to whatever `verificationCooldown` response actually comes back (AC-6).

### AC-13 — password field always blank after submit

`password` is local `useState` in `PlannerCredentialsCard`, cleared in the mutation's
`onSettled` (fires on both success and failure) — never populated from any query response,
since no response ever contains it.

### AC-14 — exhaustive status mapping enforced by `tsc`

`PLANNER_SESSION_STATUS_COLORS` moves from a component-local `const` in
`PlannerSessionStatusCard.tsx` into `constants/index.ts` as `Record<PlannerSessionStatusValue,
string>` (mirroring the existing sibling `PLANNER_SCRAPE_STATUS_COLORS` pattern already in
that file). `Record<K, V>` requires every member of `K` to have an entry — widening the
union without adding a `not_configured` key is a `tsc` error, not a runtime fallthrough.
The `status.*` / `hint.*` i18n lookups are plain template strings (this app has no typed
i18n key coverage anywhere), so their completeness is covered by AC-15 and the manual QA
pass, not by the compiler.

### AC-15 — i18n coverage

Every task that introduces user-facing copy or references a new backend error key adds
the matching entries to **both** `es.json` and `en.json` in the same commit — not deferred
to a final pass — so no task ever leaves the app showing a raw untranslated key even
mid-branch.

## Frontend

- **Routes / screens**: none new. Extends the existing `/scrapping` route → Planner tab
  (`src/app/(protected)/scrapping/ScrapingTabsView.tsx` → `PlannerManagementView`),
  already gated by the `SCRAPPING` permission.
- **Components**:
  - `PlannerSessionStatusCard.tsx` (modify) — 4th status, hidden refresh button, own
    `refreshError` state + local `<Toast>`.
  - `PlannerCredentialsCard.tsx` (new) — read-only credentials summary + save form, own
    `formError`/`saveSuccess` state + local `<Toast>`s (mirrors `IFCForm.tsx`'s pattern,
    not the auto-dismiss `useApiErrorToast` used by `PlannerManagementView`/
    `PlannerStartScrapePanel` — this card is self-contained and needs no new props
    threaded through `PlannerManagementView`).
  - `PlannerManagementView.tsx` (modify) — mounts `<PlannerCredentialsCard />` between the
    status card and the start-scrape panel. No prop changes to existing children.
- **Data**: two new query/mutation pairs in `hooks/usePlanner.ts`:
  - `plannerQueryKeys.credentials()` — `staleTime: Infinity`, invalidated explicitly by
    `useSavePlannerCredentials`'s `onSuccess` (per `docs/POLICIES.md` § TanStack Query:
    "Infinity... always paired with explicit invalidation").
  - `usePlannerCredentials()` — `GET /planner/session/credentials`.
  - `useSavePlannerCredentials()` — `POST /planner/session/credentials`; `onSuccess` sets
    the session-status cache directly (AC-4) and invalidates the credentials cache.
  - **No `useABET()` scope variables in either key.** These four Planner session endpoints
    are explicitly system-wide (proposal Non-goals) — `schoolId`/`modalityTypeId`/
    `academicPeriodId` do not apply here. This is a deliberate exception to the "every
    scope-dependent query key includes every scope variable" rule, not an oversight —
    called out here so `/abet-audit-pr` doesn't flag it as a missing-scope bug.
- **Types** (`types/index.ts`): `PlannerSessionStatusValue` widens to `'active' |
'expiring' | 'expired' | 'not_configured'`; new `PlannerCredentials { username: string |
null; configured: boolean; updatedAt: string | null }` and
  `SavePlannerCredentialsRequest { username: string; password: string }`, mirroring the
  existing `PlannerSessionStatus` / `StartPlannerScrapeRequest` naming style. These are
  hand-written to match the backend DTOs (`PlannerCredentialsResponseDto`,
  `SavePlannerCredentialsDto`) — this repo has no OpenAPI codegen step, so staying in sync
  is a manual-review responsibility at PR time, same as every other type in this module.

## Cross-repo mode

- **Mode**: sequential. The backend (`planner-api-login`, BACK-ACREDITACION-3.0#99) is
  already merged to its `develop` @ `3af260b8`. No `contract.md` is written — the backend's
  committed `openapi.json` is the contract, read remotely via `gh api` (see Read first).
- **Ordering**: per `plugins/abet-common/reference/conventions.md`, this frontend PR must
  not merge ahead of the backend reaching `staging`. `/abet-verify-contract` should be run
  before `/abet-create-pr` to confirm that promotion state with `gh api`, not by trusting
  the `develop`-SHA recorded here (that SHA can go stale between design and merge).

## Testing strategy

There is no test runner in this repo (`docs/POLICIES.md` § Verification Gate). Every AC
is verified by `npx tsc --noEmit` + `pnpm lint` (for the type/exhaustiveness-shaped ones)
plus a manual pass against a running backend (for the behavior-shaped ones — most of them,
since this change is almost entirely about correctly surfacing seven distinct backend
error responses that cannot be produced without a real or deliberately-misconfigured
backend).

| AC  | Covered by                                                                                                                                           | Kind          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | Manual: force `not_configured` (fresh/reset backend), confirm setup form, no error styling, no refresh button                                        | manual        |
| 2   | Manual: with credentials saved, confirm username + updatedAt render, no password anywhere in DOM/network tab                                         | manual        |
| 3   | Manual: fresh/never-configured backend, confirm "not configured" state                                                                               | manual        |
| 4   | Manual + Network tab: confirm no `GET /planner/session/status` fires after a successful `POST`                                                       | manual        |
| 5   | Manual: submit a known-wrong password against a real u-planner, confirm rejection message + "unchanged" note                                         | manual        |
| 6   | Manual: submit twice quickly (or resubmit within 30s of a rejection), confirm distinct cooldown message                                              | manual        |
| 7   | Manual: submit a malformed payload (e.g. via devtools override) or an empty username, confirm field-level reasons render                             | manual        |
| 8   | Manual: submit a whitespace-only username, confirm `saveFailed` message distinct from AC-5/6                                                         | manual        |
| 9   | Manual: point at an unreachable u-planner (or simulate via backend env), confirm "Planner unavailable" message                                       | manual        |
| 10  | Manual: force a decryption failure (rotate `APP_SECRET` in a disposable env) or request backend team simulate it, confirm message distinct from AC-9 | manual        |
| 11  | Manual: race — clear credentials server-side, then hit refresh before the UI refetches; confirm fallback to setup, no error toast                    | manual        |
| 12  | Manual: rapid double-click the save button, confirm only one request fires (Network tab)                                                             | manual        |
| 13  | Manual: after both a failed and a successful save, confirm the password input is empty                                                               | manual        |
| 14  | `npx tsc --noEmit` — remove a key from `PLANNER_SESSION_STATUS_COLORS` locally to confirm it fails, then restore                                     | type-check    |
| 15  | Manual: grep both locale files for every new key introduced; `pnpm lint` (unused-key lint, if configured)                                            | manual + lint |

All manual items are collected into `runbook.md`, since none of them are covered by an
automated test.

## Risks

| Risk                                                                                                                                                      | Mitigation                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend PR merges before the backend reaches `staging`                                                                                                   | `/abet-verify-contract` gate before `/abet-create-pr`, per Cross-repo mode above                                                                                                                                                                                    |
| The two 503 keys get conflated by a future edit that "simplifies" error handling to a status-code switch                                                  | This design has no status-code branch anywhere (see AC-9/10) — a reviewer should reject any future diff that introduces one for these endpoints                                                                                                                     |
| `PLANNER_SESSION_STATUS_COLORS` widened via a type cast instead of extending the `Record`, silently reintroducing the fallthrough AC-14 exists to prevent | Code review checks the diff is an added key, not a cast; `tsc --noEmit` is part of every task's steps                                                                                                                                                               |
| Manual-only verification (no test runner) means these ACs can regress silently later                                                                      | `runbook.md` gives the next person the exact repro steps per error key so a regression is at least _checkable_ by hand again, and the risk itself is logged in `docs/CONTEXT.md`'s existing "no test runner" Known Gap rather than treated as unique to this change |
| `es.json`/`en.json` drift (a key added to one, forgotten in the other)                                                                                    | Each task that adds copy touches both files in the same commit (AC-15); final manual grep pass in Milestone 4                                                                                                                                                       |

## Docs to update in this PR

- [ ] `docs/CONTEXT.md` § Domain Vocabulary or § Business Rules — add a short entry for
      the Planner session `not_configured` status and the one-system-wide-credential rule,
      since a future reader of `PlannerSessionStatusValue` will otherwise have no way to know
      a 4th value exists without reading this design.
- [ ] No `docs/POLICIES.md` change — this change follows existing policy, it does not set
      new policy.
