# Tasks — Chart maintenance password reset

**Slug**: `chart-maintenance-password-reset` · **Proposal**: `./proposal.md` · **Design**: `./design.md`

## For whoever executes this

- **There is no test runner in this repo** (`docs/POLICIES.md#verification-gate`). Every
  task's "Steps" below end in `npx tsc --noEmit` + `pnpm lint`, and a task is not complete
  until the manual verification it names has actually been performed and described —
  typecheck/lint passing alone is not enough.
- Work in checkpointed batches; the three milestones below are already the right
  batch size (data layer → dialog component → page wiring). Tasks within Milestone 1 touch
  disjoint files and can be fanned out in parallel; Milestones 2 and 3 depend on 1 and each
  other in sequence.
- Marking a task done means checking its box **and** appending `✅ DONE (YYYY-MM-DD)` to
  the heading. Never one without the other.
- **No autonomous commits.** Propose the grouping and stop.
- Do not edit `docs/POLICIES.md` or `docs/adr/*`.
- Before opening the PR: re-verify the backend endpoint has been promoted to `staging` (see
  `runbook.md`) — it was only on `develop` at design time.

## Goal

Add a "Reset password" action to the organization chart maintenance toolbar that lets an
admin pick one or more chart entity types (DEAN/SCHOOL/PROGRAM/AREA/SUBAREA/COURSE),
confirms the action is irreversible, calls the new
`POST /charts/maintenance/reset-password` endpoint, and shows a results summary of who was
reset and which nodes were skipped.

## Slicing

Vertical: Milestone 1 gets the data plumbing (types/service/hook/constants/i18n) in place
and typechecking clean; Milestone 2 builds the standalone dialog component against that
plumbing; Milestone 3 wires it into the toolbar and is the point at which the feature is
demonstrable end-to-end.

---

## Milestone 1 — Data layer: types, service, hook, constants, i18n keys

### Task 1.1 — Add reset-password types and service method ✅ DONE (2026-08-25)

- [x] Task complete

**Files**

- `src/modules/charts/types/index.ts` (modify)
- `src/modules/charts/services/chartsService.ts` (modify)

**Steps**

1. Add `ChartResetPasswordPayload`, `ChartResetPasswordResetUser`,
   `ChartResetPasswordSkippedNode`, `ChartResetPasswordResult` to `types/index.ts` exactly
   as specified in `design.md` § Frontend.
2. Add `chartsService.resetPasswords(payload)` calling
   `apiPost(`${BASE}/reset-password`, payload)` wrapped in `getApiData`, following the
   existing `create`/`update` method shape in the same file.
3. `npx tsc --noEmit` → expect clean (no consumers yet, so this only checks the new code
   itself is well-typed).
4. `pnpm lint` → expect clean.

**Commit**: `feat(charts): add reset-password types and service call`

> `pnpm exec tsc --noEmit` and `pnpm lint` both clean on the first pass.

### Task 1.2 — Add the reset-password mutation hook and entity-type-order constant ✅ DONE (2026-08-25)

- [x] Task complete

**Files**

- `src/modules/charts/hooks/useCharts.ts` (modify)
- `src/modules/charts/constants/index.ts` (modify)

**Steps**

1. Add `RESET_PASSWORD_ENTITY_TYPE_CODES` to `constants/index.ts` — the six `ENTITY_TYPE.*`
   codes in DEAN/SCHOOL/PROGRAM/AREA/SUBAREA/COURSE order, per `design.md` § Frontend.
2. Add `useResetChartPasswords()` to `useCharts.ts`: a `useMutation` wrapping
   `chartsService.resetPasswords`, with no `onSuccess` invalidation (see `design.md` § AC-4
   for why — this call never changes tree data).
3. `npx tsc --noEmit` → expect clean.
4. `pnpm lint` → expect clean.

**Commit**: `feat(charts): add reset-password mutation hook`

> `useResetChartPasswords` was kept out of `useChartMutations()`'s returned object, per
> `design.md` — it's unrelated to the create/update/remove trio and has exactly one
> consumer (Milestone 2). Clean on the first pass.

### Task 1.3 — Add i18n keys ✅ DONE (2026-08-25)

- [x] Task complete

**Files**

- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Under the existing `loads.organizationChartMaintenance` object in both files, add:
   - `toolbar.resetPassword` — button label.
   - `resetPassword.selectTitle` — modal title for the selection step.
   - `resetPassword.selectDescription` — short explainer above the checkboxes.
   - `resetPassword.continue` — the selection step's primary action label.
   - `resetPassword.confirmTitle` / `resetPassword.confirmMessage` — irreversibility
     confirmation copy (states the action is immediate and cannot be undone).
   - `resetPassword.resultsTitle` — results step title.
   - `resetPassword.resultsResetHeading` / `resetPassword.resultsResetEmpty` — reset
     section heading and empty state.
   - `resetPassword.resultsSkippedHeading` / `resetPassword.resultsSkippedEmpty` — skipped
     section heading and empty state.
   - `resetPassword.resultsSkippedCount` — interpolated count-by-type line, e.g.
     `"{{count}} node(s) skipped"`. `{{token}}` interpolation is an existing convention in
     this file (see `notifications.*.successAll` / `.partial`) — use it as-is.
   - `resetPassword.close` — closes the results dialog.
   - `error.resetPasswordFailed` — fallback toast message when the backend error has no
     translatable key.
2. Confirm both files stay valid JSON and the key sets match 1:1 between `es.json` and
   `en.json` (same keys, translated values) — `pnpm lint` catches unused/malformed JSON but
   not a missing translation, so diff the two blocks by eye.
3. `pnpm lint` → expect clean.

**Commit**: `feat(charts): add reset-password i18n copy`

> Placed the `resetPassword` block between `delete` and `export` (grouped with the other
> irreversible-action copy). No `entityTypes.*` labels were added — those come from the
> backend's `useTypesByGroupCode(ENTITY_TYPE_GROUP_CODE)` lookup already used by
> `ChartNodeDialog`, so hardcoding a second set of names here would drift from it. Both
> locale files validated as JSON with `node -e "JSON.parse(...)"`, and `pnpm lint` (exit 0)
> confirms no unused-key or malformed-JSON issues across the whole of Milestone 1.

---

## Milestone 2 — `ChartResetPasswordDialog` component

### Task 2.1 — Build the selection and confirm steps ✅ DONE (2026-08-25)

- [x] Task complete

**Files**

- `src/modules/charts/components/ChartResetPasswordDialog.tsx` (create)

**Steps**

1. Create the component per `design.md` § Approach (AC-2, AC-6): `open`/`onClose` props,
   internal `step: 'select' | 'confirm' | 'results'` state, `selectedCodes: Set<string>`.
2. Fetch `useTypesByGroupCode(ENTITY_TYPE_GROUP_CODE, { enabled: open })`; build the
   checkbox option list by filtering the result to codes present in
   `RESET_PASSWORD_ENTITY_TYPE_CODES`, ordered by that constant (not by whatever order the
   backend returns).
3. Render the `'select'` step: `Checkbox` per entity type (from `@/shared`) with its
   localized label, a warning `Alert` explaining the action is irreversible, and a
   "Continue" `Button` disabled while `selectedCodes.size === 0`.
4. Render the `'confirm'` step using the existing `ConfirmDialog` primitive, message naming
   the selected entity types by their localized labels.
5. Wire `Dialog`'s `onOpenChange` / the parent's `onClose` to reset `step` and
   `selectedCodes` when the dialog closes (reuse the `syncKey` pattern from
   `ChartNodeDialog.tsx` if it's the cleanest fit here too).
6. `npx tsc --noEmit` → expect clean.
7. `pnpm lint` → expect clean.
8. Manual verification (no page wiring yet, so verify via a temporary render in isolation
   or defer full manual verification to Task 3.2 — note in the commit/task retro which you
   did).

**Commit**: `feat(charts): add reset-password selection and confirm steps`

> Implemented together with Task 2.2 in one pass, since `'select'`/`'confirm'`/`'results'`
> are one small step-machine in the same new file and splitting them into two edits added
> no real checkpoint value. Deferred full manual verification to Task 3.2 (needs the
> toolbar wired and a real backend). The select-step warning `Alert` reuses
> `resetPassword.selectDescription` directly (now phrased to state irreversibility) instead
> of adding a second, near-duplicate copy key — one fewer string to keep in sync across
> `es.json`/`en.json`.

### Task 2.2 — Wire the mutation and build the results step ✅ DONE (2026-08-25)

- [x] Task complete

**Files**

- `src/modules/charts/components/ChartResetPasswordDialog.tsx` (modify)
- `src/modules/charts/components/index.ts` (modify)

**Steps**

1. On confirm, call `useResetChartPasswords().mutateAsync({ entityTypeCodes: [...selectedCodes] })`.
2. On success, transition to `'results'` and render: the `reset` list (name + chart-node
   count per user, including the empty state) and the `skipped` list grouped by
   `entityTypeCode` using the same label map from Task 2.1's type-options fetch (including
   the empty state) — per `design.md` § AC-4.
