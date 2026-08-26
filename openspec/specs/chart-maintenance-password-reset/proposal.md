# Chart maintenance password reset

**Slug**: `chart-maintenance-password-reset`
**Branch**: `feat/chart-maintenance-password-reset`
**Repos affected**: frontend
**Created**: 2026-08-25

## Problem

Staff whose login is linked through the organization chart (Dean, School heads, Program
directors, Area/Subarea/Course owners) sometimes need their password reset, and today the
Organization chart maintenance screen has no way to do it. The backend now exposes
`POST /charts/maintenance/reset-password`, but nothing in the frontend calls it — an admin
has no in-product path to reset a chart-linked user's password by entity type.

## What already exists

- `src/modules/charts/components/OrganizationChartMaintenance.tsx` — the maintenance
  screen, rendered as an embedded widget inside `loads/components/UploadMaintenance.tsx`
  (not a standalone route). Its toolbar already has zoom, expand/collapse-all, and
  export-PNG/PDF buttons (`Button variant="surface" size="sm"`, disabled until
  `chartReady`).
- `src/modules/charts/components/ChartNodeMenu.tsx` — per-node context menu
  (edit/add-child/delete), gated by `isReadOnlyEntityType()` for DEAN/SCHOOL/PROGRAM.
- `src/modules/charts/services/chartsService.ts` — `tree()`, `create()`, `update()`,
  `remove()` against `/charts/maintenance/*`, all going through the shared `apiClient`.
  `X-School-Id` and `X-Academic-Period-Id` are already attached automatically by
  `apiClient.buildHeaders()` from `useABET()` scope (`setActiveSchoolId` /
  `setActiveAcademicPeriodId`) — no manual header handling needed for the new call either.
- `src/shared/constants/typeCodes.ts` — `TYPE_CODES.CHART_ENTITY_TYPE` already defines
  `DEAN: 'TG903-T001'` through `COURSE: 'TG903-T006'`, matching the backend's
  `entityTypeCodes` vocabulary exactly. No new code table needed.
- `src/modules/charts/hooks/useCharts.ts` — `useChartMutations()` wraps create/update/remove
  as `useMutation`, invalidating the tree query on success.
- Delete already has a precedent for a "not a plain success" result: `ConfirmDialog` before
  the call, then a "blocked reasons" `Dialog` (`blockedReasons` state) when the backend
  reports the node couldn't be deleted. The new reset flow reuses this shape (confirm, then
  a results dialog) rather than introducing a new UI pattern.
- **No client-side action-permission gating exists anywhere in the frontend today.**
  `useAuth().permissions` (`AuthPermission[]`, from `GET /users/me`) exposes `module` and
  `permissions: string[]` per entry, but only `.route` is ever read (`canAccessRoute` /
  `hasRouteAccess`, route-level only). Confirmed with the requester: the new button will
  **not** be client-side gated by the stricter ADMIN permission — it renders identically to
  the other toolbar buttons, and a 403 from the backend is surfaced as a translated error
  toast like any other `ApiError`. This keeps the change additive and avoids inventing an
  unverified permission-check pattern.

## Goals

- Add a "Reset password" button to the maintenance screen's toolbar, styled and gated the
  same way as the existing toolbar buttons (`disabled` until `chartReady`).
- Clicking it opens a modal to select one or more entity types via checkboxes: DEAN,
  SCHOOL, PROGRAM, AREA, SUBAREA, COURSE (labels from `TYPE_CODES.CHART_ENTITY_TYPE`,
  translated).
- Submitting requires an explicit confirmation step that states the action is immediate and
  irreversible (mirroring the existing delete `ConfirmDialog`), before calling
  `POST /charts/maintenance/reset-password` with `{ entityTypeCodes }`.
- On success (201), show a results summary dialog: users whose password was reset (name +
  count of chart nodes that resolved to them) and chart nodes that were skipped (no
  resettable login). A response with both arrays empty is treated as a normal, non-error
  outcome and still shows the summary (0 reset / 0 skipped).
- 400 (`error.validation`, empty selection) and 403 (insufficient permission) responses are
  surfaced as translated error toasts, consistent with how other mutations on this screen
  handle `ApiError`.
- All new user-facing strings added to both `es.json` and `en.json`.

## Non-goals

- No per-node selection for reset — scope is by entity type only, matching the backend
  contract (the backend resolves nodes from `entityTypeCodes` + the active school/period
  scope, not from chart node IDs the frontend picks).
