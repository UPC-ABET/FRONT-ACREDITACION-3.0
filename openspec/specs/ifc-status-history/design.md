# Design — IFC status history

**Slug**: `ifc-status-history`
**Proposal**: `./proposal.md`

## Read first

- `docs/POLICIES.md` § Verification Gate, § Data Fetching, § Components (Page Layout),
  § i18n — no test runner (tsc + lint + described manual step), TanStack Query key rules,
  `PageHeader`/`DataTable`/`Badge` primitives, no ad-hoc `{ en, es }` label objects.
- `docs/CONTEXT.md` § Data Fetching, § Domain Vocabulary (IFC) — query-key factory shape,
  `X-School-Id` auto-forwarded by `apiClient` from `useABET()`.
- `openspec/changes/ifc-status-history/proposal.md` — the ACs this design satisfies.
- `src/modules/ifcs/services/ifcsService.ts` — the service pattern this change extends
  (envelope unwrap, `ApiError('ifcs.error.<x>Failed')`, zod only where runtime coercion is
  actually needed — `listIFCs`/`approveIFC`/`rejectIFC` skip it, `getIFCView`/`submitIFC`
  use it for id coercion and defaulting).
- `src/modules/ifcs/hooks/useIfcs.ts` — `ifcQueryKeys` factory and the
  query/mutation-with-invalidation pattern this change extends.
- `src/modules/ifcs/components/view/IFCActionButtons.tsx` +
  `src/modules/ifcs/components/view/IFCViewPage.tsx` — `computeActionFlags`, the flag this
  change reuses (`requesterHasHigherLevel`), and the view page's loading/error/action
  wiring this change mirrors for the new page.
- `src/modules/ifcs/components/view/IFCHeaderCard.tsx` — the exact per-status rendering
  primitives to reuse for each history row: `Badge color={...}`, `formatDateTime(...)`,
  `field ?? '—'` for nullable actor/comment.
