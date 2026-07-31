# openspec

Spec-driven change workflow for this repo.

```
openspec/
├── changes/    in flight — one directory per change
└── specs/      archived record — moved here with git mv after merge
```

A change lives in `openspec/changes/<slug>/` while it's being planned and built. Once it
merges, the folder is moved to `openspec/specs/<slug>/` with `git mv` — history and review
comments travel with it, nothing is deleted or rewritten.

## When a change gets a folder

- **Multi-step work gets a change folder.** If it needs a `design.md` worth of thought, or
  `tasks.md` worth of sequencing, it belongs here.
- **A one-shot defect does not.** Fix the bug, open the PR, done — don't scaffold a change
  folder for a single-file fix with no design decision behind it.

## Slug and branch

- **Slug** = plain kebab-case, 3–6 words. No ticket IDs — there is no Jira.
- **Branch** = `<type>/<slug>` (e.g. `feat/bulk-edit-rubric-weights`), so the slug is
  always inferable from `git branch --show-current`. `<type>` follows the same types as
  [Conventional Commits](../docs/POLICIES.md#git--commits) (`feat`, `fix`, `refactor`, …).

## Artifacts

| File          | Purpose                                                                 | Required                                                                          |
| ------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `proposal.md` | The ticket — what's changing and why.                                   | Always                                                                            |
| `design.md`   | Design decisions, alternatives considered, tradeoffs.                   | Always                                                                            |
| `tasks.md`    | Sequenced, checkable implementation tasks.                              | Always                                                                            |
| `runbook.md`  | Manual/operational steps (migrations, backfills, feature-flag rollout). | When the change has manual or operational steps                                   |
| `contract.md` | Cross-repo API contract, agreed before either side writes code.         | Only for **parallel** cross-repo work — see [Cross-repo model](#cross-repo-model) |

### `tasks.md` completeness gate

**Every task carries a `- [ ]` checkbox inside its `### Task N.N` block, in addition to the
heading.** For example:

```markdown
### Task 2.3: Add query-key scope variables

- [ ] Add `schoolId`, `modalityTypeId`, `academicPeriodId` to the notification query keys
```

Not:

```markdown
### Task 2.3: Add query-key scope variables ✅ DONE
```

The completeness gate is literally `grep -c '^- \[ \]' tasks*.md` — a file with only
`✅ DONE` headings reports **zero open tasks whether or not any work was done**, because
the checkbox that was supposed to flip to `- [x]` was never there to begin with. A
heading-only "done" marker silently defeats the gate forever. When a task finishes, check
its box (`- [x]`) — don't delete it or replace it with a heading annotation.

## Cross-repo model

Backend (`BACK-ACREDITACION-3.0`) and frontend (this repo) are separate repos. A change
spanning both uses the **same slug** in both repos' `openspec/changes/<slug>/` folders.
`proposal.md` and `contract.md` are identical copies across both repos; `design.md` and
`tasks.md` hold only that repo's own side.

- **Sequential** (one person, backend then frontend) — **the default.** No `contract.md`;
  the backend's committed `openapi.json` IS the contract.
- **Parallel** (two people working at the same time) — `contract.md` is agreed before
  either side writes code.

The backend commits `openapi.json` at its repo root (`pnpm openapi:export`). It is this
repo's source of truth for API shapes. **Fetch it remotely, never from a local checkout of
the backend** — a colleague's working tree may be on any branch with uncommitted work:

```bash
gh api "repos/UPC-ABET/BACK-ACREDITACION-3.0/contents/openapi.json?ref=staging" \
  -H "Accept: application/vnd.github.raw"
```

See [`docs/CONTEXT.md`](../docs/CONTEXT.md#related-repositories) for more on the
relationship between the two repos.

## Archiving

When a change merges:

```bash
git mv openspec/changes/<slug> openspec/specs/<slug>
```

If the change's `design.md` recorded a decision that qualifies as an ADR under
[`docs/adr/README.md`](../docs/adr/README.md#what-qualifies), promote it to a numbered ADR
as part of the same PR that archives the change — don't leave the only record of the
decision sitting in an archived spec folder no one thinks to open again.
