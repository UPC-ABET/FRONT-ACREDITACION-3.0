# Adopt the English scraping wire contract

**Slug**: `scrape-contract-english-rename`
**Branch**: `fix/scrape-contract-english-rename`
**Repos affected**: frontend (backend already shipped: `UPC-ABET/BACK-ACREDITACION-3.0` PR
#124, merged to `develop`/`staging`/`production` at commit `a338a612`)
**Created**: 2026-08-21

## Problem

`src/modules/banner`, `src/modules/planner`, and `src/modules/scraping-exports` still speak
the old Spanish-named wire contract for the Banner/Planner scraping endpoints and the
scraping-exports endpoints — request bodies keyed `nivel`/`departamentos`/`cursos`, response
types keyed `nivel`/`periodo`/`departamentos`/`escuela`, and `phase` enum values
`horario`/`matricula`/`alumnosYNotas` (Banner) and `secciones`/`evaluaciones`/`notas`
(Planner). BACK-ACREDITACION-3.0 PR #124 renamed all of these to English **on production
already**, as a hard cutover with no dual-field compatibility window — the old Spanish keys
are gone from the wire entirely, not deprecated-but-present.

None of the three modules normalize these fields except `scraping-exports`, and even that
module's wire-mapper (`normalizeStatusResponse` in `scrapingExportsService.ts`) still reads
the now-removed `periodo` key. Concretely, right now in production:

- `GET/POST /banner/scrape` responses/requests no longer contain `nivel`, `periodo`,
  `departamentos` — `ScrapeRunSummary` fields typed against those keys read as `undefined`.
- `GET/POST /planner/scrape` responses/requests no longer contain `periodo`, `escuela`,
  `cursos` — same problem for `PlannerScrapeRunSummary`.
- Both `phase` enums changed value sets, so `SCRAPE_PHASE_LABEL_KEYS` /
  `PLANNER_SCRAPE_PHASE_LABEL_KEYS` (keyed by the old Spanish values) no longer match any
  incoming `phase` string — `ScrapePhaseLabel`/`PlannerScrapePhaseLabel` silently fall back
  to rendering the raw (new, English) backend string instead of a translated label.
- `GET /scraping/exports/{exportType}/status|download` responses no longer contain
  `periodo` — `normalizeStatusResponse` reads `wire.periodo`, gets `undefined`, and every
  status response's `period` field silently becomes `''`.

Separately, while auditing these three modules against the backend's actual runtime stats
shape (`ScrapeStats` in the backend's `scraper.service.ts` — `stats`/`counts` are typed
`unknown`/`Object` in `openapi.json`, so this isn't visible from the spec alone), two gaps
were confirmed:

- Banner's stats counts are `{ horario, matricula, alumno, nota }` in the backend, but the
  frontend's `ScrapeCounts` type only has `horario`/`matricula`/`alumno` — the grades count
  (`nota`) is silently dropped and never shown in `ScrapeRunProgress` or
  `ScrapeRunHistory`. Planner's equivalent (`PlannerScrapeCounts.nota`) is already complete
  and already rendered.
- Planner's `school` field (`escuela` → `school`) is on `PlannerScrapeRunSummary` today but
  is never rendered anywhere in the Planner UI (no column in `PlannerScrapeRunHistory`, no
  mention in `PlannerScrapeRunProgress`).

The new `triggeredByName` field (always present, `'-'` fallback when unresolvable) also has
no home yet in either module's types or history tables — both history tables currently show
the raw `triggeredBy` reference (`"user:12"`-style) instead of a human-readable name.

## What already exists

- **Banner** (`src/modules/banner/`): `types/index.ts` (`StartScrapeRequest`,
  `ScrapeRunSummary`, `ScrapeCounts`, `ScraperPhase`), `services/bannerService.ts`
  (`startBannerScrape` builds the request body directly from `StartScrapeRequest`, no
  normalization on read), `constants/index.ts` (`SCRAPE_PHASE_LABEL_KEYS`),
  `components/ScrapePhaseLabel.tsx`, `components/ScrapeRunProgress.tsx` (`StatsDetail`),
  `components/ScrapeRunHistory.tsx`, `components/StartScrapePanel.tsx`.
- **Planner** (`src/modules/planner/`) mirrors the same shape one-for-one:
  `StartPlannerScrapeRequest`, `PlannerScrapeRunSummary`, `PlannerScrapeCounts`,
  `PlannerScraperPhase` in `types/index.ts`; `plannerService.ts`;
  `PLANNER_SCRAPE_PHASE_LABEL_KEYS` in `constants/index.ts`; `PlannerScrapePhaseLabel.tsx`,
  `PlannerScrapeRunProgress.tsx`, `PlannerScrapeRunHistory.tsx`,
  `PlannerStartScrapePanel.tsx`.
- **Scraping exports** (`src/modules/scraping-exports/`): `services/scrapingExportsService.ts`
  already has a `ScrapingExportStatusWire` interface and `normalizeStatusResponse()` mapping
  the raw wire shape to the typed `ScrapingExportStatusResponse` — this is the one place in
  the three modules that already does wire-normalization, it just needs its `periodo` read
  updated to `period`. `types/index.ts` (`ScrapingExportGenerated.period`) and
  `components/ScrapingExportsView.tsx` already use the English field name `period`
  internally, so no downstream consumer changes are needed there.
- Prior art: `openspec/specs/scrape-progress-and-performance/` (added the `phase` field and
  its label components — the exact components this change now has to re-key) and
  `openspec/specs/scrape-retention-and-cached-exports/` (rewrote the scraping-exports module
  to its current shape, including the `normalizeStatusResponse` wire-mapping pattern this
  change extends rather than invents).

## Goals

- Rename every request/response field the backend renamed, across all three modules, so the
  types and services match `openapi.json` at `ref=a338a612` (or later) exactly:
  - Banner: `nivel`→`level`, `departamentos`→`departments` (request); same plus
    `periodo`→`period` (response).
  - Planner: `nivel`→`level`, `cursos`→`courses` (request); `periodo`→`period`,
    `escuela`→`school` (response).
  - Scraping exports: `periodo`→`period` in `normalizeStatusResponse`'s wire-read only (the
    rest of the module already speaks `period`).
- Update both `phase` enums and their label-key maps to the new English values:
  `horario`/`matricula`/`alumnosYNotas` → `schedule`/`enrollment`/`studentsAndGrades`
  (Banner); `secciones`/`evaluaciones`/`notas` → `sections`/`evaluations`/`grades`
  (Planner).
- Add `triggeredByName: string` to `ScrapeRunSummary` and `PlannerScrapeRunSummary`
  (`triggeredBy: string | null` stays, unchanged), and display it in both history tables.
- Add the missing grades count to Banner: extend `ScrapeCounts` with `nota: number` and
  render a fourth count tile in `ScrapeRunProgress`'s `StatsDetail` plus include it in
  `ScrapeRunHistory`'s counts column, matching how Planner already renders its `nota` count.
- Display Planner's `school` field somewhere in the Planner UI (history table and/or
  progress card) — currently parsed but never shown.
