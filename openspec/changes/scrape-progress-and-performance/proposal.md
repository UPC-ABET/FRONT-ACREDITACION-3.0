# Scrape progress and performance

**Slug**: `scrape-progress-and-performance`
**Branch**: `feat/scrape-progress-and-performance`
**Repos affected**: both (backend: `UPC-ABET/BACK-ACREDITACION-3.0` PR #121, branch
`feat/scrape-progress-and-performance`, not yet merged/staged; frontend: this repo)
**Created**: 2026-08-20

## Problem

While a Banner or Planner scrape run is `running` — which can take several minutes —
operators watching `ScrapeRunProgress` / `PlannerScrapeRunProgress` see only a status
`Badge` reading "running" plus a spinner and a generic "polling" label. There is no signal
of which stage of the scrape is currently executing, so an operator cannot tell whether a
run that has been "running" for five minutes is stuck early or nearly done. The same gap
exists when scanning the run-history table: a `running` row next to `completed` rows gives
no sense of how far along it is.

The backend is adding a `phase` field to the existing status-poll and list responses
specifically to close this gap (additive, non-breaking — see "What already exists" and the
backend PR referenced above).

## What already exists

**Banner** (`src/modules/banner/`):

- `types/index.ts` — `ScrapeRunStatus`, `ScrapeRun` (`{ status, stats }`), `ScrapeRunSummary`
  (list-row shape, no `phase` today).
- `hooks/useBanner.ts` — `useBannerScrapeRun(runId)` polls `GET /api/banner/scrape/:runId`;
  `isTerminalScrapeStatus()` helper.
- `constants/index.ts` — `SCRAPE_STATUS_COLORS: Record<ScrapeRunStatus, string>`.
- `components/ScrapeRunProgress.tsx` — renders the status `Badge` + polling spinner + stats
  detail for a single run; this is the "poll-and-display status indicator" the backend
  proposal calls out as the destination for the phase label.
- `components/ScrapeRunHistory.tsx` — `DataTable` of `ScrapeRunSummary[]` with a `status`
  column (Badge), `nivel`, `departments`, `counts`, `started`, `finished`, `triggeredBy`,
  `actions`.

**Planner** (`src/modules/planner/`) mirrors the same shape one-for-one:
`PlannerScrapeRunStatus`, `PlannerScrapeRun`, `PlannerScrapeRunSummary` in `types/index.ts`;
`usePlannerScrapeRun` / `isTerminalPlannerScrapeStatus` in `hooks/usePlanner.ts`;
`PLANNER_SCRAPE_STATUS_COLORS` in `constants/index.ts`; `PlannerScrapeRunProgress.tsx` and
`PlannerScrapeRunHistory.tsx`.

Both `*Progress` components already poll live data through TanStack Query hooks and render
conditionally on `isLoading` / `isError` / terminal status — this change extends what they
render, not how they fetch.

## Goals

- Extend `ScrapeRun`, `ScrapeRunSummary` (banner) and `PlannerScrapeRun`,
  `PlannerScrapeRunSummary` (planner) with `phase: ScraperPhase | null` /
  `phase: PlannerScraperPhase | null`, matching the backend's additive field exactly.
- Render a human-readable phase label next to the status `Badge` in `ScrapeRunProgress.tsx`
  and `PlannerScrapeRunProgress.tsx`, shown only when `phase` is non-null.
- Render the phase label in `ScrapeRunHistory.tsx` and `PlannerScrapeRunHistory.tsx` for
  rows whose `phase` is non-null (including currently-`running` rows), so the list view
  gives the same visibility as the single-run card.
- Add i18n keys (`es.json` + `en.json`) for the six phase labels (3 Banner values ×
  `horario`/`matricula`/`alumnosYNotas`, 3 Planner values ×
  `secciones`/`evaluaciones`/`notas`), using the backend's suggested copy as a starting
  point.
- Treat an unrecognized/future phase value defensively: render the raw string rather than
  throwing, so a contract drift doesn't crash the screen.

## Non-goals

- No percentage or progress-bar UI. `phase` is a discrete label with no
  total/remaining count to compute a percentage from — this was an explicit backend
  scoping decision.
- No new endpoints, no change to polling cadence, or to how `useBannerScrapeRun` /
  `usePlannerScrapeRun` fetch — `phase` rides on the existing status-poll and list
  responses.
- No change to `SCRAPE_STATUS_COLORS` / `PLANNER_SCRAPE_STATUS_COLORS` or to `status`
  semantics — `phase` is additive alongside `status`, not a replacement for it.
- No separate "terminal phase" concept — once `status` reaches a terminal value, the UI
  keeps showing whatever `phase` last held; no special-casing needed beyond "don't hide
  it."
- No handling of phase for `AuthSessionStatus` / `BannerSessionStatus` /
  `PlannerSessionStatus` (the login-session status types) — `phase` only applies to scrape
  runs.

## Acceptance criteria

1. **AC-1** — Given a running Banner or Planner scrape run whose `phase` is non-null, when
   viewing `ScrapeRunProgress` / `PlannerScrapeRunProgress`, then a human-readable phase
   label is shown next to the status `Badge`.
2. **AC-2** — Given a scrape run whose `phase` is `null`, when viewing the progress card,
   then no phase label is rendered (no broken or empty label sits next to the status
   `Badge`).
