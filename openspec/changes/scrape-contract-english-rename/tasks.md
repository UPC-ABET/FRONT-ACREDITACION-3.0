# Tasks — Adopt the English scraping wire contract

**Slug**: `scrape-contract-english-rename` · **Proposal**: `./proposal.md` · **Design**: `./design.md`

## For whoever executes this

- Work in checkpointed batches of 3–5 tasks. Partition each batch by files touched and fan
  the non-overlapping ones out to parallel subagents — Milestones 1–2 (Banner), 3–4
  (Planner), and 5 (scraping-exports) touch entirely disjoint files and can run fully in
  parallel with each other. Within a module, the types/service/constants task (Milestone
  1 or 3) must land before that module's component tasks (Milestone 2 or 4), since the
  components' `tsc` cleanliness depends on the renamed types.
- **There is no test runner in this repo** (`docs/POLICIES.md` § Verification Gate). A task
  is complete when `npx tsc --noEmit` is clean, `pnpm lint` is clean, **and** the manual
  verification step described in that task has actually been performed and described — not
  on typecheck/lint alone. Do not invent a `pnpm test` step; there is nothing to run.
- Marking done means checking the box **and** appending `✅ DONE (YYYY-MM-DD)` to the
  heading. Never one without the other.
- **No autonomous commits.** Propose the grouping and stop.
- Do not edit `docs/POLICIES.md` or `docs/adr/*`.
- The backend contract has no ordering constraint here (already on `production` — see
  `design.md` § Contract status). Still re-run `/abet-verify-contract` immediately before
  `/abet-create-pr` as the standard final check.
- Per `design.md` § AC-3/AC-6, **do not rename i18n key names** (e.g.
  `banner.run.phase.horario`, `banner.history.col.nivel`) — only the code that maps
  types/enum values to those keys changes. Only add genuinely new keys
  (`banner.run.counts.nota`, `planner.history.col.school`) or edit existing key _values_
  (the `col.counts` abbreviation strings).

## Goal

Re-key every Banner/Planner/scraping-exports request and response field the backend
renamed from Spanish to English in BACK-ACREDITACION-3.0 PR #124 (already live in
production), add the new `triggeredByName` field to both scrape modules' history tables,
and close two confirmed display gaps: Banner's missing grades count and Planner's
never-shown `school` field.

## Slicing

Vertical per module: Banner's contract rename lands and typechecks before Banner's UI
tasks build on it; Planner mirrors the same two-step shape; scraping-exports is a single
one-line fix since it already has a normalization layer; a final milestone sweeps for any
missed old identifier and runs the repo-wide gate.

---

## Milestone 1 — Banner contract rename

### Task 1.1 — Rename Banner request/response fields and phase enum, add `nota` count and `triggeredByName` ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/banner/types/index.ts` (modify)

**Steps**

1. `StartScrapeRequest`: rename `nivel?: string` → `level?: string`,
   `departamentos?: string[]` → `departments?: string[]`.
2. `ScraperPhase`: rename the union to `'schedule' | 'enrollment' | 'studentsAndGrades'`
   (was `'horario' | 'matricula' | 'alumnosYNotas'`).
