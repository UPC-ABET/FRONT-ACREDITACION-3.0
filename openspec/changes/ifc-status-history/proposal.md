# IFC status history

**Slug**: `ifc-status-history`
**Branch**: `feat/ifc-status-history`
**Repos affected**: frontend
**Created**: 2026-08-18

## Problem

Once an IFC moves through Saved → Submitted → Approved/Observed, nobody above the
coordinator in the org chart (or an administrator) can see _when_ each transition
happened, who triggered it, or what comment (if any) was left — that trail only exists
in the backend's audit data today. Reviewers evaluating an IFC, or anyone auditing a
rejection, has to take the current status at face value with no way to see the sequence
that produced it.

The backend already exposes this trail
(`GET /ifcs/{id}/status-history`, `UPC-ABET/BACK-ACREDITACION-3.0`, merged to `develop`,
`IfcController_statusHistory` in `openapi.json`). Nothing in this repo calls it yet.

## What already exists

- **`src/modules/ifcs/services/ifcsService.ts`** — the service module for all other IFC
  calls (`getIFCView`, `submitIFC`, `approveIFC`, `rejectIFC`, ...), each following the
  same shape: `apiGet`/`apiPost` → unwrap the `{ code, message, data }` envelope → throw
  `ApiError('ifcs.error.<x>Failed')` if `data` is missing → parse with a Zod schema from
  `ifcResponseSchemas.ts` where the payload needs runtime coercion.
- **`src/modules/ifcs/hooks/useIfcs.ts`** — TanStack Query wrappers over the service
  (`ifcQueryKeys` factory + `useQuery`/`useMutation`). `ifcQueryKeys.view(id)` is the
  closest analog: keyed on `id` alone, no `useABET()` scope variables, because the `id`
  already uniquely identifies one IFC (school scope only affects whether that `id`
  resolves at all — a 404, not different data for the same `id`).
- **`src/modules/ifcs/components/view/IFCActionButtons.tsx`** — `computeActionFlags(ifc)`
  derives all view-page action visibility from the `IFCHeader` the view endpoint returns.
  `showApprove`/`showReject` are both gated by
  `ifc.requesterHasHigherLevel` (plus a status check) — this is the exact permission the
  new endpoint enforces server-side (403 `error.ifc.statusHistoryFailed`,
  `error.ifc.staffRequired`, or `error.ifc.higherLevelRequired` otherwise).
- **`src/modules/ifcs/components/view/IFCViewPage.tsx`** — the page this change adds an
  entry point to. Established pattern for a data-fetch failure: `ErrorDialog` with
  `tryTranslate(t, getErrorMessage(error, '...'))`, closing back to `/ifcs`.
- **`src/app/ifcs/[id]/edit/page.tsx`** — the routing convention for an IFC sub-route:
  `/ifcs/[id]/<sub-route>/page.tsx`, thin shell re-exporting a module page component.
- **`src/language/locales/{es,en}.json`** — `error.ifc.staffRequired` and
  `error.ifc.higherLevelRequired` already exist (shared with other IFC endpoints that
  return the same 403 causes). `error.ifc.statusHistoryFailed` does not exist yet.
- **`src/modules/loads/pages/UploadHistoryPage.tsx` +
  `src/modules/loads/components/UploadHistoryTable.tsx`** — the closest prior art in the
  codebase for a dedicated, read-only "history" page backed by a table of timestamped
  entries. Not required reading to implement this, but the natural reference for
  `/abet-design-feature` when shaping the new page.

## Goals

- Add the data-fetching layer for `GET /ifcs/{id}/status-history`: types, a service
  function following the existing `ifcsService.ts` pattern, and a `useQuery` hook
  following the existing `useIfcs.ts` pattern.
- Add a "History" entry point on the IFC view page (`/ifcs/[id]`), visible only when the
  requester has the same permission that gates Approve/Reject
  (`ifc.requesterHasHigherLevel`) **and** the IFC has an actual status (i.e. its status is
  not the `UNREGISTERED` placeholder `TYPE_CODES.IFC_STATUS.UNREGISTERED` /
  `TG701-T005`) — there is nothing to show before an IFC record exists.
- Add a read-only page at `/ifcs/[id]/history` that lists every status-history entry
  (newest first, as returned — no client re-sorting, no pagination) with its code,
  localized name, color, timestamp, comment (when present), and actor (when present), and
  a button back to the IFC view page.

## Non-goals

