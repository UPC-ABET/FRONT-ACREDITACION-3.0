# Design — Chart maintenance password reset

**Slug**: `chart-maintenance-password-reset`
**Proposal**: `./proposal.md`

## Read first

- `docs/POLICIES.md` § Verification Gate (no test runner — tsc + lint + described manual
  verification), § Data Fetching (TanStack Query, API client, error handling), §
  Components (Dialog/Card/Button conventions), § i18n.
- `docs/CONTEXT.md` § Related Repositories (fetch `openapi.json` remotely, never from a
  local checkout) and § Global Academic Context (`X-School-Id`/`X-Academic-Period-Id` are
  auto-attached by `apiClient`).
- `openspec/specs/` — empty (no prior art; this is the first archived change in this repo).
- `src/modules/charts/components/OrganizationChartMaintenance.tsx` — the toolbar and modal
  wiring this change extends.
- `src/modules/charts/components/ChartNodeMenu.tsx` — precedent for gating menu items by
  `isReadOnlyEntityType()`.
- `src/modules/charts/components/ChartNodeDialog.tsx` — precedent for a chart-scoped modal:
  `useTypesByGroupCode(ENTITY_TYPE_GROUP_CODE)` for backend-owned entity-type labels,
  `getApiErrorReasons` + `tryTranslate` for surfacing backend error detail, `syncKey`
  pattern for resetting local state when a dialog reopens.
- `src/modules/charts/services/chartsService.ts`, `hooks/useCharts.ts`,
  `hooks/queryKeys.ts`, `types/index.ts`, `constants/index.ts` — the files this change
  extends.
- `src/shared/lib/apiClient.ts` — confirms `X-School-Id`/`X-Academic-Period-Id` headers are
  attached automatically from `useABET()` scope; no manual header handling needed.
- `src/shared/components/ui/FeedbackDialog.tsx` (`ConfirmDialog`) and
  `src/shared/components/ui/Checkbox.tsx` — primitives reused, not rebuilt.
- Backend `openapi.json`, fetched remotely and verified against this design (see
  Dependencies below) — confirms `ResetMaintenancePasswordsDto` /
  `ResetMaintenancePasswordsResponseDto` / `ResetMaintenancePasswordsResetUserDto` /
  `ResetMaintenancePasswordsSkippedNodeDto` match the proposal exactly.

## Dependency verification (done at design time; re-verified during the audit pass)

Fetched remotely, not from a local checkout, per `docs/CONTEXT.md#related-repositories`:

- **At design time (2026-08-25)** — `staging`:
  `gh api repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=staging` —
  `POST /charts/maintenance/reset-password` **did not exist yet**. Only the unrelated
  self-service `/users/reset-password` and `/users/request-password-reset` were present.
  `develop`: same call with `ref=develop` — the endpoint **was present**, and its schema
  matched the proposal's contract exactly (`entityTypeCodes: string[]` required on the
  request DTO; `reset`/`skipped` both required arrays on the response DTO; field names and
  types matching `ResetMaintenancePasswordsResetUserDto` /
  `ResetMaintenancePasswordsSkippedNodeDto` verbatim). The endpoint does not declare a `403`
  response in the OpenAPI doc (guards produce it globally, undocumented per-route — this
  matches every other guarded endpoint in the spec) and declares only `400`/`500` besides
  `201`.
- **Re-verified same day, during `/abet-audit-pr`** — `staging` and `develop` are now at
  the **same commit**, `647f6ea02a2df74d741f9b7412511ff37ff59f06`
  (`gh api repos/UPC-ABET/BACK-ACREDITACION-3.0/git/refs/heads/staging` /
  `.../heads/develop`): the backend has been promoted, and `POST
/charts/maintenance/reset-password` is now present on `staging` with the identical
  schema. **Spec SHA this change is verified against: `647f6ea02a2df74d741f9b7412511ff37ff59f06`**
  — carry this into the PR body per the frontend stack rules' contract-currency guidance.

**Consequence**: per `plugins/abet-common/reference/conventions.md` § Sequencing, the
sequencing prerequisite for merging this PR (backend promoted `develop → staging`) **is now
satisfied**. Re-run the check in `runbook.md`'s "Deploy prerequisite" section immediately
before opening the PR regardless — a promotion state can change between now and then, and
that section also documents a grep-anchoring bug found and fixed during the audit pass (see
Risks).

## ADR gate (walked, not skipped)

