# Design — Adopt the English scraping wire contract

**Slug**: `scrape-contract-english-rename`
**Proposal**: `./proposal.md`

## Read first

- `./proposal.md` — the 13 ACs this design must satisfy.
- `docs/POLICIES.md` § TypeScript (no `any`), § Data Fetching (services are thin, typed
  pass-throughs except where a wire-mapper already exists), § i18n (`t('key')` + locale
  JSON, no hardcoded strings), § Verification Gate (no test runner — `tsc` + `pnpm lint` +
  manual is the bar).
- `docs/CONTEXT.md` § Related Repositories → Cross-repo change model (sequential, backend's
  committed `openapi.json` is the contract), § Business Rules rule 4 (Planner session
  precedent, unaffected by this change).
- `openspec/specs/scrape-progress-and-performance/` — prior art for this exact module pair
  (added `phase` + its label components; this change re-keys those same enums) and for the
  "Contract status" section format this design reuses.
- `openspec/specs/scrape-retention-and-cached-exports/` — prior art for the
  `normalizeStatusResponse` wire-mapping pattern in `scraping-exports`, which this change
  extends by one field rather than inventing a new pattern.
- `src/modules/banner/{types,services,constants,components,hooks}/*` — full module read;
  every Spanish-keyed call site was swept with `rg` (see § Contract status) rather than
  assumed from the type files alone.
- `src/modules/planner/{types,services,constants,components,hooks}/*` — same, mirror module.
- `src/modules/scraping-exports/services/scrapingExportsService.ts` — the one existing
  wire-normalization layer in these three modules.
- `src/language/locales/{es,en}.json` lines 201–396 — the `banner.*`/`planner.*` trees this
  change edits; both files are structurally identical at these line numbers, confirmed by
  `grep -n`.
- No ADR exists yet (`docs/adr/` has only its `README.md` index).

## Contract status

Checked directly against the backend's committed spec, fetched via `gh api` at the merge
commit named in the proposal (never a local checkout):

```bash
gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=a338a612" \
  -H "Accept: application/vnd.github.raw"
```

All five renamed DTOs (`RunScrapeDto`, `RunSummaryResponseDto`, `RunPlannerScrapeDto`,
`PlannerRunSummaryResponseDto`, `ScrapingExportStatusResponseDto`) match the proposal
exactly — confirmed field-by-field in `proposal.md`'s research, not re-pasted here. Two
additional facts confirmed at design time that the spec alone doesn't show (`stats`/`counts`
are typed `unknown`/`Object` in `openapi.json`), read instead from the backend's own service
source via `gh api`:

- Banner's runtime `ScrapeStats.counts` shape (`scraper.service.ts` line 37) is
  `{ horario: number; matricula: number; alumno: number; nota: number }` — four fields, one
  more than the frontend's current `ScrapeCounts` (three).
- Planner's runtime `ScrapeStats.counts` shape (`planner-scraper.service.ts` line 55) is
  `{ seccion: number; evaluacion: number; nota: number }` — matches the frontend's
  `PlannerScrapeCounts` exactly already; no gap on the Planner side.

Since `commit a338a612` is stated as already on `develop`/`staging`/`production`, this
change has no ordering constraint left to satisfy — unlike the two prior scraping changes,
which had to wait on backend promotion.

## ADR gate (walked, not skipped)

| Trigger                                       | Hit?                                                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datastore, broker or cache choice             | No                                                                                                                                                            |
| Auth or payments provider                     | No                                                                                                                                                            |
| Public API contract change or breaking change | Partially — the backend already made and shipped this decision (PR #124); this change only updates the frontend to match. No new decision is being made here. |
| New module boundary or cross-repo split       | No — reuses the existing `banner`/`planner`/`scraping-exports` modules and the existing sequential cross-repo pattern.                                        |
| Language, runtime or framework                | No                                                                                                                                                            |
| Contradicting an existing ADR                 | No — `docs/adr/` has no numbered ADRs yet.                                                                                                                    |

**Conclusion**: no ADR required. This is a mechanical contract-sync plus two small,
low-risk UI additions (a count tile, a table column) — not an architectural decision.

## Approach

### AC-1 / AC-4 — Request body field rename (Banner `level`/`departments`, Planner

`level`/`courses`)