- Leave every other field/enum untouched: `status` values, export `status` values, route
  paths, HTTP methods, headers, auth/permissions, `fatal`/`errors`/`uniqueStudents`/
  `uniqueSections`/department-and-course breakdown shapes.

## Non-goals

- No backend changes — this repo only consumes the already-shipped contract.
- No new UI for choosing `level`/`departments`/`courses` overrides at scrape-start —
  `StartScrapePanel`/`PlannerStartScrapePanel` call the mutation with no payload today; this
  change only fixes the field names the (currently unused) override path would send.
- No change to `status` enum handling, `SCRAPE_STATUS_COLORS`/`PLANNER_SCRAPE_STATUS_COLORS`,
  or the grades-rc single-flight/`409` handling in `scraping-exports`.
- No change to route paths, HTTP methods, headers (`X-Academic-Period-Id`, etc.), or
  auth/permission requirements — the task description confirms these are unaffected.
- The i18n key **names** used internally (e.g. `banner.run.phase.horario`,
  `planner.history.col.periodo`) are identifiers for this repo's translation files, not wire
  fields — whether to rename them for readability alongside the type rename is an
  implementation detail for `/abet-design-feature` to decide, not a contract requirement.
- Not auditing modules outside Banner/Planner/scraping-exports for other undisplayed backend
  fields — the "show everything" ask in this proposal is scoped to what these three modules'
  own DTOs carry.

