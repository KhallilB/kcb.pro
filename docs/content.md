# Adding or editing a project or study

All of the site's content lives in two files:

- `app/portfolio/content/projects.ts`
- `app/portfolio/content/studies.ts`

Your name, headline and GitHub link are in `app/portfolio/content/index.ts`.

Edit the file, run `bun run dev` to see the result, and run `bun run build` before
you push. The build checks the content and refuses to finish if something is wrong.

## Projects

Each project is one object in the `projects` array. The fields are typed in
`app/portfolio/domain/types.ts`, so your editor will flag anything missing.

| Field                     | What it's for                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`                    | The URL: `bezl` becomes `/work/bezl`. Must be unique across projects **and** studies.                                                                                                                                     |
| `kind`                    | `'endeavor'` for real projects. `'site'` is only for this site's own entry.                                                                                                                                               |
| `title`, `summary`        | The name, and a one-line pitch shown on cards and in the index.                                                                                                                                                           |
| `about`                   | A short paragraph saying what it is. It stands in for screenshots, so it can't be empty.                                                                                                                                  |
| `status`                  | `'planned'`, `'in-progress'` or `'shipped'`.                                                                                                                                                                              |
| `startsOn`, `shippedOn`   | Calendar days, `YYYY-MM-DD`. `shippedOn` is required once `status` is `'shipped'`.                                                                                                                                        |
| `order`                   | Season order. The in-progress endeavor with the lowest `order` is "Now building".                                                                                                                                         |
| `role`, `stack`, `domain` | The facts row on the project page.                                                                                                                                                                                        |
| `signature`               | The one thing the project should be remembered for.                                                                                                                                                                       |
| `links`                   | `{ label, href }`. Links must go somewhere: `https://…` or a site path like `/studies`.                                                                                                                                   |
| `brief`                   | The write-up: a list of `{ heading, body: [paragraphs] }` sections.                                                                                                                                                       |
| `listed`                  | Optional. `false` keeps the entry valid but off the site and out of the book. Leave it out to list it.                                                                                                                    |
| `rank`                    | Optional. `1`, `2` or `3`: the project's place in "Selected work" on the home page. Each rank once, and only on a listed endeavor.                                                                                        |
| `repo`                    | Optional. The GitHub repository as `owner/name`, such as `KhallilB/bezl`. Registers the project's progress (below). A private repository needs `PROGRESS_TOKEN` ([deploying](deploying.md#reading-private-repositories)). |
| `goal`                    | Required with `repo`. One sentence on where the project is heading: 1 to 140 characters once trimmed, no line breaks. It opens the project's Progress card.                                                               |

### How status shows up

The site never states a status without a date:

- **In progress:** "In progress · as of 22 Oct 2026". The date is the day the site
  was built, so a fresh deploy refreshes it.
- **Planned:** "Planned · Jan 2027", from `startsOn`.
- **Shipped:** "Shipped · 3 Mar 2027", from `shippedOn`.

The home page's "Now building" line names the in-progress endeavor with the lowest
`order`.

## Progress

A listed project with a `repo` is **registered**. Its page shows a **Progress** card
under the header and a closed **Full history** section after the brief, instead of the
empty build log. The build fills both from `progress.json` at the root of the
repository's default branch, plus the last 12 weeks (84 days) of that branch's commits.

`progress.json` follows [`schema/progress.v1.json`](../schema/progress.v1.json):

```json
{
  "schema": 1,
  "project": "bezl",
  "entries": [
    {
      "id": "2026-10-22-pty-throughput",
      "subject": "pty-throughput",
      "date": "2026-10-22",
      "kind": "experiment",
      "title": "Terminal output into the window",
      "passMark": "No lost bytes, echo under 100 ms, memory under 300 MB",
      "result": "partial",
      "summary": "No bytes lost and typing keeps up; memory runs high, so two tighter limits come next.",
      "measured": [{ "label": "Echo latency, median", "value": "2 ms" }],
      "evidence": [
        { "label": "RESULT.md", "path": "spikes/01-pty-throughput/RESULT.md" }
      ],
      "commit": "2230356"
    }
  ]
}
```

| Field      | Rule                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`   | `1`, the current version. kcb.pro also reads the one before it, once there is one.                                                            |
| `project`  | The kcb.pro slug.                                                                                                                             |
| `id`       | Unique in the file, no spaces. It is the entry's anchor: `/work/bezl#2026-10-22-pty-throughput`.                                              |
| `subject`  | Groups entries about the same thing over time.                                                                                                |
| `date`     | `YYYY-MM-DD`, not after the build day. Entries go oldest first.                                                                               |
| `kind`     | `experiment`, `tests`, `release` or `milestone`.                                                                                              |
| `title`    | The step's name, as visitors read it.                                                                                                         |
| `passMark` | What counted as success, decided before the result. Required for `experiment` and `tests`.                                                    |
| `result`   | `pass`, `partial`, `fail` or `not-run`.                                                                                                       |
| `summary`  | One line on what works and what is left: 1 to 140 characters once trimmed, no line breaks. Optional, but required when `result` is `partial`. |
| `measured` | Measured values only, as `{ label, value }`; may be empty.                                                                                    |
| `evidence` | `{ label, path }` (a repository path at `commit`) or `{ label, url }` (`https` only). At least one unless `not-run`.                          |
| `commit`   | A short or full hash. Required when any evidence uses `path`.                                                                                 |

`schema/progress.v1.json` is a draft-07 JSON Schema for the same rules, for checking a
file in the project's own repository. A conformance test keeps it in step with the
checks the build runs. Extra fields are ignored.

