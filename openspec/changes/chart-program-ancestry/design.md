# Design — Chart program ancestry — Program (Carrera) pre-configuration in the org chart

**Slug**: `chart-program-ancestry`
**Proposal**: `./proposal.md`

## Read first

- `docs/POLICIES.md` § Verification Gate, § Global Academic Context, § Admin import rule,
  § i18n — no test runner in this repo; `tsc`/`lint`/manual verification is the gate;
  `admin/` sub-modules import via their own concern barrel, never `@/modules/admin`.
- `docs/CONTEXT.md` § Related Repositories / Cross-repo change model — sequential mode,
  `openapi.json` on the backend's `feat/chart-program-ancestry` branch is the contract.
- `src/modules/admin/chart-heads/` — the whole module (`types/index.ts`,
  `schemas/chartHeadsSchema.ts`, `components/{ChartHeadsForm,DirectorsSection,HeadFields}.tsx`,
  `hooks/{useChartHeads,queryKeys}.ts`, `services/{chartHeadsService,schoolsService}.ts`) —
  read in full; this is where most of the change lands.
- `src/modules/charts/` — `constants/index.ts` (`READ_ONLY_ENTITY_TYPE_CODES`,
  `ENTITY_TYPE`), `components/{ChartNodeDialog,ChartNodeMenu}.tsx`, `types/index.ts`.
- `src/modules/loads/` — `pages/LoadsPage.tsx`, `components/UploadPanel.tsx`,
  `constants/flowRegistry.ts` — the Excel upload flow the precondition banner attaches to.
- `src/language/locales/es.json` lines 830–870 (`admin.chartHeads.*`), 1363–1374
  (`error.chart.*`), 1620–1627 (`error.chartHeads.*`) — the existing i18n structure this
  change extends. **`error.chart.entityTypeReadOnly` already exists** (es.json:1370) — it's
  the key Dean/School already use; Program joining the read-only set needs no new key here,
  only `error.chart.programAncestorRequired` is genuinely new.
- No `openspec/specs/` prior art exists yet (first change in this repo's openspec history).

## ADR gate (walked, not skipped)

| Trigger                                       | Hit?                                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datastore, broker or cache choice             | No                                                                                                                                                                                                 |
| Auth or payments provider                     | No                                                                                                                                                                                                 |
| Public API contract change or breaking change | No — this repo only _consumes_ the backend's additive, backward-compatible contract change; the contract decision itself belongs to the backend's own change folder.                               |
| New module boundary or cross-repo split       | No — adds one new cross-module import (`loads` → `@/modules/admin/chart-heads`, via its public barrel), which is the existing, already-documented cross-module import pattern, not a new boundary. |
| Language, runtime or framework                | No                                                                                                                                                                                                 |
| Contradicting an existing ADR                 | No — no ADRs exist in this repo yet.                                                                                                                                                               |

**Conclusion**: no ADR required. The nested "Carreras per director" repeatable-list UI is a
new pattern in this codebase but is a routine implementation choice (a UI composition
decision, not a hard-to-reverse architectural one) per `docs/adr/README.md`'s own bar.

## Approach

### AC-1 — Carrera sub-section per director row

- `types/index.ts` gains `ProgramFormValue extends HeadFormValue { key: string; programId: number | null }`, and `DirectorFormValue` gains `programs: ProgramFormValue[]`.
- `schemas/chartHeadsSchema.ts` gains `emptyProgram(key, languages)`, mirroring `emptyDirector`.
- New `components/ProgramsSubsection.tsx` mirrors `DirectorsSection.tsx`'s add/remove-row
  pattern one level down: a "Carreras" header with an "Agregar carrera" button, a Program
  `Select` per row (parallel to the School `Select` in `DirectorsSection`), reusing the
  existing `HeadFields` component unchanged for staff/linked-user/title — `ChartProgramDto`
  (`{ programId, staffId, userId?, title }`) is structurally identical to `HeadPayload` plus
  `programId`, the same relationship `DirectorPayload` already has with `schoolId`.
- `DirectorsSection.tsx` renders `<ProgramsSubsection>` inside each director's card, below
  `HeadFields`, passing that director's `programs`, `programOptions`, and per-row
  add/remove/change callbacks.
- `ChartHeadsForm.tsx` gains `addProgram(directorKey)`, `removeProgram(directorKey, programKey)`,
  `setProgram(directorKey, programKey, next)`, implemented as immutable updates to the
  matching director's `programs` array (same shape as the existing `addDirector`/
  `removeDirector`/`setDirector` trio).

