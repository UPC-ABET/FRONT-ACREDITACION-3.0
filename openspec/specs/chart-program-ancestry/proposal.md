# Chart program ancestry — Program (Carrera) pre-configuration in the org chart

**Slug**: `chart-program-ancestry`
**Branch**: `feat/chart-program-ancestry`
**Repos affected**: both (backend already in progress — PR #107 on branch
`feat/chart-program-ancestry`, repo `UPC-ABET/BACK-ACREDITACION-3.0`, not yet merged; this
proposal covers only the frontend side)
**Created**: 2026-08-18

> **Status update (2026-08-18, post-implementation audit)**: the backend's PR #107 has
> since merged and been **promoted to `staging`** — squash-merge commit `089bd6351e677`,
> confirmed via `gh api` against `openapi.json` on `develop` and `staging` (both now
> byte-identical, `ChartProgramDto`/`ChartHeadProgramViewDto` present on both). The
> "not yet merged" framing below describes the state when this proposal was written, not
> the current state — the cross-repo sequencing gate (backend must reach `staging` before
> this frontend PR merges) is now satisfied. Left as originally written rather than
> rewritten, per this repo's "don't rewrite proposal history" convention.

## Problem

The backend (PR #107, not yet merged) is changing the org-chart domain model so that every
Area, Subarea, or Course node must resolve to a pre-configured Program (Carrera) node
before reaching the School root, and Program nodes can no longer be created through the
Excel upload — only through a dedicated admin pre-configuration step. This affects three
areas of the API the frontend already consumes: chart-heads configuration, the org-chart
Excel upload, and the maintenance tree's generic chart CRUD.

Today the frontend has no way to pre-configure Carreras at all — the chart-heads admin
screen only configures a Dean and a list of Directors (one per School), and the maintenance
tree still lets an admin create/edit/delete Program-typed nodes freely, which the backend
will now reject. Without this change, admins have no UI to satisfy the new prerequisite
(programs must exist before Area/Subarea/Course nodes can be attached), and the maintenance
UI will start throwing backend errors for actions it currently allows.

Additionally, the existing Directors school picker in chart-heads shows every school
regardless of what's already picked by a sibling director row (a duplicate is only caught
by post-submit validation) — a papercut worth fixing now that this screen is being
extended with a second, analogous exclusivity constraint for Carreras.

## What already exists

- **`src/modules/admin/chart-heads/`** — the Dean/Directors config screen.
  - `services/chartHeadsService.ts` — `getChartHeadsConfig(academicPeriodId)` (`GET
/admin-chart-heads/:academicPeriodId`) and `configureChartHeads(payload)` (`POST
/admin-chart-heads/configure`).
  - `types/index.ts` — `DirectorConfig extends HeadConfig` (`{ chartId, staffId, code,
firstName, lastName, userId, user, title, schoolId, schoolCode }`) and
    `DirectorPayload extends HeadPayload` (`{ staffId, userId, title, schoolId }`). **No
    `programs` field exists yet on either type.**
  - `components/DirectorsSection.tsx` + `components/ChartHeadsForm.tsx` — the repeatable
    "add/remove director row" UI pattern (per-row client key, add button, bordered card,
    remove button), each row containing a School `Select` (from `useSchoolOptions()` →
    `services/schoolsService.ts` → `GET /schools/get-all`, unfiltered) plus the shared
    `HeadFields` (teacher lookup via `LinkedTeacherSelect`, linked-user select, bilingual
    `I18nTextField` title).
  - `schemas/chartHeadsSchema.ts` — `validateChartHeadsForm` already does **post-hoc**
    duplicate-school detection across director rows (`seenSchoolIds` Map), surfaced as a
    `duplicateSchool` field error rather than filtering the picker's options.
  - `services/usersService.ts` — the one existing "exclude already-assigned" precedent in
    the codebase, but server-side: `GET /users/get-all?unlinkedOnly=true`.
- **`src/modules/charts/`** — the maintenance-tree renderer and generic chart CRUD.
  - `components/ChartNodeDialog.tsx` — entity-type dropdown sourced from
    `useTypesByGroupCode(TYPE_GROUP_CODES.ORG_CHART_ENTITY_TYPE)` (backend-managed lookup,
    not hardcoded), filtered by `constants/index.ts`'s `READ_ONLY_ENTITY_TYPE_CODES =