3. `ScrapeCounts`: add `nota: number` (backend field name unchanged — it lives inside the
   untyped `stats.counts` object PR #124 didn't touch; see `design.md` § AC-9/AC-10).
4. `ScrapeRunSummary`: rename `nivel: string` → `level: string`,
   `periodo: string` → `period: string`, `departamentos: string[]` → `departments: string[]`;
   add `triggeredByName: string` alongside the existing `triggeredBy: string | null`.
5. `npx tsc --noEmit` — expect new errors in every file that references the old field names
   (services, components) — these are exactly the files Tasks 1.2 and 2.1/2.2 fix.

**Commit**: `fix(banner): rename scrape request/response fields to match backend contract`

### Task 1.2 — Rename Banner request body keys in the service layer ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/banner/services/bannerService.ts` (modify)

**Steps**

1. In `startBannerScrape`'s body-builder, rename the conditional spreads from
   `payload.nivel`/`{ nivel: ... }` to `payload.level`/`{ level: ... }`, and
   `payload.departamentos`/`{ departamentos: ... }` to `payload.departments`/
   `{ departments: ... }` (see `design.md` § AC-1).
2. `npx tsc --noEmit`.

**Commit**: `fix(banner): rename scrape request field to match backend contract`

### Task 1.3 — Re-key the Banner phase label map ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/banner/constants/index.ts` (modify)

**Steps**

1. Re-key `SCRAPE_PHASE_LABEL_KEYS` from `{ horario, matricula, alumnosYNotas }` to
   `{ schedule, enrollment, studentsAndGrades }`. **The i18n key values stay unchanged**
   (still `'banner.run.phase.horario'`, etc. — see `design.md` § AC-3/AC-6 and the note at
   the top of this file).
2. `npx tsc --noEmit` — `Record<ScraperPhase, string>` typing means a missed/mistyped key
   here is a compile error, not a silent gap; confirm it actually is one by checking the
   diff covers all three keys.

**Commit**: `fix(banner): re-key phase label map to the renamed enum values`

---

## Milestone 2 — Banner UI wiring

### Task 2.1 — Wire renamed fields and `triggeredByName` into `ScrapeRunHistory`, add the 4th count ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/banner/components/ScrapeRunHistory.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Change the level column's `accessorKey: 'nivel'` to `accessorKey: 'level'` (header key
   `t('banner.history.col.nivel')` stays as-is — see the note at the top of this file).
2. Change the departments cell from `row.original.departamentos.join(', ')` to
   `row.original.departments.join(', ')`.
3. Change the counts cell template from
   `` `${counts.horario} / ${counts.matricula} / ${counts.alumno}` `` to
   `` `${counts.horario} / ${counts.matricula} / ${counts.alumno} / ${counts.nota}` ``
   (`design.md` § AC-9/AC-10).
4. Change the `triggeredBy` cell from `row.original.triggeredBy ?? none` to
   `row.original.triggeredByName` (the backend guarantees a non-null value with its own
   `'-'` fallback — `design.md` § AC-8).
5. In both `es.json` and `en.json`, edit `banner.history.col.counts`'s value:
   `"Conteos (H/M/A)"` → `"Conteos (H/M/A/N)"` (es), `"Counts (S/E/St)"` →
   `"Counts (S/E/St/G)"` (en).
6. `npx tsc --noEmit`, `pnpm lint`.

**Commit**: `fix(banner): rename history table fields, show grades count and triggered-by name`

### Task 2.2 — Add the grades count tile to `ScrapeRunProgress`

- [ ] Task complete

**Files**

- `src/modules/banner/components/ScrapeRunProgress.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. In `StatsDetail`, add a fourth `CountTile` for `stats.counts.nota`, inserted after the
   `alumno` tile and before `uniqueStudents` (`design.md` § AC-9 — matches Planner's tile
   order: raw counts first, "unique X" summary last).
2. Add the new leaf key `banner.run.counts.nota` to both `es.json` and `en.json`, alongside
   the sibling `horario`/`matricula`/`alumno`/`uniqueStudents` keys — copy: "Notas" (es) /
   "Grades" (en), matching Planner's existing `planner.run.counts.nota` concept.
3. `npx tsc --noEmit`, `pnpm lint`.
4. Manual: with a reachable backend, load a Banner run whose `stats` is populated and
   confirm all four count tiles render with real numbers, in the order
   horario/matricula/alumno/notas/uniqueStudents.

**Commit**: `feat(banner): show grades count in scrape run progress`

> Code complete: `tsc --noEmit` and `pnpm lint` both clean; also widened the tile grid from
> `sm:grid-cols-4` to `sm:grid-cols-5` (not in the original steps, but the 4-tile grid would
> otherwise leave the new 5th tile orphaned on its own row — noted here rather than done
> silently). Step 4 (live manual check against a reachable backend) **not performed** — no
> backend is reachable in this environment (`.env`'s `API_PROXY_URL=http://localhost:7777`
> confirmed down via `curl`; the sibling `BACK-ACREDITACION-3.0` checkout exists locally but
> starting it would require provisioning its database and triggering a real scrape against
> Banner, out of scope for verifying a tile renders). Left unchecked; tracked in
> "Outstanding before merge" below and in `runbook.md`.

---

## Milestone 3 — Planner contract rename

### Task 3.1 — Rename Planner request/response fields and phase enum, add `triggeredByName` ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/planner/types/index.ts` (modify)