- No entry point from the IFC list page (`/ifcs`) or its table rows — only from the IFC
  view page.
- No editing, exporting, or filtering of the history — display only.
- No change to the backend, to `approve`/`reject`/`submit` flows, or to
  `computeActionFlags`'s existing status-gated logic for those three buttons.
- No pagination handling beyond what the backend already guarantees (full array, one
  response).

## Acceptance criteria

1. **AC-1** — A `getIFCStatusHistory(id: number): Promise<IFCStatusHistoryEntry[]>`
   service function exists in `ifcsService.ts`, calls
   `GET /ifcs/{id}/status-history`, unwraps the `{ data: { statuses } }` envelope, and
   throws `ApiError('ifcs.error.statusHistoryFailed')` if `data` is missing.
2. **AC-2** — The `IFCStatusHistoryEntry` type (`code: string`, `name: I18nText`,
   `color: string | null`, `at: string`, `comment: I18nText | null`, `by: string | null`)
   is added to `modules/ifcs/types/index.ts`. `color` and `by` are typed `string | null`
   in this repo despite `openapi.json` generating `object` for them — a documented,
   pre-existing backend DTO decorator quirk, not a new ambiguity.
3. **AC-3** — `ifcQueryKeys` gains a `statusHistory: (id: number) => [...]` key, and a
   `useIFCStatusHistory(id: number | undefined)` hook wraps the service call with
   `useQuery`, `enabled` only when `id` is a finite number — mirroring `useIFCView`.
4. **AC-4** — Given an IFC whose `status.code` is not `TYPE_CODES.IFC_STATUS.UNREGISTERED`
   and whose `requesterHasHigherLevel` is `true`, when the requester views `/ifcs/[id]`,
   then a "History" control is visible.
5. **AC-5** — Given an IFC whose `status` is `null`/`UNREGISTERED`, or whose
   `requesterHasHigherLevel` is `false`, when the requester views `/ifcs/[id]`, then the
   "History" control is not rendered.
6. **AC-6** — When the "History" control is activated, the app navigates to
   `/ifcs/[id]/history`.
7. **AC-7** — On `/ifcs/[id]/history`, given the fetch succeeds, then every entry from
   `statuses` renders in the order returned (newest first), showing its status name
   (localized, color-coded), timestamp, comment when non-null, and actor when non-null;
   entries with a null `comment` and/or `by` render without fabricating a placeholder
   value. The page is read-only — no controls exist to change any status from here.
8. **AC-8** — On `/ifcs/[id]/history`, a control is always present that navigates back to
   `/ifcs/[id]`.
9. **AC-9** — Given the fetch fails (403 or 404), then the page shows an error state built
   from `tryTranslate(t, getErrorMessage(error, 'ifcs.error.statusHistoryFailed'))`,
   matching `IFCViewPage`'s existing error-handling pattern (including the three possible
   403 message keys the backend can return, all of which already exist in both locale
   files except `statusHistoryFailed`, which is added by this change).

### Traceability

| AC  | Criterion                                          | Satisfied by |
| --- | -------------------------------------------------- | ------------ |
| 1   | Service function + envelope/error handling         | TBD          |
| 2   | `IFCStatusHistoryEntry` type                       | TBD          |
| 3   | Query key + `useIFCStatusHistory` hook             | TBD          |
| 4   | History control shown when permitted + real status | TBD          |
| 5   | History control hidden otherwise                   | TBD          |
| 6   | Navigation to `/ifcs/[id]/history`                 | TBD          |
| 7   | Read-only rendering of every entry, in order       | TBD          |
| 8   | Back control on the history page                   | TBD          |
| 9   | Error state on fetch failure                       | TBD          |

## Dependencies

- Backend: `GET /ifcs/{id}/status-history` — already merged to `develop` on
  `BACK-ACREDITACION-3.0`. No frontend-side backend work needed.

## Risks

| Risk                                                                                    | Impact                                                                             | Mitigation                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client-side permission gate (`requesterHasHigherLevel`) is not a real security boundary | A user could hit `/ifcs/[id]/history` directly without the flag showing the button | The page must still handle the backend's 403 gracefully (AC-9) — the backend, not the frontend, is the actual enforcement point, same as every other IFC action today. |
| `color`/`by` typed `object` in the generated OpenAPI schema                             | A naive codegen-based type import would type them wrong                            | Type them by hand as `string \| null` per the backend's explicit note, not from OpenAPI codegen.                                                                       |

## Open questions

None.