Entries are only ever added. To correct one, add a new entry with the same `subject`;
the page uses the latest entry per subject. Adding `summary` to entries already on a
default branch was a one-time exception to this rule, recorded in the description of
the PR that did it.

### What the page shows

Outcomes only, in the project's own words: each step's `title` and `summary` come
from its `progress.json`. Each result reads as a word, with a mark whose shape also
carries it:

| `result`  | Word        | Mark    |
| --------- | ----------- | ------- |
| `pass`    | Done        | filled  |
| `partial` | In progress | half    |
| `not-run` | Planned     | empty   |
| `fail`    | Rethinking  | crossed |

- **Progress** (`id="progress"`): the project's `goal`; one mark per subject, ordered
  Done, In progress, Planned, Rethinking, and oldest first within each; counts such as
  "3 of 6 done, 1 in progress, 2 planned" (a Rethinking step counts as "1 being
  rethought"; empty groups are left out); "Next up: <title>", the first Planned step
  or else the first In progress one; "Updated <date>", the build day; and "No updates
  since <date>" when the newest entry is more than 30 days old. With no entries yet,
  it says "Nothing logged yet."
- **Full history** (`<details id="record">`), closed until opened: one row per subject
  in the same order, with its mark and word, title, summary and date, then that
  subject's earlier entries, newest first. Every entry keeps its `id` as an anchor. A
  link such as `/work/bezl#2026-10-22-pty-throughput` (or `#record`) opens the section
  at that spot once the page has loaded; without JavaScript it stays closed. At the
  bottom, a 12-week table of commit squares with its total.

### What never ships

`kind`, `passMark`, `measured`, `evidence`, `commit`, commit hashes and commit
messages are checked by the build but never published. The fetch writes only `id`,
`subject`, `date`, `title`, `result` and `summary` per entry, plus a count of commits
per day (`toPublic()` in `app/portfolio/domain/progress.ts`). Each file is read back
through the pages' loader as it is written, so a `build-data/` file with any other
field stops the build before Vite runs. A browser test collects every private value
from the fixtures and fails if any of them turns up in the built pages or the bundle.

The build fails, naming the project and the fix, if a registered repository cannot be
found or read (a private one needs `PROGRESS_TOKEN`), has no `progress.json` on its
default branch, breaks a rule above, or GitHub cannot be reached or refuses (a
rejected token, a rate limit). A failed fetch leaves no stale `build-data/` behind.

`bun run dev` and the browser tests read `app/portfolio/progress/fixtures/<slug>.json`
(`{ "file": …, "commits": […] }`) instead of GitHub and trim them the same way. A newly
registered project needs a fixture there too; the unit tests and the offline build
fail without one.

## Studies

Studies work the same way, in `studies.ts`. They differ from projects in a few fields:

| Field        | What it's for                                                                      |
| ------------ | ---------------------------------------------------------------------------------- |
| `format`     | `'teardown'` (pulling apart a real system) or `'legacy'` (shown as "Reimagining"). |
| `question`   | The one question the study answers.                                                |
| `builtSlice` | What gets built in the study's week.                                               |
| `kitPiece`   | The reusable piece it hands to a project.                                          |
| `feeds`      | Slugs of the projects that piece is for. Each must be a real project slug.         |

## What the build checks

`scripts/prerender.ts` runs these checks (`app/portfolio/domain/validate.ts`) and stops
with a list of problems if any fail:

- **No duplicate slugs**, across projects and studies together.
- **No placeholder text** anywhere, including the brief: "TBD", "TODO", "lorem ipsum",
  "coming soon", "placeholder", "your name".
- **Every project and study has an `about` paragraph.**
- **A shipped project has a `shippedOn` date.**
- **Every link has a real destination.**
- **Every study's `feeds` point at projects that exist and are listed.**
- **`repo` is `owner/name`.**
- **A project with a `repo` has a `goal`** of one line, 1 to 140 characters.
- **Each `rank` is used once, and only on a listed endeavor.**
- **Every registered project has a valid `progress.json`** (see Progress
  above). The fetch step checks this, not `validate.ts`.

The checks run on every entry, hidden ones included, so a hidden project can come back
by deleting its `listed: false` line.

`app/portfolio/content/content.test.ts` runs the same checks in `bun run test`, so you
find out before you build. That file also pins the current lineup on purpose: exactly
two ranked endeavors (Bezl rank 1, then kbui rank 2), both registered by `repo`, Bezl
as "now building", the three earlier endeavors kept but hidden, and three studies.
When you add, remove or reorder projects or studies, update those expectations in the
same change.

## The 3D book needs a little more

The 2D site picks up new content automatically: a new project gets its own page and
a row in the work index on the next build. The book doesn't, because each of its
pages is laid out by hand.

- **Projects:** the book has exactly two chapters, for `bezl` and `kbui`. Their
  notes and facts are written in
  `app/tome/copy.ts`, and the page layout lives in the `SHEETS` list in
  `app/tome/engine.js`. Editing those projects' titles, summaries, `about` text or
  status in `projects.ts` updates the book. A new project does not appear in the book
  until a chapter is added in both files. Renaming or hiding one of those two slugs
  breaks its chapter.
- **Studies:** every study needs an entry in `STUDY_NOTES` in `app/tome/copy.ts`: a
  short name for the book's study list and one sentence on why it matters. Without
  one, the book's study page shows blank lines for it.
- **Switching views:** `app/tome/place.ts` lists the places the book and the site
  share, so pressing 2D on a chapter opens that chapter's page. A new chapter needs
  an entry there too.
