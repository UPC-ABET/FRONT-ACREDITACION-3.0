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
- Before opening the PR: re-verify the backend endpoint is still on `staging` (see
  `runbook.md`) — it was only on `develop` at design time, and was confirmed promoted
  during the `/abet-audit-pr` pass on 2026-08-25. Re-check anyway; promotion state can
  change.

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
   - `resetPassword.resultsResetCount` — interpolated per-user chart-node count line, e.g.
     `"{{count}} chart node(s)"` (omitted from this list originally — added retroactively
     per `/abet-audit-pr` finding; the key itself was present in both locale files and used
     by the component from the start, this was a documentation-completeness gap only).
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

> **Still not completed — no backend reachable in this environment.** `curl` against
> `http://localhost:7777` (the `API_PROXY_URL` this repo's `pnpm dev` proxies to) refused
> the connection; there is no running instance of `BACK-ACREDITACION-3.0` here, on any
> branch, and this session cannot start one (separate repo, not checked out). Re-checked
> again during the `/abet-audit-pr` fix pass (2026-08-25) — still refused. What _was_
> verified instead, as the strongest available substitute:
>
> - `pnpm exec tsc --noEmit` — clean after every task in this change, and again after every
>   audit fix.
> - `pnpm lint` — clean (exit 0) after every task, and again after every audit fix.
> - `pnpm build` (full production build, all routes including `/loads`) — compiled and
>   typechecked successfully, all pages generated with no errors.
> - **Runbook steps 6 and part of 8 have since been verified by code inspection** (see
>   `runbook.md` — no backend needed for these two, and the audit's testing auditor
>   independently confirmed the same by reading the code): the empty-selection guard is a
>   real, enforced `disabled` attribute, and `resetPasswords.mutateAsync` has no code path
>   that fires before the confirm step. This narrows what's still genuinely blocked to
>   steps 1, 2 (dynamic render), 3, 4a, 4b, 5a-live, 5b, 7 (i18n), 9 (renumbered from the
>   original 10 after the audit-fix pass added sub-steps), and the new
>   confirm-dismiss-during-pending check added to step 8.
>
> **The `staging` promotion blocker is resolved** — re-verified same day: `staging` and
> `develop` are now at the same commit (`647f6ea0...`), so the sequencing prerequisite for
> merging is satisfied. This does not change the fact that runtime correctness is still
> **typechecked, not verified** — `docs/POLICIES.md#verification-gate` still requires the
> actual manual steps to have been performed. Whoever picks this up next (or the same
> session, once a backend is reachable) must run `pnpm dev` against a backend on `staging`
> (or `develop`) and work through the remaining `runbook.md` steps before this task — and
> this change — can be marked complete.

---

## Audit fixes (/abet-audit-pr)

Six parallel auditors (code quality, architecture/docs/contract, testing, antipatterns,
security, runtime robustness) reviewed the diff on 2026-08-25. Verdict was **NOT READY**
(3 blockers, 1 major). All code-fixable findings below were implemented in this same
session immediately after the audit; the two findings that are not code-fixable (no
reachable backend; external backend-promotion status) are called out as still-open where
relevant elsewhere in this file.

### Task A.1 — Fix the runbook's false-positive staging-check command ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Blocker (Auditor B). `grep -q 'reset-password'` (unanchored) matches the
unrelated, pre-existing `/users/reset-password` endpoint, so the runbook's own merge-gate
command would report `PRESENT` even on a `staging` spec that doesn't have the chart
endpoint — which is exactly what it did when re-run during the audit, on a `staging` spec
that (at that moment) genuinely didn't have it yet.

**Files**

- `openspec/changes/chart-maintenance-password-reset/runbook.md` (modify)

**Fix**: Anchored the grep to the exact quoted path,
`grep -q '"/charts/maintenance/reset-password"'`. Re-ran the corrected command against the
current `staging` spec — reports `PRESENT`, and independently confirmed via `node`/`jq`
against the same fetched spec.

### Task A.2 — Record current staging-promotion status and spec SHA ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Blocker (Auditor B, at the time of the audit) — re-verified as part of this
fix pass and found to have changed: the backend has since been promoted to `staging`.
Also folds in the suggestion (Auditor B) to record a spec SHA per the frontend stack
rules' contract-currency guidance.

**Files**

- `openspec/changes/chart-maintenance-password-reset/design.md` (modify)
- `openspec/changes/chart-maintenance-password-reset/runbook.md` (modify)
- `openspec/changes/chart-maintenance-password-reset/tasks.md` (modify, this file)

**Fix**: Updated `design.md`'s Dependency verification section and Risks table to record
the re-check (`staging` and `develop` both at commit `647f6ea02a2df74d741f9b7412511ff37ff59f06`,
schema identical, no drift), and updated `runbook.md`'s deploy-prerequisite section
accordingly. This is a documentation update, not a code change — the underlying
sequencing prerequisite for merging is now satisfied, but it must still be re-checked
immediately before the PR is actually opened.

### Task A.3 — Guard the confirm step against dismissal mid-request ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Major (found independently by Auditor A as a stale-async-continuation issue,
Auditor F as an Escape/backdrop-dismiss bypass, and Auditor E as a related double-submit
race — synthesized as one finding at the strongest severity). `ConfirmDialog`'s
`onClose`/`onDecline` reset `step` back to `'select'` unconditionally, bypassing the
`resetPasswords.isPending` guard the buttons already respected via `isLoading`. A user
could dismiss the confirm dialog (Escape, backdrop click, or Cancel) while the
irreversible `POST /charts/maintenance/reset-password` call was still in flight, believe
it was canceled, and resubmit — resulting in two real password resets for one apparent
action.

