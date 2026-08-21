# Tasks — Scrape progress and performance

**Slug**: `scrape-progress-and-performance` · **Proposal**: `./proposal.md` · **Design**: `./design.md`

## For whoever executes this

- Work in checkpointed batches of 3–5 tasks. Partition each batch by files touched and fan
  the non-overlapping ones out to parallel subagents — Milestones 2 and 3 (Banner vs
  Planner) touch entirely disjoint files and can run fully in parallel with each other.
- **There is no test runner in this repo** (`docs/POLICIES.md` § Verification Gate). A task
  is complete when `npx tsc --noEmit` is clean, `pnpm lint` is clean, **and** the manual
  verification step described in that task has actually been performed — not on
  typecheck/lint alone. Do not invent a `pnpm test` step; there is nothing to run.
- Marking done means checking the box **and** appending `✅ DONE (YYYY-MM-DD)` to the
  heading. Never one without the other.
- **No autonomous commits.** Propose the grouping and stop.
- Do not edit `docs/POLICIES.md` or `docs/adr/*`.
- The backend contract is already confirmed live on `staging` (see `design.md` § Contract
  status) — there is no Milestone 0 blocker here. Still, re-run `/abet-verify-contract`
  immediately before `/abet-create-pr` as the standard final check.

## Goal

Surface the backend's new `phase` field for Banner and Planner scrape runs as a plain-text
label next to the existing status Badge, in both the single-run progress card and the
run-history table, for both modules — with a defensive fallback for any phase value the
frontend doesn't recognize.

## Slicing

Vertical: shared types first (unavoidable prerequisite for both modules), then Banner's UI
end-to-end, then Planner's UI end-to-end (structurally identical, done second so any lesson
from Banner carries over), then a final cross-cutting verification pass.

---

## Milestone 1 — Types

### Task 1.1 — Add `phase` to the Banner and Planner scrape types ✅ DONE (2026-08-20)

- [x] Task complete

**Files**

- `src/modules/banner/types/index.ts` (modify)
- `src/modules/planner/types/index.ts` (modify)

**Steps**

1. In `banner/types/index.ts`, add `export type ScraperPhase = 'horario' | 'matricula' |
'alumnosYNotas';` and add `phase: ScraperPhase | null;` to both `ScrapeRun` and
   `ScrapeRunSummary`, matching the confirmed `staging` schema exactly (`design.md` § AC-6).
2. In `planner/types/index.ts`, add `export type PlannerScraperPhase = 'secciones' |
'evaluaciones' | 'notas';` and add `phase: PlannerScraperPhase | null;` to both
   `PlannerScrapeRun` and `PlannerScrapeRunSummary`.
3. `npx tsc --noEmit` — expect new errors in the components that construct/mock these types
   nowhere in this repo (services are generic pass-throughs, per `design.md` § Frontend), so
   this should be clean on its own; if not, note what broke.

**Commit**: `feat(banner,planner): add phase field to scrape run types`

---

## Milestone 2 — Banner UI

### Task 2.1 — Phase label constant + component ✅ DONE (2026-08-20)

- [x] Task complete

**Files**

- `src/modules/banner/constants/index.ts` (modify)
- `src/modules/banner/components/ScrapePhaseLabel.tsx` (create)
- `src/modules/banner/components/index.ts` (modify)

**Steps**

1. Add `SCRAPE_PHASE_LABEL_KEYS: Record<ScraperPhase, string>` to `constants/index.ts`,
   mapping each phase to its i18n key (`banner.run.phase.horario`, `.matricula`,
   `.alumnosYNotas`).
2. Create `ScrapePhaseLabel.tsx` per `design.md` § AC-5: returns `null` when `phase` is
   `null`; otherwise looks up `SCRAPE_PHASE_LABEL_KEYS[phase]` and renders `t(labelKey)` if
   found, else the raw `phase` string.
3. Export `ScrapePhaseLabel` from `components/index.ts`.
4. `npx tsc --noEmit`.

**Commit**: `feat(banner): add scrape phase label component`