## Acceptance criteria

1. **AC-1** — Given `StartScrapeRequest` and `startBannerScrape()`'s request-body builder,
   when inspected, then the keys are `level`/`departments` — not `nivel`/`departamentos`.
2. **AC-2** — Given a Banner scrape-run list or detail response, when parsed by
   `ScrapeRunSummary`/related types, then the fields read are `level`, `period`,
   `departments` — not `nivel`/`periodo`/`departamentos`.
3. **AC-3** — Given a Banner scrape run's `phase`, when rendered via `ScrapePhaseLabel`
   (single-run card) — `phase` is intentionally not shown in the history table per the prior
   scope reduction — then the recognized values are `schedule`/`enrollment`/
   `studentsAndGrades`, each resolving to a translated label via `t()`.
4. **AC-4** — Given `StartPlannerScrapeRequest` and `startPlannerScrape()`'s request-body
   builder, when inspected, then the keys are `level`/`courses` — not `nivel`/`cursos`.
5. **AC-5** — Given a Planner scrape-run list or detail response, when parsed by
   `PlannerScrapeRunSummary`/related types, then the fields read are `period`, `school` — not
   `periodo`/`escuela`.
6. **AC-6** — Given a Planner scrape run's `phase`, when rendered via
   `PlannerScrapePhaseLabel`, then the recognized values are `sections`/`evaluations`/
   `grades`, each resolving to a translated label via `t()`.
7. **AC-7** — Given a scraping-export status/regenerate response, when parsed by
   `normalizeStatusResponse`, then the wire key read is `period` — not `periodo`.
8. **AC-8** — Given `ScrapeRunSummary` and `PlannerScrapeRunSummary`, when inspected, then
   both include `triggeredByName: string` alongside the unchanged `triggeredBy: string |
null`; given either history table, then the `triggeredBy` column displays
   `triggeredByName`.
9. **AC-9** — Given a Banner scrape run's `stats.counts`, when `ScrapeRunProgress` renders
   `StatsDetail`, then a fourth tile shows the grades count (`stats.counts.nota`) alongside
   `horario`/`matricula`/`alumno`.
10. **AC-10** — Given a Banner scrape run's `counts`, when shown in `ScrapeRunHistory`'s
    counts column, then all four counts are represented, not three.
11. **AC-11** — Given a Planner scrape run's `school` field, when viewing the Planner
    module's UI (history table and/or progress card, per design), then the value is visibly
    displayed somewhere it currently is not.
12. **AC-12** — Given the finished change, when grepping `src/modules/{banner,planner,
scraping-exports}` for the old wire-contract identifiers used as object keys or enum
    values (`nivel`, `departamentos`, `cursos`, `periodo`, `escuela`, `horario`, `matricula`,
    `alumnosYNotas`, `secciones`, `evaluaciones`, `notas` — excluding i18n key **names**,
    which are out of scope per Non-goals), then no live references remain.