| Trigger                                       | Hit?                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| Datastore, broker or cache choice             | No                                                          |
| Auth or payments provider                     | No                                                          |
| Public API contract change or breaking change | No — new, additive endpoint; nothing existing changes shape |
| New module boundary or cross-repo split       | No — stays inside the existing `charts` module              |
| Language, runtime or framework                | No                                                          |
| Contradicting an existing ADR                 | No — `docs/adr/` has no numbered ADRs yet                   |

**Conclusion**: no ADR required.

## Approach

### AC-1 — Toolbar button, same style/gating as siblings

`OrganizationChartMaintenance.tsx` gets one more `Button variant="surface" size="sm"`
appended to the existing toolbar button row (after the export buttons), disabled under the
same `!chartReady` condition as expand/collapse/export. Icon: `KeyIcon` from
`@heroicons/react/24/outline` (already the icon set used by every other toolbar button).
New local state: `const [resetPasswordOpen, setResetPasswordOpen] = useState(false)`.

### AC-2 — Entity-type multi-select modal

New component `src/modules/charts/components/ChartResetPasswordDialog.tsx`. It fetches
`useTypesByGroupCode(ENTITY_TYPE_GROUP_CODE, { enabled: open })` — the same backend-owned
lookup `ChartNodeDialog` already uses — but, unlike `ChartNodeDialog`, does **not** filter
out `READ_ONLY_ENTITY_TYPE_CODES`: DEAN/SCHOOL/PROGRAM must be selectable here even though
they're read-only for create/edit. The options list is built by taking the fetched types
and keeping only those whose `code` is in a new ordered constant (see Frontend § Constants)
— this both fixes checkbox order (DEAN, SCHOOL, PROGRAM, AREA, SUBAREA, COURSE, matching
the proposal and `TYPE_CODES.CHART_ENTITY_TYPE` declaration order) and defensively excludes
any future `TG903` type the backend seeds before the frontend constant is updated for it,
rather than silently rendering an unlabeled or mistranslated checkbox.

Local state: `selectedCodes: Set<string>`. The "Continue" action is disabled while
`selectedCodes.size === 0`.

### AC-3 — Request shape

`chartsService.resetPasswords({ entityTypeCodes })` → `POST /charts/maintenance/reset-password`
via `apiPost`, which already threads through `apiClient.buildHeaders()` —
`X-School-Id`/`X-Academic-Period-Id` need no special handling, exactly like `create`/
`update`/`remove`/`tree` today.

### AC-4 — Results summary dialog, including the empty case

On `201`, the dialog moves to a `'results'` internal step and renders the response with no
extra request:

- **Reset** — one row per `ResetMaintenancePasswordsResetUserDto`: `{firstName}
{lastName}` plus a count badge for `chartIds.length`.
- **Skipped** — grouped by `entityTypeCode` (not one row per node — raw `staffId`/`chartId`
  are internal ids with no name attached, so a per-node list would show meaningless numbers
  to the admin). Grouping needs the same entity-type label lookup already fetched for the
  checkboxes, so the label map is built once and reused for both steps.
- Both sections render their own empty state (`0 reset`, `0 skipped`) — this is success,
  not an error path, so no `Alert variant="destructive"` here, just the shared
  `TableEmptyState`-style copy already used elsewhere on this page for "nothing configured"
  states.

The mutation used for the results is a plain `useMutation` with **no query invalidation**:
this call never changes the tree's shape, staff assignments, or any field the tree query
returns, so invalidating `chartsQueryKeys.treeAll()` would only cause a pointless refetch.

### AC-5 — 400/403 handled as a toast, no results dialog