### AC-2 — Save payload includes programs

- `types/index.ts` gains `ProgramPayload extends HeadPayload { programId: number }`, and
  `DirectorPayload` gains `programs: ProgramPayload[]`.
- `formToPayload` maps each director's `programs` through the existing `headToPayload`
  helper (widened to accept any `HeadFormValue`, see below) plus `programId: p.programId as number`
  — validated non-null by `validateChartHeadsForm` before `formToPayload` ever runs, same
  guarantee `formToPayload` already relies on for `schoolId`.

### AC-3 — Load renders saved programs

- `types/index.ts` gains `ProgramConfig extends HeadConfig { programId: number; programCode: string }`,
  and `DirectorConfig` gains `programs: ProgramConfig[]`.
- `configToFormValue`'s director-mapping adds
  `programs: (director.programs ?? []).map(p => ({ key: \`program-${p.chartId}\`, programId: p.programId, ...headToFormValue(p, languages) }))`.
- `headToFormValue`'s parameter type widens from `HeadConfig | DirectorConfig` to just
  `HeadConfig` (both `DirectorConfig` and the new `ProgramConfig` are structurally assignable
  to it already — the explicit union was never load-bearing).

### AC-4 — School picker excludes already-picked schools

- New pure selector in `chartHeadsSchema.ts`:
  `usedSchoolIds(directors: DirectorFormValue[], excludeKey: string): Set<number>` — reduces
  over every director except the one being rendered.
- `DirectorsSection.tsx`'s `selectOptions` becomes per-row (`useMemo` keyed by
  `director.key`), filtering `schoolOptions` against `usedSchoolIds(directors, director.key)`.
  Because the row being rendered is excluded from the exclusion set by construction, its own
  currently-selected school is never filtered out of its own picker.
- The existing post-hoc `duplicateSchool` validation in `validateChartHeadsForm` **stays** as
  a defense-in-depth safety net (e.g. against a stale `schoolOptions` cache mid-session) —
  it should just stop firing in the common case now that the picker pre-filters.

### AC-5 — Carrera picker excludes already-assigned careers

- New pure selector: `usedProgramIds(directors: DirectorFormValue[], excludeDirectorKey: string, excludeProgramKey: string): Set<number>` —
  flattens every director's `programs[]` except the specific row being rendered, so a
  program is excluded from every _other_ picker in the form (any director, any row) but
  stays selectable in its own.
- `ProgramsSubsection.tsx` filters `programOptions` per row the same way `DirectorsSection`
  now does for schools.
- `validateChartHeadsForm` gains a second, form-wide `seenProgramIds` Map (mirroring the
  existing `seenSchoolIds` one, but flattened across _all_ directors' programs rather than
  per-director) that flags `duplicateProgram` on every row sharing a `programId` — the
  client-side mirror of the backend's `error.chartHeads.duplicateProgramInPayload` 400.
- `DirectorFormErrors` gains `programs: Record<string, ProgramFormErrors>`
  (`ProgramFormErrors extends HeadFormErrors { programId?: string }`), keyed the same way
  `ChartHeadsFormErrors.directors` already keys by director key.

### AC-6 — New chart-heads error codes surfaced

- Add `error.chartHeads.programNotFound`, `error.chartHeads.duplicateProgramInPayload`,
  `error.chartHeads.programAssignedToOtherSchool` to `es.json`/`en.json`, siblings of the
  existing `error.chartHeads.duplicateSchoolInPayload` at `es.json:1620-1627`.