- No client-side permission gating of the button based on the user's ADMIN permission
  (decided above — rely on the backend's 403).
- No undo, no password display anywhere in the UI — the backend response never contains a
  password, and there is no recovery path in-product (the existing self-service
  `POST /users/request-password-reset` flow is unaffected and out of scope here).
- No changes to `chartsService.tree/create/update/remove` or their ORGANIZATION-permission
  behavior.

## Acceptance criteria

1. **AC-1** — Given the maintenance screen with a loaded chart (`chartReady`), the toolbar
   shows a "Reset password" button in the same button group/style as
   expand/collapse/export, disabled under the same `!chartReady` condition.
2. **AC-2** — When the button is clicked, a modal opens listing all six entity types
   (DEAN, SCHOOL, PROGRAM, AREA, SUBAREA, COURSE) as independently selectable checkboxes,
   with the submit action disabled while zero are selected.
3. **AC-3** — When at least one entity type is selected and the admin confirms, the app
   calls `POST /charts/maintenance/reset-password` with `{ entityTypeCodes: [...] }` (only
   the selected codes) and `X-School-Id`/`X-Academic-Period-Id` present via the standard
   `apiClient` headers.
4. **AC-4** — Given a 201 response, a results dialog shows every entry in `data.reset`
   (name + number of chart nodes) and every entry in `data.skipped` (entity type label),
   including the all-empty case, and the underlying chart tree query is left untouched (no
   node data changes as a result of this call).
5. **AC-5** — Given a 400 (`error.validation`) or 403 response, the modal stays open (or
   reopens) and a translated error toast is shown; no results dialog appears.
6. **AC-6** — The confirmation step explicitly states the reset is immediate and cannot be
   undone, before the request fires.
7. **AC-7** — All new strings (button label, modal title/checkboxes, confirmation copy,
   results dialog copy, error copy) exist in both `src/language/locales/es.json` and
   `en.json` under the existing `loads.organizationChartMaintenance` namespace.

### Traceability

| AC  | Criterion                                                  | Satisfied by                                                                                                                                        |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Toolbar button, same style/gating as siblings              | `OrganizationChartMaintenance.tsx` toolbar button (Task 3.1)                                                                                        |
| 2   | Entity-type multi-select modal                             | `ChartResetPasswordDialog.tsx` `'select'` step (Task 2.1)                                                                                           |
| 3   | Request shape (`entityTypeCodes`, scope headers)           | `chartsService.resetPasswords` + `useResetChartPasswords` (Tasks 1.1–1.2), called from `ChartResetPasswordDialog.tsx`'s `'confirm'` step (Task 2.2) |
| 4   | Results summary dialog (reset + skipped, incl. empty case) | `ChartResetPasswordDialog.tsx` `'results'` step (Task 2.2)                                                                                          |
| 5   | 400/403 handled as toast, no results dialog                | `ChartResetPasswordDialog.tsx` error branch via `useApiErrorToast` (Task 2.2)                                                                       |
| 6   | Irreversibility confirmation step                          | `ChartResetPasswordDialog.tsx` `'confirm'` step, reusing `ConfirmDialog` (Task 2.1)                                                                 |
| 7   | i18n coverage (es + en)                                    | `src/language/locales/{es,en}.json` under `loads.organizationChartMaintenance` (Task 1.3)                                                           |

## Dependencies

- Backend endpoint `POST /charts/maintenance/reset-password` and its DTOs
  (`ResetMaintenancePasswordsDto`, `ResetMaintenancePasswordsResponseDto`,
  `ResetMaintenancePasswordsResetUserDto`, `ResetMaintenancePasswordsSkippedNodeDto`) must
  be present in the backend's committed `openapi.json` on the branch this ships against —
  fetch and verify remotely (`gh api repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json`)
  before implementation, per `docs/CONTEXT.md#related-repositories`. Sequential cross-repo
  model — no `contract.md` needed, backend ships first.

## Risks

| Risk                                                                                                                | Impact                                                   | Mitigation                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A user with ORGANIZATION-only permission sees and clicks the button, gets a 403                                     | Minor UX friction (button visible but fails)             | Accepted per requester decision; error toast makes the failure clear. Revisit with client-side gating if this proves confusing in practice.                            |
| `entityTypeCodes` vocabulary drifts from `TYPE_CODES.CHART_ENTITY_TYPE` if the backend adds a 7th entity type later | Modal silently omits a valid type, or sends a stale code | Modal derives its checkbox list from `TYPE_CODES.CHART_ENTITY_TYPE` (single source), so a future addition requires only a shared-constants update, not a modal rewrite |
| Reset is destroyed-on-click with no recovery                                                                        | Wrong selection resets real users' passwords             | AC-6 mandates an explicit irreversibility confirmation step before the call fires                                                                                      |

## Open questions

None — permission-gating and result-display product decisions were resolved with the
requester before this proposal was written (see "What already exists" and the Goals
section).

---
