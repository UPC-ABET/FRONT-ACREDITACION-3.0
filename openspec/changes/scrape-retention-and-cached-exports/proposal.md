# Scraping exports move to cached, async generation

**Slug**: `scrape-retention-and-cached-exports`
**Branch**: `feat/scrape-retention-and-cached-exports`
**Repos affected**: frontend (backend already implemented in `BACK-ACREDITACION-3.0`, PR #119,
not yet promoted past its own `develop`)
**Created**: 2026-08-20

## Problem

Today, four of the five scraping exports (staff, sections, enrolled-students, student-sections)
are synchronous downloads: the frontend calls a `GET` endpoint and streams the file back in the
same request. The fifth, grades-rc, already had to become a background job (`start` /
`status/:jobId` / `download/:jobId`) because its merge query can run past any HTTP/gateway
timeout.

The backend is retiring both shapes and replacing them with one generic, cached contract used by
all five export types: a `status` endpoint, a `download` endpoint that always serves the last
successfully generated file, and a `regenerate` endpoint that kicks off generation in the
background. This removes the timeout risk for all five exports and lets a previously generated
file stay downloadable while a new one is being built — but it also means the four exports that
used to return a file in one click no longer do, and the frontend has to adopt the same
status-polling pattern grades-rc already uses, for all five.

## What already exists

- `src/modules/scraping-exports/` — the module that owns this today:
  - `services/scrapingExportsService.ts` — `downloadScrapingExport()` (direct download for
    `docentes`/`secciones`/`alumnosMatriculados`/`alumnosSecciones`) and
    `startGradesRcExport()` / `getGradesRcExportStatus()` / `downloadGradesRcExport()` (the
    grades-rc job trio).
  - `hooks/useGradesRcExport.ts` — `useStartGradesRcExport()`, `useGradesRcExportStatus()`
    (polls every 5s until terminal), `isTerminalGradesRcStatus()`.
  - `types/index.ts` — `ScrapingExportKind`, `DirectDownloadExportKind`,
    `GradesRcExportStatus`, `GradesRcExportJobStatus`.
  - `constants/index.ts` — `SCRAPING_EXPORT_BY_UPLOAD_TYPE` / `scrapingExportForUploadType()`,
    mapping an upload `TypeOption` code to a `DirectDownloadExportKind`.
  - `components/ScrapingExportsView.tsx` — the "Descargas" tab under `/scrapping`: one card per
    direct-download kind (button-triggers-download) plus a grades-rc card that already has the
    status/regenerate/download pattern the other four now need.
- `src/app/(protected)/scrapping/ScrapingTabsView.tsx` — hosts `ScrapingExportsView` as the
  "Exports" tab alongside Banner and Planner, all under the `SCRAPPING` permission.
- `src/modules/loads/components/UploadPanel.tsx` — a second consumer: its "Excel web-scraping"
  quick-action button calls `downloadScrapingExport()` directly (via
  `scrapingExportForUploadType(type.code)`) to fetch the matching export inline while uploading.
- `src/shared/lib/apiClient.ts` — `apiGet`, `apiPost`, `apiGetBlobResponse`,
  `resolveDownloadFileName`, `triggerBlobDownload` already exist and cover everything the new
  endpoints need; `X-Academic-Period-Id` is forwarded automatically from `useABET()`'s active
  period once set via `setActiveAcademicPeriodId` — nothing new required there, but a `400` comes
  back if no period is currently active.