`StartScrapeRequest`/`StartPlannerScrapeRequest` (types) and
`startBannerScrape`/`startPlannerScrape` (services) are renamed together — the type defines
the contract, the service's body-builder consumes it. Both builders keep their existing
"only include the key if a value was actually passed" shape (`...(payload.level ?
{ level: payload.level } : {})`), just re-keyed. No behavior change: `StartScrapePanel`/
`PlannerStartScrapePanel` still call the mutation with no payload (confirmed — neither
component has a level/department/course picker), so this is a type-and-dead-code-path fix
today, not a runtime-visible change, but it stops the override path from being silently
wrong the moment either component grows a picker.

### AC-2 / AC-5 — Response field rename (Banner `level`/`period`/`departments`, Planner

`period`/`school`)

`ScrapeRunSummary`/`PlannerScrapeRunSummary` (and `ScrapeRun`'s nested types where
applicable) are re-keyed to match the confirmed schemas. Neither `bannerService.ts` nor
`plannerService.ts` has a wire-normalization layer — both do a generic, type-only
`getApiData<T>(res)` pass-through — so renaming the field in the type is the entire fix;
nothing in the service body changes. Every call site that reads the old key by name is
swept in the same task as the type change (§ Sweep below), since `tsc --noEmit` alone won't
catch a `DataTable`'s `accessorKey: 'nivel'` string literal — that's a plain string, not a
typed property access, so a stale accessor silently renders nothing instead of failing to
compile.

### AC-3 / AC-6 — `phase` enum rename, still translated, still defensive