`ChartResetPasswordDialog` computes the error message via `getErrorMessage()` and forwards
it to the parent through the `onError` callback prop, rather than instantiating its own
`useApiErrorToast()` — the parent (`OrganizationChartMaintenance.tsx`) already owns one
instance for the export-failure path, and reuses it here too (`onError={(message) =>
showToast(message, 'error')}`). This is deliberately not the `getApiErrorReasons`
list-of-blockers pattern from delete — the backend's `400`/`403` for this endpoint carry a
plain `message` i18n key, not the `data: string[]` blocker array that `getApiErrorReasons`
extracts (that shape is specific to delete's dependency-blocker response). On error, the
`'confirm'` step is skipped — the dialog returns to `'select'` with the prior selection
intact, so the admin can retry without re-checking boxes, and the parent's `showToast`
fires with the translated message.

### AC-6 — Irreversibility confirmation step

Internal step machine in `ChartResetPasswordDialog`: `'select' → 'confirm' → 'results'`.
`'confirm'` reuses the existing `ConfirmDialog` primitive (`@/shared`) — the same one the
page already uses for node delete — with a message naming the selected entity types and
stating the reset is immediate and cannot be undone. This mirrors the delete flow's
"remove the node and all its descendants — continue?" precedent instead of introducing a
new confirmation pattern.

### AC-7 — i18n coverage

All new copy lives under the existing `loads.organizationChartMaintenance` namespace in
both `es.json` and `en.json`, alongside the existing `toolbar`/`actions`/`form`/`toast`
keys — no new top-level namespace.

## Frontend

- **Component**: `src/modules/charts/components/ChartResetPasswordDialog.tsx` (new) —
  owns the `'select' | 'confirm' | 'results'` step state, the `Set<string>` selection, the
  mutation call, and error handling. Exported from `components/index.ts`.
- **`OrganizationChartMaintenance.tsx`** (modify) — one new toolbar `Button`, one new
  `resetPasswordOpen` boolean, renders `<ChartResetPasswordDialog open={...} onClose={...} />`
  alongside the existing `ChartNodeDialog`/`ConfirmDialog`/blocked-reasons `Dialog`.
- **Types** (`types/index.ts`, modify) — add:
  ```ts
  export type ChartResetPasswordPayload = { entityTypeCodes: string[] };
  export type ChartResetPasswordResetUser = {
  	userId: number;
  	firstName: string;
  	lastName: string;
  	chartIds: number[];
  };
  export type ChartResetPasswordSkippedNode = {
  	chartId: number;
  	staffId: number;
  	entityTypeCode: string;
  };
  export type ChartResetPasswordResult = {
  	reset: ChartResetPasswordResetUser[];
  	skipped: ChartResetPasswordSkippedNode[];
  };
  ```
- **Service** (`services/chartsService.ts`, modify) — add
  `resetPasswords(payload: ChartResetPasswordPayload): Promise<ChartResetPasswordResult>`
  as `apiPost(`${BASE}/reset-password`, payload)`, following the exact shape of the
  existing `create`/`update` methods.
- **Hook** (`hooks/useCharts.ts`, modify) — add `useResetChartPasswords()`, a bare
  `useMutation` wrapping `chartsService.resetPasswords` with **no** `onSuccess`
  invalidation (see AC-4 rationale). Not added to `useChartMutations()`'s returned object,
  since it is conceptually unrelated to the create/update/remove trio and is only consumed
  by one component.
- **Constants** (`constants/index.ts`, modify) — add:
  ```ts
  export const RESET_PASSWORD_ENTITY_TYPE_CODES: readonly string[] = [
  	ENTITY_TYPE.DEAN,
  	ENTITY_TYPE.SCHOOL,
  	ENTITY_TYPE.PROGRAM,
  	ENTITY_TYPE.AREA,
  	ENTITY_TYPE.SUBAREA,
  	ENTITY_TYPE.COURSE,
  ];
  ```
  Deliberately separate from `READ_ONLY_ENTITY_TYPE_CODES`/`ENTITY_TYPE_CODES_NEEDING_CODE`
  — this list is "all six, in display order," not a filter.
- **Data / query keys**: no new query key needed. The type-options fetch reuses
  `useTypesByGroupCode(ENTITY_TYPE_GROUP_CODE)`, which already exists and is
  `staleTime: Infinity` (static lookup) per `docs/POLICIES.md#tanstack-query`. The reset
  mutation itself is not cached and has no key.
- **i18n**: new keys added under `loads.organizationChartMaintenance` in both locale files
  — `toolbar.resetPassword`, a `resetPassword.*` block (modal title, checkbox group label,
  confirm message, results section headers/empty states, error fallback). Exact key list
  finalized in `tasks.md` Milestone 1.

## Testing strategy

No test runner exists in this repo (`docs/POLICIES.md#verification-gate`) — every row
below is manual, described in `runbook.md`, plus `tsc`/`lint` as the automated floor.

| AC  | Covered by                                                                                                          | Kind      |
| --- | ------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `runbook.md` step 1                                                                                                 | manual    |
| 2   | `runbook.md` step 2                                                                                                 | manual    |
| 3   | `runbook.md` step 3 (network tab inspection of the request)                                                         | manual    |
| 4   | `runbook.md` steps 4 (non-empty) and 5 (all-empty)                                                                  | manual    |
| 5   | `runbook.md` steps 6 (AC-5a, verified by code inspection) and 7 (AC-5b, once a non-ADMIN test account is available) | manual    |
| 6   | `runbook.md` step 8                                                                                                 | manual    |
| 7   | `runbook.md` step 9 (toggle `appLocale` cookie, repeat steps 1–2 and 4–5 in English)                                | manual    |
| all | `npx tsc --noEmit`, `pnpm lint`                                                                                     | automated |

## Risks

| Risk                                                                                                                                                                                                                                                                  | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend endpoint was on `develop`, not `staging`, as of design time                                                                                                                                                                                                   | **Resolved as of the audit pass** — the backend has been promoted; `staging` now serves the endpoint at the same commit as `develop` (`647f6ea0...`). Re-verify with the corrected `runbook.md` check immediately before opening the PR regardless, since promotion state can change.                                                                                                                                                                                                                                                                                                                                                                               |
| A user without ADMIN permission clicks the always-visible button and gets a 403 (accepted in `proposal.md`)                                                                                                                                                           | `useApiErrorToast` surfaces the backend's message as a translated toast; no silent failure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Skipped-node grouping by `entityTypeCode` could show a raw code if the type lookup hasn't loaded yet, or the select step could look broken (empty, no feedback) on a cold type-lookup cache                                                                           | **Corrected during the audit pass** — this design originally (incorrectly) claimed the dialog doesn't open until `useTypesByGroupCode` resolves; the actual code opens immediately. Fixed properly instead of just correcting the claim: the select step now shows a `LoadingState` spinner while fetching and an inline error `Alert` on failure, and "Continue" stays disabled through both states (`disabled={selectedCodes.size === 0 \|\| typesLoading \|\| typesError}`) — so the `'confirm'`/`'results'` steps are only reachable once `typeOptions` is populated, and the label map used for skipped-node grouping is guaranteed non-empty by construction. |
| Manual QA needs a non-ADMIN test account to exercise AC-5's 403 path                                                                                                                                                                                                  | Flagged in `runbook.md`; if no such account exists yet, the 403 path is verified by code review of the error-handling branch instead, and the gap is noted in the PR description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Dismissing the `'confirm'` step (Cancel/Escape/backdrop) while the reset request was in flight bypassed the `isPending` guard the buttons respected, allowing a user who believed the action was canceled to resubmit and fire two real, irreversible password resets | **Fixed during the audit pass** — `handleCancelConfirm` (used by both `ConfirmDialog`'s `onClose` and `onDecline`) and `handleConfirm` itself now both guard on `resetPasswords.isPending`, matching the guard the primary dialog's `handleClose` already had.                                                                                                                                                                                                                                                                                                                                                                                                      |

