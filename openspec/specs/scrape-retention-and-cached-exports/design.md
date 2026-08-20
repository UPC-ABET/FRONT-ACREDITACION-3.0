# Design — Scraping exports move to cached, async generation

**Slug**: `scrape-retention-and-cached-exports`
**Proposal**: `./proposal.md`

## Read first

- `./proposal.md` — the ten ACs this design must satisfy.
- `docs/POLICIES.md` § Data Fetching (TanStack Query scope-variable rule, API client rules,
  error handling), § Global Academic Context (Top Bar) (no screen-local period picker), § i18n
  (backend error codes are also frontend i18n keys), § Verification Gate (no test runner — tsc +
  lint + manual is the bar).
- `docs/CONTEXT.md` § Related Repositories → Cross-repo change model, § Global Academic Context,
  § Business Rules (rule 4, Planner credentials — the closest existing precedent for a
  cross-cutting async-state business rule worth recording).
- `src/modules/scraping-exports/` (all 6 files) — the module being replaced: old direct-download
  service, the grades-rc job trio, their types, the upload-type mapping constant, and the current
  view.
- `src/modules/loads/components/UploadPanel.tsx` — second consumer, the "Excel web-scraping"
  quick-action button.
- `src/app/(protected)/scrapping/ScrapingTabsView.tsx` — hosts the Exports tab; unaffected by
  this change beyond its existing import.
