# Tasks — Planner credentials UI

**Slug**: `planner-credentials-ui` · **Proposal**: `./proposal.md` · **Design**: `./design.md`

## For whoever executes this

- **There is no test runner in this repo** (`docs/POLICIES.md` § Verification Gate — no
  Jest/Vitest/Playwright). Every task's Steps therefore end in `npx tsc --noEmit` +
  `pnpm lint`, **not** `pnpm test` — there is nothing to run. A task is complete when
  those two commands are clean **and** the manual verification step named in the task has
  actually been performed and described, per policy. Do not report a task done on
  typecheck/lint alone when a manual step is called for.
- Work in checkpointed batches of 3–5 tasks. Partition each batch by files touched and fan
  the non-overlapping ones out to parallel subagents. Milestone 1's four tasks touch four
  different files and are a natural parallel batch; Milestone 2 and Milestone 3 both touch
  `PlannerManagementView.tsx` at the very end only (Task 3.3) — do that one after its
  siblings, not in parallel with them.
- Every new user-facing string and every backend error key referenced lands in **both**
  `src/language/locales/es.json` and `en.json` in the _same_ task/commit that introduces
  it — never deferred to a cleanup pass (see AC-15, and the i18n drift risk in
  `design.md`).
- **No autonomous commits.** Propose the grouping and stop.
- Do not edit `docs/POLICIES.md` or `docs/adr/*`.
- Full manual-verification script (all 15 ACs) lives in `./runbook.md` — Milestone 4 walks
  it and records results; earlier milestones only do the narrow manual check named in
  their own task.

## Goal

Extend the existing Planner tab (`/scrapping` → Planner) so an operator with `SCRAPPING`
permission can view and set/rotate the system-wide Planner credentials through the UI —
closing the `curl`-only gap left by the backend's `planner-api-login` change — and so the
new `not_configured` session status, and each of the seven distinct backend error keys,
render as exactly what they mean instead of a generic or misleading error.

## Slicing

Vertical. Milestone 1 is the data layer (types/constants/services/hooks) everything else
depends on. Milestone 2 makes the _existing_ status card correct for the 4th status and
its own refresh errors. Milestone 3 adds the new credentials card end-to-end. Milestone 4
is the manual QA pass across every AC, since none of them are covered by an automated
test.

---

## Milestone 1 — Data layer: types, constants, services, hooks

### Task 1.1 — Widen `PlannerSessionStatusValue`, add credentials types ✅ DONE (2026-08-09)

- [x] Task complete

**Files**

- `src/modules/planner/types/index.ts` (modify)

**Steps**

1. Change `PlannerSessionStatusValue` to `'active' | 'expiring' | 'expired' |
'not_configured'`.
2. Add `PlannerCredentials { username: string | null; configured: boolean; updatedAt:
string | null }`, matching `PlannerCredentialsResponseDto` from the backend's
   `openapi.json` (fetch remotely per `design.md` § Read first — do not guess field
   names/nullability).
3. Add `SavePlannerCredentialsRequest { username: string; password: string }`, matching
   `SavePlannerCredentialsDto`.
4. `npx tsc --noEmit` → expect it to now fail at `PlannerSessionStatusCard.tsx`'s
   `TOKEN_COLORS` (a `Record` over the old 3-value union) — this confirms the
   exhaustiveness check from AC-14 actually fires. Leave it red; Task 2.1 fixes it.

**Commit**: `feat(planner): widen session status union and add credentials types`

### Task 1.2 — Constants: status colors, not-configured error key ✅ DONE (2026-08-09)

- [x] Task complete

**Files**

- `src/modules/planner/constants/index.ts` (modify)

**Steps**

1. Add `PLANNER_SESSION_STATUS_COLORS: Record<PlannerSessionStatusValue, string>`
   (mirroring the existing `PLANNER_SCRAPE_STATUS_COLORS` in the same file), including a
   `not_configured` entry with a neutral/informational color — not the `expired` red.
2. Add `PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY = 'error.planner.credentialsNotConfigured'
as const` — the one backend error key a component branches on in code (see AC-11 in
   `design.md`); every other key lives only in the locale files.
