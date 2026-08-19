# Tasks — IFC status history

**Slug**: `ifc-status-history` · **Proposal**: `./proposal.md` · **Design**: `./design.md`

## For whoever executes this

- Work in checkpointed batches of 3–5 tasks. Partition each batch by files touched and
  fan the non-overlapping ones out to parallel subagents.
- **This repo has no test runner** (`docs/POLICIES.md` § Verification Gate). A task is
  complete when `npx tsc --noEmit` is clean, `pnpm lint` is clean, and — where a step
  says so — the described manual check has actually been performed, not skipped.
  "Steps" below replace the generic TDD loop with that gate.
- Marking done means checking the box **and** appending `✅ DONE (YYYY-MM-DD)` to the
  heading. Never one without the other — the completeness gate reads the boxes.
- **No autonomous commits.** Propose the grouping and stop.
- Do not edit `docs/POLICIES.md` or `docs/adr/*`.

## Goal

Add the data-fetching layer for `GET /ifcs/{id}/status-history`, a read-only page at
`/ifcs/[id]/history` that lists it, and a "History" entry point on the IFC view page,
visible under the same permission that gates Approve/Reject.

## Slicing

Milestone 1 lands the data layer. Milestone 2 lands the page itself, reachable directly
by URL (so it's demonstrable on its own, with no dead link). Milestone 3 wires the entry
point button on the IFC view page, making the whole flow reachable end to end.

---

## Milestone 1 — Status history data layer

### Task 1.1 — Add the `IFCStatusHistoryEntry` type and service call ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/ifcs/types/index.ts` (modify) — add `IFCStatusHistoryEntry`
- `src/modules/ifcs/services/ifcsService.ts` (modify) — add `getIFCStatusHistory(id)`

**Steps**

1. Add `IFCStatusHistoryEntry` per `design.md` § AC-1, AC-2 (`code`, `name: I18nText`,
   `color: string | null`, `at`, `comment: I18nText | null`, `by: string | null` —
   hand-typed, not imported from OpenAPI codegen).
2. Add `getIFCStatusHistory(id: number): Promise<IFCStatusHistoryEntry[]>` to
   `ifcsService.ts`, following `listIFCs`'s shape: `apiGet` → unwrap `{ data }` → throw
   `ApiError('ifcs.error.statusHistoryFailed')` if missing → return `data.statuses`. No
   zod schema (see `design.md` § AC-1, AC-2 for why).
3. `npx tsc --noEmit` → clean.
4. `pnpm lint` → clean.

**Commit**: `feat(ifcs): add status history type and service call`

### Task 1.2 — Add the query key, hook, and mutation invalidation ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/ifcs/hooks/useIfcs.ts` (modify) — add `ifcQueryKeys.statusHistory(id)`,
  `useIFCStatusHistory(id)`, and extend `useApproveIFC`/`useRejectIFC`/`useSubmitIFC`'s
  `onSuccess` to also invalidate `ifcQueryKeys.statusHistory(id)`

**Steps**

1. Add `statusHistory: (id: number) => ['ifcs', 'statusHistory', id] as const` to
   `ifcQueryKeys`.
2. Add `useIFCStatusHistory(id: number | undefined)` mirroring `useIFCView` (`enabled:
id != null && Number.isFinite(id)`).
3. Add the one-line `queryClient.invalidateQueries({ queryKey:
ifcQueryKeys.statusHistory(id) })` to each of `useApproveIFC`, `useRejectIFC`,
   `useSubmitIFC`'s existing `onSuccess`, alongside their current `all`/`view`
   invalidation. No signature change to any of the three hooks.
4. `npx tsc --noEmit` → clean.
5. `pnpm lint` → clean.

**Commit**: `feat(ifcs): add status history query key, hook, and invalidation`

---

## Milestone 2 — Read-only status history page

### Task 2.1 — Add the status history table component ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/ifcs/components/view/IFCStatusHistoryTable.tsx` (create)

**Steps**

1. Build `IFCStatusHistoryTable({ entries: IFCStatusHistoryEntry[] })` per `design.md`
   § AC-7: `DataTable` with `showSearch={false} showPagination={false}`, columns Status
   (`Badge color={entry.color}` + localized name), Date (`formatDateTime(entry.at)`),
   Comment (`entry.comment?.[lang] ?? entry.comment?.es ?? '—'`), By
   (`entry.by ?? '—'`). No `id`/`accessorKey` column, no row interaction, no action
   column.
2. `entries.length === 0` renders `TableEmptyState` instead of an empty `DataTable`
   (matches `FindingActionsTable`'s precedent).
3. `npx tsc --noEmit` → clean.
4. `pnpm lint` → clean.

**Commit**: `feat(ifcs): add read-only status history table`

### Task 2.2 — Add the status history page, route, and locale keys

- [ ] Task complete (code done, manual verification pending — see retro)

**Files**

- `src/modules/ifcs/components/view/IFCStatusHistoryPage.tsx` (create)
- `src/modules/ifcs/pages/IFCStatusHistory.tsx` (create) — thin `'use client'`
  re-export, matching `pages/IFCView.tsx`
- `src/modules/ifcs/pages/index.ts` (modify) — export `IFCStatusHistoryPageEntry`
- `src/app/ifcs/[id]/history/page.tsx` (create) — `dynamic()` route shell, matching
  `app/ifcs/[id]/edit/page.tsx`
- `src/language/locales/en.json` (modify)
- `src/language/locales/es.json` (modify)

**Steps**

1. Add locale keys per `design.md` § Frontend → i18n: `error.ifc.statusHistoryFailed`
   (alongside the existing `error.ifc.*` block), and a new `ifcs.statusHistory` section
   (`title`, `btn.back`, `table.col.{status,date,comment,by}`, `table.empty`) — same
   English/Spanish wording style as the sibling `ifcs.view`/`ifcs.pdf` sections. Add both
   locale files in the same commit (`docs/POLICIES.md` § i18n).
2. Build `IFCStatusHistoryPage` per `design.md` § AC-8, AC-9, following
   `FindingDetailPage.tsx`'s shape: `useParams` → `useIFCStatusHistory(id)` →
   `LoadingDialog` while loading → `ErrorDialog` (message from
   `tryTranslate(t, getErrorMessage(error, 'ifcs.error.statusHistoryFailed'))`, `onClose`
   pushes to `/ifcs/${id}`) on error/no data → otherwise `PageHeader` (title +
   ghost-button back action) directly followed by `IFCStatusHistoryTable`, no `Card`
   wrapper.
3. Add the `pages/IFCStatusHistory.tsx` re-export and the `pages/index.ts` barrel entry.
4. Add `app/ifcs/[id]/history/page.tsx`.
5. `npx tsc --noEmit` → clean.
6. `pnpm lint` → clean.
7. **Manual verification** (`pnpm dev`, navigate directly by URL — the entry-point
   button doesn't exist until Milestone 3):
   - As a user with `requesterHasHigherLevel: true` for a real IFC id, visit
     `/ifcs/<id>/history` → entries render newest-first with correct status color,
     timestamp, comment/actor shown when present and `—` when `null`; Back returns to
     `/ifcs/<id>`.
   - As a user without that permission (or an admin bypass case), visit the same URL for
     an IFC you're not authorized to see the history of → error state renders, not a
     crash or blank page.
   - Visit `/ifcs/<a non-existent or wrong-school id>/history` → 404 handled the same
     way.

**Commit**: `feat(ifcs): add read-only status history page and route`

> `tsc`/`lint` clean. Confirmed via the already-running local dev server
> (`localhost:3001`, `pnpm dev`) that `/ifcs/1/history` compiles, resolves, and — while
> unauthenticated — correctly redirects to `/auth/login` via `SessionGuard`, same as
> `/ifcs/1` and `/ifcs/1/edit`. The three permission/data bullets above (entries render
> correctly, 403 for an unauthorized viewer, 404 for a bad id) need a logged-in session
> against a real backend with known IFC states, which this environment doesn't have —
> **not performed**. Left unchecked per `docs/POLICIES.md` § Verification Gate rather
> than marked done on `tsc`/lint alone.

---

## Milestone 3 — History entry point on the IFC view page

### Task 3.1 — Add the `showHistory` flag and button ✅ DONE (2026-08-18)

- [x] Task complete

**Files**

- `src/modules/ifcs/components/view/IFCActionButtons.tsx` (modify)
- `src/language/locales/en.json` (modify)
- `src/language/locales/es.json` (modify)

**Steps**

1. Add `ifcs.view.btn.history` to both locale files, alongside the existing
   `ifcs.view.btn.*` block (`back`, `edit`, `reject`, `approve`, `submit`, `export`).
2. Add `showHistory: boolean` to `ActionFlags` and compute it in `computeActionFlags` as
   `hasHigherLevel && status !== S.UNREGISTERED` per `design.md` § AC-4, AC-5 — not
   gated on `status === S.SUBMITTED` the way Approve/Reject are.
3. Add an `onHistory: () => void` prop and render the `History` button
   (`variant="secondary"`) immediately after `Back` when `flags.showHistory`.
4. `npx tsc --noEmit` → clean.
5. `pnpm lint` → clean.

**Commit**: `feat(ifcs): show history button when the requester is permitted`

### Task 3.2 — Wire navigation from the IFC view page

- [ ] Task complete (code done, manual verification pending — see retro)

**Files**

- `src/modules/ifcs/components/view/IFCViewPage.tsx` (modify)

**Steps**

1. Add `handleHistory` pushing to `/ifcs/${id}/history` and pass it as
   `IFCActionButtons`'s `onHistory` prop.
2. `npx tsc --noEmit` → clean.
3. `pnpm lint` → clean.
4. **Manual verification** (`pnpm dev`):
   - As a user with `requesterHasHigherLevel: true` viewing an IFC with a real (non-
     `UNREGISTERED`) status: the History button is visible next to Back/Edit/Approve/
     Reject; clicking it navigates to `/ifcs/<id>/history`; Back on that page returns to
     the view page.
   - As a user without that permission viewing the same IFC: the History button does not
     render.
   - Viewing an IFC whose `status` is `null`/`UNREGISTERED` (if reachable — see
     `design.md` § AC-4, AC-5 on how the list page routes this case): the History button
     does not render even if `requesterHasHigherLevel` is `true`.
   - Confirm Approve/Reject/Submit still behave exactly as before this change (regression
     check on `IFCActionButtons`/`IFCViewPage`).

**Commit**: `feat(ifcs): wire history navigation from the IFC view page`

> `tsc`/`lint` clean; `/ifcs/1`, `/ifcs/1/edit`, `/ifcs/1/history` all compile and
> resolve. The permission-based button visibility, click-through navigation, and
> Approve/Reject/Submit regression check need an authenticated session with a real IFC
> in a known permission/status state — **not performed**, same blocker as Task 2.2.
> Left unchecked rather than marked done on the type/lint gate alone.

---

<!--
Append-only sections below. These record what actually happened, not what was planned,
and they are the best input to the next design.

## Unplanned — <what and why>

### Task U.1 — <title>
- [ ] Task complete

## Post-QA fixes

## Audit fixes (/abet-audit-pr)

### Review round 1
-->
