# Runbook — Chart maintenance password reset

**Slug**: `chart-maintenance-password-reset`

## Deploy prerequisite — read this before opening the PR

At design time (2026-08-25), `POST /charts/maintenance/reset-password` existed on the
backend's `develop` branch but **not** on `staging`. **Re-verified during the audit pass,
same day**: the backend has since been promoted — `staging` and `develop` are now at the
same commit (`647f6ea02a2df74d741f9b7412511ff37ff59f06`), and `staging`'s schema for
`ResetMaintenancePasswordsDto`/`ResetMaintenancePasswordsResponseDto` matches the frontend's
hand-written types exactly. **This prerequisite is currently satisfied.**

Use this exact check — anchored to the full path — to re-verify before opening the PR,
since the original draft of this command (`grep -q 'reset-password'`, unanchored) was
found during the audit to be a **false positive**: it also matches the unrelated,
pre-existing `/users/reset-password` self-service endpoint, so it would report `PRESENT`
even on a `staging` spec that doesn't have the chart endpoint.

```bash
gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=staging" \
  -H "Accept: application/vnd.github.raw" \
  | grep -q '"/charts/maintenance/reset-password"' && echo PRESENT || echo MISSING
```

Per `plugins/abet-common/reference/conventions.md` § Sequencing, this frontend PR **must
not merge** until that command reports `PRESENT` (i.e. the backend change has been
promoted `develop → staging`). Re-run it immediately before requesting review, not just
once at design/audit time — `/abet-verify-contract` automates the same check.

## Manual verification (no test runner in this repo — see `docs/POLICIES.md#verification-gate`)

Prerequisite: `pnpm dev` running against a backend build that has the endpoint (`develop`
branch is sufficient for local verification even before it reaches `staging`). Log in as a
user with ADMIN-module POST permission, and navigate to the Loads screen's organization
chart maintenance tab with a school + academic period selected in the top bar that has a
configured chart.

1. **Toolbar button (AC-1)** — Confirm "Reset password" appears in the toolbar next to
   Export PNG/PDF, is disabled while the chart is loading, and becomes enabled once it
   renders. Record pass/fail.
2. **Selection modal (AC-2)** — Click the button. Confirm all six entity types (Dean,
   School, Program, Area, Subarea, Course) appear as independently toggleable checkboxes,
   correctly localized, and that the primary action is disabled until at least one is
   checked. Record pass/fail.
   - **Loading/error state** (added during the audit fix pass): if this is the first time
     in the session the entity-type lookup is fetched (cold cache), confirm a loading
     spinner shows briefly instead of an empty checkbox list, and Continue stays disabled
     throughout. If reachable, simulate a failed lookup (e.g. block the `/types/by-group-code`
     request in devtools) and confirm an inline error message appears instead of a silently
     empty list.
3. **Request shape (AC-3)** — With the browser devtools network tab open, select 2–3 entity
   types, continue through confirmation, and submit. Confirm the request is
   `POST /charts/maintenance/reset-password` with body `{ "entityTypeCodes": [...] }`
   containing exactly the selected codes, and that `X-School-Id`/`X-Academic-Period-Id`
   headers are present and match the active top-bar scope. Record pass/fail.
4. **Results — non-empty (AC-4a)** — Using a school/period known to have at least one
   linked, active staff login among the selected entity types, confirm the results dialog
   lists the reset user(s) by name with a chart-node count, and any skipped nodes grouped
   by entity type. Record pass/fail and what was actually shown.
5. **Results — all-empty (AC-4b)** — Repeat against a school/period/entity-type
   combination expected to match zero resettable logins (e.g. an entity type with no chart
   nodes configured for the current scope). Confirm the call still succeeds (201) and the
   dialog shows the "0 reset / 0 skipped" empty states rather than an error. Record
   pass/fail.
   - **Tree left untouched (AC-4, both 4a and 4b)**: with the network tab open, confirm no
     additional `GET .../charts/maintenance/tree` request fires after the reset-password
     response resolves (`useResetChartPasswords` deliberately has no query invalidation —
     see `design.md` § AC-4). Record pass/fail separately from the results-dialog content
     check above.
6. **Validation error (AC-5a)** — ✅ **Verified by code inspection (2026-08-25, audit
   pass), no backend needed.** The "Continue" button
   (`ChartResetPasswordDialog.tsx`) renders `disabled={selectedCodes.size === 0 ||
typesLoading || typesError}`, and `Button`'s underlying `<button>` forwards `disabled` to
   the native DOM attribute (`src/shared/components/ui/Button.tsx`) — this is a real,
   enforced constraint, not merely a visual one. `handleConfirm` (the only caller of
   `resetPasswords.mutateAsync`) is only reachable via the confirm step, which is only
   reachable from this same gated button. An empty `entityTypeCodes` array cannot be
   submitted through the UI. No live-backend re-check needed for this step.
7. **Permission error (AC-5b)** — Repeat step 3 as a user who holds ORGANIZATION permission
   on this screen but not the ADMIN module's POST permission. Confirm a 403 surfaces as a
   translated toast, the modal returns to the selection step with the prior checkboxes
   still checked, and no results dialog appears. **If no such test account exists**, note
   that explicitly here and rely on code review of the error-handling branch instead — do
   not report this step as verified without either a real account or an explicit
   code-review substitute noted.
8. **Irreversibility confirmation (AC-6)** — Confirm the confirm step explicitly states the
   action is immediate and cannot be undone, and that cancelling it returns to the
   selection step without firing the request (check the network tab shows no request until
   the confirm step's own confirm button is used). Record pass/fail.
   - **No-request-before-confirm half of this step is ✅ already verified by code
     inspection (2026-08-25, audit pass)**: `resetPasswords.mutateAsync` is only called
     from `handleConfirm`, which is only wired as `ConfirmDialog`'s `onConfirm` — there is
     no code path that fires the request before that dialog's own confirm button is
     pressed. What still needs a live backend is confirming the network tab shows no
     request in practice and that the copy itself reads correctly end-to-end.
   - **Confirm-step cancel/dismiss safety** (added during the audit fix pass): cancelling
     via the "Cancel" button, Escape, or a backdrop click while a reset request is in
     flight must **not** be possible to trigger a second submission — `handleCancelConfirm`
     and `handleConfirm` both now guard on `resetPasswords.isPending`. Verify by starting a
     reset, attempting to dismiss the confirm dialog immediately (all three ways), and
     confirming nothing double-fires (check the network tab for exactly one request).
9. **i18n (AC-7)** — Switch the `appLocale` cookie to `en` (or use whatever in-app language
   toggle exists) and repeat steps 1–2 and 4a/4b, confirming no raw i18n keys or Spanish
   text leak into the English rendering. Record pass/fail.
10. **Regression check** — Confirm the existing expand/collapse/zoom/export/edit/add-child/
    delete actions on this screen are unaffected (no shared state collision from the new
    dialog). Record pass/fail.

## Rollback

This change is purely additive on the frontend (one new component, one new toolbar button,
new types/service/hook/i18n keys — no existing behavior is modified). Reverting the
frontend PR fully removes the feature with no data or migration cleanup required. The
backend endpoint itself has no frontend-side rollback dependency — it can stay deployed
even if this PR is reverted; it would simply become unreachable from the UI again.
