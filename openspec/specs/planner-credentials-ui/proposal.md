# Planner credentials UI

**Slug**: `planner-credentials-ui`
**Branch**: `feat/planner-credentials-ui`
**Repos affected**: frontend (backend side already merged as `planner-api-login`,
UPC-ABET/BACK-ACREDITACION-3.0#99, develop @ `3af260b8`)
**Created**: 2026-08-09

## Problem

Planner scraping is currently down in production. The backend rewrite (`planner-api-login`)
fixes it, but deliberately ships without credentials — they must be POSTed once through the
API after deploy, and rotated the same way whenever the u-planner account password changes.
Today the only way to do that is `curl` with a bearer token, because no screen in this app
can read or write Planner credentials. Every future rotation needs the same manual `curl`
step until this ships, and an operator/support person without API tooling is locked out
entirely.

Compounding this, the backend's `PlannerSessionStatus` gained a fourth value —
`not_configured` — that the deployed frontend does not know about. Between the backend
deploy and the first credential POST, the existing `/scrapping` → Planner tab will see only
`not_configured` and a `credentialsNotConfigured` 400 from refresh, which today has no
handling and will render as a broken/error state.

## What already exists

- `src/modules/planner/` — full module already in play:
  - `components/PlannerSessionStatusCard.tsx` — shows token `status` (`active | expiring |
expired` today) and a manual "refresh" button, backed by `usePlannerSessionStatus()` /
    `useRefreshPlannerSession()`.
  - `components/PlannerManagementView.tsx` — composes the status card, the scrape-start
    panel, run progress, and run history; already wired into
    `src/app/(protected)/scrapping/ScrapingTabsView.tsx` as the "Planner" tab, alongside
    Banner and Exports. The whole `/scrapping` route is already gated by the `SCRAPPING`
    permission (see the comment in `ScrapingTabsView.tsx`) — no new permission plumbing
    needed.
  - `services/plannerService.ts` — calls `GET /planner/session/status` and
    `POST /planner/session/refresh` today. No credentials read/write yet.
  - `types/index.ts` — `PlannerSessionStatusValue = 'active' | 'expiring' | 'expired'`. Does
    not know `'not_configured'`.
  - `hooks/usePlanner.ts` — `usePlannerSessionStatus` (polls every 60s) and
    `useRefreshPlannerSession` (a `useMutation` that seeds the status query cache with the
    response on success, no follow-up GET).
- `src/language/locales/{es,en}.json` — a `planner.session.*` block already exists (title,
  status labels, hints) for the three known statuses; no `not_configured` entry and no
  `planner.credentials.*` block.
- `src/shared/lib/apiError.ts` — `ApiError` carries `status` and the parsed `body` (which
  contains the backend's `message` i18n key plus optional `data: string[]`), which is what
  routing on the exact error key (not just the HTTP status) requires.
- `src/shared/hooks/useApiErrorToast.ts` — generic toast-on-error hook already used by
  `PlannerManagementView`, translates a raw i18n key via `tryTranslate`.
- Backend contract (read remotely from `openapi.json` on the backend's `develop`, not a
  local checkout):
  - `GET /planner/session/status` → `PlannerSessionStatusDto { status: 'active' |
'expiring' | 'expired' | 'not_configured', tokenExp: string | null }`
  - `POST /planner/session/refresh` → same `PlannerSessionStatusDto`; 400
    `error.planner.credentialsNotConfigured`; 503 `error.planner.unreachable` /
    `error.scraperCredential.decryptionFailed`
  - `GET /planner/session/credentials` → `PlannerCredentialsResponseDto { username: string |
null, configured: boolean, updatedAt: string | null }` — password is never returned
  - `POST /planner/session/credentials` (`SavePlannerCredentialsDto { username, password }`)
    → `PlannerSessionStatusDto`; 400 `error.planner.invalidCredentials` /
    `error.planner.verificationCooldown` / `error.planner.invalidCredentialsPayload` /
    `error.scraperCredential.saveFailed`; 503 `error.planner.unreachable` /
    `error.scraperCredential.decryptionFailed`

This is additive to the existing Planner tab, not a new screen or route.

## Goals

- The Planner tab lets an operator with `SCRAPPING` permission view whether Planner
  credentials are configured (`username`, `configured`, `updatedAt`) and set or rotate them,
  without touching `curl` or a bearer token.
- `not_configured` renders as "nobody has set this up yet, here's the form" — never as an
  error banner, never as something a retry/refresh button would fix.
- Every distinct backend error key listed in "What already exists" produces a distinct,
  correctly-worded message. In particular: `invalidCredentials` (password wrong) is never
  confused with `verificationCooldown` (no verdict yet, a double-click artifact), and the two
  503 keys (`unreachable` vs `decryptionFailed`) are routed on the message key, never on the
  shared 503 status code alone.
- A rejected save is communicated as "nothing was written" so the operator knows any prior
  working configuration is untouched.
- A successful save updates the visible session status immediately from the POST response —
  no extra `GET /status` round-trip.
- The submit control is disabled for the full duration of a save request, so a second click
  cannot fire a second request while one is outstanding (client-side belt to the server's
  entry-claimed cooldown).
- The password field is write-only in the UI: always starts blank, is never populated from
  any API response (the read endpoint never returns it), and is cleared after both success
  and failure.
- Credentials can be viewed and updated at any time after initial setup too (rotation), not
  only while `not_configured` — the read endpoint's `username`/`configured`/`updatedAt`
  shape exists specifically to support that ongoing view.

## Non-goals

- No Banner credential UI. Banner keeps its streamed 2FA browser login flow untouched.
- No multi-account or per-school Planner credentials — one system-wide credential, one form.
- No scope headers (`X-School-Id` / `X-Modality-Type-Id` / `X-Academic-Period-Id`) on any of
  the four Planner session endpoints — the session is system-wide. (The shared `apiClient`
  attaches these headers automatically to every request; the backend for these four routes
  ignores them, so no client-side suppression is required or in scope.)
- No change to how the scrape-run panel, progress, or history behave — only the session
  status/credentials surface changes.

## Acceptance criteria

1. **AC-1** — Given the backend returns `status: 'not_configured'`, when the Planner tab
   renders, then the UI shows a setup affordance (the credentials form) rather than an error
   message, a broken badge, or an automatic retry loop.
2. **AC-2** — Given credentials are configured, when the credentials section loads, then it
   displays the current `username` and a formatted `updatedAt`, and never displays or
   pre-fills a password anywhere.
3. **AC-3** — Given no credentials have ever been saved (`configured: false`, `username:
null`, `updatedAt: null`), when the credentials section loads, then it shows a "not
   configured yet" state distinct from a loading or error state.
4. **AC-4** — Given a user submits a username/password pair u-planner accepts, when the
   `POST /planner/session/credentials` call succeeds, then the UI updates the session status
   shown to the user directly from that response body, with no follow-up `GET
/planner/session/status` call, and shows a success confirmation.
5. **AC-5** — Given u-planner rejects the pair (`error.planner.invalidCredentials`, 400),
   when the response arrives, then the UI shows a message stating the credentials were
   rejected and that any previously-saved working credentials are unchanged.
6. **AC-6** — Given a verification is already in flight or one was rejected in the last 30s
   (`error.planner.verificationCooldown`, 400), when the response arrives, then the UI shows
   a distinct "still checking, try again in a moment" message that never implies the
   credentials themselves are wrong.
7. **AC-7** — Given a malformed request body (`error.planner.invalidCredentialsPayload`,
   400, with field issues in `data[]`), when the response arrives, then the UI surfaces the
   `data[]` details rather than only the generic key.
8. **AC-8** — Given a structurally unusable pair, e.g. a whitespace-only username
   (`error.scraperCredential.saveFailed`, 400), when the response arrives, then the UI shows
   a message distinct from both AC-5 and AC-6.
9. **AC-9** — Given u-planner is unreachable (`error.planner.unreachable`, 503), when the
   response arrives (from either the refresh action or a save), then the UI attributes the
   failure to Planner's availability, not to the credentials being wrong.
10. **AC-10** — Given the stored credential fails to decrypt (`error.scraperCredential.decryptionFailed`,
    503 — same status code as AC-9), when the response arrives, then the UI shows a message
    distinct from AC-9, proving the routing is on the message key and not the HTTP status.
11. **AC-11** — Given the refresh action is pressed while `status` is `not_configured`
    (`error.planner.credentialsNotConfigured`, 400) — reachable only defensively, since the
    refresh control is not offered while unconfigured per AC-1 — when it occurs, then the UI
    falls back to the same not-configured setup affordance rather than a raw/generic error
    banner.
12. **AC-12** — Given a save request is in flight, when the user attempts to submit again
    before it resolves, then the submit control is disabled and the second click has no
    effect.
13. **AC-13** — Given a save attempt just failed or just succeeded, when the form re-renders,
    then the password field is empty (never repopulated with the previously typed or any
    server-supplied value).
14. **AC-14** — `PlannerSessionStatusValue` includes `'not_configured'`, and every place that
    maps a status to a badge color / label / hint handles all four values — verified by
    `npx tsc --noEmit` failing if a case is dropped (e.g. an exhaustive switch or a `Record`
    keyed by the full union, not a partial map accessed with a type assertion).
15. **AC-15** — All new user-facing strings and all seven backend error keys used by this
    screen have entries in both `src/language/locales/es.json` and
    `src/language/locales/en.json`.

### Traceability

| AC  | Criterion                                                              | Satisfied by                                                                                                                    |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `not_configured` renders as setup, not error                           | `PlannerSessionStatusCard.tsx` (4th status + hidden refresh button) + always-rendered `PlannerCredentialsCard.tsx`              |
| 2   | Configured view shows username + updatedAt, never password             | `PlannerCredentialsCard.tsx` + `usePlannerCredentials()` (`hooks/usePlanner.ts`)                                                |
| 3   | Unconfigured view is a distinct state                                  | `PlannerCredentialsCard.tsx`                                                                                                    |
| 4   | Save success updates status from POST response, no extra GET           | `useSavePlannerCredentials()` `onSuccess` (`hooks/usePlanner.ts`)                                                               |
| 5   | `invalidCredentials` message + "prior config unchanged" note           | `es.json`/`en.json` `error.planner.invalidCredentials` + `PlannerCredentialsCard.tsx` error Toast                               |
| 6   | `verificationCooldown` message, distinct from invalid-credentials      | `es.json`/`en.json` `error.planner.verificationCooldown` + `PlannerCredentialsCard.tsx` error Toast                             |
| 7   | `invalidCredentialsPayload` surfaces `data[]`                          | `resolveApiErrorContent()` (`shared/utils/tryTranslate.ts`, existing) + `PlannerCredentialsCard.tsx` `<Toast reasons=...>`      |
| 8   | `scraperCredential.saveFailed` message, distinct from AC-5/AC-6        | `es.json`/`en.json` `error.scraperCredential.saveFailed` + `PlannerCredentialsCard.tsx` error Toast                             |
| 9   | `planner.unreachable` (503) message                                    | `es.json`/`en.json` `error.planner.unreachable`; keyed by `ApiError.message`, never `status`                                    |
| 10  | `scraperCredential.decryptionFailed` (503) message, distinct from AC-9 | `es.json`/`en.json` `error.scraperCredential.decryptionFailed`; keyed by `ApiError.message`, never `status`                     |
| 11  | `credentialsNotConfigured` on refresh falls back to setup state        | `PlannerSessionStatusCard.tsx` refresh `onError` interception + `PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY` (`constants/index.ts`) |
| 12  | Submit disabled for full request duration                              | `Button loading={saveCredentials.isPending}` in `PlannerCredentialsCard.tsx` (existing `Button` primitive behavior)             |
| 13  | Password field always blank after submit                               | `PlannerCredentialsCard.tsx` mutation `onSettled` clearing local state                                                          |
| 14  | `PlannerSessionStatusValue` widened + exhaustive mapping               | `types/index.ts` + `PLANNER_SESSION_STATUS_COLORS: Record<...>` (`constants/index.ts`)                                          |
| 15  | i18n keys added to both locale files                                   | `src/language/locales/es.json` + `en.json`, added per-task alongside each new string                                            |

## Dependencies

- Backend change `planner-api-login` (UPC-ABET/BACK-ACREDITACION-3.0#99), merged to
  `develop` @ `3af260b8`. This frontend change must not be promoted to an environment ahead
  of the backend being deployed there — see [Sequencing] in the originating ticket: between
  backend deploy and the first credential POST, the old frontend (without this change) would
  see `not_configured` and treat it as a hard error.
- No frontend-side data migration, seed, or permission change — `SCRAPPING` already gates
  the whole `/scrapping` route.

## Risks

| Risk                                                                                                   | Impact                                                                                                                                                                                                                           | Mitigation                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Both 503 keys (`planner.unreachable`, `scraperCredential.decryptionFailed`) share the same HTTP status | A status-only error handler would show the wrong message for a server-side APP_SECRET fault                                                                                                                                      | Route error handling on the `message` key from the response body (already available via `ApiError.body`), never on `error.status` alone (AC-9/AC-10) |
| `verificationCooldown` looks identical to a rejected password if handled generically                   | Operator re-enters a correct password thinking it was wrong, burning the 30s cooldown again                                                                                                                                      | Dedicated message + visual treatment per key, not a single generic "save failed" toast (AC-5/AC-6)                                                   |
| Existing `PlannerSessionStatusCard` maps `status` via a `Record` typed over the current 3-value union  | Adding `not_configured` to the type without updating every consumer either fails to compile (good) or silently falls through to `undefined` styling (bad) if a consumer widens the type with a cast instead of extending the map | AC-14 requires exhaustiveness enforced by `tsc`, not a runtime default branch                                                                        |
| Frontend ships before backend is promoted to the same environment                                      | Users hit `not_configured` handling that doesn't exist yet, or vice versa                                                                                                                                                        | Sequencing note carried into `design.md`/`runbook.md`; release directly behind backend promotion per the ticket                                      |

## Open questions

None — the ticket is prescriptive enough (exact endpoints, exact error keys and their
distinctions, exact throttling/entry-claim behavior, exact response-reuse rule for status
after save) to write testable ACs without inventing product decisions. Placement (extend
the existing Planner tab) and scope (system-wide, no new permission) both follow directly
from what already exists in the codebase, not from a guess.
