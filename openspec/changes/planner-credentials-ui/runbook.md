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

**Status as of 2026-08-09 (audit)**: checked directly against GitHub — PR #99's base
branch is `develop`, and the backend's `develop` is 2 commits ahead of its `staging`
branch. `staging` and `production` both currently have **zero** `/planner/session/*`
paths in their committed `openapi.json`; only `develop` has them. So per this repo's own
sequencing rule (backend reaches `staging` before the frontend PR merges), **this
prerequisite is not yet satisfied** — do not merge this frontend PR until that's
re-checked and confirmed.

Skipping this and testing against an environment that's ahead of or behind the backend
produces false results in both directions: an old frontend against the new backend hits
the exact gap this change closes (unhandled `not_configured`); this new frontend against
an old backend will 404 on `/planner/session/credentials`.

## Two verification tiers — don't conflate them

There are two genuinely different kinds of confidence here, and this runbook keeps them
in separate columns so one is never mistaken for the other:

- **Rendering (mocked response)** — does the component render the right distinct text for
  a given backend response shape? This needs **no backend at all**: override the
  `POST /planner/session/credentials` (or `GET`/`POST /planner/session/status`) response
  in browser devtools' network overrides, or point `apiClient` at a local fixture server,
  and confirm the UI reacts correctly. Zero infrastructure cost — there is no excuse to
  skip this tier before merging.
- **Live behavior (real backend + u-planner)** — does the _backend_ actually produce the
  response the mock assumed, under the real condition described (wrong password, cooldown
  window, u-planner actually down, etc.)? This is the tier that genuinely needs backend +
  u-planner access and cannot be shortcut.

A row can be "Rendering: verified, Live: not verified" — that is real, useful signal
(the wiring is provably correct; only the backend's actual behavior is unconfirmed). What
this runbook must never do is present "the code reads correctly" as if it were either
tier's actual verification.

## How to reproduce each backend error key (for the Live-behavior tier)

None of these can be triggered from the UI alone in the ordinary path — each requires a
deliberate action against the backend or u-planner.

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

**Status as of 2026-08-09**: no live backend with a real u-planner account was available
during implementation, and the mocked-response rendering pass (the zero-cost tier above)
has also not been run yet — it was identified as missing during `/abet-audit-pr`. Running
both tiers was descoped from this change's `tasks.md` completion criteria per explicit
decision, so every row below is recorded honestly as "Not run" rather than marked done.

| AC  | Check                                                                                                                 | Rendering (mocked response) | Live behavior (real backend/u-planner)                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fresh/never-configured backend → Planner tab shows setup form, no error styling, no refresh button                    | Not run                     | Not run                                                                                                                                                                                                   |
| 2   | Configured backend → username + updatedAt shown, password never in DOM or Network tab response bodies                 | Not run                     | Not run                                                                                                                                                                                                   |
| 3   | Never-configured backend → credentials card shows a distinct "not configured" state, not blank/error                  | Not run                     | Not run                                                                                                                                                                                                   |
| 4   | Successful save → Network tab shows no `GET /planner/session/status` firing after the `POST`                          | Not run                     | Not run                                                                                                                                                                                                   |
| 5   | Wrong password → rejection message states prior working credentials (if any) are unchanged                            | Not run                     | Not run — needs a real u-planner account                                                                                                                                                                  |
| 6   | Rapid double-submit / resubmit within 30s of rejection → distinct cooldown message, never phrased as "wrong password" | Not run                     | Not run — needs a live backend enforcing the 30s window                                                                                                                                                   |
| 7   | Malformed payload → field-level `data[]` reasons rendered, not just the generic key                                   | Not run                     | Not run                                                                                                                                                                                                   |
| 8   | Whitespace-only username → message distinct from both AC-5 and AC-6                                                   | Not run                     | Not run                                                                                                                                                                                                   |
| 9   | u-planner unreachable → message attributes the problem to Planner's availability                                      | Not run                     | Not run                                                                                                                                                                                                   |
| 10  | Decryption failure (disposable env only) → message distinct from AC-9, despite same 503 status                        | Not run                     | Not run — disposable environment only                                                                                                                                                                     |
| 11  | Refresh pressed while `not_configured` (race) → falls back to setup view, no error toast shown                        | Not run                     | Not run                                                                                                                                                                                                   |
| 12  | Rapid double-click save → Network tab shows exactly one request                                                       | N/A (not a rendering check) | Not run                                                                                                                                                                                                   |
| 13  | After both a failed and a successful save, password input is empty in both cases                                      | Not run                     | Not run                                                                                                                                                                                                   |
| 14  | `npx tsc --noEmit` fails if a status key is removed from `PLANNER_SESSION_STATUS_COLORS`, passes when restored        | N/A                         | **Verified 2026-08-09** — confirmed the reverse direction live during implementation: widening `PlannerSessionStatusValue` immediately broke `tsc` at the old 3-key `Record` until the 4th key was added. |
| 15  | Every new key introduced and every new UI string present in both `es.json` and `en.json`                              | N/A                         | **Verified 2026-08-09** — every key introduced was added to both `es.json` and `en.json` in the same edit; both files validated as parseable JSON after each change.                                      |

Code-level review during implementation and audit gives reasonable confidence the wiring
is _structurally_ correct for rows 1–13 (e.g. `status !== 'not_configured'` gates the
refresh button; `onSettled: () => setPassword('')` fires for both outcomes;
`useSavePlannerCredentials`'s `onSuccess` uses `setQueryData` not `invalidateQueries` for
the status key) — but reading code is not either verification tier, and none of rows 1–13
are marked verified on that basis.

**Before this change ships**:

1. Run the mocked-response rendering pass for rows 1–11 and 13 (zero infrastructure
   needed — see "Two verification tiers" above).
2. Once the backend reaches `staging` (see Deploy prerequisite), run the live-behavior
   pass for rows 1–13, and row 10 in a disposable environment only.

## Rollback

This change adds new components and hooks additively; it does not modify any existing
endpoint call in a breaking way (the only modified existing call, `refreshPlannerSession`,
keeps its prior request/response shape — only its error handling changes). Reverting is a
plain revert of the frontend PR; no data migration, seed, or backend coordination is
needed to roll back the frontend independently of the backend.

Note: the backend change this frontend depends on is merged to the backend's `develop`
only (confirmed 2026-08-09 — not yet on `staging` or `production`). This rollback note
does not assume it's deployed anywhere; if it later reaches production out of band from
the branch-promotion flow described above, re-verify that assumption before relying on it.