## Audit-pass corrections (2026-08-25)

`/abet-audit-pr` ran six parallel auditors over the implemented diff; see `tasks.md` §
Audit fixes for the full findings table. Recorded here, append-only, rather than rewriting
the Approach section above (which still accurately describes the original design intent):

- **`ChartResetPasswordDialog.tsx`** now guards both `handleConfirm` and the `'confirm'`
  step's dismissal (`handleCancelConfirm`, used by `ConfirmDialog`'s `onClose`/`onDecline`)
  against `resetPasswords.isPending` — closing the confirm dialog mid-request could
  previously bypass the guard the buttons already respected (see Risks).
- The select step now surfaces `useTypesByGroupCode`'s loading and error states
  (`LoadingState` spinner / inline `Alert`) instead of silently rendering an empty
  checkbox list.
- The duplicated reset/skipped result-list JSX was factored into a local `ResultList`
  helper component within the same file.
- The `open && step !== 'confirm'` / `open && step === 'confirm'` pair of independently-
  negated conditions was replaced with one derived `isConfirmStep` boolean.
- The render-time "sync state when a key changes" idiom (previously duplicated between
  this component and `ChartNodeDialog.tsx`'s `syncKey` pattern) was extracted into
  `src/shared/hooks/useSyncOnChange.ts`, and both dialogs now use it.
- `useResetChartPasswords` (`hooks/useCharts.ts`) now filters `entityTypeCodes` against
  `RESET_PASSWORD_ENTITY_TYPE_CODES` before calling the service, as defense-in-depth on
  top of the dialog's existing whitelist-constrained checkbox construction.

## Docs to update in this PR

- [ ] None required. `docs/CONTEXT.md`'s Domain Vocabulary and Business Rules sections
      don't currently describe chart-maintenance actions in enough detail that this addition
      would contradict or need to extend them, and this change introduces no new module,
      import-direction exception, or architectural pattern.
