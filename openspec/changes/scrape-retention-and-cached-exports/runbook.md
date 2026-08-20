# Runbook — Scraping exports move to cached, async generation

**Slug**: `scrape-retention-and-cached-exports`

## Deploy prerequisite

**Resolved 2026-08-20** — re-checked the same day and `ref=staging` now serves exactly the new
generic contract (`.../{exportType}/status|download|regenerate`); the seven old literal paths are
gone. Re-verify with the same command if this is picked up again after a gap:

```bash
gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=staging" \
  -H "Accept: application/vnd.github.raw" | grep -o '"/scraping/exports[^"]*"'
```

## Manual verification steps (no test runner covers these)

Perform these against a backend that is actually running the new contract (once Milestone 0
passes) — none of them are covered by an automated test, per `docs/POLICIES.md` § Verification
Gate.

1. **Status per type, period-scoped (AC-1)** — With an academic period selected in the top bar,
   load `/scrapping` → Exports tab. Confirm the Network tab shows one `GET .../status` call per
   export type (5 total), each carrying `X-Academic-Period-Id`. A fired request only proves the
   call happened — also visually confirm each of the four rendered states at least once
   (`notGenerated`: only a "Generar" button, no badge; `running`: badge + spinner text;
   `completed`: badge + Download button; `failed`: badge + the error `Alert`, showing the
   backend's `errorMessage` when present).
2. **No-period gating (AC-2)** — Clear the top-bar period selector. Confirm the Exports tab shows
   the "select a period" notice and fires no status/download/regenerate calls.
3. **Download survives a concurrent regenerate (AC-3)** — Pick an export type with a previously
   completed file. Click Regenerate, then immediately click Download before the job finishes.
   Confirm the previous file downloads rather than a block or a 404.
4. **notGenerated/failed → regenerate (AC-4)** — Pick an export type with no file yet (or force
   one to `failed`). Click the primary action; confirm `regenerate` fires and the card flips to
   `running`.
5. **409 handling and grades-rc wording (AC-5)** — Trigger a `409` (e.g. click regenerate twice
   quickly, or regenerate grades-rc while another period's grades-rc job is running). Confirm the
   toast shows the backend's translated message and that no copy anywhere implies the conflict is
   scoped to the current period for grades-rc.
6. **Query key scoping (AC-6)** — With one export type showing a stale/`running` badge, switch
   the top-bar academic period. Confirm the badge refetches for the new period rather than
   showing the previous period's cached state.
7. **UploadPanel button, all three branches (AC-8)** — On the loads upload page, click "Excel
   web-scraping" for: (a) an upload type with a completed export (expect immediate download),
   (b) one that's `notGenerated` (expect a regenerate + toast pointing to the Exports tab), and
   (c) one currently `running` (expect an info toast, no regenerate call fired).
8. **Locale completeness (AC-9)** — Switch the app language (`es`/`en`) and repeat steps 1–7
   briefly, confirming no raw i18n keys leak into the UI. Two of the four new
   `error.scrapingExport.*` keys are already exercised above (`notGenerated` by step 4,
   `alreadyGenerating` by step 5); the other two need a deliberate repro since nothing in the
   normal flow triggers them:
   - `invalidExportType` — call the download/status/regenerate endpoint directly with a bogus
     `exportType` path segment (e.g. via `curl` or the browser devtools Network tab's "Edit and
     Resend"), and confirm the resulting error surfaces translated, not as a raw key.
   - `periodNotFound` — call the same endpoints with an `X-Academic-Period-Id` for a period that
     doesn't exist (or was deleted), and confirm the same.
9. **Status fetch failure (added post-audit)** — Force the status `GET` to fail (e.g. block the
   request in devtools, or point at a period the backend rejects with a 5xx). Confirm the card
   shows the new "could not check status" error `Alert` rather than silently rendering as
   `notGenerated`.
10. **Stale-file race (added post-audit)** — If the backend's retention policy makes this
    reproducible, purge a previously-completed file, then click Download on a card that still
    shows it as available. Confirm the "no longer available" message appears (not the generic
    `notGenerated` copy) and the card's status refetches. If this isn't reproducible against the
    current backend, note that explicitly rather than skipping the row silently.

## Dead-code verification (AC-7)

```bash
rg -i "docentes|secciones|alumnos-matriculados|alumnos-secciones|grades-rc/(start|status/|download/)|DirectDownloadExportKind|GradesRcExportJobStatus|GradesRcExportStatus\b" src/
```

Expect no matches outside historical comments/commit messages. Fix any hit before merging.

## Known gaps not covered above

Neither a `403` (permission denied) on any of the three endpoints, nor an
`X-Academic-Period-Id` that's non-null but invalid/stale, has a manual verification step here.
Both are realistic production states — accepted as a gap for this change rather than blocking on
them, since neither is called out in `proposal.md`'s acceptance criteria.

## Rollback

No data migration, no seed, no feature flag — this is a pure contract-swap on the frontend. If
something is wrong post-merge, revert the frontend PR; the backend's old endpoints remain
unaffected by anything in this repo (the backend's own removal of the old paths is that repo's
concern and its own rollback path).
