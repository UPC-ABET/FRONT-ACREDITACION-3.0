# Runbook — Planner credentials UI

**Slug**: `planner-credentials-ui`

## Deploy prerequisite — read this first

This frontend change is only meaningful once the backend change it depends on
(`planner-api-login`, UPC-ABET/BACK-ACREDITACION-3.0#99) has reached the **same
environment**. Before verifying anything below:

1. Confirm the backend PR is on `staging` (not just merged to `develop`) if you're
   verifying against an environment that follows the promotion chain, or run it locally
   from its `develop` branch for local verification. `/abet-verify-contract` checks this
   with `gh api` — don't trust a colleague's local checkout.
2. Confirm no Planner credentials exist yet in that environment's database, if you want to
   exercise the `not_configured` path (AC-1, AC-3) — if credentials were already POSTed via
   `curl` to unblock production, use a disposable/local environment instead for those two
   checks.

Skipping this and testing against an environment that's ahead of or behind the backend
produces false results in both directions: an old frontend against the new backend hits
the exact gap this change closes (unhandled `not_configured`); this new frontend against
an old backend will 404 on `/planner/session/credentials`.

## How to reproduce each backend error key

None of these can be triggered from the UI alone in the ordinary path — each requires a
deliberate action against the backend or u-planner. Coordinate with backend/infra as
needed; do not attempt to fake these by editing frontend network responses only, since
that verifies the UI's rendering but not the real end-to-end wiring.

| Key                                        | How to reproduce                                                                                                                                                                                                                   | Verifies |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `error.planner.invalidCredentials`         | Submit the save form with a syntactically valid but wrong password for a real u-planner account.                                                                                                                                   | AC-5     |
| `error.planner.verificationCooldown`       | Submit the save form, then immediately submit again (or resubmit within 30s of a rejection). The _first_ click's request claims the slot on entry, so a fast second click should get this even before the first resolves.          | AC-6     |
| `error.planner.invalidCredentialsPayload`  | Use browser devtools to intercept and mutate the POST body into something structurally invalid (e.g. `password` as a number), or ask backend for a fixture that returns this.                                                      | AC-7     |
| `error.planner.credentialsNotConfigured`   | Hit `POST /planner/session/refresh` (not save) directly, or trigger the refresh action, on an environment with no credentials saved.                                                                                               | AC-11    |
| `error.scraperCredential.saveFailed`       | Submit the save form with a whitespace-only username (e.g. `"   "`).                                                                                                                                                               | AC-8     |
| `error.planner.unreachable`                | Point the backend's u-planner base URL at an unreachable host, or block the network path to u-planner, then submit a save or press refresh.                                                                                        | AC-9     |
| `error.scraperCredential.decryptionFailed` | In a disposable environment only: save valid credentials, then change `APP_SECRET`, then press refresh. **Never do this against a shared or production environment** — it invalidates every other stored encrypted credential too. | AC-10    |

## AC-by-AC verification checklist

Record pass/fail and date for each. A fail links back to the Milestone 1–3 task that owns
it — fix there, not with a patch to this runbook.

**Status as of 2026-08-09 (implementation session)**: no live backend with a real
u-planner account was available in this session — everything below marked "code-level
only" was verified by reading the implemented logic, `npx tsc --noEmit`, `pnpm lint`
(repo-wide, zero warnings), and `pnpm build` (production build, all routes including
`/scrapping` compile and generate cleanly). None of that substitutes for the behavioral
checks marked **not verified** — those need a person with backend + u-planner access to
run through this table for real before this change ships. Per `docs/POLICIES.md` §
Verification Gate, this task is not "done" until that pass happens; this session leaves
it explicitly open rather than claiming a manual check that didn't happen.

| AC  | Check                                                                                                                 | Result                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fresh/never-configured backend → Planner tab shows setup form, no error styling, no refresh button                    | Code-level only — `status !== 'not_configured'` gates the refresh button and the `not_configured` badge uses a neutral color (`#71717a`), confirmed by reading `PlannerSessionStatusCard.tsx`. **Not verified against a live not_configured response.** |
| 2   | Configured backend → username + updatedAt shown, password never in DOM or Network tab response bodies                 | Code-level only — `PlannerCredentials` type and `PlannerCredentialsCard` never reference a password field; backend contract (`PlannerCredentialsResponseDto`) has no password field to leak. **Not verified in a live Network tab.**                    |
| 3   | Never-configured backend → credentials card shows a distinct "not configured" state, not blank/error                  | Code-level only — `!data.configured` branch renders `planner.credentials.notConfigured`. **Not verified live.**                                                                                                                                         |
| 4   | Successful save → Network tab shows no `GET /planner/session/status` firing after the `POST`                          | Code-level only — `useSavePlannerCredentials`'s `onSuccess` calls `setQueryData`, not `invalidateQueries`, for `sessionStatus()`. **Not verified in a live Network tab.**                                                                               |
| 5   | Wrong password → rejection message states prior working credentials (if any) are unchanged                            | **Not verified** — needs a real u-planner account and a deliberately wrong password.                                                                                                                                                                    |
| 6   | Rapid double-submit / resubmit within 30s of rejection → distinct cooldown message, never phrased as "wrong password" | **Not verified** — needs a live backend enforcing the 30s window.                                                                                                                                                                                       |
| 7   | Malformed payload → field-level `data[]` reasons rendered, not just the generic key                                   | Code-level only — reuses `resolveApiErrorContent`/`getApiErrorReasons`, already exercised elsewhere in the app (e.g. `IFCForm.tsx`) for the same `data[]` shape. **Not verified with a real malformed-payload response from this endpoint.**            |
| 8   | Whitespace-only username → message distinct from both AC-5 and AC-6                                                   | **Not verified** — needs a live backend to actually reject a whitespace-only username.                                                                                                                                                                  |
| 9   | u-planner unreachable → message attributes the problem to Planner's availability                                      | **Not verified** — needs u-planner to be made unreachable.                                                                                                                                                                                              |
| 10  | Decryption failure (disposable env only) → message distinct from AC-9, despite same 503 status                        | **Not verified** — explicitly requires a disposable environment; not attempted.                                                                                                                                                                         |
| 11  | Refresh pressed while `not_configured` (race) → falls back to setup view, no error toast shown                        | Code-level only — `onError` checks `error.message === PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY` before ever calling `setRefreshError`. **Not verified against a real race.**                                                                              |
| 12  | Rapid double-click save → Network tab shows exactly one request                                                       | Code-level only — `Button`'s `loading` prop sets `disabled` synchronously on the first click (`disabled={disabled                                                                                                                                       |     | loading}`), and `isPending` flips true before React can process a second click in the same event loop tick. **Not verified in a live Network tab.** |
| 13  | After both a failed and a successful save, password input is empty in both cases                                      | Code-level only — `onSettled: () => setPassword('')` fires for both outcomes. **Not verified by hand.**                                                                                                                                                 |
| 14  | `npx tsc --noEmit` fails if a status key is removed from `PLANNER_SESSION_STATUS_COLORS`, passes when restored        | **Verified 2026-08-09** — confirmed the reverse direction live during implementation: widening `PlannerSessionStatusValue` (Task 1.1) immediately broke `tsc` at the old 3-key `Record` until Task 2.1 added the 4th key.                               |
| 15  | Every new key from the table above and every new UI string present in both `es.json` and `en.json`                    | **Verified 2026-08-09** — every key added in Tasks 2.1/2.2/3.1/3.2 was added to both `es.json` and `en.json` in the same edit; both files validated as parseable JSON after each change.                                                                |

**Before this change ships**: someone with u-planner credentials and backend access must
run rows 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13 for real and flip them to pass/fail here.
Row 10 additionally needs a disposable environment.

## Rollback

This change adds new components and hooks additively; it does not modify any existing
endpoint call in a breaking way (the only modified existing call, `refreshPlannerSession`,
keeps its prior request/response shape — only its error handling changes). Reverting is a
plain revert of the frontend PR; no data migration, seed, or backend coordination is
needed to roll back the frontend independently of the backend (the backend change is
already live and out of scope for this rollback).
