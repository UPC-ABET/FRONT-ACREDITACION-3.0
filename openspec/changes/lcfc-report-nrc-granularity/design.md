# Design — frontend

## Sequencing

Sequential mode: backend change (same slug, `BACK-ACREDITACION-3.0`) implements first;
`openapi.json` is the contract, no `contract.md` here. The backend's `LcfcReportQueryDto`
gained an optional `groupBy?: 'course' | 'section'` query param on `GET lcfc/report-pdf`
(default `'section'`).

## Change

`downloadLCFCReportPdf` (`src/modules/surveys/services/lcfcService.ts`) existed but was never
called from any component. This change:

- Adds a `groupBy: 'course' | 'section' = 'section'` third parameter, forwarded as a query
  param.
- Wires it into `LCFCReports.tsx` (`src/modules/surveys/components/lcfc/`) with:
  - A `Toggle` ("Detalle por NRC (sección)") — on = `section` (shows professor per NRC), off =
    `course` (aggregated, no professor pursuant to the user's requirement that course-level
    view omits professor).
  - A `Button` ("Descargar reporte PDF") next to it, calling `downloadLCFCReportPdf(programId,
    locale, groupBy)`.

No new i18n namespace — new keys added under the existing `surveys.lcfc.reports.*` block in
both `es.json` and `en.json`.

## ADR gate

No new pattern, no new dependency. Doesn't warrant an ADR.