3. On error, use `useApiErrorToast()` (not `getApiErrorReasons` — see `design.md` § AC-5
   for why that pattern doesn't apply here), return to the `'select'` step with the prior
   selection intact, and show the translated toast via a callback prop the parent
   (`OrganizationChartMaintenance.tsx`) supplies — matching how the page already owns toast
   state (`toast`/`showToast`/`clearToast`) for the export-failure case.
4. Export `ChartResetPasswordDialog` from `components/index.ts`.
5. `npx tsc --noEmit` → expect clean.
6. `pnpm lint` → expect clean.

**Commit**: `feat(charts): wire reset-password mutation and results step`

> Error handling uses `getErrorMessage(error, fallbackKey)` (returns the backend's raw
> i18n key, e.g. `error.validation` or its 403 key, since `ApiError.message` already holds
> it) rather than `getApiErrorReasons`, exactly as `design.md` § AC-5 specifies — the parent
> page's `showToast` translates it. Skipped nodes are grouped by `entityTypeCode` with
> counts (not one row per raw `chartId`/`staffId`), per `design.md` § AC-4.
> `pnpm exec tsc --noEmit` and `pnpm lint` both clean.

---

## Milestone 3 — Toolbar wiring and manual verification

### Task 3.1 — Add the toolbar button and mount the dialog ✅ DONE (2026-08-25)

- [x] Task complete

**Files**

- `src/modules/charts/components/OrganizationChartMaintenance.tsx` (modify)

**Steps**

1. Add `resetPasswordOpen` state and a `Button variant="surface" size="sm"` with `KeyIcon`
   (`@heroicons/react/24/outline`) to the toolbar button row, disabled under the same
   `!chartReady` condition as the neighboring buttons, per `design.md` § AC-1.
2. Render `<ChartResetPasswordDialog open={resetPasswordOpen} onClose={...} onError={showToast} />`
   (exact prop names per whatever Task 2.2 actually settled on) alongside the existing
   `ChartNodeDialog`/`ConfirmDialog`/blocked-reasons `Dialog`.
3. `npx tsc --noEmit` → expect clean.
4. `pnpm lint` → expect clean.

**Commit**: `feat(charts): add reset-password button to chart maintenance toolbar`

> Wired `onError={(message) => showToast(message, 'error')}` — the page already owned
> `toast`/`showToast`/`clearToast` for the export-failure path, so the reset-password error
> path reuses the same state rather than adding a second toast. Clean on the first pass.

### Task 3.2 — Manual verification against a real backend ⏳ BLOCKED (2026-08-25)

- [ ] Task complete

**Files**

- `openspec/changes/chart-maintenance-password-reset/runbook.md` (already created at
  design time)

**Steps**

1. Run `pnpm dev` against a backend running the `develop` branch (where the endpoint
   currently lives — see `design.md` § Dependency verification).
2. Execute every step in `runbook.md` and record the outcome (pass/fail, and what was
   actually observed — not just "done") next to each step.
3. Re-run `npx tsc --noEmit` and `pnpm lint` one final time on the whole diff.

**Commit**: none — this task's output is the completed `runbook.md`, folded into whichever
commit `/abet-implement`'s final grouping proposes, or left uncommitted for
`/abet-audit-pr` to review alongside the diff.

> **Not completed — no backend reachable in this environment.** `curl` against
> `http://localhost:7777` (the `API_PROXY_URL` this repo's `pnpm dev` proxies to) refused
> the connection; there is no running instance of `BACK-ACREDITACION-3.0` here, on any
> branch, and this session cannot start one (separate repo, not checked out). What _was_
> verified instead, as the strongest available substitute:
>
> - `pnpm exec tsc --noEmit` — clean after every task in this change.
> - `pnpm lint` — clean (exit 0) after every task.
> - `pnpm build` (full production build, all routes including `/loads`) — compiled and
>   typechecked successfully, all pages generated with no errors.
>
> This does **not** satisfy `docs/POLICIES.md#verification-gate`, which requires the actual
> manual verification step to have been performed, not just typecheck/lint/build. AC-1
> through AC-7 in `proposal.md` remain **unverified against a real backend** — the 10 steps
> in `runbook.md` are all still open. Whoever picks this up next (or the same session, once
> a backend is available) must run `pnpm dev` against the `develop`-branch backend and work
> through `runbook.md` before this task — and this change — can be marked complete.

---
