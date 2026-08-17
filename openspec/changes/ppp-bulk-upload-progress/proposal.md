# PPP bulk upload progress

**Slug**: `ppp-bulk-upload-progress`
**Branch**: `feat/ppp_1`
**Repos affected**: frontend (this repo) + backend (UPC-ABET/BACK-ACREDITACION-3.0#104)
**Created**: 2026-08-16 (retro-fitted during review of PR #101)

> Retro-fitted after the fact. The branch name (`feat/ppp_1`) predates the slug convention,
> so the folder name is the slug and the branch is not renamed — see [design.md](./design.md).

## Problem

PPP's bulk import is a single synchronous POST. The coordinator picks an Excel with a few
hundred rows, clicks upload, and gets no feedback until the whole file has been validated
and saved — which for a large workbook is long enough that the screen reads as frozen and
users retry, re-submitting the same file.

Two smaller problems ride along with it:

- **A failed import gives the user nothing to act on.** PPP's import is all-or-nothing: one
  bad row means nothing is saved. The list of per-row reasons is shown on screen, but there
  is no corrected-file path — the user has to translate an on-screen list back into edits in
  their own workbook by hand.
- **The report and configuration screens disagree with each other.** PPP's report filters
  are laid out differently from GRA's, and PPP's competence form still carries an "external"
  toggle that the outcomes-driven configuration flow made meaningless.

## What already exists

- `src/modules/surveys/components/ppp/PPPMassiveUpload.tsx` — the upload screen, wired to
  `FileUploadPanel` and `UploadResultSummary`.
- `src/modules/surveys/hooks/usePPP.ts` — `usePPPUpload`, previously a single awaited call
  to `uploadPPPMassive`.
- `src/modules/surveys/services/pppService.ts` — `uploadPPPMassive`, posting the workbook as
  base64 to `ppp/survey/upload-excel`.
- `src/modules/surveys/components/lcfc/notifications/LCFCNotificationProgressDialog.tsx` —
  LCFC already solved the same "long job, show progress" problem for notification sends, and
  `useLCFC`/`useGRA` already poll a job-status endpoint. This change is the **third**
  instance of that shape, which is what makes shared machinery worth extracting now.
- `src/modules/surveys/components/shared/CommissionCampusFilters.tsx` — the commission +
  campus filter pair, used by `GRAReports`.

## What changes

1. **Backend (#104)** turns `ppp/survey/upload-excel` into a job starter — it validates the
   workbook synchronously enough to return a row count, then returns
   `{ accepted, jobId, totalRows }` and processes in the background. A new
   `ppp/survey/upload-status/:jobId` reports `{ progressPct, totalRows, processedRows, done,
result }`. On failure the `result` carries `excelWithErrors` (the same workbook, base64,
   with an appended "Errores" column) plus a suggested `fileName`.
2. **Frontend** starts the job, polls the status endpoint, and shows real progress in a
   dialog — rows actually processed server-side, never a simulated bar.
3. **A failed import offers the annotated workbook as a download**, so the user fixes their
   own file and re-uploads it.
4. **Polling machinery is extracted** into one `useJobPolling` hook used by PPP, GRA and
   LCFC, and the progress dialog into one `SurveyJobProgressDialog` used by PPP and LCFC.
5. **PPP's report filters** reuse `CommissionCampusFilters` and gain the survey-number and
   language selectors, matching GRA.
6. **The competence "external" toggle is removed from the UI.** The stored value is still
   read and written back unchanged — this change does not decide the flag's fate.

## Out of scope

- **Deciding whether `isExternal` is dead.** The toggle goes; the column and the value stay.
  Removing it for real is a backend change and needs its own proposal.
- **Job durability.** Backend #104 keeps job state in an in-process `Map`, so a restart or a
  second replica can drop a job mid-upload. GRA and LCFC already ship with this; it is a
  platform question, not one this change takes on.

## Acceptance criteria

- [ ] Uploading a valid workbook shows a progress dialog that advances from 0% to 100% and
      reports the saved-row count; the dialog cannot be dismissed while the job runs.
- [ ] Uploading a workbook with at least one bad row ends on a "with errors" dialog stating
      that nothing was saved, offering a **Download errors** button that yields the annotated
      workbook. The selected file stays in the panel so the user can retry without re-picking.
- [ ] A job that never reports `done` fails the dialog with a timeout message after 10
      minutes, making the dialog closable, instead of polling forever.
- [ ] A status response slower than the poll interval never makes the progress bar move
      backwards.
- [ ] Opening an existing competence flagged external and saving it leaves the stored flag
      unchanged.
- [ ] PPP and GRA report screens offer the same filter set (career, commission, campus,
      language; survey number on PPP only), and each PPP tab's career selection survives
      switching to another tab and back.