3. `npx tsc --noEmit` — still expected red (Task 2.1 hasn't removed the old
   `TOKEN_COLORS` yet); confirm the new export itself compiles with no missing-key error.

**Commit**: `feat(planner): add session status color map and not-configured error key constant`

### Task 1.3 — Services: read/write credentials ✅ DONE (2026-08-09)

- [x] Task complete

**Files**

- `src/modules/planner/services/plannerService.ts` (modify)

**Steps**

1. Add `getPlannerCredentials(): Promise<PlannerCredentials>` — `apiGet('/planner/session/credentials')`.
2. Add `savePlannerCredentials(payload: SavePlannerCredentialsRequest):
Promise<PlannerSessionStatus>` — `apiPost('/planner/session/credentials', payload)`.
3. `npx tsc --noEmit` && `pnpm lint`.

**Commit**: `feat(planner): add credentials read/write API calls`

### Task 1.4 — Hooks: credentials query and save mutation ✅ DONE (2026-08-09)

- [x] Task complete

**Files**

- `src/modules/planner/hooks/usePlanner.ts` (modify)

**Steps**

1. Add `plannerQueryKeys.credentials = () => [...plannerQueryKeys.all, 'credentials'] as
const`. No `useABET()` scope variables in this key or `sessionStatus()` — these
   endpoints are system-wide by design (see `design.md` § Frontend, the explicit
   scope-key exception).
2. Add `usePlannerCredentials()` — `useQuery` over `getPlannerCredentials`, `staleTime:
Infinity` (paired with the explicit invalidation added in the next step, per
   `docs/POLICIES.md` § TanStack Query).
3. Add `useSavePlannerCredentials()` — `useMutation` over `savePlannerCredentials`;
   `onSuccess` does `queryClient.setQueryData(plannerQueryKeys.sessionStatus(), data)`
   (AC-4 — reuses the exact pattern already in `useRefreshPlannerSession`) **and**
   `queryClient.invalidateQueries({ queryKey: plannerQueryKeys.credentials() })`.
4. `npx tsc --noEmit` && `pnpm lint`.

**Commit**: `feat(planner): add usePlannerCredentials and useSavePlannerCredentials hooks`

---

## Milestone 2 — Token status card: 4th status + its own refresh errors

### Task 2.1 — `not_configured` status rendering, hidden refresh button ✅ DONE (2026-08-09)

- [x] Task complete