- `src/modules/ifcs/components/finding-view/FindingDetailPage.tsx` +
  `FindingActionsTable.tsx` — the closest existing "sub-page reached from a parent
  record, read-only table, `PageHeader` action-slot back button" precedent; this design
  follows it directly rather than the busier `loads/UploadHistoryPage` (which has
  pagination and mutation actions this feature doesn't need).
- `src/app/ifcs/[id]/edit/page.tsx`, `src/app/ifcs/[id]/page.tsx` — the
  `dynamic(() => import('@/modules/ifcs').then((m) => m.<Entry>))` route-shell pattern.
- `src/shared/components/ui/Badge.tsx`, `Table.tsx` (`DataTable`) — primitives used as-is,
  no modification.
- `src/language/locales/en.json` / `es.json` lines ~1536-1565 (`error.ifc.*`) and
  ~427-434 (`ifcs.view.btn.*`) — exact insertion points; `error.ifc.staffRequired` and
  `error.ifc.higherLevelRequired` already exist and need no change.
- Backend `openapi.json` (`UPC-ABET/BACK-ACREDITACION-3.0`, `develop`,
  `IfcController_statusHistory` / `IfcStatusHistoryResponseDto` / `IfcStatusInfoDto`) —
  fetched and read during `/abet-define-task`; confirms the response shape and the
  `color`/`by` "typed `object`, actually `string | null`" DTO quirk.

## ADR gate (walked, not skipped)

| Trigger                                       | Hit?                                                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Datastore, broker or cache choice             | No                                                                                                                      |
| Auth or payments provider                     | No                                                                                                                      |
| Public API contract change or breaking change | No — new, additive, already-merged backend endpoint; nothing existing changes shape                                     |
| New module boundary or cross-repo split       | No — stays inside the existing `ifcs` module; backend side already shipped, no frontend↔backend coordination left to do |
| Language, runtime or framework                | No                                                                                                                      |
| Contradicting an existing ADR                 | No — `docs/adr/` has no recorded ADRs yet                                                                               |

**Conclusion**: no ADR required.

## Approach

### AC-1, AC-2 — Service function + type

`IFCStatusHistoryEntry` is added to `modules/ifcs/types/index.ts`:

```ts
export interface IFCStatusHistoryEntry {
	code: string;
	name: I18nText;
	color: string | null;
	at: string;
	comment: I18nText | null;
	by: string | null;
}
```

`color`/`by` are hand-typed `string | null` — the backend DTO decorators generate
`{ "type": "object", "nullable": true }` for both in `openapi.json`
(`IfcStatusInfoDto`), which the proposal already flags as a pre-existing backend quirk,
not something this change fixes.

`getIFCStatusHistory(id: number): Promise<IFCStatusHistoryEntry[]>` is added to
`ifcsService.ts`, following `listIFCs`'s shape (no zod): unwrap the envelope, throw
`ApiError('ifcs.error.statusHistoryFailed')` if `data` is missing, return
`data.statuses` directly. No zod schema is added — unlike `getIFCView`, there is no `id`
field to coerce and no optional field needing a default; `comment`/`by` are already
nullable in both the wire shape and the TS type, so a runtime guard adds no safety the
type doesn't already express (see `docs/POLICIES.md` — don't validate scenarios that
can't happen).

### AC-3 — Query key + hook

`ifcQueryKeys.statusHistory = (id: number) => ['ifcs', 'statusHistory', id] as const`,
alongside the existing `all`/`list`/`view` keys. No `useABET()` scope variable is added
to the key, for the same reason `view` omits them: the `id` already uniquely identifies
one IFC, and a school-scope mismatch produces a 404 for that `id`, not different data for
it.

`useIFCStatusHistory(id: number | undefined)` wraps `getIFCStatusHistory` with
`useQuery`, `enabled: id != null && Number.isFinite(id)` — identical shape to
`useIFCView`.

Additionally, `useApproveIFC`, `useRejectIFC`, and `useSubmitIFC` each add
`queryClient.invalidateQueries({ queryKey: ifcQueryKeys.statusHistory(id) })` alongside
their existing `all`/`view` invalidation. These three mutations are exactly the actions
that append a new status-history entry; without this, a history tab already open in
another window would show stale data past its next natural refetch. This is the one
piece of behavior in this change that isn't purely additive — it touches
`useIfcs.ts`'s existing mutation hooks — but it's a one-line addition per hook with no
signature change.

### AC-4, AC-5 — History control visibility

`computeActionFlags` (`IFCActionButtons.tsx`) gains:

```ts
showHistory: hasHigherLevel && status !== S.UNREGISTERED,
```

added to the `ActionFlags` type and the returned object. `status` here is already
`ifc.status?.code ?? S.UNREGISTERED` (the existing fallback two lines above), so a null
`ifc.status` — no IFC record with a real status yet — correctly falls into `false`
without a separate null check. This is deliberately **not** gated on
`status === S.SUBMITTED` the way `showApprove`/`showReject` are: the backend's own 403
condition for this endpoint (`error.ifc.higherLevelRequired` /
`error.ifc.staffRequired`) is org-chart position or admin only, with no status
component, so gating the button on `SUBMITTED` would hide it for approved/observed IFCs
the requester is fully entitled to see the trail for.

### AC-6 — Navigation

`IFCActionButtons` gets an `onHistory: () => void` prop and renders a `History` button
(`variant="secondary"`, same visual weight as `Back`) when `flags.showHistory`, placed
immediately after `Back` in the button row. `IFCViewPage` passes
`onHistory={() => router.push('/ifcs/' + id + '/history')}`.

### AC-7 — Read-only rendering

`IFCStatusHistoryTable` (new, `components/view/`) takes `entries: IFCStatusHistoryEntry[]`
and renders a `DataTable` with `showSearch={false}` `showPagination={false}` (the backend
returns the full array, already newest-first — no client sort/paginate), columns:

| Column  | Cell                                                                     |
| ------- | ------------------------------------------------------------------------ |
| Status  | `<Badge color={entry.color}>{entry.name[lang] ?? entry.name.es}</Badge>` |
| Date    | `formatDateTime(entry.at)`                                               |
| Comment | `entry.comment?.[lang] ?? entry.comment?.es ?? '—'`                      |
| By      | `entry.by ?? '—'`                                                        |

This is the same `Badge color=`/`formatDateTime`/`?? '—'` combination
`IFCHeaderCard.tsx` already uses for the single current-status display — this change
just repeats it per row instead of once. `entries.length === 0` renders
`TableEmptyState` instead of an empty `DataTable`, matching `FindingActionsTable`'s
precedent. No row is interactive — no `onClick`, no action column — so "read-only" is
structural (nothing in the component can mutate anything), not a disabled affordance
sitting next to a live one.

### AC-8, AC-9 — Page shell, back control, error state

`IFCStatusHistoryPage` (new, `components/view/`) follows `FindingDetailPage.tsx`
exactly: reads `id` from `useParams`, calls `useIFCStatusHistory(id)`, and on
`isLoading` renders `LoadingDialog`, on `error || !data` renders `ErrorDialog` with
`tryTranslate(t, getErrorMessage(error, 'ifcs.error.statusHistoryFailed'))` and
`onClose={() => router.push('/ifcs/' + id)}` (back to the IFC, not the list — the
natural "undo" of a navigation one level deep). On success it renders a page shell:
`PageHeader` (`title: t('ifcs.statusHistory.title')`, `action`: a `variant="ghost"`
button with `ArrowLeftIcon` + `t('ifcs.statusHistory.btn.back')` that pushes back to
`/ifcs/[id]`) followed directly by `IFCStatusHistoryTable` — no `Card` wrapper, per
`docs/POLICIES.md` ("the `DataTable` primitive already renders its own bordered box")
and the `IFCDashboard`/`IFCTable` precedent of using the table bare under a `PageHeader`.

The page title is a fixed, translated string ("Status History" / "Historial de
Estados"), not the course name — the status-history endpoint's response carries no
course/program context, and fetching it separately (e.g. reusing `getIFCView`) would add
a second request and a second loading/error state for a label the user already has from
the page they just navigated from. This keeps the page to the one call the proposal
scopes it to.

`error.ifc.statusHistoryFailed` is added to both locale files (`staffRequired` and
`higherLevelRequired` already exist and cover the other two 403 causes — `tryTranslate`
falls back to the raw key for anything unmapped, so no other error path is left silent).

## Frontend

- **Routes**: `src/app/ifcs/[id]/history/page.tsx` (new) — thin
  `dynamic(() => import('@/modules/ifcs').then((m) => m.IFCStatusHistoryPageEntry))`
  shell, matching `[id]/edit/page.tsx`.
- **Components** (all under `src/modules/ifcs/components/view/`, alongside the other
  view-page components they share styling with):
  - `IFCStatusHistoryTable.tsx` (new)
  - `IFCStatusHistoryPage.tsx` (new)
  - `IFCActionButtons.tsx` (modify) — `showHistory` flag + button
  - `IFCViewPage.tsx` (modify) — `onHistory` handler
- **Pages barrel**: `src/modules/ifcs/pages/IFCStatusHistory.tsx` (new, thin
  `'use client'` re-export, matching `IFCView.tsx`) + `pages/index.ts` (modify, exports
  `IFCStatusHistoryPageEntry`).
- **Types**: `modules/ifcs/types/index.ts` (modify) — `IFCStatusHistoryEntry`.
- **Services**: `modules/ifcs/services/ifcsService.ts` (modify) — `getIFCStatusHistory`.
- **Data**: `modules/ifcs/hooks/useIfcs.ts` (modify) — `ifcQueryKeys.statusHistory`,
  `useIFCStatusHistory`, plus the three-hook invalidation addition described under AC-3.
  Query key intentionally carries no `useABET()` scope variable — see AC-3 above for why
  that's consistent with `ifcQueryKeys.view`, not an omission.
- **i18n**: `src/language/locales/{es,en}.json` —
  - `ifc.error.statusHistoryFailed` (new key, alongside the existing `ifc.error.*` block;
    `staffRequired`/`higherLevelRequired` already present, no change)
  - `ifcs.view.btn.history` (new key, alongside the existing `ifcs.view.btn.*` block)
  - `ifcs.statusHistory.title`, `ifcs.statusHistory.btn.back`,
    `ifcs.statusHistory.table.col.status`, `.date`, `.comment`, `.by`,
    `ifcs.statusHistory.table.empty` (new section, sibling to `ifcs.view`/`ifcs.pdf`)

## Testing strategy

There is no test runner in this repo (`docs/POLICIES.md` § Verification Gate). Every AC
is verified by `npx tsc --noEmit` + `pnpm lint` being clean, plus the manual
click-through below — there is no automated coverage to add.

| AC      | Covered by                                                                                                                                                                                            | Kind   |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1, 2, 3 | `tsc --noEmit` (type shape), manual: Network tab shows `GET /ifcs/{id}/status-history` with `X-School-Id` when the History page loads                                                                 | manual |
| 4, 5    | Manual: view an IFC as a user with `requesterHasHigherLevel: true` and a real status → button visible; as a user without it, or an IFC whose status is the `UNREGISTERED` placeholder → button absent | manual |
| 6       | Manual: click History → URL becomes `/ifcs/[id]/history`                                                                                                                                              | manual |
| 7       | Manual: entries render newest-first as returned, correct badge color, timestamp, comment/actor shown when present and `—` when `null`; no control on the page can change any status                   | manual |
| 8       | Manual: Back control returns to `/ifcs/[id]`                                                                                                                                                          | manual |
| 9       | Manual: hit `/ifcs/[id]/history` directly for an IFC where the caller lacks the permission (403) and for a non-existent/out-of-school id (404) → error state renders, not a crash or blank page       | manual |

All of the above are described as the manual verification step in `/abet-implement`'s
final task, per the Verification Gate — no separate `runbook.md` is needed for this
change (see below).

## Risks

| Risk                                                                                                                | Mitigation                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client-side `showHistory` gate is not a real security boundary — a user could hit `/ifcs/[id]/history` directly     | AC-9 / the error-state design above: the backend's 403 is what actually enforces this, same as every other IFC action already in the app; the frontend only needs to fail gracefully, which it does via the same `ErrorDialog` pattern `IFCViewPage` already uses.                                   |
| `color`/`by` typed `object` in the generated OpenAPI schema could tempt a future codegen import                     | Typed by hand in `types/index.ts` with a comment-free, explicit `string \| null`, matching the proposal's explicit call-out — no OpenAPI-generated type is imported for this DTO.                                                                                                                    |
| Adding invalidation to `useApproveIFC`/`useRejectIFC`/`useSubmitIFC` touches shared, already-working mutation hooks | The addition is one extra `invalidateQueries` call per hook, same pattern as the existing `all`/`view` calls right above it — no behavior change to what those hooks already do, verified by `tsc` (signatures unchanged) and the manual click-through (approve/reject/submit still work as before). |

## Docs to update in this PR

None. `docs/CONTEXT.md`'s Domain Vocabulary entry for **IFC** and its Data Fetching
section already describe the query-key-factory and `apiClient` conventions this change
follows without deviation; nothing here introduces a new pattern, module, or convention
worth documenting there.
