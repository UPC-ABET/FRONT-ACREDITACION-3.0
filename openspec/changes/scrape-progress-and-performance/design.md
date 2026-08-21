# Design — Scrape progress and performance

**Slug**: `scrape-progress-and-performance`
**Proposal**: `./proposal.md`

## Read first

- `./proposal.md` — the 8 ACs this design must satisfy.
- `docs/POLICIES.md` § Data Fetching (never `useEffect`+`useState` for API calls — not
  relevant here since no new fetch is added), § i18n (`t('key')` + locale JSON, no hardcoded
  strings), § Verification Gate (no test runner — `tsc` + `pnpm lint` + manual is the bar),
  § Components (Badge for status pills, reuse over hand-rolling).
- `docs/CONTEXT.md` § Related Repositories → Cross-repo change model (sequential mode,
  `openapi.json` is the contract), § Business Rules rule 4 (Planner's async-state
  precedent).
- `src/modules/banner/{types,constants,hooks,services,components}/*` — `ScrapeRun`,
  `ScrapeRunSummary`, `SCRAPE_STATUS_COLORS`, `useBannerScrapeRun`, `getBannerScrapeRun`,
  `ScrapeRunProgress.tsx`, `ScrapeRunHistory.tsx` — the module being extended.
- `src/modules/planner/{types,constants,hooks,services,components}/*` — the mirror-image
  Planner module (`PlannerScrapeRun`, `PlannerScrapeRunSummary`,
  `PLANNER_SCRAPE_STATUS_COLORS`, `usePlannerScrapeRun`, `getPlannerScrapeRun`,
  `PlannerScrapeRunProgress.tsx`, `PlannerScrapeRunHistory.tsx`).
- `src/language/locales/{es,en}.json` — existing `banner.run.*` / `planner.run.*` /
  `banner.history.*` / `planner.history.*` trees the new keys extend.
- `src/shared/components/ui/Badge.tsx` — the existing status-pill primitive; not reused for
  the phase label itself (see Approach § AC-1).
- `openspec/specs/scrape-retention-and-cached-exports/design.md` — prior art for this
  repo's "contract status" section format and for keeping a service function a thin,
  type-only pass-through of the backend response.
- No ADR exists yet (`docs/adr/` has only its `README.md` index).

## Contract status

Checked directly against the backend's committed spec on `staging` (not a local checkout):

```bash
gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=staging" \
  -H "Accept: application/vnd.github.raw"
```

**Correction to `proposal.md`**: at proposal time, PR #121 was believed not yet
merged/staged. Re-checked at design time (2026-08-20/21) — **PR #121 has since merged to
`develop` (2026-08-21T03:29:34Z, per `gh pr view 121`) and `staging`'s `openapi.json` already
carries the new `phase` field**, byte-identical in shape to `develop`'s (both files: 17,662
lines). The four schemas match the proposal exactly, with `description` strings the proposal
didn't quote but which are useful context:

```json
// RunSummaryResponseDto.phase / ScrapeRunStatusResponseDto.phase
{
  "type": "string",
  "enum": ["horario", "matricula", "alumnosYNotas"],
  "nullable": true,
  "description": "The furthest scrape phase that has started for this run."
}

// PlannerRunSummaryResponseDto.phase / PlannerScrapeRunStatusResponseDto.phase
{
  "type": "string",
  "enum": ["secciones", "evaluaciones", "notas"],
  "nullable": true,
  "description": "The furthest phase that has started for this run. Null until the first phase begins."
}
```

`phase` is **not** in any of the four schemas' `required` array — matching `null` as a real,
expected steady state (right after run creation), not an edge case to special-case around.

**This clears the proposal's ordering-rule blocker for this change's own merge** — the
backend is on `staging`, so this frontend change may merge once implemented, not just be
developed. `/abet-verify-contract` should still be re-run immediately before
`/abet-create-pr` per the standard process (cheap insurance against `staging` moving again
before this PR lands), but implementation is not gated on anything further.

## ADR gate (walked, not skipped)