13. **AC-13** — Given the finished change, when running `npx tsc --noEmit` and `pnpm lint`,
    then both are clean (per this repo's verification gate — there is no test runner).

### Traceability

| AC  | Criterion                                                           | Satisfied by                                                                                                                                  |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Banner request body uses `level`/`departments`                      | `banner/types/index.ts` (`StartScrapeRequest`), `banner/services/bannerService.ts` (`startBannerScrape`) — tasks.md Tasks 1.1, 1.2            |
| 2   | Banner response types use `level`/`period`/`departments`            | `banner/types/index.ts` (`ScrapeRunSummary`) — tasks.md Task 1.1                                                                              |
| 3   | Banner `phase` enum + label map renamed, still translated           | `banner/types/index.ts` (`ScraperPhase`), `banner/constants/index.ts` (`SCRAPE_PHASE_LABEL_KEYS`) — tasks.md Tasks 1.1, 1.3                   |
| 4   | Planner request body uses `level`/`courses`                         | `planner/types/index.ts` (`StartPlannerScrapeRequest`), `planner/services/plannerService.ts` (`startPlannerScrape`) — tasks.md Tasks 3.1, 3.2 |
| 5   | Planner response types use `period`/`school`                        | `planner/types/index.ts` (`PlannerScrapeRunSummary`) — tasks.md Task 3.1                                                                      |
| 6   | Planner `phase` enum + label map renamed, still translated          | `planner/types/index.ts` (`PlannerScraperPhase`), `planner/constants/index.ts` (`PLANNER_SCRAPE_PHASE_LABEL_KEYS`) — tasks.md Tasks 3.1, 3.3  |
| 7   | Scraping-exports wire-mapper reads `period`                         | `scraping-exports/services/scrapingExportsService.ts` (`ScrapingExportStatusWire`, `normalizeStatusResponse`) — tasks.md Task 5.1             |
| 8   | `triggeredByName` added to both types, shown in both history tables | `banner/types/index.ts`, `planner/types/index.ts`; `ScrapeRunHistory.tsx`, `PlannerScrapeRunHistory.tsx` — tasks.md Tasks 1.1, 3.1, 2.1, 4.1  |
| 9   | Banner grades count (`nota`) shown in `ScrapeRunProgress`           | `banner/types/index.ts` (`ScrapeCounts`), `ScrapeRunProgress.tsx` (`StatsDetail`) — tasks.md Tasks 1.1, 2.2                                   |
| 10  | Banner grades count (`nota`) shown in `ScrapeRunHistory`            | `ScrapeRunHistory.tsx` counts cell — tasks.md Task 2.1                                                                                        |
| 11  | Planner `school` field shown somewhere in the Planner UI            | `PlannerScrapeRunHistory.tsx` new `school` column — tasks.md Task 4.1                                                                         |
| 12  | No old Spanish wire identifiers remain (grep-verified)              | tasks.md Task 6.1                                                                                                                             |
| 13  | `tsc --noEmit` and `pnpm lint` clean                                | tasks.md Task 6.2                                                                                                                             |

## Dependencies

- **Backend PR #124** (`UPC-ABET/BACK-ACREDITACION-3.0`) — already merged to `develop`,
  `staging`, and `production` at commit `a338a612`. There is no ordering constraint left to
  satisfy (unlike the two prior scraping changes, which had to wait on backend promotion) —
  this change can implement and merge immediately, and in fact should be prioritized since
  the current production frontend is silently reading/writing the wrong field names against
  a backend that no longer speaks them.
- Run `/abet-verify-contract` before `/abet-create-pr` per standard policy, confirming the
  four DTOs against `openapi.json` at `ref=staging` (or `ref=production`) one more time at
  merge time.

## Risks

| Risk                                                                                                                                                                                                                                                                                                              | Impact                                                                                                                                                          | Mitigation                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This is a live production regression, not just a stale-contract cleanup — Banner/Planner run history and scraping-exports status have been silently misreading fields since PR #124 shipped to production.                                                                                                        | Users may already be seeing blank periods/departments/school, untranslated phase labels, or empty export periods.                                               | Treat this change as high priority; no additional mitigation needed beyond shipping it — the fix is the mitigation.                                                                             |
| `stats`/`counts` are untyped (`unknown`/`Object`) in `openapi.json`, so the `nota` count and other stats-internal field names were confirmed by reading the backend's `scraper.service.ts` source via `gh api`, not from the committed spec.                                                                      | If the backend changes the internal `stats` shape without updating `openapi.json` (since it's not spec-tracked), this frontend type could silently drift again. | Out of scope to fix backend spec coverage here; flag it as a known gap so a future stats-shape change isn't assumed covered by `/abet-verify-contract`.                                         |
| Renaming `Record<ScraperPhase, string>` / `Record<PlannerScraperPhase, string>` label-key maps must stay exhaustive — a missed key silently falls back to the raw string (existing defensive behavior from `scrape-progress-and-performance`), which would hide a translation regression rather than fail loudly. | A renamed phase value with no matching i18n key shows an untranslated raw string in production.                                                                 | `design.md`/`tasks.md` should call out updating all three label-key entries per enum in the same commit as the type rename, and manual verification should include triggering each phase value. |