**Steps**

1. `StartPlannerScrapeRequest`: rename `nivel?: string` → `level?: string`,
   `cursos?: string[]` → `courses?: string[]`.
2. `PlannerScraperPhase`: rename the union to `'sections' | 'evaluations' | 'grades'` (was
   `'secciones' | 'evaluaciones' | 'notas'`).
3. `PlannerScrapeRunSummary`: rename `periodo: string` → `period: string`,
   `escuela: string | null` → `school: string | null`; add `triggeredByName: string`
   alongside the existing `triggeredBy: string | null`.
4. `npx tsc --noEmit` — expect new errors in the service and history-table files fixed by
   Tasks 3.2 and 4.1.

**Commit**: `fix(planner): rename scrape request/response fields to match backend contract`

### Task 3.2 — Rename Planner request body keys in the service layer ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/planner/services/plannerService.ts` (modify)

**Steps**

1. In `startPlannerScrape`'s body-builder, rename the conditional spreads from
   `payload.nivel`/`{ nivel: ... }` to `payload.level`/`{ level: ... }`, and
   `payload.cursos`/`{ cursos: ... }` to `payload.courses`/`{ courses: ... }`.
2. `npx tsc --noEmit`.

**Commit**: `fix(planner): rename scrape request field to match backend contract`

### Task 3.3 — Re-key the Planner phase label map ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/planner/constants/index.ts` (modify)

**Steps**

1. Re-key `PLANNER_SCRAPE_PHASE_LABEL_KEYS` from `{ secciones, evaluaciones, notas }` to
   `{ sections, evaluations, grades }`. i18n key values stay unchanged (still
   `'planner.run.phase.secciones'`, etc.).
2. `npx tsc --noEmit`.

**Commit**: `fix(planner): re-key phase label map to the renamed enum values`

---

## Milestone 4 — Planner UI wiring

### Task 4.1 — Wire renamed fields and `triggeredByName` into `PlannerScrapeRunHistory`, add the `school` column

- [ ] Task complete (code complete — see retro)

**Files**

