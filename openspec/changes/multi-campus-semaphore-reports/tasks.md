# Tasks — Multi-campus semaphore report export

### Task 1: Update the filter DTO type

- [x] In `src/modules/evaluation/types/performanceReport.ts`, change
      `campusId?: number` to `campusIds?: number[]` on `PerformanceReportFilterDto`.

### Task 2: Update filter state hook to multi-select campus

- [x] In `src/modules/evaluation/hooks/usePerformanceReportFilters.ts`: replace
      `campusId: number | null` state with `campusIds: number[]` state (default `[]`),
      mirroring the existing `gradeTypeIds` pattern.
- [x] Update the `filters` memo to emit `campusIds: campusIds.length > 0 ? campusIds : undefined`.
- [x] Update `hasActiveFilters` to check `campusIds.length > 0` instead of `campusId != null`.
- [x] Update `reset()` to `setCampusIds([])`.
- [x] Replace `onCampusChange` (single-option handler) with `onCampusesChange` (array
      handler), following `onGradeTypesChange`'s shape.
- [x] Update the hook's returned object accordingly (`campusIds` instead of `campusId`,
      `onCampusesChange` instead of `onCampusChange`).

### Task 3: Update the filter bar UI to multi-select campus

- [x] In `src/modules/evaluation/components/performance-report/PerformanceReportFilters.tsx`,
      change the campus `<Select>` to `isMulti`, using the existing `selectedOptions()`
      helper (already used by the grade-types select) instead of `selectedOption()`.
- [x] Wire its `onChange` to `state.onCampusesChange`, mapping the selected options to
      `number[]` the same way the grade-types select does.

### Task 4: Verify downstream consumers need no further changes for the campus rename

- [x] Confirm `PerformanceReportView.tsx` needs no changes for the `campusId` →
      `campusIds` rename itself — it consumes the `filters` prop generically and doesn't
      reference `campusId` by name. (It does start consuming `appliedFilters` instead of
      `filters` for Task 5, below — a different, deliberate change.)
- [x] Confirm `performanceReportsService.ts`, `usePerformanceReports.ts`, and the download
      button in `PerformanceReportView.tsx` need no changes (per `design.md`, the blob/
      filename handling is already format-agnostic).

### Task 5: Add an explicit "Buscar" (Search) button so filter edits don't fire a request per change

- [x] In `usePerformanceReportFilters.ts`, add `appliedFilters` state
      (`useState<PerformanceReportFilterDto>`, initialized to `{ lang }`), a `search()`
      function that copies the live `filters` into it, and a `hasPendingChanges` memo
      (`JSON.stringify(filters) !== JSON.stringify(appliedFilters)`) to drive the button's
      disabled state.
- [x] Update `reset()` to also reset `appliedFilters` back to `{ lang }` (applies
      immediately — it's already a single explicit action).
- [x] Update the academic-period render-phase reset block to also reset `appliedFilters`
      (keeping `campusIds`/`gradeTypeIds`/`lang`, clearing the cascade-derived fields) —
      see `design.md` for why this is required, not optional.
- [x] Export `appliedFilters`, `hasPendingChanges`, and `search` from the hook.
- [x] In `PerformanceReports.tsx`, pass `filterState.appliedFilters` (not
      `filterState.filters`) to `PerformanceReportView` as its `filters` prop.
- [x] In `PerformanceReportFilters.tsx`, add a primary "Buscar" `<Button>` next to
      "Limpiar filtros", calling `state.search()`, disabled when `!state.hasPendingChanges`.
- [x] Add the `performanceReports.filters.search` key to `es.json` ("Buscar") and
      `en.json` ("Search").

### Task 6: Verify

- [x] `npx tsc --noEmit` is clean.
- [x] `pnpm lint` (via `npx eslint <changed files>`) is clean on every changed file
      (`performanceReport.ts`, `usePerformanceReportFilters.ts`,
      `PerformanceReportFilters.tsx`, `PerformanceReports.tsx`, `es.json`, `en.json`). The 2
      pre-existing `pnpm lint` errors elsewhere (`BannerLoginDialog.tsx`,
      `PerceptionReportPanel.tsx`) were verified present on `develop` before this change
      (via `git stash` + `pnpm lint`) — unrelated to this work.
- [x] `npx prettier --check` is clean on every changed file.
- [x] Manual verification (confirmed by miikuru002 against the running dev server):
      ran `pnpm dev`, opened the RC/RV report screen, and checked:
  - Editing any filter (campus, accreditor, outcome, language, grade types) does **not**
    refetch the report immediately — the on-screen data stays put until "Buscar" is
    clicked, and the button is disabled until something actually changed.
  - Clicking "Buscar" fires exactly one report request reflecting the current filter
    selection.
  - Clicking "Limpiar filtros" immediately reloads the unfiltered report (no extra
    "Buscar" click needed).
  - Switching the academic period (top bar) immediately reloads the report for the new
    period with the cascade filters cleared, rather than replaying a stale
    `programCommissionId` from the previous period.
  - Selecting 0 campuses (or clearing the filter) then searching still loads the combined
    on-screen report and downloads a single file with no campus suffix.
  - Selecting exactly 1 campus then searching downloads a single file (still no ZIP).
  - Selecting 2+ (but not all) campuses then searching downloads a `.zip` and the
    browser's download dialog shows a `.zip` filename, confirming `Content-Disposition`
    is read correctly for the new multi-campus case.
  - The "no data" (404) toast still fires correctly when a searched campus combination
    has no data.