| Trigger                                       | Hit?                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datastore, broker or cache choice             | No                                                                                                                                                       |
| Auth or payments provider                     | No                                                                                                                                                       |
| Public API contract change or breaking change | Partially — the backend added a field; it's additive/non-breaking and the backend's own change already owns that decision. This change only consumes it. |
| New module boundary or cross-repo split       | No — reuses the existing `banner`/`planner` modules and the existing sequential cross-repo pattern; no new module, no new split.                         |
| Language, runtime or framework                | No                                                                                                                                                       |
| Contradicting an existing ADR                 | No — `docs/adr/` has no numbered ADRs yet to contradict.                                                                                                 |

**Conclusion**: no ADR required. This is a small additive UI extension of an
already-established scrape-status pattern, not a new architectural decision.

## Approach

### AC-1 — Phase label next to the status Badge in both progress cards

A new small presentational component per module — `ScrapePhaseLabel`
(`banner/components/ScrapePhaseLabel.tsx`) and `PlannerScrapePhaseLabel`
(`planner/components/PlannerScrapePhaseLabel.tsx`) — takes `{ phase: ScraperPhase | null }`
(resp. `PlannerScraperPhase | null`) and renders a muted inline text label, or `null`. Each
`*ScrapeRunProgress.tsx` renders it right after the status `Badge`, inside the same
`flex items-center gap-3` row that already holds the Badge and the polling spinner — no
layout restructuring needed.

### AC-2 — Null phase renders nothing

`ScrapePhaseLabel`/`PlannerScrapePhaseLabel` return `null` immediately when `phase` is
`null` (covers both "run just created" and any run whose backend response never populated
it). No empty `<span>`, no placeholder dash — the row simply shows the status Badge alone,
exactly as it does today.

### AC-3 — Phase label visible in both history tables, without adding an 8th column

Both history tables already have 7 columns (`status`, plus 6 more) — the proposal flagged
adding an 8th as a crowding risk and left the resolution to design time. Resolved here:
**the phase label goes inside the existing `status` cell, as a second line under the
Badge**, reusing the same `ScrapePhaseLabel`/`PlannerScrapePhaseLabel` component:

```tsx
{
	id: 'status',
	header: t('banner.history.col.status'),
	cell: ({ row }) => (
		<div className="space-y-1">
			<Badge color={SCRAPE_STATUS_COLORS[row.original.status]}>
				{t(`banner.run.status.${row.original.status}`)}
			</Badge>
			<ScrapePhaseLabel phase={row.original.phase} />
		</div>
	),
},
```

No new column definition, no new `col.phase` header key, table width unchanged. This
satisfies AC-3 by construction rather than by a later design call.

### AC-4 — Terminal-status runs keep showing their last-known phase

Neither `ScrapePhaseLabel` nor its call sites read `status` at all — they render purely off
`phase`. This is inferred from the field's "furthest phase that has started" framing in the
proposal and the `openapi.json` schema descriptions (§ Contract status above) — the schemas
don't explicitly document what happens once `status` reaches a terminal value, only that
`phase` advances monotonically while running. Since nothing in this design branches on
`status` to decide whether to show `phase`, the last-known value simply renders as whatever
the backend last sent; there is nothing to special-case for terminal runs either way. This
assumption is checkable and worth confirming for real: `runbook.md` step 5 (watch a run
reach a terminal status and confirm the phase label survives) is exactly that check.

### AC-5 — Unrecognized phase value falls back to the raw string, never crashes

A per-module constant map from phase value to i18n key —
`SCRAPE_PHASE_LABEL_KEYS: Record<ScraperPhase, string>` (banner) and
`PLANNER_SCRAPE_PHASE_LABEL_KEYS: Record<PlannerScraperPhase, string>` (planner), living
alongside the existing `SCRAPE_STATUS_COLORS` / `PLANNER_SCRAPE_STATUS_COLORS` in each
module's `constants/index.ts`. The label component looks the value up **by membership, not
by string-concatenating a `t()` key**:

```tsx
export function ScrapePhaseLabel({ phase }: { phase: ScraperPhase | null }) {
	const { t } = useI18n();
	if (!phase) return null;
	const labelKey = SCRAPE_PHASE_LABEL_KEYS[phase];
	return <span className="text-xs text-zinc-500">{labelKey ? t(labelKey) : phase}</span>;
}
```