- No code change beyond the locale entries: `ChartHeadsForm.tsx`'s existing
  `extractErrorDetails` + `tryTranslate(t, getErrorMessage(...))` pipeline already surfaces
  any `error.chartHeads.*` key the backend returns, exactly as it does today for
  `duplicateSchoolInPayload`.

### AC-7 / AC-8 — Program becomes a read-only entity type in the maintenance tree

- One-line change: add `ENTITY_TYPE.PROGRAM` to `READ_ONLY_ENTITY_TYPE_CODES` in
  `src/modules/charts/constants/index.ts`.
- That single constant already drives both behaviors with zero further code changes:
  `ChartNodeDialog.tsx`'s `typeOptions` filter (`!READ_ONLY_ENTITY_TYPE_CODES.includes(type.code)`)
  removes Program from the creatable/re-typeable dropdown (AC-7); `ChartNodeMenu.tsx`'s
  `isReadOnlyEntityType(code)` check hides Edit/Delete for Program nodes (AC-8), matching
  Dean/School's existing treatment exactly.
- `canAddChild = code !== ENTITY_TYPE.DEAN` in `ChartNodeMenu.tsx` is intentionally left
  unchanged — Program nodes must still allow "Add child" (that's how Area/Subarea/Course
  attach under a pre-configured Program per the new ancestor rule).

### AC-9 — Backend read-only/ancestor errors surfaced

- `error.chart.entityTypeReadOnly` **already exists** in both locale files (`es.json:1370`,
  already used for Dean/School rejections) — Program create/update attempts hitting this
  error translate correctly with zero new code, since `ChartNodeDialog.handleApiError`
  already calls the generic `getApiErrorReasons` + `tryTranslate` pipeline.
- Add the new key `error.chart.programAncestorRequired` to both locale files, sibling to
  `entityTypeInvalid`/`entityCodeRequired` at `es.json:1363-1374`.
- No client-side ancestor pre-check is added — confirmed scope is "surface the backend
  error only" (see proposal's Open questions / resolved decisions).

### AC-10 — Upload precondition banner

- `admin/chart-heads`'s existing `useChartHeadsConfig(academicPeriodId)` hook (already
  exported from the module's public barrel `@/modules/admin/chart-heads`) is reused by
  `loads` — a new, policy-compliant cross-module import through the concern's own barrel
  (see `docs/POLICIES.md#admin-import-rule`).
- New pure selector `findDirectorForSchool(config: ChartHeadsConfig, schoolId: number): DirectorConfig | undefined`
  added to `admin/chart-heads/schemas/chartHeadsSchema.ts` and re-exported.
- In `LoadsPage.tsx` (which already reads `schoolId`/`academicPeriodId` from `useABET()` and
  already knows `selectedType.code === TYPE_CODES.UPLOAD_TYPE.CHARTS`), fetch the chart-heads
  config for the active period, resolve the director for the active school, and pass
  `hasDirector` / `hasPrograms` down to `UploadPanel` as props — only for the `charts` flow,
  so no other upload type pays for this query.
- `UploadPanel.tsx` renders an `Alert variant="warning"` above the dropzone when
  `!hasDirector || !hasPrograms`, naming which prerequisite(s) are missing. Non-blocking —
  the upload button stays enabled, per the confirmed scope; the annotated Excel remains the
  authoritative failure signal, this is purely an early heads-up.

### AC-11 — Upload/template/rollback shape unchanged

- No changes to `src/modules/loads/services/uploadsService.ts` or
  `src/modules/loads/types/index.ts`. Verified by grep/diff review at task time that only
  `UploadPanel.tsx`/`LoadsPage.tsx` (presentation) and the new chart-heads selector change —
  never the upload service or its payload/response types.

### AC-12 — Terminology

- Every new locale string this change introduces uses "Carrera" — `admin.chartHeads.field.program`,
  `admin.chartHeads.directors.programs.*`, and the upload precondition copy. A task-level
  verification step greps the diff for "Programa" to confirm none slipped in.