### Task 2.2 — Wire the phase label into the progress card and history table ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/banner/components/ScrapeRunProgress.tsx` (modify)
- `src/modules/banner/components/ScrapeRunHistory.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. In `ScrapeRunProgress.tsx`, render `<ScrapePhaseLabel phase={data.phase} />` inside the
   existing status row, right after the `Badge` (`design.md` § AC-1).
2. In `ScrapeRunHistory.tsx`, update the `status` column's `cell` to render the Badge and
   `<ScrapePhaseLabel phase={row.original.phase} />` stacked in a `space-y-1` wrapper — no
   new column (`design.md` § AC-3).
3. Add the three `banner.run.phase.{horario,matricula,alumnosYNotas}` keys to both
   `es.json` and `en.json`, alongside the existing `banner.run.status.*` keys (see
   `design.md` § Frontend for the exact copy).
4. `npx tsc --noEmit`, `pnpm lint`.
5. Manual: with a reachable backend on the new contract, start a Banner scrape and watch
   the progress card and the history table while it runs through its phases; confirm the
   label appears, changes, and survives into the terminal state (AC-1–AC-4 from
   `proposal.md`).

**Commit**: `feat(banner): show scrape phase in the progress card and history table`

> Step 5 (live browser check against a reachable backend) still **not performed** — no
> backend is reachable in this environment (`.env`'s `API_PROXY_URL=http://localhost:7777`
> confirmed down via `curl`; the sibling `BACK-ACREDITACION-3.0` checkout exists locally but
> starting it would require provisioning its database and, to actually populate `phase`
> transitions, triggering a real scrape against Banner/uPlanner — a live-external-system
> action out of scope for a label-rendering check). Strengthened instead (2026-08-20,
> `/abet-audit-pr` follow-up): an isolated `react-dom/server` SSR render of the actual
> shipped `ScrapePhaseLabel` component (not a reimplementation) confirmed `phase: null` →
> empty output, a known phase → the correct translated label, and an unrecognized phase
> string → the raw-string fallback with no throw — see Task 4.1's retro for the full
> harness and results. That closes the component's own logic (AC-2, AC-5) with real
> executed evidence. What's still unverified is the **end-to-end** behavior this task's
> step 5 actually asks for: watching the label appear and advance against a real running
> scrape (AC-1, AC-3, AC-4) — left open pending a live-backend pass, tracked in
> `runbook.md`.
>
> **Closed 2026-08-21**: verified live post-deploy by the requester — phase label observed
> advancing on the Banner progress card against production data. The history-table half of
> this task's original scope (AC-3) no longer applies — reverted the same day, see
> `proposal.md` § Scope reduction and Task U.1.

---

## Milestone 3 — Planner UI

### Task 3.1 — Phase label constant + component ✅ DONE (2026-08-20)

- [x] Task complete

**Files**

- `src/modules/planner/constants/index.ts` (modify)
- `src/modules/planner/components/PlannerScrapePhaseLabel.tsx` (create)
- `src/modules/planner/components/index.ts` (modify)

**Steps**

1. Add `PLANNER_SCRAPE_PHASE_LABEL_KEYS: Record<PlannerScraperPhase, string>` to
   `constants/index.ts`, mapping each phase to its i18n key (`planner.run.phase.secciones`,
   `.evaluaciones`, `.notas`).
2. Create `PlannerScrapePhaseLabel.tsx`, identical shape to Banner's `ScrapePhaseLabel`
   (`design.md` § AC-5), typed over `PlannerScraperPhase`.
3. Export `PlannerScrapePhaseLabel` from `components/index.ts`.
4. `npx tsc --noEmit`.

**Commit**: `feat(planner): add scrape phase label component`

### Task 3.2 — Wire the phase label into the progress card and history table ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/planner/components/PlannerScrapeRunProgress.tsx` (modify)
- `src/modules/planner/components/PlannerScrapeRunHistory.tsx` (modify)
- `src/language/locales/es.json` (modify)
- `src/language/locales/en.json` (modify)

**Steps**

1. In `PlannerScrapeRunProgress.tsx`, render
   `<PlannerScrapePhaseLabel phase={data.phase} />` next to the status `Badge`, mirroring
   Task 2.2 step 1.
2. In `PlannerScrapeRunHistory.tsx`, update the `status` column's `cell` the same way as
   Task 2.2 step 2.
3. Add the three `planner.run.phase.{secciones,evaluaciones,notas}` keys to both `es.json`
   and `en.json`.
4. `npx tsc --noEmit`, `pnpm lint`.
5. Manual: same as Task 2.2 step 5, but for a Planner scrape run.

**Commit**: `feat(planner): show scrape phase in the progress card and history table`

> Same reachability gap as Task 2.2 — step 5 not performed against a live backend. Same
> SSR-render strengthening applies (Planner's `PlannerScrapePhaseLabel` was exercised by the
> identical harness described in Task 2.2's retro and Task 4.1's, with the same three
> results). AC-1/AC-3/AC-4's live end-to-end behavior is still open, tracked in
> `runbook.md`.
>
> **Closed 2026-08-21**: verified live post-deploy by the requester, same as Task 2.2. The
> history-table half of this task's original scope (AC-3) no longer applies — reverted the
> same day, see `proposal.md` § Scope reduction and Task U.1.

---

## Milestone 4 — Final verification

### Task 4.1 — Defensive-fallback and null-phase checks ✅ DONE (2026-08-20)