- `src/shared/lib/apiClient.ts` — `apiGet`/`apiPost`/`apiGetBlobResponse`, `ApiError.status`, and
  confirmation that `X-Academic-Period-Id` is forwarded automatically once
  `setActiveAcademicPeriodId` has been called (nothing to add here, but a `400` comes back if it
  hasn't).
- `src/providers/AbetProvider.tsx` — `useABET()` shape (`schoolId`, `modalityTypeId`,
  `academicPeriodId`).
- `src/shared/hooks/useApiErrorToast.ts` — the `showToast`/`handleError` pattern reused here.
- `src/modules/ard/components/ArdOverviewPage.tsx` (lines ~210) — precedent for the standard
  "select a period" notice: `{academicPeriodId === null && <Alert variant="warning">...}`.
- `src/shared/constants/typeCodes.ts` (`UPLOAD_TYPE`) — the keys `scrapingExportForUploadType`
  maps from.
- `openspec/specs/` — empty; no prior art for this exact pattern beyond the grades-rc job trio
  already inside the module being replaced.
- No ADR exists yet (`docs/adr/` has only its `README.md` index).

## Contract status

Checked directly against the backend's committed spec (not a local checkout):

```bash
gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=staging" \
  -H "Accept: application/vnd.github.raw" | grep -o '"/scraping/exports[^"]*"'
```

At design time (2026-08-20, first check), `ref=staging` still only had the **old** paths. Re-run
at implementation start (2026-08-20, same day): `ref=staging` now returns exactly the three new
generic paths (`/scraping/exports/{exportType}/status|download|regenerate`) and none of the seven
old ones — **the Milestone 0 gate is satisfied.**

The real `ScrapingExportStatusResponseDto` schema (from `components.schemas` in the fetched
spec) corrects one assumption from the brief: **`periodo` is a `string`, not a `number`.**
Everything else matches the brief exactly:

```json
{
	"exportType": {
		"enum": ["staff", "sections", "enrolledStudents", "studentSections", "gradesRc"]
	},
	"periodo": { "type": "string" },
	"lang": { "type": "string" },
	"status": { "enum": ["running", "completed", "failed", "notGenerated"] },
	"fileName": { "type": "string", "nullable": true },
	"errorMessage": { "type": "string", "nullable": true },
	"startedAt": { "type": "string", "format": "date-time", "nullable": true },
	"finishedAt": { "type": "string", "format": "date-time", "nullable": true }
}
```

Only `status` is `required` in the DTO — matching the brief's "never generated yet: just
`{ status: 'notGenerated' }`". The frontend's `ScrapingExportGenerated`/`ScrapingExportStatusResponse`
union below models this the same way, purely for ergonomic narrowing on the `status` literal; the
`{ status: 'notGenerated' }` branch is a strict subtype of what the DTO actually allows (all other
fields simply absent), so the union is safe. Path `exportType` is kebab-case
(`enrolled-students`, `student-sections`); the JSON body's `exportType` field and all frontend
identifiers are camelCase (`enrolledStudents`, `studentSections`) — confirmed against the spec,
not just the brief. `X-Academic-Period-Id` is `required`, `type: integer` on all three endpoints,
confirming no change needed to the existing header-forwarding behavior.

## ADR gate (walked, not skipped)

| Trigger                                       | Hit?                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Datastore, broker or cache choice             | No                                                                                                                                                                                                                                                           |
| Auth or payments provider                     | No                                                                                                                                                                                                                                                           |
| Public API contract change or breaking change | Partially — the backend already decided and is shipping a breaking API change; this repo only _consumes_ it. No new public API is introduced by the frontend, and the decision behind the breaking change belongs to the backend's own change, not this one. |
| New module boundary or cross-repo split       | No — reuses the existing `scraping-exports` module and the existing sequential cross-repo pattern; no new module, no new split.                                                                                                                              |
| Language, runtime or framework                | No                                                                                                                                                                                                                                                           |
| Contradicting an existing ADR                 | No — `docs/adr/` has no numbered ADRs yet to contradict.                                                                                                                                                                                                     |

**Conclusion**: no ADR required. This generalizes an already-accepted pattern (grades-rc's
status/regenerate/download trio) to the other four export types; it doesn't introduce a new
cross-cutting architecture decision.

## Approach

### AC-1 — Status call per export type, period/lang-scoped

One query per export type, `useScrapingExportStatus(exportType, academicPeriodId, lang)`, calling
`GET /scraping/exports/:exportType/status?lang=...` (kebab-case path segment resolved from a
`EXPORT_TYPE_PATH` map; `X-Academic-Period-Id` is attached automatically by `apiClient` once
`academicPeriodId` is active — no manual header code needed). `ScrapingExportsView` renders one
card per `ScrapingExportType` (`staff`, `sections`, `enrolledStudents`, `studentSections`,
`gradesRc`), each backed by its own query instance — five independent queries, not one aggregate
call, since the backend contract is per-type.

### AC-2 — No-period gating

`ScrapingExportsView` reads `const { academicPeriodId } = useABET()`. All five status queries are
`enabled: academicPeriodId !== null`. When it's `null`, the view renders the standard
`<Alert variant="warning">{t('scraping.exports.selectPeriod')}</Alert>` notice (same idiom as
`ArdOverviewPage`) instead of the cards, and instead of a screen-local period picker.

### AC-3 — Download available whenever a successful file exists, independent of current status

The status response's `fileName` reflects the **last successfully generated file**, independent
of the current run's `status` — that's what makes "download serves the previous file while a
regenerate runs" possible. So the Download action's visibility rule is:

```
canDownload = status !== 'notGenerated' && fileName !== null
```

not `status === 'completed'`. This covers all three cases the brief describes: `completed` (the
obvious case), `running` with a prior success (`fileName` set — download the old file while the
new one builds), and `failed` with a prior success (a previous good file survives a later failed
regenerate attempt). Only `notGenerated`, or a `running`/`failed` status with `fileName: null`
(never once succeeded), hide Download.

### AC-4 — `notGenerated`/`failed` → regenerate as primary action

The primary button calls `POST /scraping/exports/:exportType/regenerate` whenever `status` is
`notGenerated` or `failed` (label "Generar" / "Reintentar" respectively, matching the existing
grades-rc card's copy pattern). While `status === 'running'`, the primary button is disabled
(label reflects "generating…") rather than re-issuing regenerate, both to avoid a guaranteed
`409` and because there is nothing new to trigger.

### AC-5 — 409 handling, without implying per-period scope for grades-rc

The regenerate mutation's `onError` checks `error instanceof ApiError && error.status === 409`,
shows the backend's own translated message (`tryTranslate(t, error.message)` — the backend
already sends `error.scrapingExport.alreadyGenerating`) via the existing toast pattern, and
invalidates that export's status query so the UI re-syncs with whatever is actually running.

**No export-type-specific wording is added on top of the backend's message** — this is the whole
mitigation. The generic message ("ya se está generando" / "already generating") is accurate for
all five types including `gradesRc`; the bug this AC guards against is a developer later adding
copy like "this period's export is already generating" uniformly across all five cards, which
would misrepresent `gradesRc`'s cross-period single-flight behavior. The badge/running-state
copy is likewise the same generic template for all five types — nothing renders "for this
period" anywhere in the card.

### AC-6 — Query key scope

Per the TanStack Query policy ("put all of [`schoolId`, `modalityTypeId`, `academicPeriodId`] in
the key, not just the ones that seem relevant"), even though the brief only calls out
`X-Academic-Period-Id` as required:

```ts
const scrapingExportsQueryKeys = {
	all: ['scraping-exports'] as const,
	status: (
		exportType: ScrapingExportType,
		schoolId: number | null,
		modalityTypeId: number | null,
		academicPeriodId: number | null,
		lang: string,
	) =>
		[
			...scrapingExportsQueryKeys.all,
			'status',
			exportType,
			schoolId,
			modalityTypeId,
			academicPeriodId,
			lang,
		] as const,
};
```

### AC-7 — Old contract removed

The whole `scraping-exports` module's internals (types, constants, service, hooks) are rewritten
in place — the old exports are deleted, not deprecated or aliased, in the same commit that adds
the new ones (see Milestone 1). Both consumers (`ScrapingExportsView`, `UploadPanel`) are updated
in the same milestone so the tree never has dangling imports. Final verification is a literal
grep for the old path segments and export names (Task 4.2).

### AC-8 — `UploadPanel`'s button, refined

Resolved with the requester as "download latest if it exists, else regenerate." Read literally
against AC-3's `fileName`-is-the-source-of-truth rule (not `status === 'completed'`), so a file
that succeeded before a _later_ failed attempt is still offered:

```ts
const status = await getScrapingExportStatus(exportType, locale);
if (status.status !== 'notGenerated' && status.fileName) {
	await downloadScrapingExport(exportType, locale, fallbackFileName);
} else if (status.status === 'running') {
	showToast(t('loads.upload.webScrapingAlreadyRunning'), 'info'); // no regenerate call — avoids a guaranteed 409
} else {
	await regenerateScrapingExport(exportType, locale);
	showToast(t('loads.upload.webScrapingStarted'), 'success'); // points to the Exports tab
}
```

This is one round trip more than the old single-call button (a `status` check before acting),
which is unavoidable under the new contract — there is no way to know in advance whether a file
already exists without asking.

### AC-9 — New i18n keys

`error.scrapingExport.notGenerated`, `error.scrapingExport.alreadyGenerating`,
`error.scrapingExport.invalidExportType`, `error.scrapingExport.periodNotFound` added to both
`es.json` and `en.json`, alongside the existing `scraping.exports.*` tree (reworked — see
Frontend § i18n keys below).

### AC-10 — Contract verification gate

`tasks.md` Milestone 0 is a hard blocker: no other milestone starts until
`/abet-verify-contract` passes against the backend's `openapi.json` at `ref=staging`.

## Frontend

- **Routes / screens**: no new routes. `/scrapping` (Exports tab) and the loads upload page are
  the two existing screens affected.
- **Module**: `src/modules/scraping-exports/` — same module, contents rewritten:
  - `types/index.ts` — replace `ScrapingExportKind` / `DirectDownloadExportKind` /
    `GradesRcExportStatus` / `GradesRcExportJobStatus` with:

    ```ts
    export type ScrapingExportType =
    	| 'staff'
    	| 'sections'
    	| 'enrolledStudents'
    	| 'studentSections'
    	| 'gradesRc';

    export type ScrapingExportRunStatus = 'running' | 'completed' | 'failed';

    export interface ScrapingExportGenerated {
    	exportType: ScrapingExportType;
    	periodo: string;
    	lang: string;
    	status: ScrapingExportRunStatus;
    	fileName: string | null;
    	errorMessage: string | null;
    	startedAt: string | null;
    	finishedAt: string | null;
    }

    export type ScrapingExportStatusResponse = { status: 'notGenerated' } | ScrapingExportGenerated;
    ```

  - `constants/index.ts` — `EXPORT_TYPE_PATH` (camelCase → kebab-case path segment),
    `EXPORT_FALLBACK_FILE_NAME` (camelCase → the existing fallback filenames, unchanged), and
    `scrapingExportForUploadType` reworked to return the new `ScrapingExportType` values
    (`staff`/`sections`/`enrolledStudents`/`studentSections`, same `TYPE_CODES.UPLOAD_TYPE` keys
    as today — only the mapped values change).
  - `services/scrapingExportsService.ts` — `getScrapingExportStatus`, `regenerateScrapingExport`,
    `downloadScrapingExport(exportType, lang, fallbackFileName)`, all built on the same
    `apiGet`/`apiPost`/`apiGetBlobResponse` helpers already used today. The old
    `startGradesRcExport`/`getGradesRcExportStatus`/`downloadGradesRcExport` trio and the old
    `EXPORTS` direct-download map are deleted.
  - `hooks/useScrapingExports.ts` (replaces `useGradesRcExport.ts`) —
    `scrapingExportsQueryKeys`, `useScrapingExportStatus`, `useRegenerateScrapingExport`
    (invalidates that export's status query on both success and 409 error). Polling interval
    constant carried forward from the grades-rc precedent (5s), now shared by all five types,
    active only while `status === 'running'`.
  - `components/ScrapingExportsView.tsx` — one unified card renderer for all five types
    (replaces the four identical direct-download cards plus the separate hand-built grades-rc
    card) driven by `SCRAPING_EXPORT_TYPES: ScrapingExportType[]` iterated with
    `useScrapingExportStatus` per type.

- **Second consumer**: `src/modules/loads/components/UploadPanel.tsx` — `handleWebScraping`
  rewritten per AC-8's approach above; still gated on `scrapingExportForUploadType(type.code)`
  returning a type (grades-rc stays excluded from the upload-type map, unchanged from today).
- **Data / query keys**: see AC-6 above — every key includes `schoolId`, `modalityTypeId`,
  `academicPeriodId`, `exportType`, and `lang`.
- **i18n keys** (both `es.json`/`en.json`):
  - `scraping.exports.items.{staff,sections,enrolledStudents,studentSections,gradesRc}.{title,description}`
    (renamed from `docentes`/`secciones`/`alumnosMatriculados`/`alumnosSecciones`/`notasRc`,
    content unchanged).
  - `scraping.exports.actions.{generate,regenerate,retry,download,badgeRunning,badgeCompleted,
badgeFailed,statusRunning,statusFailed,startFailed}` — generalizes the old `notasRc.*`
    action-label keys so all five cards share one set instead of four cards using
    `scraping.exports.download` and one using its own `notasRc.*` set.
  - `scraping.exports.selectPeriod` — new, the top-bar gating notice (AC-2).
  - `loads.upload.webScrapingAlreadyRunning`, `loads.upload.webScrapingStarted` — new, for the
    two non-download branches of AC-8.
  - `error.scrapingExport.{notGenerated,alreadyGenerating,invalidExportType,periodNotFound}` —
    new (AC-9).
- **Types staying in sync with the backend contract**: since this is sequential mode with no
  `contract.md`, the `ScrapingExportGenerated` shape above is the frontend's best reading of the
  brief. Milestone 0 requires diffing it against the real `openapi.json` once verified, before
  Task 1.1 is treated as done — in particular confirming `periodo`'s type and whether any field
  is optional rather than nullable.

## Cross-repo mode

- **Mode**: sequential — one backend PR (#119) already exists and will merge and promote on its
  own; this frontend change follows it. No `contract.md`; the backend's committed `openapi.json`
  is the contract.
- **Contract**: `BACK-ACREDITACION-3.0`'s `openapi.json`, fetched via `gh api` at whichever branch
  is being checked — never a local checkout.
- **Ordering**: stricter than the repo's general default for this specific change, per the
  requester's explicit instruction — **no implementation work starts** (not just "no merge")
  until the backend reaches `staging` and `/abet-verify-contract` passes. Confirmed not yet the
  case as of 2026-08-20 (see "Contract status at design time" above).

## Testing strategy

No test runner exists in this repo (`docs/POLICIES.md` § Verification Gate) — every row below is
`tsc --noEmit` + `pnpm lint` + a described manual step, not an automated test. Introducing a test
framework is out of scope for this change.

| AC  | Covered by                                                                                                                                                                           | Kind                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | -------------------- | ----------------- | --------------- | ---------------- | ------------------ | ------------------------ | --------------------------------------------------------------------------- | ----------------- |
| 1   | Load `/scrapping` → Exports tab with a period selected; Network tab shows 5 `status` calls                                                                                           | manual                         |
| 2   | Clear the top-bar period; Exports tab shows the notice, no network calls fire                                                                                                        | manual                         |
| 3   | While one export is `running` (regenerate it, then immediately check), confirm Download still works if a prior file exists                                                           | manual                         |
| 4   | Click "Generar" on a `notGenerated` export; confirm `regenerate` fires and the card flips to running                                                                                 | manual                         |
| 5   | Trigger a `409` (double-click regenerate fast, or regenerate grades-rc while another period's grades-rc job runs); confirm the toast text and that it doesn't claim per-period scope | manual                         |
| 6   | Switch the top-bar period; confirm status refetches for the new period (no stale badge)                                                                                              | manual                         |
| 7   | `rg -i "docentes                                                                                                                                                                     | secciones                      | alumnos-matriculados | alumnos-secciones | grades-rc/start | grades-rc/status | grades-rc/download | DirectDownloadExportKind | GradesRcExportJobStatus" src/` returns nothing outside comments/locale copy | manual (Task 4.2) |
| 8   | Click "Excel web-scraping" in `UploadPanel` in each of the three states (completed / notGenerated / running)                                                                         | manual                         |
| 9   | `es.json`/`en.json` both contain the four new `error.scrapingExport.*` keys                                                                                                          | manual (grep)                  |
| 10  | `/abet-verify-contract` output, attached to the PR body                                                                                                                              | manual, tracked as Milestone 0 |

All manual steps are also written into `runbook.md`.

## Risks

| Risk                                                            | Mitigation                                                                                                                                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend not yet on `staging`                                    | Resolved — confirmed live on `ref=staging` at implementation start; Milestone 0 checked off                                                                                         |
| `periodo` field type / optionality assumed, not confirmed       | Resolved — corrected to `string` from the real `openapi.json` (see "Contract status" above)                                                                                         |
| Five independent per-type queries instead of one aggregate call | Matches the backend's per-type contract exactly (there is no aggregate endpoint); five small queries is simpler than inventing a client-side batching layer for a page with 5 cards |
| Grades-rc's cross-period 409 misread as this-period             | No period-specific copy anywhere in the shared card template (AC-5)                                                                                                                 |
| Dead code left behind after cutover                             | AC-7 + Task 4.2's grep are the explicit gate                                                                                                                                        |

## Docs to update in this PR

- [x] `docs/CONTEXT.md` § Business Rules — add an entry for the shared scraping-export contract:
      download always serves the last successful file even mid-regenerate, and grades-rc's
      single-flight is global across periods, not per-period like the other four (mirrors the
      existing Planner credentials entry, rule 4, as the nearest precedent for this kind of
      cross-cutting async-state rule). Done as rules 5 and 6.
- [x] `docs/CONTEXT.md` § Directory Structure — no path changes, but the one-line description of
      `scraping-exports/` ("Scraping export downloads") is still accurate; no edit needed there
      beyond the Business Rules addition above. Confirmed — closing with no action.
