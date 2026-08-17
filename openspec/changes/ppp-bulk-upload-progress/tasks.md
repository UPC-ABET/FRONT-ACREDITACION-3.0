# Tasks — PPP bulk upload progress (frontend)

Tasks 1.x–3.x were done on `feat/ppp_1` before this folder existed; 4.x–7.x came out of the
PR #101 review. Boxes are checked to match what is on the branch.

## 1. Service + types

### Task 1.1: Model the job-start and job-status shapes

- [x] Add `PPPUploadJobStatus` and extend `MassiveUploadResult` with `excelWithErrors` /
      `fileName` in `types/index.ts`; widen `BackendUploadResult.errors` to
      `Array<string | object>` (PPP returns strings, other endpoints return objects)

### Task 1.2: Replace the synchronous upload call

- [x] Replace `uploadPPPMassive` with `startPPPUpload` + `getPPPUploadStatus` in
      `services/pppService.ts`; drop the never-read `academicPeriodId` body parameter
      (the endpoint reads `X-Academic-Period-Id`) and `encodeURIComponent` the job id

## 2. Upload flow

### Task 2.1: Poll the job from the hook

- [x] Rewrite `usePPPUpload` to start the job, hold the id, and expose `loading` / `status` /
      `result` / `error`

### Task 2.2: Show real progress

- [x] Add the progress dialog to `PPPMassiveUpload`, non-dismissible while the job runs

## 3. Configuration + report screens

### Task 3.1: Generate PPP config from real outcomes

- [x] Add `generatePPPConfigFromOutcomes` and the "Generar configuración" action in
      `PPPConfiguration`

### Task 3.2: Remove the "external" toggle from the competence form

- [x] Drop the toggle and its i18n key from `CompetenceCRUD`

### Task 3.3: Rework the PPP report filters

- [x] Move career / commission / campus / survey-number / language into the screen's own grid
      and pass them to `PerceptionReportPanel` as `externalFilters`

## 4. Review follow-up — correctness

### Task 4.1: Stop overwriting the stored `isExternal` flag

- [x] Restore `isExternal` on `CompetenceConfig` / `CompetenceFormData`, read it in
      `adaptPppConfig` / `adaptGraConfig`, carry it through `CompetenceCRUD`, and send the
      read value back in `savePPPCompetence` / `saveGRACompetence` instead of a literal `false`

### Task 4.2: Fail fast when the job was not accepted

- [x] Treat `accepted === false` as a failed start in `usePPPUpload`, not just an empty `jobId`

### Task 4.3: Bound the poll

- [x] Stop polling and surface `error.survey.jobPollTimeout` after 10 minutes, so the dialog
      becomes closable instead of spinning forever

### Task 4.4: Keep the career filter across tab switches

- [x] Hoist `uploadProgramId` / `reportsProgramId` / `configProgramId` into
      `PPPManagementView` and pass each into its tab

## 5. Review follow-up — consolidation

### Task 5.1: One polling hook

- [x] Add `hooks/useJobPolling.ts` on `useQuery` + `refetchInterval`, and migrate
      `usePPPUpload`, `useGRASendNotifications` and `useLCFCNotification` onto it

### Task 5.2: One progress dialog

- [x] Add `components/shared/SurveyJobProgressDialog.tsx` and reduce
      `PPPUploadProgressDialog` and `LCFCNotificationProgressDialog` to thin wrappers

### Task 5.3: One base64 decoder

- [x] Add `base64ToBlob` to `@/shared/utils` and use it from `PerceptionReportPanel`,
      `PPPMassiveUpload` and `shared/lib/fileDownload.ts`

### Task 5.4: Stop duplicating the commission/campus filters

- [x] Give `CommissionCampusFilters` a `className` (`contents`) and `namePrefix`, and use it
      from both `GRAReports` and `PPPReports`

### Task 5.5: Use the existing interpolation helper

- [x] Replace the manual `.replace` chains in the progress dialogs with `interpolate()`, and
      fold the `:` separator into the translated string

## 6. Review follow-up — UX

### Task 6.1: Tie the error workbook to a click

- [x] Replace the auto-download effect with a **Download errors** button in the dialog footer

### Task 6.2: Collapse the error surfaces

- [x] Drop the `rowsWithErrors` toast and reword `errorsNote` to state that nothing was saved
      and that the workbook is available from the button

### Task 6.3: Give GRA its report language back

- [x] Add the language `Select` to `GRAReports`, defaulting to the UI locale but overridable

## 7. Verification

### Task 7.1: Static checks

- [x] `npx tsc --noEmit` and `npx eslint` clean on the changed areas

### Task 7.2: Manual verification

- [ ] Upload a valid workbook and confirm the bar advances and the saved count matches
- [ ] Upload a workbook with a bad row; confirm the dialog says nothing was saved, the
      **Download errors** button yields the annotated file, and the picked file is retained
- [ ] Save a competence that has `isExternal = true` stored and confirm it is still `true`
- [ ] Switch PPP tabs back and forth and confirm each tab keeps its career selection
- [ ] Generate a GRA perception report in English while the UI is in Spanish
