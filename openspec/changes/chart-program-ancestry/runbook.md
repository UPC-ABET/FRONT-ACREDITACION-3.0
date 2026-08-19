# Runbook — Chart program ancestry — Program (Carrera) pre-configuration in the org chart

**Slug**: `chart-program-ancestry`

This repo has no test runner, so every acceptance criterion in `proposal.md` is verified by
hand. This file is the consolidated checklist — the per-task "Manual verification" steps in
`tasks.md` are the same checks, run once per task; this is the same set run end to end
before the PR is opened.

## ⚠️ Deploy prerequisite

```
UPDATE (2026-08-18, post-implementation audit): the backend PR #107 has been confirmed
promoted to `staging` — squash-merge commit 089bd6351e677, verified via `gh api` against
openapi.json on both `develop` and `staging` (byte-identical, ChartProgramDto and
ChartHeadProgramViewDto present on both). The cross-repo sequencing gate below is
satisfied; this PR is no longer blocked on backend promotion.

Original prerequisite (kept for the record): this PR must not merge until the backend
change (UPC-ABET/BACK-ACREDITACION-3.0, branch feat/chart-program-ancestry, PR #107) has
reached the `staging` branch there. Confirm via /abet-verify-contract against `staging`
immediately before opening this PR — see docs/CONTEXT.md's cross-repo sequencing rule.

Manual end-to-end verification below still requires a locally-runnable backend (or a
shared environment running it) — "on staging" means promoted, not deployed; per
docs/CONTEXT.md, only `production` is an actually-running environment today. None of the
Manual validation rows below have been run against a live backend yet (no such
environment was available during implementation) — see tasks.md's Task 7.2 retro and the
`## Audit fixes (/abet-audit-pr)` section for the honest status.
```

## Manual validation

| #   | Step                                                                                                                                                                              | Expected                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | On the chart-heads admin screen, add two directors and pick a school on the first.                                                                                                | The second director's school picker no longer offers that school; the first director's own picker still shows it selected. (AC-4)                                                   |
| 2   | Add two Carreras to one director, with distinct staff and titles, then Save.                                                                                                      | The `POST /admin-chart-heads/configure` request body includes `directors[].programs[]` with both entries. (AC-1, AC-2)                                                              |
| 3   | Reload the page after step 2.                                                                                                                                                     | Both Carreras re-populate on the director's row, sourced from the `GET /admin-chart-heads/:academicPeriodId` response. (AC-3)                                                       |
| 4   | Add a second director; try to pick a Carrera already assigned to the first director, in the second director's picker and in a second Carrera row under the _same_ first director. | That Carrera is absent from both pickers. (AC-5)                                                                                                                                    |
| 5   | Trigger `error.chartHeads.programAssignedToOtherSchool` server-side (assign the same program to two different schools across two saves).                                          | A translated (not raw-key) toast/error message appears. (AC-6)                                                                                                                      |
| 6   | Open the maintenance tree's node-create dialog.                                                                                                                                   | "Carrera" is absent from the entity-type dropdown. (AC-7)                                                                                                                           |
| 7   | Right-click an existing Program node in the tree.                                                                                                                                 | Edit/Delete are absent; "Add child" is present. (AC-8)                                                                                                                              |
| 8   | Attempt to create an Area/Subarea/Course node whose parent chain has no Program ancestor (requires the backend branch running).                                                   | A translated `error.chart.programAncestorRequired` message appears, not the raw key. (AC-9)                                                                                         |
| 9   | On the Excel upload screen, select a school + period with no chart-heads config at all for that school.                                                                           | A warning banner names both missing prerequisites (no Director, no Carreras); the upload button stays enabled. (AC-10)                                                              |
| 10  | Configure a Director only for that school/period, revisit the upload screen.                                                                                                      | Only the "no Carreras" warning remains. (AC-10)                                                                                                                                     |
| 11  | Configure a Carrera too, revisit the upload screen.                                                                                                                               | The banner disappears. (AC-10)                                                                                                                                                      |
| 12  | `git diff` review of the full branch against `develop`.                                                                                                                           | No changes under `src/modules/loads/services/uploadsService.ts` or `src/modules/loads/types/index.ts`. (AC-11)                                                                      |
| 13  | `rg -i "programa" <touched locale line ranges>`                                                                                                                                   | Zero matches — "Carrera" used throughout. (AC-12)                                                                                                                                   |
| 14  | Run `/abet-verify-contract` against the backend's `feat/chart-program-ancestry`/`develop`/`staging` branches and confirm field names, error keys, and promotion status.           | See `tasks.md`'s Milestone 1 retro for the completed record (all assumptions confirmed exact; re-confirmed by the post-implementation audit against `staging`, 2026-08-18). (AC-13) |

## Data validation

Not applicable — this is a frontend-only change with no local data store or migration.

## Symptom → diagnosis

| Symptom                                                        | Likely cause                                                                                                                                               | Check                                                                                                                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carrera picker shows an option that should be excluded         | `usedProgramIds`/`usedSchoolIds` selector excluded the wrong row, or was computed from stale `form.directors` (e.g. before a `setForm` re-render)          | Re-read `chartHeadsSchema.ts`'s exclusion selectors against the current `ChartHeadsFormValue`, confirm they take the live `directors` array, not a captured stale closure                   |
| New backend error shows the raw key instead of translated text | Locale key spelling doesn't match the backend's exact error string (see Milestone 1's contract-verification note about possible key drift)                 | Compare the raw key in the browser network tab's error response against `es.json`'s `error.chartHeads.*` / `error.chart.*` entries character-for-character                                  |
| Upload precondition banner never appears                       | `LoadsPage.tsx`'s `useChartHeadsConfig` call is gated behind the wrong condition, or `schoolId`/`academicPeriodId` from `useABET()` are null when expected | Confirm the top bar's school selector is visible for the `charts` upload type (`useGlobalAcademicFiltersVisibilityOverride`) and that both scope values are non-null before the query fires |

## How to revert

Plain `git revert` of the merge commit — no migration, no seed, no data rewrite involved on
the frontend side.

## Do NOT

- Do not merge this PR without re-confirming the backend is on `staging` via
  `/abet-verify-contract` immediately before opening the PR — it was confirmed there as of
  2026-08-18, but re-verify rather than trusting this file's timestamp, since `staging` can
  move.
- Do not mark a task's manual-verification step "done" without actually running it against
  a live backend — see `tasks.md`'s `## Audit fixes (/abet-audit-pr)` section for the
  tasks whose manual verification is still outstanding as of this writing.
- Do not guess the exact backend error-key spellings from the proposal's pasted text — it
  was garbled in two places; always confirm via `/abet-verify-contract` (Milestone 1) before
  relying on a key.
