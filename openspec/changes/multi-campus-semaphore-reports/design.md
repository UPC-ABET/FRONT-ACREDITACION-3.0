# Design — Multi-campus semaphore report export

## Decision: mirror the existing `gradeTypeIds` multi-select pattern, don't invent a new one

`usePerformanceReportFilters.ts` already has one array-valued filter,
`gradeTypeIds: number[]` (RV-only grade type filter), with a full round trip: `useState<number[]>`
→ memoized `xOptions` → `selectedOptions()` helper in the component → `isMulti` `<Select>` →
`onChange` mapping `option[] → number[]`. Campus becomes the second array-valued filter,
using the exact same shape (`campusIds: number[]`, defaulting to `[]`), rather than a
one-off boolean/checkbox-list UI. This keeps the filter bar internally consistent and
means the component only needs the already-imported `selectedOptions()` helper — no new
component code.

Alternative considered: a separate "all campuses" toggle next to a disabled single-select.
Rejected — `reportes-rc.md` explicitly says `campusIds: []`/omitted already means "all
campuses" on the backend, so a toggle would be redundant state that has to stay in sync
with the array, for no behavioral gain. Empty multi-select reads naturally as "no filter
applied = all", matching every other optional filter in this same form (accreditor,
commission, outcome all use the same "unset = no filter" convention).

## Decision: no change to the download hook/service/component beyond the DTO field

`usePerformanceReportDownload` → `performanceReportsService.downloadReport()` →
`apiPostBlobResponse` already:

- Never branches on `Content-Type` — it hands the response back as an opaque `Blob`.
- Resolves the filename from `Content-Disposition` via `resolveDownloadFileName()`, only
  falling back to a locally-built name (`fallbackFileName()`) if the header is absent.
- `triggerBlobDownload()` in `PerformanceReportView.tsx` fires the same way regardless of
  whether the blob is a PDF, an XLSX, or a ZIP — the browser's download dialog uses
  whatever extension is in the resolved filename.

This already satisfies every bullet in `reportes-rc.md`'s "Manejo de errores" and
"Checklist de migración" sections except the DTO field rename and the campus multi-select
UI. Confirmed by reading `performanceReportsService.ts`,
`usePerformanceReports.ts`, and `PerformanceReportView.tsx` before writing this
design — no speculative "might need to change" items included.

## Filename fallback and ZIP extension — accepted as-is, not hardened

`fallbackFileName()` only ever returns a `.pdf`/`.xlsx` extension, never `.zip`, since it
has no way to know the backend chose ZIP mode without reading the response. This fallback
only fires when `Content-Disposition` is missing entirely, which `reportes-rc.md` says the
backend always sends for these 6 endpoints. Not hardening this against a header the
backend contract guarantees it will send — that would be validating for a scenario that
can't happen per the documented contract, which the project's coding guidelines
explicitly call out as unnecessary defensive code.

## Decision: split "draft" filters from "applied" filters, gated by an explicit Search button

Turning campus into a multi-select made the existing "every filter change refetches
immediately" behavior worse: selecting several campuses (or tweaking campus + language +
outcome while getting a filter combination right) fired one overlapping report request per
click, each with its own in-flight `useQuery`/query-key, racing each other and visibly
delaying the one that actually mattered. This wasn't purely a multi-campus problem, but the
multi-select made it easy to hit in normal use, so it's fixed as part of this change rather
than filed separately.

`usePerformanceReportFilters` now holds two versions of the filter payload:

- `filters` — the live value derived from current Select state, recomputed every render
  (unchanged from before this decision). Still used by the filter bar to know what's
  currently selected.
- `appliedFilters` — a separate `useState<PerformanceReportFilterDto>`, only overwritten by
  `search()` (copies `filters` in) or `reset()` (clears back to just `lang`). This is what
  `PerformanceReportView` actually queries and downloads against.

`reset()` still applies immediately rather than requiring a second "Buscar" click — it's
already a single explicit user action (the "Limpiar filtros" button), so gating it behind
another click would be double-clicking for no benefit. Only editing individual filter
fields is deferred.

The academic period is a special case: it's a _global_ selector (top bar, `useABET()`), not
part of this filter bar, so there's no "Buscar" gesture tied to it. When it changes, the
existing render-phase reset (accreditor/commission/program/outcome → `null`) now also resets
`appliedFilters` to match (keeping `campusIds`/`gradeTypeIds`/`lang`, since those aren't
period-scoped) — otherwise the query key would flip to the new period while still
carrying a `programCommissionId` that belonged to the old one, since `academicPeriodId`
is a separate key segment from `appliedFilters` in `performanceReportKeys.report()`.

`hasPendingChanges` (`JSON.stringify(filters) !== JSON.stringify(appliedFilters)`) drives
the Search button's `disabled` state — nothing to search when the two already match, which
is also the state right after mount, after a completed search, or right after reset.
`JSON.stringify` is deliberately the whole comparison: `PerformanceReportFilterDto` is a
flat object of primitives/optional-primitive-arrays with no method or `Date` values, so a
generic deep-equal utility would be solving a more general problem than this call site has;
the one thing this relies on is that `filters` and `appliedFilters` build their optional
keys in the same order (`programCommissionId, outcomeId, campusIds, gradeTypeIds, lang`) so
that `JSON.stringify` (which drops `undefined`-valued keys but preserves insertion order of
the rest) produces matching strings for equal values — true for every literal that
constructs one of these two states in this file today.

## `hasActiveFilters` / `reset()` / query-key implications

- `hasActiveFilters` currently checks `campusId != null`; becomes `campusIds.length > 0`.
- `reset()` currently does `setCampusId(null)`; becomes `setCampusIds([])`.
- The download mutation and the on-screen `useQuery` both already put the full `filters`
  object (or `effectiveFilters`) into their query keys
  (`performanceReportKeys.report(kind, academicPeriodId, filters)`), so switching
  `campusId: number | undefined` to `campusIds: number[] | undefined` inside that object
  continues to correctly bust the cache on any campus selection change — no query-key
  factory changes needed.