### AC-13 — Contract verification gate

- First task of the whole plan (Milestone 1): run `/abet-verify-contract` against
  `UPC-ABET/BACK-ACREDITACION-3.0`'s `feat/chart-program-ancestry` branch and confirm, against
  the real `openapi.json`, not the pasted prose: `ChartProgramDto` and
  `ChartHeadProgramViewDto` field names; that the chart-CRUD read-only-entity error really is
  the pre-existing `error.chart.entityTypeReadOnly` key (this design assumes so, based on
  finding that key already in `es.json:1370` used for Dean/School — but the backend PR could
  have introduced a distinct key instead); and the exact spelling of
  `error.chart.programAncestorRequired`. Record the SHA verified against, per
  `docs/CONTEXT.md`'s cross-repo model.

## Frontend

- **Routes / screens**: no new routes. Existing `/admin/configuration` (chart-heads tab),
  the charts maintenance embedded widget (rendered inside `/admin/loads` or wherever
  `OrganizationChartMaintenance` mounts today via `UploadMaintenance`), and `/admin/loads`
  upload tab all gain in-place UI, no navigation changes.
- **Components (new)**: `src/modules/admin/chart-heads/components/ProgramsSubsection.tsx`.
- **Components (modified)**: `DirectorsSection.tsx`, `ChartHeadsForm.tsx` (chart-heads);
  no component changes needed in `ChartNodeDialog.tsx`/`ChartNodeMenu.tsx` beyond the
  constants-file change already covering both; `UploadPanel.tsx`, `LoadsPage.tsx` (loads).
- **Types**: additive-only extensions to `admin/chart-heads/types/index.ts`
  (`ProgramConfig`, `ProgramPayload`, `ProgramFormValue`, `ProgramFormErrors`, plus the new
  `programs` fields on `DirectorConfig`/`DirectorPayload`/`DirectorFormValue`/`DirectorFormErrors`).
  Every field name mirrors the backend DTOs verified in AC-13 — no renaming/aliasing.
- **Data / query keys**: no new query keys needed — `chartHeadsKeys.config(academicPeriodId)`
  already covers the extended response shape (same endpoint, superset of fields); a new
  local `programsService.ts` (mirroring the existing local `schoolsService.ts`) adds one
  query key, e.g. `chartHeadsKeys.programs()`, `staleTime: Infinity` (static lookup, same as
  `schools()`/`users()`). This is a **module-local duplicate** of `charts/chartsService.programsGetAll()`
  (`GET /programs/get-all`), deliberately not shared — `admin/chart-heads`'s existing
  `schoolsService.ts` already duplicates rather than imports from a shared location, so this
  follows the established (if imperfect) precedent instead of introducing a new
  `chart-heads` → `charts` cross-module coupling for a single GET-all lookup.
- **i18n**: all additions listed per-AC above; `es.json`/`en.json` updated together, per
  `docs/POLICIES.md#i18n`.

## Cross-repo mode

- **Mode**: sequential — backend PR #107 is already authored on `feat/chart-program-ancestry`;
  this frontend change follows once it's confirmed promoted far enough. No `contract.md` is
  created.
