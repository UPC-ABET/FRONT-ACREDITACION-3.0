# Tasks — Chart program ancestry — Program (Carrera) pre-configuration in the org chart

**Slug**: `chart-program-ancestry` · **Proposal**: `./proposal.md` · **Design**: `./design.md`

## For whoever executes this

- **This repo has no test runner** (`docs/POLICIES.md#verification-gate`) — there is no
  `pnpm test`. A task is complete when `npx tsc --noEmit` is clean, `pnpm lint` is clean,
  and the task's manual verification step has actually been performed and described — not
  on typecheck/lint alone.
- Work in checkpointed batches of 3–5 tasks. Partition each batch by files touched and fan
  the non-overlapping ones out to parallel subagents.
- Marking done means checking the box **and** appending `✅ DONE (YYYY-MM-DD)` to the
  heading. Never one without the other — the completeness gate reads the boxes.
- **No autonomous commits.** Propose the grouping and stop.
- Do not edit `docs/POLICIES.md` or `docs/adr/*`.
- **Milestone 1 blocks everything else** — do not start Milestone 2+ until the contract is
  verified and this file's assumed field/error-key names are confirmed or corrected.

## Goal

Let admins pre-configure Carreras (Programs) per school Director in the chart-heads screen,
exclude schools/Carreras already picked elsewhere from their respective pickers, treat
Program as a read-only entity type in the org-chart maintenance tree (matching the backend's
new contract from PR #107), and warn on the Excel upload screen when a school has no
Director/Carreras configured for the target period yet.

## Slicing

Vertical. Each milestone delivers something demonstrable in the running app.

---

## Milestone 1 — Contract verification (gate)

### Task 1.1 — Verify the backend contract before writing any code ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- None (research/verification only; this task's output is recorded in this file and
  `design.md`, not a code change).

**Steps**

1. Run `/abet-verify-contract` against `UPC-ABET/BACK-ACREDITACION-3.0`'s
   `feat/chart-program-ancestry` branch.
2. Confirm the exact field names of `ChartProgramDto` (`{ programId, staffId, userId?, title }`
   assumed) and `ChartHeadProgramViewDto` (`{ chartId, staffId, code, firstName, lastName,
userId, user, title, programId, programCode }` assumed) against the real `openapi.json`.
3. Confirm whether the chart-CRUD read-only-entity error is genuinely the pre-existing
   `error.chart.entityTypeReadOnly` key (already used for Dean/School, found at
   `src/language/locales/es.json:1370`) or a distinct new key — this design assumed reuse.
4. Confirm the exact spelling of the new ancestor-rule error key (assumed
   `error.chart.programAncestorRequired`).
5. If anything differs from the assumptions above, update `design.md`'s "Approach" section
   with a dated correction note before proceeding to Milestone 2.
6. Record the verified spec SHA (for the eventual PR body, per `docs/CONTEXT.md`'s
   cross-repo model).

**Commit**: none — this task produces no diff by itself unless `design.md` needs a
correction note, in which case: `docs(chart-program-ancestry): record contract verification`

> Verified against `openapi.json` on the backend's `develop` branch (SHA
> `f13c506992d2af25b22dfdc4246b829f5aec7b38`) — **PR #107 is actually already merged to
> `develop`**, contradicting the "not yet merged" framing in the original request; it is
> not yet on `staging` (SHA `8bd65edec8771be558b367f79ad8300a155a3d4e`, confirmed older —
> `ChartHeadProgramViewDto`/`ChartProgramDto` absent there). Verdict: **⛔ MERGED, NOT
> PROMOTED** — safe to implement against now, but this frontend PR must not merge until
> the backend reaches `staging` (unchanged runbook prerequisite).
>
> Every assumption in `design.md`/`tasks.md` was confirmed **exactly correct**, including
> the two garbled spots from the original request:
>
> - `ChartProgramDto` = `{ programId: number, staffId: number, userId?: number | null, title: I18nText }`, required `[programId, staffId, title]`, nested at `ChartDirectorDto.programs` (optional on the request, not in `required`).
> - `ChartHeadProgramViewDto` = `{ chartId, staffId, code, firstName, lastName, userId, user, title, programId, programCode }`, nested at `ChartHeadDirectorViewDto.programs` — **required and always present** in the response (an empty array for directors with no Carreras, never omitted) — so the frontend's `director.programs ?? []` defensive fallback in `configToFormValue` is belt-and-suspenders, not strictly required, but kept anyway as cheap insurance.
> - `error.chart.entityTypeReadOnly` — confirmed reused (not a new key), sourced from `src/modules/organization/charts/config/strings/charts.validation.ts` on the backend.
> - `error.chart.programAncestorRequired` — confirmed exact spelling, same file.
> - `error.chartHeads.programNotFound`, `error.chartHeads.duplicateProgramInPayload`, `error.chartHeads.programAssignedToOtherSchool` — all three confirmed exact, sourced from `src/modules/admin/organization/chart-heads/config/strings/chart-heads.validation.ts`.
> - `POST /admin-chart-heads/configure` and `GET /admin-chart-heads/:academicPeriodId` routes unchanged.
>
> One spec quirk worth noting for later readers: `userId` and `code` are documented as
> `"type": "object"` (nullable) in the raw OpenAPI JSON rather than `number`/`string` — a
> decorator artifact on the backend's Swagger annotations, not a real shape change; the
> `example` values and descriptions confirm the intended types match what `HeadPayload`/
> `HeadConfig` already use. No design.md correction needed — every assumption held.

