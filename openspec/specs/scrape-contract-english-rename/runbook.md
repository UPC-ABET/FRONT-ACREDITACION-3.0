# Runbook — Adopt the English scraping wire contract

**Slug**: `scrape-contract-english-rename`

The manual validation plan for this change. Every acceptance criterion here is verified by
hand — there is no test runner in this repo (`docs/POLICIES.md` § Verification Gate).

## ⚠️ Deploy prerequisite

None to arrange — the backend side (`BACK-ACREDITACION-3.0` PR #124) is already on
`production`. This is purely a frontend catch-up; there is no ordering constraint left and
nothing to schedule around. That said, **this change should ship as soon as it's ready**:
until it does, the live Banner/Planner history tables, progress cards, and scraping-exports
status are silently reading stale field names (see `proposal.md` § Problem).

```bash
# nothing to run
```

## Manual validation

Requires a reachable backend already on the new (English) contract — since it's live on
`production`, any environment pointed at the real backend qualifies — and permission to
start a Banner scrape, a Planner scrape, and trigger a scraping-export status call.

| #   | Step                                                                                                                                                                                                                                               | Expected                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Start a Banner scrape; watch it run to completion                                                                                                                                                                                                  | `ScrapeRunProgress` and `ScrapeRunHistory` show real `level`/`period`/`departments` values, not blank/`undefined` cells                                                               |
| 2   | While the Banner scrape is `running`, watch the phase label on `ScrapeRunProgress`                                                                                                                                                                 | A translated label ("Fetching schedules"/"Fetching enrollments"/"Fetching students & grades") appears and advances — never the raw `schedule`/`enrollment`/`studentsAndGrades` string |
| 3   | Once the Banner scrape reaches the `studentsAndGrades` phase and finishes                                                                                                                                                                          | `ScrapeRunProgress`'s `StatsDetail` shows **four** count tiles (schedules/enrollments/students/grades), and `ScrapeRunHistory`'s counts cell shows four values, not three             |
| 4   | Start a Planner scrape; watch it run to completion                                                                                                                                                                                                 | `PlannerScrapeRunProgress` and `PlannerScrapeRunHistory` show real `period`/`school` values                                                                                           |
| 5   | While the Planner scrape is `running`, watch the phase label on `PlannerScrapeRunProgress`                                                                                                                                                         | A translated label ("Fetching sections"/"Fetching evaluations"/"Fetching grades") appears and advances — never the raw `sections`/`evaluations`/`grades` string                       |
| 6   | Open `PlannerScrapeRunHistory` for a period with at least one run                                                                                                                                                                                  | A `school` column is present, showing a real school code or `-` for an unscoped run                                                                                                   |
| 7   | Open either history table                                                                                                                                                                                                                          | The "Triggered by" column shows a human-readable name (or `-`), never a raw `"user:12"`-style reference                                                                               |
| 8   | Open the Exports tab (`ScrapingExportsView`) for an export type with a prior successful generation                                                                                                                                                 | The status card's period-dependent copy/state is correct — no longer silently reading `''` for `period`                                                                               |
| 9   | Switch the UI language (es ↔ en) while any of the above is visible                                                                                                                                                                                 | All labels change language correctly; no missing-key placeholder shown                                                                                                                |
| 10  | Run the sweep: `rg "periodo\|nivel\|departamentos\|cursos\|escuela\|horario\|matricula\|alumnosYNotas\|secciones\|evaluaciones\|\bnotas\b" src/modules/banner src/modules/planner src/modules/scraping-exports --include='*.ts' --include='*.tsx'` | Every remaining hit is an i18n key **name** or a comment referencing the old contract — no live code reference                                                                        |
| 11  | `npx tsc --noEmit` and `pnpm lint`, run repo-wide                                                                                                                                                                                                  | Both clean                                                                                                                                                                            |

## Data validation

Not applicable — no database, migration, or backfill involved. Every field in this change
is read live from the backend's existing (already-migrated) response shapes.

## Symptom → diagnosis

| Symptom                                                                | Likely cause                                                                                                                                | Check                                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Banner/Planner history row shows blank period/level/school/departments | This change hasn't shipped yet, or a call site still reads the old Spanish key                                                              | Run the § Manual validation step 10 sweep; check the specific component against `tasks.md` |
| Phase label shows the raw English enum string instead of a translation | `SCRAPE_PHASE_LABEL_KEYS`/`PLANNER_SCRAPE_PHASE_LABEL_KEYS` wasn't re-keyed to match the renamed `ScraperPhase`/`PlannerScraperPhase` union | Compare the constant map's keys against the type union in `types/index.ts`                 |
| Banner grades count tile/column missing                                | Task 2.1/2.2 not applied, or `ScrapeCounts` still missing `nota`                                                                            | Check `ScrapeCounts` in `banner/types/index.ts` and the two component files                |
| Planner history table has no `school` column                           | Task 4.1 not applied                                                                                                                        | Check `PlannerScrapeRunHistory.tsx`'s column definitions                                   |
| "Triggered by" column still shows a raw `"user:12"`-style string       | Cell still reads `.triggeredBy` instead of `.triggeredByName`                                                                               | Check both history tables' `triggeredBy` column `cell`                                     |
| Scraping-export status shows an empty period                           | `normalizeStatusResponse` in `scrapingExportsService.ts` still reads `wire.periodo`                                                         | Check `ScrapingExportStatusWire`/`normalizeStatusResponse`                                 |

## How to revert

No migration or data rewrite — reverting the code is sufficient. Reverting this change
re-introduces the live production bug it fixes (stale Spanish field reads against the
already-renamed backend contract), so only revert if a genuine regression is found in this
change itself, not as a way to "undo the backend rename" — that rename already shipped and
cannot be reverted from this repo.

```bash
git revert <commit-sha>   # for each commit in this change, newest first
```

## Do NOT

- Do not rename the i18n key **names** (e.g. `banner.run.phase.horario`,
  `banner.history.col.nivel`) as part of this change — only the code that maps
  types/enum values to those keys changes. See `design.md` § AC-3/AC-6.
- **Superseded 2026-08-21** — this originally said not to rename `ScrapeCounts.nota` /
  `PlannerScrapeCounts.nota`, since PR #124 hadn't touched the backend's untyped
  `stats.counts` object. The backend has since renamed it too (see `proposal.md` § Scope
  extension, `tasks.md` § Unplanned, Tasks U.1/U.2) — `ScrapeCounts`/`PlannerScrapeCounts`
  are now `{ schedule, enrollment, students, grades }` / `{ sections, evaluations, grades }`.
  The rule that still applies: **do not invent an English name the backend hasn't actually
  chosen** — every rename in this repo must trace to a confirmed backend change (spec or
  source), never a guess.
- Do not add a UI for choosing `level`/`departments`/`courses` overrides at scrape-start as
  part of this change — out of scope (`proposal.md` § Non-goals); only the field names the
  (currently unused) override path would send are being fixed.
- Do not remove `triggeredBy` from either type — it's unchanged on the wire and stays typed
  even though no component currently reads it after this change adds `triggeredByName`.