- **Contract**: the backend's committed `openapi.json` on that branch, fetched via
  `gh api repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=feat/chart-program-ancestry`
  during `/abet-verify-contract` (Milestone 1's task), and re-verified against `staging`
  before this frontend PR merges.
- **Ordering**: per `docs/CONTEXT.md`'s cross-repo model, the backend change must reach the
  `staging` branch before this frontend PR merges to `develop`. This frontend change may be
  _developed_ now, but the PR does not merge ahead of the backend being promoted.

## Testing strategy

There is no test runner in this repo (`docs/POLICIES.md#verification-gate`) — every AC is
verified by `npx tsc --noEmit` + `pnpm lint` staying clean, plus the manual verification
step named below. Anything manual is also captured in `runbook.md`.

| AC  | Covered by                                                                                                                                                                   | Kind            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | Add/remove Carrera rows in the chart-heads screen, confirm the row UI matches Directors' pattern                                                                             | manual          |
| 2   | Save with Carreras added, inspect the network request body for `directors[].programs[]`                                                                                      | manual          |
| 3   | Reload the page after saving, confirm Carreras re-populate from the GET response                                                                                             | manual          |
| 4   | Add two directors, pick a school on one, confirm it's absent from the other's picker; confirm editing a director still shows its own school                                  | manual          |
| 5   | Add Carreras to two different directors, confirm a Carrera picked on one is absent from every other Carrera picker (including a second row under the same director)          | manual          |
| 6   | Trigger each new error server-side (e.g. reuse a `programId` already assigned to another school) and confirm the translated toast text                                       | manual          |
| 7   | Open the maintenance tree's create dialog, confirm "Carrera" is absent from the entity-type dropdown                                                                         | manual          |
| 8   | Right-click a Program node in the tree, confirm Edit/Delete are absent, "Add child" is present                                                                               | manual          |
| 9   | Attempt (via a manually crafted request, or by observing a real backend rejection) an Area/Subarea/Course under a non-Program ancestor, confirm the translated error appears | manual          |
| 10  | Select a school + period with no configured Director/Carreras on the upload screen, confirm the warning banner appears; configure them, confirm it disappears                | manual          |
| 11  | `git diff` review confirming no changes under `loads/services/uploadsService.ts` or `loads/types/`                                                                           | manual (review) |
| 12  | `rg -i "programa"` over the diff's touched locale entries returns nothing                                                                                                    | manual (grep)   |
| 13  | `/abet-verify-contract` output recorded in the PR body                                                                                                                       | manual          |

## Risks

| Risk                                                                                                                                                                                                                                                                                                                                                                                                                                           | Mitigation                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The backend description pasted into the proposal was garbled in two spots (the chart-CRUD read-only-entity error key, the ancestor-rule wording) — this design assumed `error.chart.entityTypeReadOnly` is reused rather than a new key being introduced.                                                                                                                                                                                      | AC-13 / Milestone 1 verifies this against the real `openapi.json` before any DTO or error-handling code is written; if wrong, only the Milestone 4/AC-9 task needs correcting.                                                             |
| No endpoint is confirmed to return "Carreras for School X" directly — the plan relies on a flat `GET /programs/get-all` list plus client-side exclusion, which is correct only if `academic.programs` truly has no school affinity of its own (matches the backend's own framing: "a program can belong to at most one school **per academic period**", i.e. the school link lives entirely in chart-heads config, not on the program record). | Confirmed during AC-13 contract verification; if academic.programs turns out to carry its own school scoping, the local `programsService.ts` query gains a filter param instead of client-side-only filtering — a small, contained change. |
| The nested "Carreras per director" list is a first-of-its-kind UI pattern (Directors is flat, single-level) — more surface area for a subtle bug (e.g. exclusion sets recomputed from stale state after add/remove).                                                                                                                                                                                                                           | Exclusion selectors are pure functions over the single `form.directors` array (no duplicated local state), unit-testable in principle even without a test runner (verified manually against the AC-4/AC-5 scenarios above).                |
| `loads` importing from `@/modules/admin/chart-heads` is a new cross-module edge not yet listed in `docs/CONTEXT.md`'s "Import Rules Reference" table.                                                                                                                                                                                                                                                                                          | Added as a "Docs to update" item below — table entry added in the same PR, per the existing convention for that section.                                                                                                                   |

## Docs to update in this PR

- [ ] `docs/CONTEXT.md` § Import Rules Reference — add
      `loads → @/modules/admin/chart-heads (for the upload precondition check)` to the known
      cross-module imports list.
- [ ] `docs/CONTEXT.md` § Directory Structure — extend the `chart-heads/` one-line
      description from "Org-chart heads configuration (dean/directors)" to "(dean/directors/
      Carreras)".