**Files**

- `src/modules/charts/components/ChartResetPasswordDialog.tsx` (modify)

**Steps**

1. Add `handleCancelConfirm`, guarded on `resetPasswords.isPending`, and wire it as both
   `ConfirmDialog`'s `onClose` and `onDecline` (previously two separate unguarded inline
   closures).
2. Add the same guard as the first line of `handleConfirm` itself, as defense-in-depth
   against a double-click race the button's `disabled` state might not catch in the same
   frame.
3. `pnpm exec tsc --noEmit` → clean.
4. `pnpm lint` → clean.

**Commit**: `fix(charts): guard reset-password confirm step against mid-request dismissal`

> Verified by reading the resulting control flow: `resetPasswords.mutateAsync` is only
> reachable via `handleConfirm`, which now returns immediately if already pending, and the
> only two ways to leave the `'confirm'` step (`onClose`/`onDecline`) route through the
> same guard `handleClose` already used for the primary dialog. No live-backend
> verification possible in this environment; added as an explicit new runbook step for
> whoever next has a reachable backend (see `runbook.md` step 8's new bullet).

### Task A.4 — Surface loading/error state for the entity-type lookup ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Minor (Auditor A: error state not surfaced; Auditor C: `design.md`'s claim
that the dialog "only opens once types have resolved" doesn't match the actual code,
which opens immediately and shows an empty checkbox list during the fetch). Merged into
one fix since both point at the same gap.

**Files**