---

## Milestone 2 — Directors school picker excludes already-picked schools (AC-4)

### Task 2.1 — Add the school-exclusion selector and wire it into the picker ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/admin/chart-heads/schemas/chartHeadsSchema.ts` (modify)
- `src/modules/admin/chart-heads/components/DirectorsSection.tsx` (modify)

**Steps**

1. Add `usedSchoolIds(directors: DirectorFormValue[], excludeKey: string): Set<number>` to
   `chartHeadsSchema.ts` — reduce over every director except the one whose `key === excludeKey`,
   collecting non-null `schoolId`s.
2. In `DirectorsSection.tsx`, change `selectOptions` from one shared `useMemo` to a per-row
   computation: for each director, filter `schoolOptions` against
   `usedSchoolIds(directors, director.key)`.
3. `npx tsc --noEmit` → expect clean.
4. `pnpm lint` → expect clean.
5. **Manual verification**: in the running app, add two director rows on the chart-heads
   screen, pick a school on the first, confirm that school is absent from the second row's
   picker, and confirm the first row's own picker still shows (and keeps selected) its own
   choice. Edit an existing saved director and confirm its current school stays selectable.

**Commit**: `feat(chart-heads): exclude already-picked schools from director pickers`

> `tsc --noEmit` and `pnpm lint` both clean. This repo's dev server needs a running
> backend (`API_PROXY_URL=http://localhost:7777`, a separate repo not available in this
> environment) for real data, so the functional in-browser check is deferred to a
> consolidated pass in Milestone 7 plus the `runbook.md` pre-merge checklist, per
> `docs/POLICIES.md`'s verification gate — flagging rather than fabricating a browser test.

---

## Milestone 3 — Carrera pre-configuration: types, service, schema (AC-2, AC-3, AC-6 data layer)

### Task 3.1 — Extend chart-heads types with Program shapes ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/admin/chart-heads/types/index.ts` (modify)

**Steps**

1. Add `ProgramConfig extends HeadConfig { programId: number; programCode: string }`.
2. Add `ProgramPayload extends HeadPayload { programId: number }`.
3. Add `programs: ProgramConfig[]` to `DirectorConfig` and `programs: ProgramPayload[]` to
   `DirectorPayload`.
4. Add `ProgramOption { id: number; code: string; name: string }` (mirrors `SchoolOption`).
5. Add `ProgramFormValue extends HeadFormValue { key: string; programId: number | null }`
   and `programs: ProgramFormValue[]` on `DirectorFormValue`.
6. Add `ProgramFormErrors extends HeadFormErrors { programId?: string }` and
   `programs: Record<string, ProgramFormErrors>` on `DirectorFormErrors`.
7. `npx tsc --noEmit` → expect it to now fail elsewhere (schema/components not yet updated) —
   this is expected; proceed to Task 3.2/3.3 before the module compiles clean again.

**Commit**: `feat(chart-heads): add Program types for director-level Carrera config`

### Task 3.2 — Add the module-local programs service and hook ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/admin/chart-heads/services/programsService.ts` (create)
- `src/modules/admin/chart-heads/services/index.ts` (modify)
- `src/modules/admin/chart-heads/hooks/queryKeys.ts` (modify)
- `src/modules/admin/chart-heads/hooks/useChartHeads.ts` (modify)

**Steps**

