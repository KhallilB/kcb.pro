# Progress as a journey, outcomes only

Date: 2026-10-23
Status: approved in conversation; spec review passed (round 2 fixes applied)
Amends: [2026-10-22 progress ledger](2026-10-22-progress-ledger-design.md) and plan 1a, before PR #131 merges. Plan 1b gets a follow-up edit (see "Plan 1b").

## Why

The first ledger reads like a test report. Visitors meet pass marks, "partial" and commit hashes before they learn what the project is, and "partly works" sounds like "broken". The owner also wants the site to show where a project is heading without publishing its internals: anything on a public page, including the JavaScript bundle, can be scraped.

## Goal

A project page tells, at a glance and in plain words: what the project is for, how far along it is, and what comes next. It stays honest, and it ships only what it shows.

## Decisions

| Topic                | Decision                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page order           | Header, the journey card, the brief, then the full record (collapsed)                                                                                                    |
| Status words         | One exported map, `STATUS_WORD`: `pass` Done, `partial` In progress, `not-run` Up next, `fail` Rethinking. Used by 2D and by plan 1b's seals                             |
| Detail on the page   | Outcomes only: step title, status, date and a one-line summary. No pass marks, measurements, evidence links, commit hashes, commit messages or links into the repository |
| Data that ships      | The fetch validates the full data, then a pure `toPublic()` trims it before anything is written. Neither HTML nor the client bundle carries anything else                |
| Activity             | Daily commit counts only, inside the full record                                                                                                                         |
| Summary sentence     | New optional `summary` on entries, required when `result` is `partial`                                                                                                   |
| Goal sentence        | New `goal` on each project with a `repo`                                                                                                                                 |
| Private repositories | Allowed. The fetch authenticates with the first non-empty of `PROGRESS_TOKEN` and `GITHUB_TOKEN`. Bezl's repository becomes private; its Source link is removed          |
| Bot crawlers         | Not handled in code. The owner may enable Cloudflare's AI-crawler blocking; it deters, it does not prevent                                                               |

## Contract change (v1)

`summary`: optional string. The value is trimmed; the trimmed text must be 1 to 140 characters and contain no `\n` or `\r`. Required when `result` is `partial`, where it must say what works and what is left (the build checks presence and length; the wording is reviewed by people).

`schema` stays `1`. `validateProgress`, `schema/progress.v1.json` and the conformance corpus gain the field and the partial rule. Making `summary` required on `partial` rejects files that are valid today, so it is safe only once every registered project's file complies (see "Order of work"). Adding `summary` to entries already on a default branch is a one-time, documented exception to the append-only rule; nothing enforces append-only yet (sub-project 2). Each project's summary PR records the exception in its description.

## Public data shape

```ts
interface PublicEntry {
  id: string
  subject: string
  date: IsoDay
  title: string
  result: ProgressResult
  summary?: string
}
interface PublicProgress {
  entries: PublicEntry[]
  days: { day: IsoDay; count: number }[]
}
```

- `toPublic(full: ProjectProgress, buildDay): PublicProgress` lives in `domain/progress.ts`. It keeps entries in file order and drops `kind`, `passMark`, `measured`, `evidence` and `commit`. `days` is dense: exactly 84 items, consecutive, ending on the build day, counts of commits by committer date; shas, messages and URLs are dropped.
- The fetch step validates the full fetched data (`validateProgress`, `validateCommits`), then writes `toPublic(...)` to `build-data/progress/<slug>.json`.
- `loadProgress` validates the public shape: every entry field as above, `days` length 84, consecutive, last day equals the build day, counts non-negative integers. It rejects unknown keys on the top-level object and on entries, so a stale full-shape file in `build-data/` fails closed instead of shipping.
- kcb.pro's own offline fixtures (`app/portfolio/progress/fixtures/*.json`) gain `summary` on every `partial` entry, so the offline build and e2e pass the new rule.
- `fixture-progress.ts` and offline mode run the full fixtures through `toPublic` before loading, so tests and the offline build see the same shape as production.
- `useSite().progress` becomes `Record<string, PublicProgress>`. `current`, `progressCounts`, `overallSeal` and `quietSince` accept `PublicEntry`.

## Order and naming rule

Group order everywhere: Done, In progress, Up next, Rethinking. Within a group: date ascending, then file order. The step line, the record and the Next rule all use this order, so tests can pin it.

## The journey card

A `<section aria-labelledby="progress">` under the project header, heading "Where it stands" with `id="progress"` (the CI live-ledger guard keeps matching).

- **Goal:** the project's `goal` sentence.
- **Step line:** one mark per subject in `current(entries, buildDay)`, in the order above; filled, half, empty and crossed marks; each mark has an accessible name such as "Step 2 of 6: Terminal output keeps up, in progress". Marks are not colour-only (shape plus the visible counts).
- **Counts:** "3 done · 1 in progress · 2 up next"; "rethinking" appears only when non-zero; zero groups are left out.
- **Next:** the first Up next step in the order above, else the first In progress step: "Next: <title>". Omitted when neither exists.
- **As of** the build day, and "Quiet since <date>" when the newest entry is more than 30 days old.