- `src/modules/charts/components/ChartResetPasswordDialog.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)
- `openspec/changes/chart-maintenance-password-reset/design.md` (modify — corrected the
  inaccurate risk-table claim instead of leaving it to describe behavior that never
  existed)

**Steps**

1. Destructure `isError` from `useTypesByGroupCode` alongside `data`/`isLoading`.
2. Render `LoadingState` (`@/shared`) while `typesLoading`, an inline `Alert
variant="destructive"` on `typesError`, and the checkbox list otherwise.
3. Add `resetPassword.loadTypesFailed` to both locale files.
4. Extend the "Continue" button's `disabled` condition to also cover `typesError`.
5. `pnpm exec tsc --noEmit` → clean.
6. `pnpm lint` → clean.

**Commit**: `fix(charts): surface loading and error states for reset-password entity types`

### Task A.5 — Deduplicate result-list rendering and the confirm-step boolean ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Two minors (Auditor D) — the reset/skipped result sections were two
near-identical ~25-line blocks, and the main `Dialog`'s `open`/`ConfirmDialog`'s `isOpen`
conditions were independently-written negations of the same `step` value with no
guarantee they'd stay complementary.

**Files**

- `src/modules/charts/components/ChartResetPasswordDialog.tsx` (modify)

**Steps**

1. Extract a local `ResultList` component (`heading`, `emptyText`, `rows`, `badgeVariant`
   props) and use it for both the reset and skipped sections.
2. Derive `const isConfirmStep = step === 'confirm';` once; use it for both the primary
   `Dialog`'s `open` and `ConfirmDialog`'s `isOpen`.
3. `pnpm exec tsc --noEmit` → clean.
4. `pnpm lint` → clean.

**Commit**: `refactor(charts): deduplicate reset-password result rendering`

### Task A.6 — Extract the render-time sync-on-change idiom into a shared hook ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Suggestion (Auditor D) — the "adjust state during render when a key changes"
idiom (used to reset dialog state when it reopens) was hand-rolled independently in this
new component and in the pre-existing `ChartNodeDialog.tsx`'s `syncKey` pattern, with two
different shapes for the same trick.

**Files**

- `src/shared/hooks/useSyncOnChange.ts` (create)
- `src/shared/hooks/index.ts` (modify)
- `src/modules/charts/components/ChartResetPasswordDialog.tsx` (modify)
- `src/modules/charts/components/ChartNodeDialog.tsx` (modify)

**Steps**

1. Extract `useSyncOnChange<T>(key: T, initial: T, onChange: (key: T) => void): void` —
   generic over the comparison key, preserving the exact "compare during render, update
   state and fire the callback on mismatch" behavior both existing call sites relied on.
2. Export from the `shared/hooks` barrel.
3. Update `ChartResetPasswordDialog.tsx` to call it with `(open, false, ...)`.
4. Update `ChartNodeDialog.tsx` to call it with `(syncKey, '', ...)`, preserving its exact
   existing reset logic.
5. `pnpm exec tsc --noEmit` → clean.
6. `pnpm lint` → clean.

**Commit**: `refactor(shared): extract render-time sync-on-change hook`

> Touches `ChartNodeDialog.tsx`, a file otherwise outside this change's diff — justified
> because the finding specifically compared the new component's pattern against that
> file's precedent, and deduplicating only one side wouldn't have resolved it. Behavior
> verified unchanged by inspection: the hook's `key !== syncedKey` / `setSyncedKey(key)` /
> callback-fire sequence is identical to what both components did inline before.

### Task A.7 — Whitelist `entityTypeCodes` defense-in-depth at the hook layer ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Suggestion (Auditor E) — `chartsService.resetPasswords` forwarded
`entityTypeCodes` with no constraint of its own; only the dialog's checkbox construction
kept it whitelist-safe. Not exploitable today (single, constrained caller), but cheap
insurance against a future second caller.

**Files**

- `src/modules/charts/hooks/useCharts.ts` (modify)

**Steps**

1. In `useResetChartPasswords`'s `mutationFn`, filter `payload.entityTypeCodes` against
   `RESET_PASSWORD_ENTITY_TYPE_CODES` before calling `chartsService.resetPasswords`.
2. `pnpm exec tsc --noEmit` → clean.
3. `pnpm lint` → clean.

**Commit**: `fix(charts): whitelist entity type codes in reset-password mutation`

### Task A.8 — Add the missing AC-4 tree-invalidation assertion and record partially-verifiable runbook steps ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Two minors (Auditor C) — no runbook step explicitly asserted AC-4's "tree
left untouched" claim, and steps 6 and part of 8 were achievable by static code reading
without a backend but were recorded as fully blocked anyway.

**Files**

- `openspec/changes/chart-maintenance-password-reset/runbook.md` (modify)
- `openspec/changes/chart-maintenance-password-reset/tasks.md` (modify, this file — Task
  3.2's retro)

**Fix**: Added a network-tab sub-check to runbook steps 4a/4b for "no extra tree GET
fires," and a loading/error-state sub-check to step 2. Marked step 6 (empty-selection
guard) and half of step 8 (no request before confirm) as verified by static code
inspection directly in `runbook.md`, and updated Task 3.2's retro to reflect the narrowed
remaining scope.

### Task A.9 — Add missing `resultsResetCount` key to Task 1.3's record ✅ DONE (2026-08-25)

- [x] Task complete

**Finding**: Suggestion (Auditor C) — `resultsResetCount` was present in both locale
files and used by the component from the start, but Task 1.3's enumerated key list
omitted it, understating what that task actually recorded.

**Files**

- `openspec/changes/chart-maintenance-password-reset/tasks.md` (modify — Task 1.3)

**Fix**: Added the key to Task 1.3's list with a note explaining it was a
documentation-only gap, not a functional one.

---
