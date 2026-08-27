### Task 1 — Wire `downloadLCFCReportPdf` with a granularity toggle ✅ DONE (2026-08-27)

- [x] Task complete

**Files**

- `src/modules/surveys/services/lcfcService.ts` (modify — `groupBy` param)
- `src/modules/surveys/components/lcfc/LCFCReports.tsx` (modify — toggle + download button)
- `src/language/locales/es.json` (modify — new `surveys.lcfc.reports.*` keys)
- `src/language/locales/en.json` (modify — same keys, English)

**Steps**

1. Add `groupBy: 'course' | 'section' = 'section'` to `downloadLCFCReportPdf`.
2. Add a `Toggle` + `Button` to `LCFCReports.tsx`, defaulting to NRC/section granularity.
3. Add i18n keys: `downloadPdf`, `granularityLabel`, `granularityDescription`,
   `granularityCourse`, `granularitySection`.

**Commit**: `feat(surveys): add NRC/course granularity toggle to LCFC results report`

**Manual verification** (no `node_modules` installed in this checkout at implementation
time — run before merging):

- [ ] `npm install && npx tsc --noEmit` — no new type errors.
- [ ] `npm run lint` — no new lint errors on touched files.
- [ ] Manually load the LCFC reports tab, toggle NRC/Curso, download the PDF, confirm the
      backend-rendered table matches the toggle (professor+section shown only for NRC).