- [x] Task complete

**Files**

- None — verification only, no source change needed.

**Steps**

1. ~~Manual: verify AC-2 — load a progress card for a run whose `phase` is still `null`~~ —
   revised (see retro): no reachable backend, so verified instead by an isolated
   `react-dom/server` render of the real shipped component.
2. ~~Manual: verify AC-5 via devtools network-response-override~~ — revised the same way.
3. Record both results in `runbook.md`.

**Commit**: none — this task never touches code (nothing needed fixing).

> **No reachable backend** in this environment (`.env`'s `API_PROXY_URL=http://localhost:7777`
> confirmed down via `curl`; a full live check would additionally require triggering a real
> scrape against Banner/uPlanner, which is out of scope for verifying a label's render logic).
> Instead of settling for code review alone, built a genuine execution-based check
> (2026-08-20): a throwaway script (`scratch-verify-phase.tsx`, deleted after the run —
> never committed) imported the actual `ScrapePhaseLabel`/`PlannerScrapePhaseLabel` and
> `LocaleProvider` from source (no reimplementation) and rendered them with
> `react-dom/server`'s `renderToStaticMarkup` via
> `pnpm exec ts-node -r ./scratch-alias-register.js scratch-verify-phase.tsx` (a tiny
> `Module._resolveFilename` shim resolved the `@/` alias for the CommonJS `require` ts-node
> uses; no dependency was added or left behind — `git status` confirmed clean after
> deleting both scratch files). Results, six for six:
>
> | Case                                             | Expected             | Actual                                                                   |
> | ------------------------------------------------ | -------------------- | ------------------------------------------------------------------------ |
> | Banner `phase: null`                             | empty output         | `""` — pass                                                              |
> | Planner `phase: null`                            | empty output         | `""` — pass                                                              |
> | Banner `phase: 'horario'`                        | translated label     | `<span class="text-xs text-zinc-500">Obteniendo horarios</span>` — pass  |
> | Planner `phase: 'secciones'`                     | translated label     | `<span class="text-xs text-zinc-500">Obteniendo secciones</span>` — pass |
> | Banner unrecognized phase (`'someFuturePhase'`)  | raw string, no throw | `<span class="text-xs text-zinc-500">someFuturePhase</span>` — pass      |
> | Planner unrecognized phase (`'someFuturePhase'`) | raw string, no throw | `<span class="text-xs text-zinc-500">someFuturePhase</span>` — pass      |
>
> This closes AC-2 and AC-5 with real executed evidence against the actual shipped code,
> not just reasoning about it — that's what this task specifically covers, so it's marked
> done. It does **not** cover AC-1/AC-3/AC-4 (watching the label advance through real phase
> transitions against a live, running scrape) — that remains genuinely open and is Tasks
> 2.2/3.2's unchecked step 5, tracked in "Outstanding before merge" below and in
> `runbook.md`.

### Task 4.2 — i18n key parity + repo-wide gate ✅ DONE (2026-08-20)

- [x] Task complete

**Files**

- None expected; fix in place anything found.

**Steps**

1. `rg '"phase"' src/language/locales/es.json src/language/locales/en.json` — confirm both
   files carry all 6 new leaf keys (`banner.run.phase.*` × 3, `planner.run.phase.*` × 3) with
   no key present in one file and missing from the other.
2. `npx tsc --noEmit` across the whole repo (not just touched files) — must be clean.
3. `pnpm lint` across the whole repo — must be clean.

**Commit**: none, unless step 1 finds a missing key — then `fix(i18n): add missing scrape
phase locale key` in whichever file(s) needed it.

> All 6 keys present in both files at matching positions (`es.json`/`en.json` lines 263 and
> 363 in each). `tsc --noEmit` and `pnpm lint` both clean, repo-wide, no exclusions.

---

## Outstanding before merge

Everything is code-complete: `npx tsc --noEmit` and `pnpm lint` are clean across the whole
repo (re-confirmed after the audit-fix pass below). The one genuine remaining gap is the
**live end-to-end check** — watching the phase label appear and advance against a real,
running Banner/Planner scrape (AC-1, AC-3, AC-4). That specifically requires a reachable
backend _and_ triggering a real scrape against Banner/uPlanner, neither of which is
available or appropriate to do unilaterally in this environment (`.env`'s
`API_PROXY_URL=http://localhost:7777` confirmed down via `curl`; the sibling backend
checkout exists locally but starting it would mean provisioning its database and hitting a
live external SIS as a side effect of a label check). AC-2 and AC-5 are no longer
code-review-only — see Task 4.1's retro for the SSR-executed proof.

**Before this is treated as ready for `/abet-create-pr`**, run against a reachable backend
on the `staging` contract:

- `runbook.md`'s Manual validation table, steps 1, 2, 4, 5, 7 (steps 3 and 6 — AC-2/AC-5 —
  are now additionally backed by the SSR proof in Task 4.1's retro, but a real browser
  observation is still worth doing once a backend is reachable).
