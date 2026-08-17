# Design — PPP bulk upload progress (frontend)

## Retro-fit note

This folder was written during review of PR #101, not before it. The branch is `feat/ppp_1`,
which predates the slug convention and does not encode the slug. Renaming a branch with an
open PR loses review threads, so the branch stays and this file records the mismatch. Future
PPP work should branch as `feat/<slug>`.

## Decision 1 — one polling hook, built on `useQuery`

**Context.** Before this change the repo had two hand-rolled `useEffect` + `setInterval`
polling loops (`useGRASendNotifications`, `useLCFCNotification`). PPP's upload made a third.
`docs/POLICIES.md` → Data Fetching says all data fetching goes through `useQuery` /
`useMutation` and **never** `useEffect` + `useState`, so the two shipped copies already
contradicted the policy.

**Options.**

| Option                                  | Verdict                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| Copy the existing loop a third time     | Rejected — cements a policy violation and triples the failure modes |
| Extract the hand-rolled loop as-is      | Rejected — DRY, but still `useEffect` + `useState` for an API call  |
| One `useJobPolling` built on `useQuery` | **Chosen**                                                          |

**Why.** `refetchInterval` gives the poll loop; TanStack de-duplicates in-flight fetches for
a key, which removes the overlapping-request bug the hand-rolled version had (a status call
slower than the 1s interval could resolve out of order and walk the progress bar backwards);
and unmount cancellation comes free instead of via a `cancelled` flag.

**Consequences.** All three call sites were migrated in this change, so there is exactly one
copy. GRA and LCFC keep their existing public hook shapes (`sending`, `status`, `error`), so
their components did not change.

**Deliberate deviation.** `useJobPolling` still uses two `useEffect`s: one to keep the
`onSettled` callback in a ref, one to arm the timeout timer. Neither performs an API call —
the policy line targets fetching, not timers — and both now live in one file rather than
three.

## Decision 2 — timeout as a wall-clock timer, not a poll counter

A job whose status endpoint never reports `done` (backend restart drops the in-process job
map — see the proposal's Out of scope) would otherwise poll forever behind a dialog that is
deliberately non-dismissible while running, leaving a page reload as the only escape.

Counting polls was considered and rejected: `useQuery`'s result does not expose an update
count in v5, and more importantly the thing worth bounding is how long the _user_ has been
waiting, not how many requests happened to resolve. A single `setTimeout(POLL_TIMEOUT_MS)`
armed per job flips a state flag, which disables the query and surfaces
`error.survey.jobPollTimeout`. 10 minutes is well past the worst observed import and short
enough that a stuck dialog is not a support call.

## Decision 3 — the error workbook downloads on click, not automatically

The first implementation fired the download from an effect the moment a poll reported
`failed > 0`. That download is not tied to a user gesture, so a stricter browser profile can
suppress it — while the dialog still claims the file was downloaded. For an all-or-nothing
import that workbook is the only record of what went wrong.

It is now a **Download errors** button in the dialog footer. This also removes an effect and
two `eslint-disable` comments, and it collapses the error surfaces from three (dialog +
toast + summary panel) to the modal that already carries the outcome.

## Decision 4 — `isExternal` is round-tripped, not decided

The UI toggle is removed, but `CompetenceConfig` / `CompetenceFormData` still carry the
value: the adapters read `extra.isExternal` and the save payloads send back what they read.

The alternative — dropping the field from the payload — is only correct if the flag is truly
dead, which is a backend question this change is not positioned to answer. Round-tripping is
the option that cannot lose data: without it, opening any competence flagged external and
pressing Save silently overwrites `true` with a hardcoded `false`, with no UI left to notice
or undo it.

## Decision 5 — per-tab career filter lives in the parent

PPP's tabs render as `activeTab === 'upload' && <PPPMassiveUpload />`, so switching tabs
unmounts the inactive one. Holding `programId` inside each tab therefore does not give
"independent per-tab filters" — it gives "filter resets whenever you leave the tab".

`PPPManagementView` now owns three ids (`uploadProgramId`, `reportsProgramId`,
`configProgramId`) and passes each down. The tabs stay independent _and_ the selection
survives a round trip. `GRAManagementView` has the same shape and should follow, but it is
not touched here — it is not a regression this PR introduced.

## Decision 6 — `CommissionCampusFilters` gets a `className`, not a fork

PPP's report screen needs commission + campus inside a 3-column grid that also holds career,
survey number and language. Rather than inlining a second copy of the two selects (which is
what left the shared component dead), it accepts a `className` — the report screens pass
`contents`, so the two selects participate in the parent grid directly — and a `namePrefix`
so two instances on a page keep distinct field names.