3. **AC-3** — Given a Banner or Planner run-history list containing a run whose `phase` is
   non-null, when viewing `ScrapeRunHistory` / `PlannerScrapeRunHistory`, then that row
   shows the phase label.
4. **AC-4** — Given a run whose `status` has reached a terminal value
   (`completed`/`partial`/`failed`/`expired`) and whose `phase` was last set to some value,
   when viewed in either the progress card or the history table, then the last-known phase
   is still shown (not hidden just because `status` is terminal).
5. **AC-5** — Given a `phase` value the frontend doesn't recognize (defensive/contract-drift
   case), when rendered, then the raw string is shown instead of the component throwing.
6. **AC-6** — Given the updated types (`ScrapeRun`, `ScrapeRunSummary`, `PlannerScrapeRun`,
   `PlannerScrapeRunSummary`), when the backend's `openapi.json` on `staging` is fetched and
   compared, then the `phase` field and its union values match exactly (verified via
   `/abet-verify-contract` before merge, per the cross-repo ordering rule below).
7. **AC-7** — Given all new phase-label copy, when inspected, then every string is sourced
   via `t('key')` from both `src/language/locales/es.json` and `en.json` — no hardcoded
   Spanish or English strings.
8. **AC-8** — Given the finished change, when running `npx tsc --noEmit` and `pnpm lint`,
   then both are clean (per this repo's verification gate — there is no test runner).

### Traceability

| AC  | Criterion                                                                                         | Satisfied by                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Phase label next to status Badge in both progress cards                                           | `ScrapePhaseLabel`/`PlannerScrapePhaseLabel` rendered in `ScrapeRunProgress.tsx`/`PlannerScrapeRunProgress.tsx` (Tasks 2.2, 3.2)       |
| 2   | Null phase renders no label                                                                       | `ScrapePhaseLabel`/`PlannerScrapePhaseLabel` early-return on `phase === null` (Tasks 2.1, 3.1)                                         |
| 3   | ~~Phase label visible in both history tables~~ — reverted, see Scope reduction (2026-08-21) below | Removed from `ScrapeRunHistory.tsx`/`PlannerScrapeRunHistory.tsx` — phase now shows only on the progress cards (AC-1)                  |
| 4   | Terminal-status runs keep showing last-known phase                                                | No `status`-based branching in the label components — renders purely off `phase` (design.md § AC-4)                                    |
| 5   | Unrecognized phase value falls back to raw string, no crash                                       | `SCRAPE_PHASE_LABEL_KEYS`/`PLANNER_SCRAPE_PHASE_LABEL_KEYS` membership check with raw-string fallback (Tasks 2.1, 3.1)                 |
| 6   | Types match backend `openapi.json` on `staging` exactly                                           | `ScraperPhase`/`PlannerScraperPhase` in `types/index.ts` (Task 1.1), verified against the live schema in `design.md` § Contract status |
| 7   | All phase copy goes through `t()` + both locale files                                             | `banner.run.phase.*`/`planner.run.phase.*` keys in `es.json`/`en.json` (Tasks 2.2, 3.2)                                                |
| 8   | `tsc --noEmit` and `pnpm lint` clean                                                              | Task 4.2 (repo-wide gate)                                                                                                              |

## Dependencies

- **Backend PR #121** (`UPC-ABET/BACK-ACREDITACION-3.0`, branch
  `feat/scrape-progress-and-performance`) — additive `phase` field on
  `ScrapeRunStatusResponseDto`, `RunSummaryResponseDto`, `PlannerScrapeRunStatusResponseDto`,
  `PlannerRunSummaryResponseDto`. Not yet merged to `develop`, not yet on `staging`.
- **Ordering rule (per this repo's cross-repo convention):** this frontend change may be
  designed and implemented now, but **must not merge** until the backend PR has reached the
  backend's `staging` branch — confirmed by fetching that repo's own `openapi.json` at each
  branch in the promotion chain via `gh api`, never assumed from a local checkout. This is
  exactly what `/abet-verify-contract` is for; run it before `/abet-create-pr` on this
  change.

## Risks

| Risk                                                                                              | Impact                                               | Mitigation                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend PR #121 isn't merged yet — exact union values or field shape could still shift.           | Frontend types could drift from what actually ships. | Re-verify the four schemas' `phase` field against `staging`'s `openapi.json` via `/abet-verify-contract` before merging; don't finalize types as "confirmed" until then. |
| Adding a phase column/label to already-dense history tables (7 columns today) could crowd the UI. | Minor UX regression on the history screens.          | Left to `/abet-design-feature` to decide: dedicated column vs. folding the label into the existing status cell as a secondary line.                                      |

## Open questions

None — the one open scoping question (whether phase should also appear in the run-history
tables, not just the single-run progress cards) was resolved with the requester: **yes,
both.**

---

### Scope reduction — remove phase from history tables (2026-08-21)

After this change shipped to production (PR #110), the requester decided the phase label
should show only on the single-run progress cards, not in the history tables — AC-3 is
reversed. This does not change AC-1, AC-2, AC-4, AC-5, AC-6, AC-7, or AC-8: `phase` is still
on the types, still rendered on `ScrapeRunProgress`/`PlannerScrapeRunProgress`, still
defensively handled for unrecognized values. Only the history-table rendering (previously
folded into the `status` cell) is removed. See `tasks.md` § Unplanned for the implementing
task.
