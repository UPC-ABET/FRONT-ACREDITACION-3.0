# Architecture Decision Records

An ADR records a significant, hard-to-reverse architecture decision and the reasoning
behind it — not a running design log and not a place for decisions a future PR can freely
overturn.

## What qualifies

Write an ADR when a decision:

- Is expensive to reverse (a data model, a cross-cutting pattern, a dependency the rest of
  the app builds on).
- Would otherwise get re-litigated because the reasoning lives only in a PR discussion or a
  Slack thread.
- Affects more than one module or more than one team.

Examples from this repo's own conventions that would have warranted an ADR if this
practice had existed at the time: choosing cookie-based auth over token-in-localStorage,
the `admin/` no-aggregate-barrel decision, the tab-state-in-URL pattern.

Don't write one for a routine implementation choice, a naming call, or anything already
covered by [`docs/POLICIES.md`](../POLICIES.md) — POLICIES.md is where the resulting rule
lives; the ADR is where the _why_ and the _alternatives considered_ live.

## Numbering

- Sequential, zero-padded, four digits: `0001-cookie-based-auth.md`,
  `0002-admin-no-aggregate-barrel.md`.
- The number is assigned at creation time and never reused, even if the ADR is later
  superseded or rejected.
- Check the highest existing number in this folder before creating the next one — don't
  guess or reuse a gap left by a deleted draft.

## Immutability

- **An accepted ADR is never edited to reflect a later decision.** If a decision changes,
  write a new ADR that supersedes the old one, and update the old ADR's status line to
  point at the new one. The old ADR's _content_ stays as it was written — it's a record of
  what was decided and why, at the time.
- Typo fixes and formatting are fine. Changing the decision, the reasoning, or the
  consequences is not — that's a new ADR.

## Format

Each ADR is a single Markdown file:

```markdown
# NNNN. Title in imperative or noun form

## Status

Proposed | Accepted | Superseded by [NNNN](./NNNN-slug.md) | Rejected

## Context

What problem forced this decision. What constraints applied.

## Decision

What was decided, stated plainly.

## Consequences

What this makes easier, what this makes harder, what it forecloses.
```

## Where ADRs come from

Most ADRs in this repo originate from an `openspec/changes/<slug>/design.md` that turned
out to record a decision worth keeping past the change's lifetime — see
[`openspec/README.md`](../../openspec/README.md). When a change's `design.md` documents
something that qualifies under [What qualifies](#what-qualifies), promote it to an ADR
here as part of that same change, rather than letting the reasoning disappear once the
change folder is archived to `openspec/specs/`.
