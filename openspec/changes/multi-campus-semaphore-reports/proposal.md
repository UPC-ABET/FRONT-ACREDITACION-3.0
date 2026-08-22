# Multi-campus semaphore report export (RC/RV)

**Slug**: `multi-campus-semaphore-reports`
**Branch**: `feat/multi-campus-semaphore-reports`
**Repos affected**: frontend
**Created**: 2026-08-19

## Problem

The backend's semaphore report endpoints (`/evaluation/semaphore-reports/{rc,rv}` and
their `/pdf`/`/excel` variants) replaced the single `campusId?: number` filter with
`campusIds?: number[]`, and changed the download response shape based on how many
campuses are selected:

- Empty/omitted `campusIds` (or literally all active campuses) → 1 file with combined
  data, no campus suffix.
- Exactly 1 campus → 1 file, filename suffixed with the campus code.
- 2+ campuses (not all) → a `.zip` containing one file per campus.

The frontend still sends the old `campusId: number` field. Since the backend's
`ValidationPipe` runs with `whitelist: true`, sending `campusId` now fails every one of
the 6 endpoints with `400 property campusId should not exist` — the RC/RV report screen
and its PDF/Excel downloads are currently broken for any request bound for these
endpoints (full contract shared by the backend team as `reportes-rc.md`; not committed to
this repo — see backend PR
[#118](https://github.com/UPC-ABET/BACK-ACREDITACION-3.0/pull/118) for the source of
truth).

## What already exists

`src/modules/evaluation/` already implements the RC/RV report screen and downloads
end-to-end against these endpoints:

- `services/performanceReportsService.ts` — `getReport()` (JSON, for the on-screen
  table/chart) and `downloadReport()` (blob, for PDF/Excel), both POSTing
  `PerformanceReportFilterDto`.
- `types/performanceReport.ts` — `PerformanceReportFilterDto.campusId?: number` is the
  single field that needs to change shape.
- `hooks/usePerformanceReportFilters.ts` — owns all filter state (accreditor → commission
  → program → outcome cascade, plus campus, grade types, language) and exposes a
  `PerformanceReportFiltersState` consumed by the filter bar and the report view. Campus
  is currently a single-select (`campusId: number | null`); the module already has a
  working multi-select pattern one field over (`gradeTypeIds: number[]`, RV-only).
- `components/performance-report/PerformanceReportFilters.tsx` — renders the campus
  `<Select>` as single-select today; the grade-types `<Select isMulti>` a few lines down
  is the pattern to mirror.
- `hooks/usePerformanceReports.ts` — `usePerformanceReportDownload()` already treats the
  download response as an opaque blob + filename (`triggerBlobDownload`,
  `resolveDownloadFileName` off `Content-Disposition`) — it does not branch on
  `Content-Type`, so it already works unchanged for the PDF/Excel/ZIP trichotomy the
  backend now implements.

## What changes

1. `campusId?: number` → `campusIds?: number[]` in `PerformanceReportFilterDto`.
2. The campus filter becomes multi-select in both the hook (`usePerformanceReportFilters`)
   and the filter bar UI (`PerformanceReportFilters`), following the existing
   `gradeTypeIds` multi-select pattern in the same files.
3. No changes to the download plumbing (service/hook/blob handling) — it already handles
   PDF, Excel, or ZIP responses generically via `Content-Disposition`, which is exactly
   what the backend's shared contract doc (`reportes-rc.md`, not committed here) asks for.
4. **Explicit "Buscar" (Search) button.** Every filter field previously fed straight into
   the `useQuery` that drives the on-screen report (`PerformanceReportFilterDto` sat in
   the query key), so each individual filter tweak fired its own request immediately —
   picking two campuses in quick succession, for example, fired two overlapping report
   requests. `usePerformanceReportFilters` now separates the live filter-bar state
   (`filters`, unchanged) from an `appliedFilters` value that only advances when the user
   clicks "Buscar" (`search()`) or "Limpiar filtros" (`reset()`, which applies
   immediately since it's already a single explicit action). The report screen
   (`PerformanceReportView`, via `PerformanceReports.tsx`) now queries and downloads
   against `appliedFilters` instead of the live draft.

## Out of scope

- Any change to the on-screen JSON report rendering (`PerformanceReportView.tsx`,
  `PerformanceReportTable.tsx`, `PerformanceReportChart.tsx`) — the JSON endpoints already
  return a combined `summary[]` with a per-row `campus` field regardless of how many
  campuses are selected, so no changes are needed there.
- Adding a distinct "downloading ZIP" visual state — the button already shows a generic
  loading spinner (`Button loading` prop) with no PDF/ZIP-specific copy, so the checklist
  item in the backend's shared contract doc about simplifying "descargando ZIP" copy does
  not apply; there was never a ZIP-specific label to begin with.

## Blocking dependency

This change assumes `PerformanceReportFilterDto.campusId?: number` →
`campusIds?: number[]` is already live on the backend. As of this writing it is not:
backend PR [#118](https://github.com/UPC-ABET/BACK-ACREDITACION-3.0/pull/118) (the
`campusId` → `campusIds` contract change) is still open against `develop`, and the
committed `openapi.json` on both backend `develop` and `staging` still defines
`SemaphoreFilterDto.campusId: number` (singular). Do not merge this frontend change until
#118 has merged to `develop` and promoted to `staging` — with `ValidationPipe({ whitelist:
true })` on the backend, sending `campusIds: number[]` before then does not error
visibly, it silently drops the filter, so the multi-campus scenarios in `tasks.md`'s
manual verification step cannot be meaningfully exercised until then either.