[ENTITY_TYPE.DEAN, ENTITY_TYPE.SCHOOL]`. `ENTITY_TYPE.PROGRAM` (`TG903-T003`) is
    currently **creatable/editable** through this dialog, backed by
    `chartsService.programsGetAll()` (`GET /programs/get-all`).
  - `components/ChartNodeMenu.tsx` — already treats Dean/School as read-only (no
    edit/delete offered); Program is not yet in that treatment.
  - No client-side ancestor/hierarchy validation exists anywhere in this module today.
- **`src/modules/loads/`** — the Excel upload flow (`UploadTypeSelect.tsx`,
  `UploadPanel.tsx`, `uploadsService.ts`), which drives `/uploads/charts/{template,upload,
rollback}` for the `charts` flow. The entity-type legend the backend generates lives
  inside the downloaded Excel template itself (server-rendered) — there is no
  frontend-rendered list of entity types in the upload UI to update. Upload errors are
  already handled generically as opaque localized text baked into the returned annotated
  Excel; no error-code-specific frontend logic exists to change.
- **`src/modules/academic/`** — Program (Carrera) is modeled three different,
  non-consolidated ways: `programsService.getByFilters()` (`POST
/programs/get-by-filters`, returns `ProgramResponse[]`), `programsService.byModality()`
  (`GET /programs/by-modality`), and `charts/chartsService.programsGetAll()` (`GET
/programs/get-all`, returns the leaner `ProgramItem[]`). None is confirmed to return
  "Carreras belonging to School X" directly.
- **i18n**: the Spanish label for this concept is overwhelmingly **"Carrera"** across the
  codebase (chart-heads, evaluation, surveys, `loads.organizationChartMaintenance.form.
programPlaceholder`); "Programa" appears only as an outlier in the `ard` module.

## Goals

- Add a **Carreras (Programs) sub-section per Director** in the chart-heads config screen:
  each director can have zero or more Carrera assignments, each with its own staff lookup,
  optional linked user, and bilingual title — mirroring the existing Directors
  add/remove-row pattern, nested one level deeper.
- Send/receive the new `programs` field on `POST /admin-chart-heads/configure` and `GET
/admin-chart-heads/:academicPeriodId`, matching the backend's `ChartProgramDto` /
  `ChartHeadProgramViewDto` shapes.
- Exclude, per director row's School picker, schools already selected by **other** director
  rows in the same academic-period form (the row's own current selection stays visible).
- Exclude, per director's Carrera picker(s), careers already assigned to **any**
  director/school in that same academic period (derived from the already-loaded config
  response — no new endpoint), with the row's own current selection staying visible.
- Remove `Program` as a creatable/editable/deletable entity type everywhere in the
  maintenance tree (generic node dialog + context menu), joining Dean/School in the
  existing read-only treatment.
- Surface every new backend error code introduced by this change
  (`error.chartHeads.programNotFound`, `error.chartHeads.duplicateProgramInPayload`,
  `error.chartHeads.programAssignedToOtherSchool`, the chart-CRUD read-only-entity error,
  and `error.chart.programAncestorRequired`) through the existing `tryTranslate(t, code)`
  pattern, with new keys added to both locale files.
- Add a precondition warning banner to the org-chart Excel upload screen when the target
  school + academic period has **no Director configured** and/or **zero pre-configured
  Carreras**, shown before any file is uploaded (sourced from the existing chart-heads
  config GET response — no new endpoint).
- All new UI copy in Spanish uses "Carrera", never "Programa".

## Non-goals

- No changes to the backend repo — PR #107 is already in flight there; this proposal only
  tracks the frontend consumer of that contract.
- No client-side pre-validation of the "Area/Subarea/Course requires a Program ancestor"
  rule — the frontend relies on the backend's `error.chart.programAncestorRequired`
  response surfaced through the existing error-toast/inline-error pattern, not a new
  tree-walking check.
- No change to the Excel template's entity-type legend/dropdown content — that content is
  generated server-side inside the downloaded file; there is nothing frontend-rendered to
  update.
- No cross-academic-period exclusion — "already selected" filtering for schools/careers is
  scoped to the current academic period only, matching the backend's own per-period
  uniqueness rule.
- No consolidation of the three existing, fragmented program-fetching services/endpoints in
  `academic`/`charts` into one — only whatever is needed to list Carreras for the
  chart-heads Directors screen is in scope.

## Acceptance criteria

1. **AC-1** — Given the chart-heads Directors config screen, when an admin opens a director
   row, then they can add zero or more Carrera entries to that director, each with its own
   staff (professor) lookup, optional linked user, and bilingual title, using an
   add/remove-row pattern analogous to the existing Directors list.
2. **AC-2** — When the admin saves the config, then the `POST /admin-chart-heads/configure`
   payload includes each director's `programs: [{ programId, staffId, userId, title }]`
   (omitted or empty when a director has no Carreras configured).
3. **AC-3** — Given a period with previously configured Director→Carrera assignments, when
   the config screen loads via `GET /admin-chart-heads/:academicPeriodId`, then each
   director row pre-populates its Carrera sub-list from the response's `programs[]`
   (`chartId, staffId, code, firstName, lastName, userId, user, title, programId,