Same rename shape for both modules: `ScraperPhase`/`PlannerScraperPhase`'s three literal
values change, and `SCRAPE_PHASE_LABEL_KEYS`/`PLANNER_SCRAPE_PHASE_LABEL_KEYS`
(`Record<ScraperPhase, string>` / `Record<PlannerScraperPhase, string>`) are re-keyed to
match — `tsc` enforces this pair stays exhaustive, since a `Record<T, string>` with a
missing key is a compile error, not a silent gap. `ScrapePhaseLabel`/
`PlannerScrapePhaseLabel` themselves need **no code change** — their membership-check +
raw-string-fallback logic (`scrape-progress-and-performance`'s AC-5) is already keyed
generically off whatever `ScraperPhase` is at compile time, so it stays defensive against a
genuinely new future value with zero changes here.

**Design decision**: the i18n key **names** (`banner.run.phase.horario`, etc.) are left
unrenamed — only the `Record` values (which key of the locale tree each phase maps to) move
to point at the same, still-Spanish-named keys. Per `proposal.md`'s Non-goals this is not
contract-mandated, and renaming ~10 i18n keys across two locale files for a purely cosmetic
internal-identifier change adds diff noise without changing anything user-visible (the
_translated text_ — "Fetching schedules" / "Obteniendo horarios" — is unaffected either
way). Kept as a design note here rather than silently decided, per the ADR-gate-adjacent
principle of writing down the reasoning for a call a reviewer might otherwise question.

### AC-7 — Scraping-exports wire mapper reads `period`

One-line change: `ScrapingExportStatusWire.periodo?: string` → `.period?: string`, and
`normalizeStatusResponse`'s `period: wire.periodo ?? ''` → `period: wire.period ?? ''`. The
explanatory comment above the interface (`// The backend's wire field is periodo...`) is
updated to stop asserting a now-false fact. Nothing downstream changes — `types/index.ts`
(`ScrapingExportGenerated.period`) and every consumer already read `period`, since this
module's own internal shape was always English; only the wire-read key was wrong.

### AC-8 — `triggeredByName` added to both types, shown in both history tables

`triggeredByName: string` (never null, `'-'` fallback per the backend) is added alongside
the existing `triggeredBy: string | null` on both `ScrapeRunSummary` and
`PlannerScrapeRunSummary` — additive, no rename. Both history tables' existing
`triggeredBy` column changes its `cell` from `row.original.triggeredBy ?? none` to
`row.original.triggeredByName` — the backend's own `'-'` fallback replaces the frontend's
local `none` fallback for this column specifically (the column header key
`col.triggeredBy` is left as-is; only the cell's data source changes, so the visible label
"Ejecutado por"/"Triggered by" is unaffected). `triggeredBy` itself stays on the type,
unused by any component today — kept because the proposal is explicit that it's unchanged
on the wire, and removing an otherwise-valid typed field the backend still sends is out of
scope for a rename-and-display change.

### AC-9 / AC-10 — Banner grades count added to `ScrapeCounts`, progress card, and history

`ScrapeCounts` gains `nota: number` (kept as `nota`, not renamed to `grade`/`grades` — this
field lives inside the untyped `stats`/`counts` object the backend never renamed in PR #124;
renaming it here would be inventing a contract change the backend didn't make). Three call
sites follow directly from the type change:

1. `ScrapeRunProgress.tsx`'s `StatsDetail` gets a fourth `CountTile` —
   `t('banner.run.counts.nota')` / `stats.counts.nota` — inserted after the existing
   `alumno` tile and before `uniqueStudents`, matching Planner's `StatsDetail` tile order
   (`seccion`, `evaluacion`, `nota`, `uniqueSections`) so the two modules read the same way:
   three raw counts, then the "unique X" summary tile last.
2. `ScrapeRunHistory.tsx`'s `counts` cell template changes from
   `` `${counts.horario} / ${counts.matricula} / ${counts.alumno}` `` to include `.nota`,
   mirroring Planner's three-value template exactly.
3. The `banner.history.col.counts` label — `"Conteos (H/M/A)"` / `"Counts (S/E/St)"` —
   gains the fourth initial (`"Conteos (H/M/A/N)"` / `"Counts (S/E/St/G)"`) in both locale
   files, matching Planner's `"Conteos (S/E/N)"` / `"Counts (S/E/G)"` pattern of one initial
   per count.

A new leaf i18n key, `banner.run.counts.nota`, is added next to the sibling
`horario`/`matricula`/`alumno`/`uniqueStudents` keys — copy: "Notas" (es) / "Grades" (en),
matching Planner's existing `planner.run.counts.nota` copy exactly for the same concept.

### AC-11 — Planner `school` field displayed

**Design decision**: add a `school` column to `PlannerScrapeRunHistory`, positioned
immediately after the `period` column — this directly mirrors how Banner's analogous
per-run scope field (`departments`) is already a standalone history column right after its
own `nivel`/`level` column, so the two tables keep the same "identity columns first, then
counts" shape. `school` is `string | null` (the schema marks it nullable — "School code, if
scoped"), so the cell renders `row.original.school ?? none`, matching every other
nullable-field cell in these two tables (`finishedAt`, `triggeredBy` before this change).
Not added to `PlannerScrapeRunProgress`'s card — that card has no equivalent identity field
today (Banner's progress card doesn't show `departments` either; it shows only status,
phase, and the stats breakdown), so adding it only to the history table keeps both modules'
progress cards symmetric with each other.

A new column needs a new i18n key pair: `planner.history.col.school` — copy: "Escuela" (es)
/ "School" (en).

### AC-12 — Sweep for old identifiers

The full set of live (non-locale) references to old Spanish wire identifiers was enumerated
at design time with:

```bash
rg "periodo|nivel|departamentos|cursos|escuela|horario|matricula|alumnosYNotas|secciones|evaluaciones|\bnotas\b" \
  src/modules/banner src/modules/planner src/modules/scraping-exports \
  --include='*.ts' --include='*.tsx'
```

Every hit is accounted for in the task list below (§ Frontend) — this is not a "grep at the
end and hope" check; the task list was built _from_ this sweep, so AC-12's own verification
step is a re-run of the same command with an empty (or i18n-key-only) result expected.

### AC-13 — `tsc --noEmit` + `pnpm lint` clean

Standard verification gate; no test runner exists in this repo (`docs/POLICIES.md` §
Verification Gate).

## Frontend

- **Routes / screens**: no new routes. `BannerManagementView`/`PlannerManagementView` and
  the components they compose are all extended in place.
- **Modules**: `src/modules/banner/`, `src/modules/planner/`, `src/modules/scraping-exports/`
  — every file identified in the § Sweep above:
  - `banner/types/index.ts` — `StartScrapeRequest` (`nivel`→`level`,
    `departamentos`→`departments`), `ScraperPhase` (rename all 3 values),
    `ScrapeCounts` (add `nota`), `ScrapeRunSummary` (`nivel`→`level`, `periodo`→`period`,
    `departamentos`→`departments`, add `triggeredByName`).
  - `banner/services/bannerService.ts` — `startBannerScrape`'s body-builder re-keyed to
    `level`/`departments`.
  - `banner/constants/index.ts` — `SCRAPE_PHASE_LABEL_KEYS` re-keyed to the new enum values
    (values — the i18n key strings — unchanged, per § AC-3/AC-6 design decision).
  - `banner/components/ScrapeRunHistory.tsx` — `accessorKey: 'nivel'` → `'level'`,
    `row.original.departamentos` → `.departments`, counts template gains `.nota`,
    `triggeredBy` cell reads `.triggeredByName`.
  - `banner/components/ScrapeRunProgress.tsx` — `StatsDetail` gains the fourth `nota` tile.
  - `planner/types/index.ts` — `StartPlannerScrapeRequest` (`nivel`→`level`,
    `cursos`→`courses`), `PlannerScraperPhase` (rename all 3 values),
    `PlannerScrapeRunSummary` (`periodo`→`period`, `escuela`→`school`, add
    `triggeredByName`).
  - `planner/services/plannerService.ts` — `startPlannerScrape`'s body-builder re-keyed to
    `level`/`courses`.
  - `planner/constants/index.ts` — `PLANNER_SCRAPE_PHASE_LABEL_KEYS` re-keyed.
  - `planner/components/PlannerScrapeRunHistory.tsx` — `accessorKey: 'periodo'` → `'period'`,
    new `school` column inserted after `period`, `triggeredBy` cell reads
    `.triggeredByName`.
  - `scraping-exports/services/scrapingExportsService.ts` — `ScrapingExportStatusWire`
    (`periodo`→`period`), `normalizeStatusResponse`'s read updated, stale comment fixed.
- **Components**: `ScrapePhaseLabel.tsx`/`PlannerScrapePhaseLabel.tsx` need no code change
  (§ AC-3/AC-6) — listed for completeness since they're the components whose _behavior_
  this change depends on staying correct, not because their source changes.
- **Services**: no new normalization layer added to Banner/Planner — deliberately kept as
  thin, type-only pass-throughs (consistent with `docs/CONTEXT.md`'s "services are API
  calls only" module-structure convention); only `scraping-exports` already had a
  normalization layer, and this change edits it rather than adding a second pattern.
- **Hooks**: no changes. Nothing here reads `status`/`phase`/polling logic.
- **Data / query keys**: unaffected — no new query, no new key shape, no new scope
  variable.
- **i18n keys** (both `es.json`/`en.json`), all additive except the two `col.counts` value
  edits noted above:
  - `banner.run.counts.nota` — "Notas" / "Grades"
  - `planner.history.col.school` — "Escuela" / "School"
  - `banner.history.col.counts` value edited: `"Conteos (H/M/A)"` → `"Conteos (H/M/A/N)"`;
    `"Counts (S/E/St)"` → `"Counts (S/E/St/G)"`

## Cross-repo mode

- **Mode**: sequential — the backend change (PR #124) is not just merged but already on
  `production`. No `contract.md`; the backend's committed `openapi.json` at `ref=a338a612`
  is the contract, confirmed directly (§ Contract status above).
- **Contract**: `BACK-ACREDITACION-3.0`'s `openapi.json`, confirmed 2026-08-21 against
  `ref=a338a612`.
- **Ordering**: no constraint remains — the backend is already past `staging`. Still run
  `/abet-verify-contract` immediately before `/abet-create-pr`, per the repo's standard
  process, as a final sanity check against whatever ref is current at merge time.

## Testing strategy

No test runner exists in this repo (`docs/POLICIES.md` § Verification Gate) — every row
below is `tsc --noEmit` + `pnpm lint` + a described manual step, all written into
`runbook.md`.

| AC  | Covered by                                                                                                                                                                             | Kind                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Code inspection of `StartScrapeRequest`/`startBannerScrape` body-builder — no UI path exercises an override today (see § AC-1/AC-4)                                                    | manual (code review)               |
| 2   | Start a real Banner scrape against the live (already-migrated) backend; confirm `level`/`period`/`departments` render correctly in the history row and progress card                   | manual                             |
| 3   | Watch a running Banner scrape advance through phases; confirm the phase label shows a translated string (not a raw `schedule`/`enrollment`/`studentsAndGrades` fallback) at each stage | manual                             |
| 4   | Code inspection of `StartPlannerScrapeRequest`/`startPlannerScrape` body-builder                                                                                                       | manual (code review)               |
| 5   | Start a real Planner scrape; confirm `period`/`school` render correctly                                                                                                                | manual                             |
| 6   | Watch a running Planner scrape advance through phases; confirm translated labels at each stage                                                                                         | manual                             |
| 7   | Trigger a scraping-export status/regenerate call; confirm the returned `period` is non-empty (not `''`, the old failure mode)                                                          | manual                             |
| 8   | Both history tables' `triggeredBy` column shows a name (or `-`), not a raw `"user:12"`-style string                                                                                    | manual                             |
| 9   | Banner progress card's `StatsDetail` shows 4 count tiles including grades, once a run reaches the `alumnosYNotas`/`studentsAndGrades` phase                                            | manual                             |
| 10  | Banner history table's counts cell shows 4 values, not 3                                                                                                                               | manual                             |
| 11  | Planner history table shows a `school` column with real data (or `-` when the run wasn't school-scoped)                                                                                | manual                             |
| 12  | `rg` sweep (§ AC-12 command) returns no hits outside i18n key names/comments                                                                                                           | manual (grep)                      |
| 13  | `npx tsc --noEmit`, `pnpm lint`                                                                                                                                                        | automated (gate, not a test suite) |

## Risks

| Risk                                                                                                                                                                                                                | Mitigation                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| This is a live production regression already, not a preventive change — every day this ships late, the three affected screens keep misreading fields.                                                               | No additional mitigation beyond prioritizing the merge; the fix is the mitigation (per `proposal.md` § Risks).                                                                                                                                                                       |
| `stats`/`counts` internal shape (`nota` field, etc.) isn't spec-tracked (`unknown` in `openapi.json`) — a future backend change to that shape wouldn't be caught by `/abet-verify-contract`.                        | Out of scope to fix backend spec coverage in this change; flagged here and in `proposal.md` so it isn't assumed covered going forward.                                                                                                                                               |
| Renaming two `Record<Phase, string>` label-key maps must stay exhaustive, or a phase silently falls back to the (now-different) raw English string instead of a translation.                                        | `Record<T, string>` typing makes a missing key a `tsc` compile error, not a silent runtime gap — verified as part of Task 1.1/2.1 (§ tasks.md).                                                                                                                                      |
| Two DataTable `accessorKey` string literals (`'nivel'`, `'periodo'`) reference the renamed fields by string, not by typed property access — a stale accessor wouldn't fail `tsc`, only silently render blank cells. | Explicitly called out and swept (§ AC-12); each accessor's rename is its own task step, not left to compiler inference.                                                                                                                                                              |
| No live-scrape-completion end-to-end check is possible without triggering a real Banner/uPlanner scrape (external systems) — mirrors the exact reachability gap `scrape-progress-and-performance` hit.              | Follow that change's precedent: verify what's verifiable without a live run (types, `tsc`, lint, grep sweep, and — where practical — an isolated component render), and track the genuinely-live-only checks explicitly in `runbook.md` rather than marking them done on assumption. |

## Docs to update in this PR

- [ ] `docs/CONTEXT.md` — no change needed. This is a wire-contract sync of an
      already-documented pattern plus two small additive UI fields; it introduces no new
      business rule, module boundary, cross-module import, or environment variable.
      Re-confirm this at PR time by re-reading § Business Rules and § Directory Structure.