> `tsc --noEmit` went from the expected red (Task 1.1's deliberate exhaustiveness break)
> straight to green on this pass — no surprises.

**Files**

- `src/modules/planner/components/PlannerSessionStatusCard.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Remove the component-local `TOKEN_COLORS` const; import
   `PLANNER_SESSION_STATUS_COLORS` from `../constants` instead (Task 1.2).
2. Hide the "refresh" `<Button>` entirely when `status === 'not_configured'` (AC-1) —
   there is nothing to refresh yet, and pressing it only produces
   `credentialsNotConfigured`.
3. Add `planner.session.status.not_configured` and `planner.session.hint.not_configured`
   to **both** `es.json` and `en.json`, matching the tone of the existing three entries —
   informational ("Planner has not been configured yet — set credentials below"), not
   alarming.
4. `npx tsc --noEmit` → expect **green** now (the `Record` is exhaustive again).
5. `pnpm lint`.
6. Manual: with a backend/test account that has never had Planner credentials saved,
   load the Planner tab and confirm the badge reads "not configured" (not red/expired
   styling) and no refresh button is present.

**Commit**: `feat(planner): render not_configured session status without a retry button`

### Task 2.2 — Refresh error handling (503s, and the `credentialsNotConfigured` fallback) ✅ DONE (2026-08-09)

- [x] Task complete

> `tsc --noEmit` and `pnpm lint` clean on the first pass. Manual reproduction of the two
> 503 keys and the `credentialsNotConfigured` race deferred to Task 4.1 — none of the
> three can be produced without a running backend and deliberate misconfiguration (see
> `runbook.md`).

**Files**

- `src/modules/planner/components/PlannerSessionStatusCard.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Add local state `refreshError: ApiErrorContent | null` (type from
   `@/shared/utils/tryTranslate`).
2. Pass an `onError` callback into the existing `refreshSession.mutate(...)` call (today
   it has none — this closes a pre-existing gap where a failed refresh was silently
   swallowed):
   - if `error instanceof ApiError && error.message ===
PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY`: `queryClient.invalidateQueries({ queryKey:
plannerQueryKeys.sessionStatus() })` and return — **no toast** (AC-11; the
     not_configured rendering from Task 2.1 takes over once the refetch lands).
   - otherwise: `setRefreshError(resolveApiErrorContent(t, error,
'planner.session.refreshError'))`.
3. Render a manually-controlled `<Toast isOpen={!!refreshError}
onClose={() => setRefreshError(null)} type="error" message={refreshError?.title}
reasons={refreshError?.reasons} />`, following `IFCForm.tsx`'s exact pattern for this
   (not the auto-dismiss `useApiErrorToast` hook).
4. Add `planner.session.refreshError` (generic fallback title),
   `error.planner.unreachable`, and `error.scraperCredential.decryptionFailed` to both
   locale files, with distinguishable text (AC-9/AC-10 — "u-planner did not respond" vs "a
   server-side configuration problem", never both phrased as "credential" issues).
5. `npx tsc --noEmit` && `pnpm lint`.
6. Manual: this AC needs a backend that can be made to return each error — coordinate
   with whoever can stop u-planner reachability (AC-9) or rotate `APP_SECRET` in a
   disposable environment (AC-10); record the result in `runbook.md` rather than here.

**Commit**: `feat(planner): surface distinct refresh errors and fall back cleanly on credentialsNotConfigured`

---

## Milestone 3 — Credentials card: view + save form

### Task 3.1 — `PlannerCredentialsCard`: read-only view ✅ DONE (2026-08-09)

- [x] Task complete

**Files**

- `src/modules/planner/components/PlannerCredentialsCard.tsx` (create)
- `src/modules/planner/components/index.ts` (modify — export it)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Create the component: `usePlannerCredentials()`, loading state (`Spinner` + text) and
   error state (italic red text) mirroring `PlannerSessionStatusCard`'s existing
   conventions exactly — no new visual language.
2. Configured (`data.configured === true`): show `data.username` and a locale-formatted
   `data.updatedAt` (same `toLocaleString` pattern as `PlannerSessionStatusCard`'s
   `tokenExp` formatting).
3. Not configured (`data.configured === false`): show a distinct "not configured yet"
   line — not blank, not styled as an error (AC-3).
4. Add `planner.credentials.title`, `.subtitle`, `.loading`, `.loadError`,
   `.currentLabel`, `.updatedAtLabel`, `.notConfigured` to both locale files.
5. `npx tsc --noEmit` && `pnpm lint`.
6. Manual: confirm the view renders correctly for both a configured and a never-configured
   backend state.

**Commit**: `feat(planner): add read-only Planner credentials view`

### Task 3.2 — `PlannerCredentialsCard`: save form ✅ DONE (2026-08-09)

- [x] Task complete

> `tsc --noEmit` and `pnpm lint` clean on the first pass. End-to-end submit against a
> real u-planner account (wrong password / correct password / double-click) deferred to
> Task 4.1 — no backend available in this session.

**Files**

- `src/modules/planner/components/PlannerCredentialsCard.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Add controlled `username`/`password` local state, two `<Input>`s (`label`, `required`,
   the password one `type="password"`), and a submit `<Button loading=
{saveCredentials.isPending}>` (AC-12 — `Button` already disables while `loading`, no
   extra `disabled` needed).
2. On submit, call `useSavePlannerCredentials().mutate({ username, password }, {...})`:
   - `onSuccess`: `setSaveSuccess(true)` (or similar), used to render a success `<Toast
type="success">` (self-contained, not the parent's `useApiErrorToast`).
   - `onError`: `setFormError(resolveApiErrorContent(t, error,
'planner.credentials.saveError'))`, rendered via `<Toast type="error" reasons=
{formError?.reasons} />` (AC-5/6/7/8 — this is generic; no per-key branching needed,
     see `design.md` § AC-5/6/8 and § AC-7).
   - `onSettled`: clear `password` back to `''` regardless of outcome (AC-13).
3. Add `planner.credentials.usernameLabel`, `.passwordLabel`, `.save`, `.saveSuccess`,
   `error.planner.invalidCredentials`, `error.planner.verificationCooldown`,
   `error.planner.invalidCredentialsPayload`, `error.scraperCredential.saveFailed` to both
   locale files — phrase `invalidCredentials` to explicitly state prior working
   credentials are unchanged on rejection (AC-5), and `verificationCooldown` to explicitly
   say nothing about correctness (AC-6).
4. `npx tsc --noEmit` && `pnpm lint`.
5. Manual: submit a deliberately wrong password against a real u-planner account and
   confirm the AC-5 message; double-submit rapidly and confirm only one request fires
   (Network tab) and/or the AC-6 message on the second if it lands as a real cooldown.
   Full error-key-by-error-key verification is `runbook.md`'s job — this step only proves
   the wiring works end-to-end for at least one success and one failure path.

**Commit**: `feat(planner): add Planner credentials save form`

### Task 3.3 — Wire into `PlannerManagementView` ✅ DONE (2026-08-09)

- [x] Task complete

> Full-repo `pnpm lint` and `npx tsc --noEmit` both clean at this checkpoint, not just
> the files touched by this task.

**Files**

- `src/modules/planner/components/PlannerManagementView.tsx` (modify)

**Steps**

1. Render `<PlannerCredentialsCard />` between `<PlannerSessionStatusCard />` and
   `<PlannerStartScrapePanel ... />`. No prop changes to any existing child.
2. `npx tsc --noEmit` && `pnpm lint`.
3. Manual: load `/scrapping` → Planner tab, confirm the new card appears in the right
   position and the rest of the tab (scrape start/progress/history) is visually
   unaffected.

**Commit**: `feat(planner): mount PlannerCredentialsCard in the Planner tab`

---

## Milestone 4 — Manual QA pass and docs

### Task 4.1 — Full AC walkthrough against a running backend ⚠️ NOT DONE — needs live backend

- [ ] Task complete

**Files**

- `openspec/changes/planner-credentials-ui/runbook.md` (modify — fill in the results table)

**Steps**

1. Follow the deploy prerequisite and "how to reproduce each backend error key" sections
   already written in `runbook.md`, against a running backend on the `planner-api-login`
   change.
2. Record pass/fail per AC in `runbook.md`'s checklist table. Any fail routes back to the
   relevant Milestone 1–3 task, not a silent patch here.

> **Left open on purpose.** No live backend with a real u-planner account was available in
> this implementation session, so the actual behavioral checks (rows 1, 2, 3, 4, 5, 6, 7,
> 8, 9, 11, 12, 13, plus row 10 in a disposable env) were **not run**. `runbook.md` records
> exactly what code-level evidence stands in for them today (mostly `tsc`/`lint`/`build`
> plus reading the implemented logic) and what still needs a human with backend + u-planner
> access before this ships. Per `docs/POLICIES.md` § Verification Gate, this task stays
> unchecked rather than being marked done on typecheck/lint alone — do not flip it to done
> without actually running the checklist. 3. `npx tsc --noEmit` && `pnpm lint` clean across the whole diff (not just this task's
> files).

**Commit**: `docs(planner): add credentials UI manual verification runbook`

### Task 4.2 — `docs/CONTEXT.md` update ✅ DONE (2026-08-09)

- [x] Task complete

**Files**

- `docs/CONTEXT.md` (modify)

**Steps**

1. Add a short entry (Domain Vocabulary or Business Rules, whichever section already
   covers Planner/session concepts best) documenting the `not_configured` session status
   and the one-system-wide-credential rule, per `design.md` § Docs to update in this PR.
2. `pnpm lint` (markdown formatting via lint-staged on commit is sufficient; no dedicated
   docs linter in this repo).

**Commit**: `docs: document Planner not_configured session status`

<!--
Append-only sections below. These record what actually happened, not what was planned.

## Unplanned — <what and why>

## Post-QA fixes

## Audit fixes (/abet-audit-pr)
-->