- Re-run `/abet-verify-contract` one more time immediately before opening the PR, per
  `design.md` § Cross-repo mode (not expected to have moved, but that's the checkable gate
  the process relies on).

## Audit fixes (/abet-audit-pr)

Six parallel auditors (code quality, architecture/contract, testing, antipatterns,
security, runtime robustness) ran against the diff. Security and runtime robustness came
back clean. Original verdict: **NOT READY** — one blocker, one major, both about checkbox
honesty around the unperformed manual-verification gap this file already tracked. Resolved
same day (2026-08-20):

### Blocker

- [x] **Task 4.1 open — AC-2/AC-5 only verified by static code review, never by an actual
      render.** Fixed: built a genuine `react-dom/server` SSR execution of the real shipped
      `ScrapePhaseLabel`/`PlannerScrapePhaseLabel` components (not a reimplementation, not
      code review) covering `phase: null`, a known phase, and an unrecognized phase string —
      all six cases passed. See Task 4.1's retro for the harness and full results table.
      Task 4.1 is now checked. What genuinely still needs a live backend (AC-1/AC-3/AC-4's
      real phase-transition behavior) is called out explicitly in "Outstanding before merge"
      above rather than folded into this task.

### Major

- [x] **Tasks 2.2 and 3.2 were checked `✅ DONE` despite each one's own step 5 (live manual
      verification) being marked "not performed."** Fixed: unchecked both, removed their
      "✅ DONE" markers, and rewrote their retros to state precisely what is and isn't
      verified (the SSR proof covers the label components' own logic; the live end-to-end
      render does not). `grep -c '^- \[ \]' tasks.md` now correctly reports the true count of
      open items.

### Minor

- [x] **`design.md` § AC-4 overstated verification.** Fixed: reworded to say the
      "no phase-reset" behavior is inferred from the field's "furthest phase" framing, not
      explicitly documented by the backend, and pointed at `runbook.md` step 5 as the actual
      check for it.

### Suggestions

- [x] Added a one-line comment on `SCRAPE_PHASE_LABEL_KEYS`/`PLANNER_SCRAPE_PHASE_LABEL_KEYS`
      explaining why phase resolution uses a `Record` lookup (supports the raw-value
      fallback) instead of the status label's template-literal `t()` call.
- [x] No action taken on the Banner/Planner component duplication — confirmed as matching
      the codebase's existing, deliberate no-shared-code convention between the two modules.

Independently re-verified (not trusting `design.md`'s claim alone): the architecture
auditor re-fetched `staging`'s live `openapi.json` via `gh api` and diffed all four `phase`
schemas against the frontend types field-by-field — exact match on enum values,
nullability, and field names for both Banner and Planner.

`npx tsc --noEmit` and `pnpm lint` both clean, repo-wide, after all fixes above.

## Unplanned — remove phase label from history tables (2026-08-21)

PR #110 shipped to `production` on 2026-08-21. The same day, the requester decided phase
should show only on the single-run progress cards, not the history tables — see
`proposal.md` § Scope reduction. This reopens AC-3 as reverted rather than satisfied; AC-1,
AC-2, AC-4, AC-5, AC-6, AC-7, AC-8 are unaffected.

### Task U.1 — Remove phase from ScrapeRunHistory / PlannerScrapeRunHistory ✅ DONE (2026-08-21)

- [x] Task complete

**Files**

- `src/modules/banner/components/ScrapeRunHistory.tsx` (modify)
- `src/modules/planner/components/PlannerScrapeRunHistory.tsx` (modify)

**Steps**

1. Remove the `ScrapePhaseLabel`/`PlannerScrapePhaseLabel` import and its usage from each
   file's `status` column `cell`, reverting the cell to render the status `Badge` alone
   (its pre-change shape) instead of the `space-y-1` wrapper with the phase label as a
   second line.
2. `npx tsc --noEmit`, `pnpm lint` — both clean.

**Commit**: `fix(scraping): remove phase label from history tables, keep on progress cards`

> `ScrapePhaseLabel`/`PlannerScrapePhaseLabel` components, their constants
> (`SCRAPE_PHASE_LABEL_KEYS`/`PLANNER_SCRAPE_PHASE_LABEL_KEYS`), the `phase` type fields,
> and the i18n keys are all untouched — still in active use by the progress cards
> (`ScrapeRunProgress.tsx`/`PlannerScrapeRunProgress.tsx`), which is the whole reason this
> was a small revert rather than a re-do. Only the two history-table wiring sites changed.