- `src/modules/planner/components/PlannerScrapeRunHistory.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Change the period column's `accessorKey: 'periodo'` to `accessorKey: 'period'` (header
   key `t('planner.history.col.periodo')` stays as-is).
2. Add a new `school` column immediately after the period column:
   `{ id: 'school', header: t('planner.history.col.school'), cell: ({ row }) =>
row.original.school ?? none }` (`design.md` § AC-11).
3. Change the `triggeredBy` cell from `row.original.triggeredBy ?? none` to
   `row.original.triggeredByName`.
4. Add the new leaf key `planner.history.col.school` to both `es.json` and `en.json` —
   copy: "Escuela" (es) / "School" (en).
5. `npx tsc --noEmit`, `pnpm lint`.
6. Manual: with a reachable backend, load the Planner history table and confirm the new
   `school` column renders a real school code (or `-` for an unscoped run).

**Commit**: `fix(planner): rename history table fields, add school column, show triggered-by name`

> Code complete: steps 1–5 done, `tsc --noEmit` and `pnpm lint` both clean. Step 6 (live
> manual check) **not performed** — same reachability gap as Task 2.2 (no backend reachable
> in this environment). Left unchecked; tracked in "Outstanding before merge" below and in
> `runbook.md`.

---

## Milestone 5 — Scraping-exports wire mapper

### Task 5.1 — Rename the `periodo` wire read to `period`

- [ ] Task complete (code complete — see retro)

**Files**

- `src/modules/scraping-exports/services/scrapingExportsService.ts` (modify)

**Steps**

1. Rename `ScrapingExportStatusWire.periodo?: string` to `.period?: string`.
2. Update `normalizeStatusResponse`'s `period: wire.periodo ?? ''` to
   `period: wire.period ?? ''`.
3. Update the comment above the interface (currently asserts the wire field is `periodo`
   Spanish) to state the field is `period`, English, as of PR #124.
4. `npx tsc --noEmit`, `pnpm lint`.
5. Manual: with a reachable backend, call the status endpoint for any export type with an
   active period and confirm the returned `period` is the real period code, not `''`.

**Commit**: `fix(scraping-exports): read the renamed period field from the status wire response`

> Code complete: steps 1–4 done, `tsc --noEmit` and `pnpm lint` both clean. Step 5 (live
> manual check) **not performed** — same reachability gap as Tasks 2.2/4.1. Left unchecked;
> tracked in "Outstanding before merge" below and in `runbook.md`.

---

## Milestone 6 — Final verification

### Task 6.1 — Old-identifier sweep and i18n key check ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- None expected; fix in place anything found.

**Steps**

1. Run the sweep from `design.md` § AC-12:
   ```bash
   rg "periodo|nivel|departamentos|cursos|escuela|horario|matricula|alumnosYNotas|secciones|evaluaciones|\bnotas\b" \
     src/modules/banner src/modules/planner src/modules/scraping-exports \
     --include='*.ts' --include='*.tsx'
   ```
   Confirm every remaining hit is either an i18n key **name** (e.g.
   `banner.run.phase.horario`) or a comment referencing the old contract for historical
   context — no live code reference (object key, enum value, `accessorKey`, request-body
   key) should remain.
2. Confirm the three new/edited i18n entries exist in both locale files at matching
   positions: `banner.run.counts.nota`, `planner.history.col.school`, and the edited
   `banner.history.col.counts` value.

**Commit**: none, unless step 1 or 2 finds something missed — then
`fix(scraping): <what was missed>`.

> Sweep command run; every remaining hit is either an i18n key name
> (`banner.run.phase.horario`, `banner.history.col.nivel`, `planner.run.phase.secciones`,
> etc.) or a `stats.counts` internal field name (`horario`/`matricula`/`alumno` — the
> backend's untyped `stats` object, which PR #124 did not rename; confirmed against
> `scraper.service.ts` at design time). No live wire-contract identifier (object key sent
> in a request body, response-type field, or `accessorKey`) remains. Both new/edited i18n
> entries (`banner.run.counts.nota`, `planner.history.col.school`,
> `banner.history.col.counts`) confirmed present in both `es.json`/`en.json` at matching
> line numbers (271, 290, 341, 373).

### Task 6.2 — Repo-wide gate ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- None.

**Steps**

1. `npx tsc --noEmit` across the whole repo — must be clean.
2. `pnpm lint` across the whole repo — must be clean.

**Commit**: none.

> `pnpm exec tsc --noEmit` (repo uses `pnpm`, not a bare `npx` in this environment's shell —
> same command, different invocation) and `pnpm lint` (`eslint --max-warnings 0`) both
> clean, repo-wide, no exclusions.

---

## Outstanding before merge

Everything is code-complete: `pnpm exec tsc --noEmit` and `pnpm lint` are clean across the
whole repo, the old-identifier sweep (Task 6.1) found nothing outstanding, and i18n key
parity is confirmed. Nine of twelve tasks are fully done. The three that aren't (2.2, 4.1,
5.1) share one genuine remaining gap: **no backend is reachable in this environment**
(`.env`'s `API_PROXY_URL=http://localhost:7777` confirmed down via `curl`; the sibling
`BACK-ACREDITACION-3.0` checkout exists locally but starting it would mean provisioning its
database and, to populate real data, triggering actual scrapes against Banner/uPlanner or
calling scraping-exports against a real academic period — out of scope for this environment)
— so their own manual-verification steps could not be performed:

- Task 2.2, step 4 — confirm all four Banner count tiles render real numbers.
- Task 4.1, step 6 — confirm the new Planner `school` column renders real data.
- Task 5.1, step 5 — confirm the scraping-exports status call returns a real, non-empty
  `period`.

This is the same reachability gap `scrape-progress-and-performance` hit (see that change's
`tasks.md` § Milestone 2/3 retros) — resolved there by the requester verifying live
post-deploy. **Before this is treated as ready for `/abet-create-pr`**, either run
`runbook.md`'s Manual validation table steps 1–8 against a reachable backend, or — per the
prior change's precedent — ship and verify live post-deploy, given this fixes an active
production regression rather than shipping a new feature ahead of its dependency.

Re-run `/abet-verify-contract` one more time immediately before opening the PR, per
`design.md` § Cross-repo mode, as the standard final check.

<!--
Append-only sections below. These record what actually happened, not what was planned.

## Unplanned — <what and why>

## Post-QA fixes

## Audit fixes (/abet-audit-pr)
-->