- Locale keys under `scraping.exports.*` in `es.json` / `en.json` (`items.docentes`,
  `items.secciones`, `items.alumnosMatriculados`, `items.alumnosSecciones`, `items.notasRc`,
  `notasRc.*` for the grades-rc card's badges/actions).

## Goals

- Replace all calls to the four removed direct-download endpoints and the three removed
  grades-rc job endpoints with the three new generic endpoints
  (`GET .../status`, `GET .../download`, `POST .../regenerate`), for all five export types
  (`staff`, `sections`, `enrolledStudents`, `studentSections`, `gradesRc`).
- Generalize the existing grades-rc status/regenerate/download UI pattern in
  `ScrapingExportsView` to all five export types, so each shows not-generated / running /
  completed / failed and offers the right action for that state.
- Preserve the "download always serves the last successful file, even mid-regenerate" semantic
  in the UI — a `running` status must not hide or block the Download action when a completed
  file already exists.
- Handle the `409` regenerate conflict for all five types, including that grades-rc's conflict is
  global (any period's grades-rc job running) rather than scoped to the current period like the
  other four.
- Gate all three calls on an active academic period from `useABET()`, per the existing "no
  screen-local picker, show the standard notice" rule — the backend now hard-requires
  `X-Academic-Period-Id` (`400` without it).
- Update `UploadPanel`'s "Excel web-scraping" button to the new contract: check status first,
  download immediately if `completed`, trigger `regenerate` if `notGenerated`/`failed`, and just
  inform the user (no `regenerate` call, to avoid a guaranteed `409`) if already `running`.
- Add the four new backend i18n error keys (`error.scrapingExport.notGenerated`,
  `error.scrapingExport.alreadyGenerating`, `error.scrapingExport.invalidExportType`,
  `error.scrapingExport.periodNotFound`) to both locale files.
- Remove every reference to the old contract (paths, types, hooks, service functions) once the
  new one is in place — no dead code left behind.

## Non-goals

- No backend changes — this repo only consumes the already-built contract.
- No change to auth/permission handling — same `SCRAPPING` module permission and JWT requirement
  as today.
- No change to the Banner or Planner tabs on `/scrapping`.
- No new screen-local School/Modality/Period selector — the existing top-bar gating rule covers
  this.
- Not building a generic "any long-running job" abstraction beyond what these three endpoints
  need — grades-rc's global single-flight quirk is handled as a special case in copy/logic, not
  generalized.

## Acceptance criteria

1. **AC-1** — Given an active academic period, when the Exports tab renders, then for each of
   the five export types the UI calls `GET /scraping/exports/:exportType/status` with the active
   period and locale, and renders one of `notGenerated` / `running` / `completed` / `failed`.
2. **AC-2** — Given no academic period is selected (`useABET().academicPeriodId` is `null`), when
   the Exports tab is viewed, then no status/download/regenerate calls are made and the standard
   "select a period in the top bar" notice is shown instead of a screen-local picker.
3. **AC-3** — Given an export type's status is `completed`, when the user clicks Download, then
   `GET /scraping/exports/:exportType/download` is called and the file downloads under the
   server-provided filename, **regardless of whether a regenerate for that same
   export/period/lang is concurrently `running`**.
4. **AC-4** — Given an export type's status is `notGenerated` or `failed`, when the user triggers
   the primary action, then `POST /scraping/exports/:exportType/regenerate` is called and the UI
   reflects the returned `running` state; Download is not offered until a `completed` file
   exists.
5. **AC-5** — Given a `regenerate` call returns `409`, then the UI shows the already-generating
   state without calling regenerate again; for `gradesRc` specifically, the copy/logic must not
   imply the conflict is scoped to the current period, since grades-rc is single-flighted across
   all periods.
6. **AC-6** — Given the status query key, when `exportType`, `academicPeriodId`, or `lang`
   changes, then the query key changes accordingly (no stale cross-period/cross-type data),
   satisfying the mandatory TanStack Query scope-variable rule.
7. **AC-7** — Given this change ships, then no code references the old contract: the four
   direct-download paths, the three `grades-rc/start|status|download` paths, and the old
   service/hook/type exports (`downloadScrapingExport`, `DIRECT_DOWNLOAD_EXPORT_KINDS`,
   `startGradesRcExport`, `getGradesRcExportStatus`, `downloadGradesRcExport`,
   `useStartGradesRcExport`, `useGradesRcExportStatus`, `isTerminalGradesRcStatus`,
   `ScrapingExportKind`, `DirectDownloadExportKind`, `GradesRcExportJobStatus`) are all removed.
8. **AC-8** — Given `UploadPanel`'s "Excel web-scraping" button, when clicked: if status is
   `completed` it downloads immediately; if `notGenerated` or `failed` it calls `regenerate` and
   toasts the user to check the Exports tab; if `running` it toasts that generation is already in
   progress and does **not** call `regenerate`.
9. **AC-9** — Given the four new backend error keys, then `es.json` and `en.json` both contain
   entries for `error.scrapingExport.notGenerated`, `error.scrapingExport.alreadyGenerating`,
   `error.scrapingExport.invalidExportType`, and `error.scrapingExport.periodNotFound`.
10. **AC-10** — Given the backend contract isn't confirmed live yet, then `/abet-verify-contract`
    has been run against the backend's `openapi.json` at `ref=staging` and passed, before any
    implementation task is started.

### Traceability

| AC  | Criterion                                               | Satisfied by                                                                                                         |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Status call per export type, period/lang-scoped         | `src/modules/scraping-exports/hooks/useScrapingExports.ts` (`useScrapingExportStatus`)                               |
| 2   | No-period gating, standard notice                       | `src/modules/scraping-exports/components/ScrapingExportsView.tsx`                                                    |
| 3   | Download ignores concurrent `running` regenerate        | `src/modules/scraping-exports/types/index.ts` (`isScrapingExportDownloadable`), used in `ScrapingExportsView.tsx`    |
| 4   | `notGenerated`/`failed` → regenerate as primary action  | `src/modules/scraping-exports/components/ScrapingExportsView.tsx` (`ScrapingExportCard`)                             |
| 5   | 409 handling, grades-rc global single-flight copy       | `src/modules/scraping-exports/hooks/useScrapingExports.ts` (`useRegenerateScrapingExport`), `docs/CONTEXT.md` rule 6 |
| 6   | Query key includes exportType + period + lang           | `src/modules/scraping-exports/hooks/useScrapingExports.ts` (`scrapingExportsQueryKeys`, `AbetScope`)                 |
| 7   | Old contract fully removed, no dead references          | Whole `src/modules/scraping-exports/` module rewrite; verified by `rg` sweep (`tasks.md` Task 4.2)                   |
| 8   | UploadPanel button: download-latest-else-regenerate     | `src/modules/loads/components/UploadPanel.tsx` (`handleWebScraping`)                                                 |
| 9   | New error i18n keys in both locale files                | `src/language/locales/{es,en}.json` (`error.scrapingExport.*`)                                                       |
| 10  | Contract verified against staging before implementation | `tasks.md` Task 0.1; re-verified at PR-creation time against `staging@f584e72`                                       |

## Dependencies

- Backend PR #119 (`feat/scrape-retention-and-cached-exports` in `BACK-ACREDITACION-3.0`) must
  be merged to the backend's `develop` **and promoted to its `staging` branch** before real
  implementation starts — this is a sequential cross-repo change (no `contract.md`; the backend's
  committed `openapi.json` is the contract). Verify via `/abet-verify-contract` against
  `ref=staging`, never a local checkout of the backend on any branch.

## Risks

| Risk                                                                | Impact                                                                                                                                     | Mitigation                                                                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Backend not yet on `staging`                                        | Building against a contract that could still shift before it's actually deployed                                                           | Do not start implementation until `/abet-verify-contract` passes against `ref=staging`; this proposal is advance planning only |
| UX regression for staff/sections/enrolled-students/student-sections | Users lose the "one click, instant file" experience they have today; these four now behave like grades-rc (status-driven, possibly a wait) | Generalize the existing grades-rc status UI (already understood by users) to all five types instead of inventing a new pattern |
| Grades-rc's global (cross-period) single-flight conflict            | A `409` on grades-rc could be misread by the UI/user as "this period is already generating" when it's actually a different period's job    | Special-case the copy/logic for `gradesRc` 409s so it doesn't claim per-period scope                                           |
| Dead code left behind after the cutover                             | Old endpoints return 404 once backend removes them; stale frontend code calling them silently breaks                                       | AC-7 explicitly requires removal, verified by grep for the old paths/exports before PR                                         |

## Open questions

None — the one open product question (UploadPanel's button behavior post-migration) was
resolved with the requester: check status first, download immediately if `completed`, otherwise
`regenerate` (skipping the call entirely if already `running`) and point the user to the Exports
tab. Captured as AC-8.
