# Design

## Where the modality label comes from

`useModalityLabel` is a new hook in `modules/academic/hooks/`. Academic owns the global
scope selectors, so it owns the lookup that turns `modalityTypeId` into a display name —
surveys imports it through the `@/modules/academic` barrel, the same way it already imports
`campusesService`.

Alternative considered: exporting the label out of `useGlobalAcademicFilters`. Rejected —
that hook owns the top bar's own state (school cookie, period reset, query invalidation)
and calling it from a report panel would drag all of that in for one string.

The hook reuses `useTypesByGroupCode`, whose query is `staleTime: Infinity` and already
warm from the top bar, so the extra consumer costs no request.

## Where it is sent from

`PerceptionReportPanel` is the single call site for all three survey types, so the label is
added to the mutation payload there rather than in each of `PPPReports` / `GRAReports` /
`LCFCReports`. `PerceptionReportFilters` gains `modalityLabel?: string`, and the three
`generate*PerceptionPdf` services forward it.

## Multiple PDFs per generation

PPP now returns one report per practice. The results list already renders
`result.reports` as a list keyed by filename and offers the zip when the backend sends one,
so no UI change is needed — this is called out here only because it is the visible effect
of the backend half.