## The full record

After the brief, a `<details id="record">` with summary "The full record":

- One row per subject in `current(...)`, grouped and ordered as above: status mark and word, title, summary when present, date. The row's element has `id = <current entry id>`.
- Under a row, earlier entries for the same subject, newest first, each a small line "<date> · <status word> · <summary or title>" with its own `id = <entry id>`, so every entry id still anchors.
- "Activity": the 12-week grid with total and legend, built from `days`.
- **Opening on a link:** the prerendered record is closed (the server has no hash). After hydration, an effect reads `useLocation().hash`; when it equals any rendered entry id or `record`, it sets the record open and scrolls the target into view. The first client render matches the server (closed), so there is no hydration mismatch. The effect re-runs on client navigation (hash or path change) before plan 1b's seek, so seal links land on a visible element; a direct page load with a hash opens it too. Without JavaScript the record stays closed; the anchor still exists.

## Removed from the first ledger

Pass-mark and measured rows, evidence `<details>`, commit links, the filter bar and status count, the commit-type list, "Recent commits, last 90 days", and the "All commits on GitHub" link. The empty activity text becomes "No commits in the last 12 weeks." The fetch requests commits only for the 84-day window.

## Private repositories and errors

- The public-repository check in `fetch.ts` is removed.
- Token choice: first non-empty of `PROGRESS_TOKEN`, `GITHUB_TOKEN` (an unset Actions secret arrives as an empty string). Neither is printed.
- A 404 from GitHub says the repository was not found or the token in use cannot read it, names that variable (or that none is set), and adds "private repositories need `PROGRESS_TOKEN`" when `PROGRESS_TOKEN` was not the one used.
- A 401 says that token was rejected and names it.
- The parent spec's "Private repositories" non-goal and "must be public" rule are superseded.

## Content

- `goal`: required when a project has `repo`; 1 to 140 characters after trimming; no line breaks; validated in `validate.ts`. Drafts for the owner to edit: Bezl "One window that runs AI coding assistants side by side, with one writer per task."; kbui "One design system every project shares, with the rules checked by the build."
- Bezl's `links` loses its Source link in PR #131, before Bezl goes private. kbui keeps its link.
- Bezl and kbui `progress.json` gain `summary` sentences, written from the existing evidence, in one PR each.

## Order of work

1. Summary PRs in Bezl and kbui (owner merges). Valid under today's rules because unknown fields are allowed.
2. PR #131 gains this change and merges (its CI fetches the live files, now with summaries).
3. Owner, after #131 is on `main` (which then has `workflow_dispatch`): create a fine-grained token with read-only Contents and Metadata on KhallilB/bezl (and kbui, optional since it is public), note its expiry; save it as the kcb.pro secret `PROGRESS_TOKEN`; run the workflow manually; make Bezl private; run it again.

`docs/deploying.md` documents the token, its scopes, its expiry and how failures show up: an expired or revoked `PROGRESS_TOKEN` gives a 401 naming `PROGRESS_TOKEN`; a removed secret falls back to `GITHUB_TOKEN` and gives a 404 naming `GITHUB_TOKEN` with the "private repositories need `PROGRESS_TOKEN`" hint.

## Plan 1b

A follow-up edit to plan 1b replaces `ProjectProgress`/`p.file.entries` with `PublicProgress`/`entries`, rebuilds its fixtures with `toPublic`, uses `STATUS_WORD` for the seal words, and relies on the record's open-on-hash for seal links. Nothing in 1b needs commit messages.

## Tests, written first

- Contract: `summary` trimming, length and line-break rules; required for `partial`; schema corpus rows for each.
- `toPublic`: keeps exactly the public fields; dense, ordered 84-day `days`; entries in file order.
- Loader: rejects a non-public shape and bad `days`.
- Fetch: private repository accepted with a token; 404 and 401 messages name the token variable; `PROGRESS_TOKEN` preferred, empty values skipped, never printed.
- Journey card: status words, counts, step order and accessible names, the Next rule, Quiet since.
- Record: grouping and order, current rows and earlier lines with ids, activity from `days`, open on a matching hash both after a client navigation and on a direct load with a hash, with no hydration warning.
- Validation: `goal` required with `repo`, length and line-break rules.
- e2e (offline build): the journey card comes before the brief; the record is collapsed; a scan of `build/work/*.html` and `build/assets/*.js` finds none of a fixed list of fixture-only strings (a pass mark, a measurement label, an evidence path, a commit sha, a commit message).

## Acceptance

- `/work/bezl` shows the goal, the step line and "Next:" above "The problem", and no pass marks, measured values, evidence paths, links into the repository or commit messages appear anywhere in the built HTML or bundle.
- With Bezl private and `PROGRESS_TOKEN` set, the scheduled build succeeds; with the secret removed, it fails with a 404 naming `GITHUB_TOKEN` and the `PROGRESS_TOKEN` hint.