Runtime JSON parsing doesn't enforce the TypeScript union, so a genuinely new backend value
(future phase, or a typo'd deploy) simply isn't a key in the `Record` — `labelKey` is
`undefined`, and the component renders `phase` itself instead of calling `t()` with a
made-up key (which would silently print the raw i18n key string instead of anything
readable). This is deliberately not the `tryTranslate(t, errorCode)` pattern used for
backend error codes elsewhere — that pattern assumes the value **is** the i18n key; here the
raw value is a scrape-phase enum, not a key, so falling back to it directly is correct.

### AC-6 — Types match the backend contract exactly

Confirmed against the real `staging` schema above (not the proposal's paraphrase) — no
discrepancy found, so the types below are final rather than "best guess pending
verification":

```ts
// banner/types/index.ts
export type ScraperPhase = 'horario' | 'matricula' | 'alumnosYNotas';
// ScrapeRun.phase: ScraperPhase | null
// ScrapeRunSummary.phase: ScraperPhase | null

// planner/types/index.ts
export type PlannerScraperPhase = 'secciones' | 'evaluaciones' | 'notas';
// PlannerScrapeRun.phase: PlannerScraperPhase | null
// PlannerScrapeRunSummary.phase: PlannerScraperPhase | null
```

### AC-7 — All phase copy through `t()` + both locale files

Six new leaf keys total — `banner.run.phase.{horario,matricula,alumnosYNotas}` and
`planner.run.phase.{secciones,evaluaciones,notas}` — added under the existing `run` object
in both `es.json` and `en.json`, next to the existing `run.status.*` siblings. No new
top-level tree; this follows the exact nesting the sibling `status`/`counts`/`departments`
keys already use.

### AC-8 — `tsc --noEmit` + `pnpm lint` clean

Standard verification gate; no test runner exists in this repo (`docs/POLICIES.md` §
Verification Gate).

## Frontend

- **Routes / screens**: no new routes. The two existing screens
  (`ScrapeRunProgress`/`ScrapeRunHistory` under Banner's management view,
  `PlannerScrapeRunProgress`/`PlannerScrapeRunHistory` under Planner's) are extended in
  place.
- **Modules**: `src/modules/banner/` and `src/modules/planner/` — both extended
  symmetrically:
  - `types/index.ts` — add `ScraperPhase`/`PlannerScraperPhase` and the `phase` field on
    `ScrapeRun`/`ScrapeRunSummary` and `PlannerScrapeRun`/`PlannerScrapeRunSummary` (see
    AC-6).
  - `constants/index.ts` — add `SCRAPE_PHASE_LABEL_KEYS`/`PLANNER_SCRAPE_PHASE_LABEL_KEYS`
    (see AC-5).
  - `components/ScrapePhaseLabel.tsx` / `components/PlannerScrapePhaseLabel.tsx` — new,
    exported from each module's `components/index.ts` barrel alongside the existing
    components (consistent with every other component in that folder being barrel-exported,
    even though today's only consumers are within the same module).
  - `components/ScrapeRunProgress.tsx` / `components/PlannerScrapeRunProgress.tsx` — render
    the new label next to the status Badge (AC-1).
  - `components/ScrapeRunHistory.tsx` / `components/PlannerScrapeRunHistory.tsx` — render
    the new label inside the existing `status` cell (AC-3).
- **Services**: **no changes.** `getBannerScrapeRun`/`listBannerScrapeRuns` and their
  Planner equivalents already do a type-only `getApiData<T>(res)` pass-through with no field
  mapping — once `phase` is added to the `T` they're generic over, it flows through
  automatically. Confirmed by reading `bannerService.ts`/`plannerService.ts` — no
  normalization layer to update.
- **Hooks**: no changes. `useBannerScrapeRun`/`usePlannerScrapeRun` and the terminal-status
  helpers key off `status`, not `phase` — nothing there needs to change, and nothing in this
  change touches polling cadence (matches the proposal's non-goals).
- **Data / query keys**: unaffected — no new query, no new key shape.
- **i18n keys** (both `es.json`/`en.json`), added under the existing `run` object:
  - `banner.run.phase.horario` — "Fetching schedules" / "Obteniendo horarios"
  - `banner.run.phase.matricula` — "Fetching enrollments" / "Obteniendo matrículas"
  - `banner.run.phase.alumnosYNotas` — "Fetching students & grades" / "Obteniendo alumnos y
    notas"
  - `planner.run.phase.secciones` — "Fetching sections" / "Obteniendo secciones"
  - `planner.run.phase.evaluaciones` — "Fetching evaluations" / "Obteniendo evaluaciones"
  - `planner.run.phase.notas` — "Fetching grades" / "Obteniendo notas"

## Cross-repo mode

- **Mode**: sequential — the backend PR (#121) already exists, is merged to `develop`, and
  (per the Contract status check above) is already on `staging`. No `contract.md`; the
  backend's committed `openapi.json` is the contract, already verified against directly
  (see AC-6).
- **Contract**: `BACK-ACREDITACION-3.0`'s `openapi.json` at `ref=staging`, confirmed
  2026-08-20/21 (see Contract status above).
- **Ordering**: already satisfied — the backend is on `staging`, so this change is clear to
  merge once implemented. Re-run `/abet-verify-contract` immediately before
  `/abet-create-pr` as a final sanity check, per the repo's standard process — not because
  anything is expected to have changed, but because that's the checkable gate the process
  relies on rather than trusting this design-time snapshot indefinitely.

## Testing strategy

No test runner exists in this repo (`docs/POLICIES.md` § Verification Gate) — every row
below is `tsc --noEmit` + `pnpm lint` + a described manual step.

| AC  | Covered by                                                                                                                                                                                           | Kind                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Start a Banner and a Planner scrape against a reachable backend on the new contract; watch the progress card while `running` — phase label appears next to the Badge and changes as the run advances | manual                                                                           |
| 2   | Load a progress card for a run whose `phase` is still `null` (right after creation) — no label rendered, no layout glitch                                                                            | manual                                                                           |
| 3   | Load both history tables with at least one `running` row — phase label appears as a second line under the status Badge in that row's cell                                                            | manual                                                                           |
| 4   | Let a run reach `completed`/`partial`/`failed`/`expired` — confirm the last-known phase is still shown, not hidden                                                                                   | manual                                                                           |
| 5   | Temporarily point a test call at a fabricated response with an unlisted `phase` string (e.g. via browser devtools response override) — confirm the raw string renders and nothing throws             | manual                                                                           |
| 6   | `rg '"phase"' <fetched openapi.json>` output, compared line-by-line against the types in `types/index.ts`                                                                                            | manual (done at design time, re-verified at PR time via `/abet-verify-contract`) |
| 7   | `rg '"phase"' src/language/locales/es.json src/language/locales/en.json` — both files carry all 6 keys                                                                                               | manual (grep)                                                                    |
| 8   | `npx tsc --noEmit`, `pnpm lint`                                                                                                                                                                      | automated (gate, not a test suite)                                               |

All manual steps are also written into `runbook.md`.

## Risks

| Risk                                                                          | Mitigation                                                                                                                                                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend not yet on `staging`                                                  | Resolved — confirmed live on `ref=staging` at design time (see Contract status above); `/abet-verify-contract` re-run before PR creation as a final check, not a blocker |
| Adding a phase indicator to already-dense history tables could crowd the UI   | Resolved by construction — folded into the existing `status` cell as a second line, no new column (AC-3)                                                                 |
| Unrecognized future `phase` value from the backend crashes the UI             | `SCRAPE_PHASE_LABEL_KEYS` membership check + raw-string fallback, not a direct `t()` call on a constructed key (AC-5)                                                    |
| `phase` accidentally read as implying a percentage/ordering UI beyond a label | Explicit non-goal in `proposal.md`; this design renders text only, no progress bar, no step indicator                                                                    |

## Docs to update in this PR

- [x] `docs/CONTEXT.md` — no change needed. This is a straightforward additive UI extension
      of an existing, already-documented pattern (scrape run status polling); it introduces
      no new business rule, module boundary, cross-module import, or environment variable.
      Confirmed by re-reading § Business Rules and § Directory Structure — neither needs an
      entry for this change.
