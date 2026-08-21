# Runbook — Scrape progress and performance

**Slug**: `scrape-progress-and-performance`

The manual validation plan for this change. Every acceptance criterion here is verified by
hand — there is no test runner in this repo (`docs/POLICIES.md` § Verification Gate).

## ⚠️ Deploy prerequisite

None. This is a purely additive frontend UI change consuming a field the backend
(`BACK-ACREDITACION-3.0` PR #121) already ships on `staging`. No migration, no seed, no
environment variable, no deploy-time action.

```bash
# nothing to run
```

## Manual validation

Requires a reachable backend on the `staging` contract (local or otherwise) and permission
to start a Banner and a Planner scrape.

| #   | Step                                                                                                                              | Expected                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Start a Banner scrape; watch `ScrapeRunProgress` while `running`                                                                  | A phase label (e.g. "Fetching schedules") appears next to the status Badge and advances through `horario → matricula → alumnosYNotas` as the run progresses |
| 2   | Same, for a Planner scrape                                                                                                        | Phase label advances through `secciones → evaluaciones → notas`                                                                                             |
| 3   | Open a progress card immediately after starting a run, before the first phase begins                                              | No phase label rendered — status Badge alone, no empty/broken element                                                                                       |
| 4   | Open `ScrapeRunHistory` / `PlannerScrapeRunHistory` while at least one row is `running`                                           | That row's status cell shows the phase label as a second line under the Badge; no new 8th column, table width unchanged                                     |
| 5   | Let a run reach a terminal status (`completed`/`partial`/`failed`/`expired`)                                                      | The last-known phase label is still shown in both the progress card and the history row — not hidden                                                        |
| 6   | Force an unrecognized `phase` value via browser devtools' network response override (or a local mock) on one status/list response | The raw string renders in place of a translated label; no console error, no crashed component                                                               |
| 7   | Switch the UI language (es ↔ en) while a phase label is visible                                                                   | The label's text changes language; no missing-key placeholder shown                                                                                         |
| 8   | `rg '"phase"' src/language/locales/es.json src/language/locales/en.json`                                                          | All 6 keys present in both files                                                                                                                            |
| 9   | `npx tsc --noEmit` and `pnpm lint`, run repo-wide                                                                                 | Both clean                                                                                                                                                  |

## Data validation

Not applicable — no database, migration, or backfill involved. `phase` is read live from
the backend's existing status/list responses.

## Symptom → diagnosis

| Symptom                                                                     | Likely cause                                                                                                                                                                         | Check                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Phase label never appears, even mid-run                                     | Backend response genuinely has `phase: null`, or the frontend build predates PR #121's field                                                                                         | Inspect the raw network response for the status/list call; confirm `phase` is present |
| Phase label shows the raw enum string instead of translated copy            | `SCRAPE_PHASE_LABEL_KEYS`/`PLANNER_SCRAPE_PHASE_LABEL_KEYS` missing that key, or the locale JSON key is missing/misspelled                                                           | Compare the rendered raw string against the constant map and both locale files        |
| Phase label missing from the history table but present in the progress card | The `status` cell edit in `ScrapeRunHistory.tsx`/`PlannerScrapeRunHistory.tsx` wasn't applied, or `row.original.phase` is undefined (stale cached list data from before this change) | Hard-refresh to bust the TanStack Query cache; check the column `cell` definition     |

## How to revert

No migration or data rewrite — reverting the code is sufficient.

```bash
git revert <commit-sha>   # for each commit in this change, newest first
```

## Do NOT

- Do not add a percentage or progress-bar computation on top of `phase` — this was
  explicitly scoped out (`proposal.md` § Non-goals); there is no total/remaining count to
  compute one from.
- Do not special-case `phase` display around terminal `status` values — the backend never
  resets `phase`, so no additional logic is needed or wanted (`design.md` § AC-4).
- Do not change `SCRAPE_STATUS_COLORS` / `PLANNER_SCRAPE_STATUS_COLORS` or `status`
  semantics as part of fixing anything here — `phase` is strictly additive alongside
  `status`.
