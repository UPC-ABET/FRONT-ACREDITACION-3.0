# Runbook — Chart maintenance password reset

**Slug**: `chart-maintenance-password-reset`

## Deploy prerequisite — read this before opening the PR

At design time (2026-08-25), `POST /charts/maintenance/reset-password` existed on the
backend's `develop` branch but **not** on `staging`:

```bash
gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=staging" \
  -H "Accept: application/vnd.github.raw" | grep -q 'reset-password' && echo PRESENT || echo MISSING
```

Per `plugins/abet-common/reference/conventions.md` § Sequencing, this frontend PR **must
not merge** until that command reports `PRESENT` (i.e. the backend change has been
promoted `develop → staging`). Re-run it immediately before requesting review, not just
once at design time — `/abet-verify-contract` automates the same check.

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
6. **Validation error (AC-5a)** — This should be unreachable through the UI (the Continue
   button is disabled at zero selections), but confirm by inspection of the component that
   an empty `entityTypeCodes` array is in fact impossible to submit. Record how this was
   confirmed.
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