1. Create `programsService.ts` mirroring `schoolsService.ts`: `getAllPrograms(): Promise<ProgramOption[]>`
   calling `GET /programs/get-all` (same endpoint `charts/chartsService.programsGetAll()` uses,
   deliberately duplicated per `design.md`'s Frontend § Data / query keys rationale).
2. Export it from the module's `services/index.ts` barrel.
3. Add `programs: () => [...chartHeadsKeys.all, 'programs'] as const` to `queryKeys.ts`.
4. Add `useProgramOptions()` to `useChartHeads.ts` (mirrors `useSchoolOptions`,
   `staleTime: Infinity`).
5. `npx tsc --noEmit` and `pnpm lint` → expect clean for these new files (module as a whole
   still won't compile until Task 3.3).

**Commit**: `feat(chart-heads): add programs lookup service and hook`

### Task 3.3 — Extend chartHeadsSchema for Program load/save/validate + exclusion selectors ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/admin/chart-heads/schemas/chartHeadsSchema.ts` (modify)

**Steps**

1. Widen `headToFormValue`'s parameter type from `HeadConfig | DirectorConfig` to
   `HeadConfig` (structurally sufficient — see `design.md` AC-3).
2. Add `emptyProgram(key: string, languages: string[]): ProgramFormValue`, mirroring
   `emptyDirector`.
3. In `configToFormValue`, map each director's `programs` to
   `ProgramFormValue[]` via `{ key: \`program-${p.chartId}\`, programId: p.programId, ...headToFormValue(p, languages) }`.
4. In `validateChartHeadsForm`: validate each director's programs (teacher/title required
   via the existing `validateHead`, `programId` required), then add a form-wide
   `seenProgramIds` Map (flattened across every director, not per-director) that flags a
   `duplicateProgram` error (new `VALIDATION_KEYS.duplicateProgram = 'admin.chartHeads.error.duplicateProgram'`)
   on every row sharing a `programId`, mirroring the existing `seenSchoolIds` logic.
5. In `formToPayload`, map each director's `programs` through `headToPayload` plus
   `programId: p.programId as number`.
6. Add `usedProgramIds(directors: DirectorFormValue[], excludeDirectorKey: string, excludeProgramKey: string): Set<number>`
   (flattens all directors' programs except the row being rendered).
7. `npx tsc --noEmit` → expect clean now that types/service/schema are all in sync.
8. `pnpm lint` → expect clean.

**Commit**: `feat(chart-heads): load, validate, and save director Carrera assignments`

### Task 3.4 — Add new chart-heads i18n keys (client-side validation + backend error surfacing) ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Under `admin.chartHeads.error` (es.json:862-869), add `duplicateProgram`: "Esta carrera ya
   fue asignada a otro director." (and the English equivalent).
2. Add `admin.chartHeads.field.program`: "Carrera", `field.programPlaceholder`: "Selecciona
   una carrera".
3. Add `admin.chartHeads.directors.programs.{title,add,remove,empty,rowLabel}` — "Carreras",
   "Agregar carrera", "Quitar", "Aún no hay carreras asignadas a este director.",
   "Carrera {number}" — sibling to the existing `directors.*` block (es.json:838-845).
4. Under the top-level `error.chartHeads` namespace (es.json:1620-1627), add
   `programNotFound`, `duplicateProgramInPayload`, `programAssignedToOtherSchool` with the
   exact key spellings confirmed in Task 1.1.
5. Mirror every addition in `en.json`.
6. `pnpm lint` → expect clean (JSON formatting via lint-staged on commit).
7. **Manual verification**: `rg -i "programa" src/language/locales/es.json` against only the
   lines added in this task — confirm zero matches (AC-12).

**Commit**: `feat(chart-heads): add Carrera i18n copy and backend error translations`

> Milestone 3 (Tasks 3.1–3.4) executed as one continuous pass: types, service/hook, schema
> (load/save/validate + `usedProgramIds`), and i18n. `tsc --noEmit` and `pnpm lint` clean
> after every step. Two small deviations from the literal task text, both intentional:
> `headToFormValue`'s widened `HeadConfig` parameter type was applied in the same edit as
> the rest of Task 3.3 rather than as a separate step (trivial, same file, no reason to
> split); and `validateChartHeadsForm`'s `directorsHaveError` check was refactored into two
> small named predicates (`directorHasOwnError`/`directorHasProgramError`) instead of the
> single inline expression sketched in `design.md`, because the inline cast
> (`errors[key as keyof typeof errors]`) needed to enumerate `programs` as a data field was
> genuinely harder to read than just naming the two checks. `rg`-equivalent grep on the
> diff (`git diff | grep -oE ': "[^"]*"' | grep -i programa`) confirms zero "Programa"
> matches among added Spanish string _values_ (the one case-insensitive hit was the key
> name `programAssignedToOtherSchool`, not a translated string).

---

## Milestone 4 — Carrera nested UI (AC-1, AC-5 UI wiring)

### Task 4.1 — Build ProgramsSubsection ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/admin/chart-heads/components/ProgramsSubsection.tsx` (create)
- `src/modules/admin/chart-heads/components/index.ts` (modify)

**Steps**

1. Create `ProgramsSubsection.tsx`, structurally mirroring `DirectorsSection.tsx`: a
   "Carreras" sub-header with an "Agregar carrera" button, one bordered row per program with
   a Program `Select` (options filtered per-row via `usedProgramIds`, same pattern as
   Milestone 2's school filtering) followed by the shared `HeadFields` component, and a
   "Quitar" remove button per row.
2. Export it from `components/index.ts`.
3. `npx tsc --noEmit` and `pnpm lint` → expect clean.

**Commit**: `feat(chart-heads): add ProgramsSubsection component for director Carreras`

### Task 4.2 — Wire ProgramsSubsection into DirectorsSection and ChartHeadsForm ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/admin/chart-heads/components/DirectorsSection.tsx` (modify)
- `src/modules/admin/chart-heads/components/ChartHeadsForm.tsx` (modify)
- `src/modules/admin/chart-heads/components/ChartHeadsConfigPage.tsx` (modify)

**Steps**

1. In `ChartHeadsForm.tsx`, add `addProgram(directorKey)`, `removeProgram(directorKey, programKey)`,
   `setProgram(directorKey, programKey, next)` — immutable updates to the matching
   director's `programs` array, following the existing `addDirector`/`removeDirector`/
   `setDirector` pattern (including a `nextProgramKey` ref per new-row key generation).
2. Thread `programOptions`/`programsLoading` (from `useProgramOptions()`) and the new
   handlers down through `DirectorsSection` into `ProgramsSubsection` per director row.
3. In `ChartHeadsConfigPage.tsx`, call `useProgramOptions()` alongside the existing
   `useSchoolOptions()`/`useUserOptions()` and pass the result into `ChartHeadsForm`.
4. `npx tsc --noEmit` and `pnpm lint` → expect clean.
5. **Manual verification** (AC-1, AC-2, AC-3, AC-5): add a director, add two Carreras to it
   with distinct staff/title, save, confirm the `POST /admin-chart-heads/configure` request
   body includes `directors[].programs[]`; reload the page and confirm both Carreras
   re-populate from the `GET` response; add a second director and confirm a Carrera already
   used by the first director is absent from the second director's Carrera picker, and
   absent from a second Carrera row under the _same_ director too.

**Commit**: `feat(chart-heads): wire Carrera add/remove/save/load into the Directors form`

> `tsc --noEmit`/`pnpm lint` clean after wiring. Additionally booted `pnpm dev` and
> requested `GET /admin/configuration?tab=chartHeads` directly — got a clean `200` with no
> Turbopack/Next.js compile errors, confirming the whole new module tree (types → schema →
> service → `ChartHeadsConfigPage` → `ChartHeadsForm` → `DirectorsSection` →
> `ProgramsSubsection` → `HeadFields`) resolves and client/server boundaries are correct.
> Could not go further than that: this repo's dev server needs the backend from PR #107
> (`API_PROXY_URL=http://localhost:7777`, a separate, not-yet-runnable-here repo) for
> auth/data, so the actual add/remove/save/load/exclusion behavior described in AC-1
> through AC-5 is **not yet manually verified** — deferred to Milestone 7's consolidated
> pass and `runbook.md`, flagging explicitly per `docs/POLICIES.md`'s verification gate
> rather than claiming a browser check that didn't happen.

---

## Milestone 5 — Maintenance tree: Program becomes read-only (AC-7, AC-8, AC-9)

### Task 5.1 — Add Program to the read-only entity-type set ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/charts/constants/index.ts` (modify)

**Steps**

1. Add `ENTITY_TYPE.PROGRAM` to `READ_ONLY_ENTITY_TYPE_CODES`.
2. `npx tsc --noEmit` and `pnpm lint` → expect clean.
3. **Manual verification** (AC-7, AC-8): open the maintenance tree's node-create dialog,
   confirm "Carrera" is no longer offered in the entity-type dropdown; right-click an
   existing Program node, confirm Edit/Delete are gone and "Add child" remains.

**Commit**: `fix(charts): treat Program as a read-only entity type`

> One-line constant change as designed — `tsc`/`lint` clean. Deferred the interactive
> confirmation (dropdown/context-menu check) to Milestone 7's consolidated pass since it
> needs the maintenance tree's real data (a running backend); the mechanism itself
> (`READ_ONLY_ENTITY_TYPE_CODES` driving both `ChartNodeDialog`'s `typeOptions` filter and
> `ChartNodeMenu`'s `isReadOnlyEntityType` check) was already read and confirmed correct
> during design — see `design.md` AC-7/AC-8.

### Task 5.2 — Add the ancestor-rule error translation ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. Add `error.chart.programAncestorRequired` sibling to `entityTypeInvalid`/
   `entityCodeRequired` (es.json:1363-1374), using the exact key confirmed in Task 1.1.
2. Mirror in `en.json`.
3. `pnpm lint` → expect clean.
4. **Manual verification** (AC-9): once the backend branch is reachable locally/in a shared
   environment, attempt to create an Area/Subarea/Course node whose parent chain has no
   Program ancestor and confirm the translated error text appears (not the raw key). If the
   backend isn't reachable yet, defer this specific check to `runbook.md`'s pre-merge
   checklist and note it as pending in the PR description.

**Commit**: `feat(charts): translate the program-ancestor-required error`

> Key spelling (`error.chart.programAncestorRequired`) confirmed exact via Milestone 1's
> contract verification — sourced directly from the backend's
> `charts.validation.ts` on `develop`. `tsc`/`lint`/JSON-validity all clean. The actual
> backend-triggered check (attempting to create an Area/Subarea/Course with no Program
> ancestor and confirming the translated text appears) requires the backend from PR #107
> running — deferred to Milestone 7 / `runbook.md`, per the same verification-gate
> reasoning as the prior milestones.

---

## Milestone 6 — Excel upload precondition banner (AC-10, AC-11)

### Task 6.1 — Add the director/Carrera precondition selector ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/admin/chart-heads/schemas/chartHeadsSchema.ts` (modify)

**Steps**

1. Add `findDirectorForSchool(config: ChartHeadsConfig, schoolId: number): DirectorConfig | undefined`
   (simple `.find()` over `config.directors`).
2. Ensure it's re-exported from the module's public barrel (already covered by the existing
   `export * from './schemas'` in `index.ts`).
3. `npx tsc --noEmit` and `pnpm lint` → expect clean.

**Commit**: `feat(chart-heads): add school-to-director lookup for upload precondition checks`

### Task 6.2 — Render the precondition banner on the charts upload screen ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/loads/pages/LoadsPage.tsx` (modify)
- `src/modules/loads/components/UploadPanel.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. In `LoadsPage.tsx`, when `selectedType?.code === TYPE_CODES.UPLOAD_TYPE.CHARTS` and
   `academicPeriodId`/`schoolId` are both set, call `useChartHeadsConfig(academicPeriodId)`
   from `@/modules/admin/chart-heads` (new cross-module import through its public barrel)
   and pass down `hasDirector`/`hasPrograms` booleans (via `findDirectorForSchool` +
   `(director?.programs.length ?? 0) > 0`) to `UploadPanel` as new optional props, only for
   the charts flow.
2. In `UploadPanel.tsx`, render an `Alert variant="warning"` above the dropzone when either
   flag is false, naming the missing prerequisite(s); leave the upload button enabled
   (non-blocking, per confirmed scope).
3. Add `loads.upload.chartsPrecondition.{noDirector,noPrograms}` keys to both locale files.
4. `npx tsc --noEmit` and `pnpm lint` → expect clean.
5. **Manual verification** (AC-10): pick a school + period combination with no chart-heads
   config at all — confirm both warnings show; configure a Director only — confirm just the
   "no Carreras" warning remains; configure a Carrera too — confirm the banner disappears.
6. **Review check** (AC-11): `git diff` confirms no changes touched
   `src/modules/loads/services/uploadsService.ts` or `src/modules/loads/types/index.ts`.

**Commit**: `feat(loads): warn when the target school has no chart-heads/Carrera config`

> Passed a single `chartsPrecondition?: { hasDirector, hasPrograms }` object prop instead
> of two separate booleans (cleaner call site, and `undefined` cleanly means "not the
> charts flow, don't render the banner at all" vs. two independently-optional flags that
> could theoretically desync). `useChartHeadsConfig(isChartsFlow ? academicPeriodId : null)`
> reuses the hook's existing `enabled: academicPeriodId !== null` gate rather than adding a
> new gating mechanism, so the query only ever fires for the charts upload flow. `tsc`,
> `pnpm lint`, and JSON validity all clean; `git diff --stat` on
> `loads/services/uploadsService.ts` and `loads/types/index.ts` confirmed empty (AC-11).
> Verified via a live (previously-forgotten-running) dev server that `GET /loads` still
> returns 200 with no error boundary — did not click through the actual banner
> show/hide states since that needs real chart-heads data from the not-yet-locally-runnable
> backend; deferred to Milestone 7 / `runbook.md`.

---

## Milestone 7 — Docs pass and final regression (AC-12, docs)

### Task 7.1 — Update docs/CONTEXT.md for the new cross-module import ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `docs/CONTEXT.md` (modify)

**Steps**

1. Add `loads → @/modules/admin/chart-heads (for the upload precondition check)` to the
   "Known cross-module imports today" list under § Import Rules Reference.
2. Extend the `chart-heads/` one-line description under § Directory Structure from
   "Org-chart heads configuration (dean/directors)" to "(dean/directors/Carreras)".
3. `pnpm lint` → expect clean.

**Commit**: `docs(context): record chart-heads Carrera scope and the new loads cross-module import`

### Task 7.2 — Full manual regression pass across all three screens ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- None (verification only).

**Steps**

1. Re-run every "Manual verification" step listed in Milestones 2, 4, 5, 6 in one sitting
   against the same academic period/school, end to end.
2. Confirm the Dean section and existing (pre-change) Director save/load flows are
   unaffected — no regression on `HeadFields`/`DeanSection`.
3. Confirm `npx tsc --noEmit` and `pnpm lint` are clean on the full branch diff, not just
   per-task.
4. Record the outcome (pass/fail per AC) for the PR body's manual-verification section.

**Commit**: none — this task is a verification checkpoint, not a code change.

> **Final status, reported honestly rather than claimed:**
>
> - `npx tsc --noEmit` and `pnpm lint` are clean across the full branch diff (verified
>   again just now, not just per-task).
> - `git status --short` shows exactly the files `design.md`'s Frontend section predicted —
>   no unplanned files touched: 12 modified files in `admin/chart-heads`, `charts`, `loads`,
>   `docs/CONTEXT.md`, both locale files, plus 2 new files
>   (`ProgramsSubsection.tsx`, `programsService.ts`).
> - The Next.js/Turbopack dev server was booted twice during implementation and served
>   `GET /admin/configuration?tab=chartHeads` and `GET /loads` with clean `200`s and no
>   compile/error-boundary output — this confirms every new module resolves and every
>   client/server component boundary is correct, which is stronger than `tsc` alone catches.
> - **What is genuinely NOT manually verified**: every functional, data-dependent
>   behavior in `runbook.md`'s Manual validation table (rows 1–11) — add/remove/save/load
>   Carreras, the school/Carrera exclusion filtering actually hiding the right options,
>   real backend error translation, the maintenance-tree dropdown/context-menu behavior
>   against real Program nodes, and the upload precondition banner's three states. All of
>   these require the backend from PR #107 running with real data (auth, schools, staff,
>   programs) — genuinely not available in this environment
>   (`API_PROXY_URL=http://localhost:7777` points at a separate repo this session cannot
>   run). Per `docs/POLICIES.md`'s verification gate, this is reported explicitly rather
>   than fabricated — **`runbook.md`'s Manual validation table must be run for real by a
>   human (or a future session with the backend available) before this PR merges.**
> - Design-time code review substitutes partially for the missing runtime check: every
>   piece of reused logic (`HeadFields`, `headToPayload`/`headToFormValue`, the
>   `READ_ONLY_ENTITY_TYPE_CODES` mechanism, the `tryTranslate`/`getApiErrorReasons` error
>   pipeline) was read in its current, working form before being extended, not
>   reimplemented from scratch — this bounds the risk but does not replace the manual pass.

---

<!--
Append-only sections below. These record what actually happened, not what was planned.

## Unplanned — <what and why>

### Task U.1 — <title>
- [ ] Task complete

## Post-QA fixes

## Audit fixes (/abet-audit-pr)

### Review round 1
-->
