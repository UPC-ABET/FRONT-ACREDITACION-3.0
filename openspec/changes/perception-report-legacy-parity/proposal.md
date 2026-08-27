# Perception report — parity with the legacy system (frontend)

## Problem

The backend's PPP / GRA / LCFC perception PDF prints `MODALIDAD DE ESTUDIO: TODOS` on every
report. `PerceptionReportDto` has accepted a `modalityLabel` for display since the report
was built, but no screen has ever sent one — so the header contradicts the modality the
user actually picked in the top bar, and the LCFC report in particular does not show every
filter that shaped it.

## What already exists

- `PerceptionReportPanel` (`modules/surveys/components/shared/`) collects the report
  filters and is the single caller of `generate*PerceptionPdf` for all three survey types.
- `useABET()` exposes `modalityTypeId`; `useTypesByGroupCode(TYPE_GROUP_CODES.PROGRAM_MODALITY)`
  resolves it to a localized name. `useGlobalAcademicFilters` already does this for the top
  bar's own select, but keeps the resolution private to that hook.

## Goals

1. Resolve the top bar's modality to a display label that any screen can read.
2. Send it as `modalityLabel` on every perception report request (PPP, GRA, LCFC).

## Non-goals

- Any change to the PDF layout — that is the backend half of this change.
- A screen-local modality selector. Modality stays a top bar concern
  ([POLICIES § Global Academic Context](../../../docs/POLICIES.md#global-academic-context-top-bar)).

## Acceptance criteria

- Generating a report with the top bar set to EPE prints EPE in the PDF header; switching
  to Regular and regenerating prints Regular.
- PPP now returns one PDF per practice; the existing results list and zip download handle
  the longer list with no change.
- `npx tsc --noEmit` and `pnpm lint` are clean.