programCode`).
4. **AC-4** — Given two or more director rows in the form, when a School picker is opened
   on any row, then schools already selected by other director rows are excluded from its
   options; the row's own currently-selected school remains selectable in its own picker.
5. **AC-5** — Given the loaded config for the academic period, when a Carrera picker is
   opened on any director row, then careers already assigned to any director (other rows in
   the same form, or previously saved directors) are excluded from its options; the
   row/sub-row's own currently-selected career remains selectable in its own picker.
6. **AC-6** — Given the backend returns `error.chartHeads.programNotFound`,
   `error.chartHeads.duplicateProgramInPayload`, or
   `error.chartHeads.programAssignedToOtherSchool` on save, then the UI surfaces a
   translated message via the existing `tryTranslate(t, code)` pattern, with new keys added
   to `es.json` and `en.json`.
7. **AC-7** — Given the maintenance tree's node create/edit dialog, when the admin opens the
   entity-type dropdown, then `Program` (`TG903-T003`) is not offered as a selectable type
   for create or re-type — it is added to the existing read-only-entity-type exclusion list
   alongside Dean and School.
8. **AC-8** — Given a Program-typed node in the maintenance tree, when the admin opens its
   context menu, then Edit/Delete are unavailable for it, matching the existing treatment of
   Dean and School nodes.
9. **AC-9** — Given the backend rejects a create/update with the chart-CRUD
   read-only-entity error or `error.chart.programAncestorRequired`, then the UI surfaces a
   translated message via the existing error-handling pattern; no client-side ancestor
   pre-validation is added (per confirmed scope).
10. **AC-10** — Given the org-chart Excel upload screen for a selected school + academic
    period, when that school has no Director configured for the period or zero
    pre-configured Carreras for the period, then a warning banner is shown before any file
    is uploaded, sourced from the existing `GET /admin-chart-heads/:academicPeriodId`
    response (no new endpoint).
11. **AC-11** — Given the upload/template/rollback endpoints' request/response shapes are
    unchanged, then no code changes are made to the multipart payload, headers, or
    annotated-Excel handling beyond AC-10; new per-row error text appearing in the annotated
    Excel (`parentCodeEmpty`, `programNotConfiguredForSchool`, reworded `parentNotFound`)
    requires no code change since these already render as opaque localized text from the
    returned file.
12. **AC-12** — Given any new UI text introduced by this change, then all Spanish copy uses
    "Carrera" (never "Programa") for the program/career concept.
13. **AC-13** — Before implementation begins, `/abet-verify-contract` is run against the
    backend's `feat/chart-program-ancestry` branch `openapi.json` to confirm exact field
    names, DTO shapes, and error key spellings — the backend description pasted into this
    proposal contained garbled text around the chart-CRUD read-only-entity error key and the
    exact ancestor-rule wording, both of which must be verified, not assumed.

### Traceability

| AC  | Criterion                                           | Satisfied by                                                                                                                                                        |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Carrera sub-section per director row                | `admin/chart-heads/components/ProgramsSubsection.tsx` (new), wired via `DirectorsSection.tsx` + `ChartHeadsForm.tsx` — tasks.md Milestone 4                         |
| 2   | Save payload includes `programs[]`                  | `admin/chart-heads/types/index.ts` (`ProgramPayload`, `DirectorPayload.programs`), `schemas/chartHeadsSchema.ts` (`formToPayload`) — tasks.md Milestone 3           |
| 3   | Load pre-populates `programs[]`                     | `admin/chart-heads/types/index.ts` (`ProgramConfig`, `DirectorConfig.programs`), `schemas/chartHeadsSchema.ts` (`configToFormValue`) — tasks.md Milestone 3         |
| 4   | School picker excludes already-picked schools       | `schemas/chartHeadsSchema.ts` (`usedSchoolIds`), `components/DirectorsSection.tsx` — tasks.md Milestone 2                                                           |
| 5   | Carrera picker excludes already-assigned careers    | `schemas/chartHeadsSchema.ts` (`usedProgramIds`), `components/ProgramsSubsection.tsx` — tasks.md Milestone 4                                                        |
| 6   | New chart-heads error codes surfaced                | `src/language/locales/{es,en}.json` (`error.chartHeads.*`) — tasks.md Milestone 3, Task 3.4                                                                         |
| 7   | Program removed from creatable entity-type dropdown | `src/modules/charts/constants/index.ts` (`READ_ONLY_ENTITY_TYPE_CODES`) — tasks.md Milestone 5, Task 5.1                                                            |
| 8   | Program nodes read-only in context menu             | same constant, consumed by `charts/components/ChartNodeMenu.tsx` — tasks.md Milestone 5, Task 5.1                                                                   |
| 9   | Read-only/ancestor backend errors surfaced          | `src/language/locales/{es,en}.json` (`error.chart.entityTypeReadOnly` — pre-existing; `error.chart.programAncestorRequired` — new) — tasks.md Milestone 5, Task 5.2 |
| 10  | Upload precondition warning banner                  | `admin/chart-heads/schemas/chartHeadsSchema.ts` (`findDirectorForSchool`), `loads/pages/LoadsPage.tsx`, `loads/components/UploadPanel.tsx` — tasks.md Milestone 6   |
| 11  | Upload/template/rollback shape unchanged            | verified by diff review — tasks.md Milestone 6, Task 6.2 step 6                                                                                                     |
| 12  | "Carrera" terminology enforced                      | verified by grep — tasks.md Milestone 3 Task 3.4 step 7, Milestone 7                                                                                                |
| 13  | Contract verified before implementation             | `/abet-verify-contract` run — tasks.md Milestone 1, Task 1.1                                                                                                        |

## Dependencies

- Backend PR #107 (branch `feat/chart-program-ancestry`, repo
  `UPC-ABET/BACK-ACREDITACION-3.0`) must be merged, or its `openapi.json` verifiable on that
  branch, before implementation starts — this frontend change cannot ship ahead of the
  backend contract it depends on.
- `/abet-verify-contract` must be re-run if the backend branch changes before this frontend
  change ships, since the spec source is explicitly "not merged yet."

## Risks

| Risk                                                                                                                                                    | Impact                                                                                                   | Mitigation                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The backend description pasted into this proposal is garbled in two spots (the chart-CRUD read-only-entity error key; the exact ancestor-rule wording). | Implementing against a guessed error key or rule silently breaks error translation or the ancestor gate. | Verify exact key names/shapes via `/abet-verify-contract` against `openapi.json` before writing any error-handling or DTO code, not just before merge.               |
| Program fetching is fragmented across 3 endpoints/shapes in `academic`/`charts`, none confirmed to return "Carreras for School X."                      | Design phase may need a new backend query param or client-side filtering of an unscoped list.            | Confirm during design (and via `/abet-verify-contract`) which endpoint — or new param — supplies the school-scoped Carrera list; escalate to backend if none exists. |
| The nested "Carreras per director" repeatable list has no existing pattern in the codebase to copy (Directors is only a flat, single-level list).       | First-of-its-kind nested-list component; more design/review time.                                        | Base it on `DirectorsSection`'s existing per-row-key/add/remove/dedup-Map pattern, adapted one level deeper.                                                         |
| "Exclude already-assigned" picker filtering is a new client-side pattern (only prior precedent is the server-side `unlinkedOnly=true` flag).            | Exclusion sets could drift out of sync with form state if re-derived ad hoc.                             | Derive exclusion sets via memoized selectors off the single loaded `ChartHeadsConfig`/form state, not duplicated local state.                                        |

## Open questions

None — the three product ambiguities raised during scoping (client-side ancestor
validation, upload precondition warning, and exclusion scope) were resolved with the
requester before this proposal was written:

- Ancestor rule: surface the backend error only, no client-side tree-walk.
- Upload precondition: show a warning banner covering **both** "no Director configured"
  and "no Carreras configured" for the target school + period (broadened from the initial
  programs-only framing).
- Exclusion scope: same-academic-period only, derived from the already-loaded config; a
  row's own current selection always stays selectable.