## Open questions

None — the rename mapping is fully specified by the backend team's summary and confirmed
directly against the merged `openapi.json` (`ref=a338a612`) and the backend's
`scraper.service.ts`/`planner-scraper.service.ts` source for the two fields (`stats.counts`,
`school`) not covered by the spec. The two "show everything" gaps (Banner grades count,
Planner school field) were confirmed as real, verifiable omissions, not guessed.

---

### Scope extension — `stats.counts` field rename (2026-08-21)

The backend renamed the `stats.counts` field names on `RunSummaryResponseDto`/
`PlannerRunSummaryResponseDto` (`GET /banner/scrape`, `GET /planner/scrape`, and their
`/:runId` variants) from Spanish to English — the exact class of field this proposal's own
Risks table flagged as unprotected ("`stats`/`counts` are untyped in `openapi.json`... if
the backend changes the internal `stats` shape without updating `openapi.json`, this
frontend type could silently drift again"). Same hard-cutover rules as the original rename:
no dual-field compatibility window.

- Banner (`ScrapeCounts`): `horario`→`schedule`, `matricula`→`enrollment`,
  `alumno`→`students`, `nota`→`grades`.
- Planner (`PlannerScrapeCounts`): `seccion`→`sections`, `evaluacion`→`evaluations`,
  `nota`→`grades`.

Independently confirmed against the backend's `scraper.service.ts`/
`planner-scraper.service.ts` on `develop` via `gh api` (not just the report) before
touching any code — `counts: { schedule, enrollment, students, grades }` (Banner) and
`counts: { sections, evaluations, grades }` (Planner), matching exactly.

New acceptance criteria, numbered continuing from AC-13:

14. **AC-14** — Given `ScrapeCounts`, when inspected, then its fields are `schedule`,
    `enrollment`, `students`, `grades` — not `horario`/`matricula`/`alumno`/`nota`.
15. **AC-15** — Given `PlannerScrapeCounts`, when inspected, then its fields are
    `sections`, `evaluations`, `grades` — not `seccion`/`evaluacion`/`nota`.
16. **AC-16** — Given every component that reads `stats.counts`/`counts`
    (`ScrapeRunHistory.tsx`, `ScrapeRunProgress.tsx`, `PlannerScrapeRunHistory.tsx`,
    `PlannerScrapeRunProgress.tsx`), when inspected, then all four read the renamed field
    names.
17. **AC-17** — Given the finished change, when grepping `src/modules/{banner,planner}`
    for the old count field identifiers used as object keys (`horario`, `matricula`,
    `alumno`, `seccion`, `evaluacion` — `nota` excluded from the grep since it's still a
    live i18n key name/comment substring elsewhere), then no live references remain.
18. **AC-18** — Given the finished change, when running `npx tsc --noEmit` and
    `pnpm lint`, then both are clean.

#### Traceability (scope extension)

| AC  | Criterion                                     | Satisfied by                                                                                                   |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 14  | `ScrapeCounts` fields renamed                 | `banner/types/index.ts`                                                                                        |
| 15  | `PlannerScrapeCounts` fields renamed          | `planner/types/index.ts`                                                                                       |
| 16  | All 4 read sites updated                      | `ScrapeRunHistory.tsx`, `ScrapeRunProgress.tsx`, `PlannerScrapeRunHistory.tsx`, `PlannerScrapeRunProgress.tsx` |
| 17  | No old Spanish count-field identifiers remain | grep sweep                                                                                                     |
| 18  | `tsc --noEmit` and `pnpm lint` clean          | repo-wide gate                                                                                                 |

---
