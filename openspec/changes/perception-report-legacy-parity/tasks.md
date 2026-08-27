# Tasks

## 1. Expose the selected modality as a label

- [x] Add `useModalityLabel` to `modules/academic/hooks/` and export it from the barrel

## 2. Send it with every perception report request

- [x] Add `modalityLabel` to `PerceptionReportFilters`
- [x] Read the hook in `PerceptionReportPanel` and include it in the mutation payload
- [x] Forward it in `generatePPPPerceptionPdf`, `generateGRAPerceptionPdf` and
      `generateLCFCPerceptionPdf`

## 3. Verification

- [x] `npx tsc --noEmit` clean
- [x] `pnpm lint` clean
- [ ] Manual: with the backend branch running, generate a GRA report under Regular and
      under EPE and confirm the `MODALIDAD DE ESTUDIO` header follows the top bar
- [ ] Manual: generate a PPP report with practices 1 and 2 selected and confirm the results
      list shows one PDF per practice plus the zip
