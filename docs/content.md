# Adding or editing a project or study

All of the site's content lives in two files:

- `app/portfolio/content/projects.ts`
- `app/portfolio/content/studies.ts`

Your name, headline, contact links and past roles are in `app/portfolio/content/index.ts`. The résumé PDF it links to is `public/khallil-bailey-resume.pdf`.

Edit the file, run `bun run dev` to see the result, and run `bun run build` before
you push. The build checks the content and refuses to finish if something is wrong.

## Projects

Each project is one object in the `projects` array. The fields are typed in
`app/portfolio/domain/types.ts`, so your editor will flag anything missing.

| Field                     | What it's for                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `slug`                    | The URL: `bezl` becomes `/work/bezl`. Must be unique across projects **and** studies.                  |
| `kind`                    | `'endeavor'` for real projects. `'site'` is only for this site's own entry.                            |
| `title`, `summary`        | The name, and a one-line pitch shown on cards and in the index.                                        |
| `about`                   | A short paragraph saying what it is. The only picture when there's no `media`, so it can't be empty.   |
| `media`                   | Optional. One image or video under the header. See [Media](#media).                                    |
| `status`                  | `'planned'`, `'in-progress'` or `'shipped'`.                                                           |
| `startsOn`, `shippedOn`   | Calendar days, `YYYY-MM-DD`. `shippedOn` is required once `status` is `'shipped'`.                     |
| `order`                   | Season order. Lower numbers come first on the home page.                                               |
| `role`, `stack`, `domain` | The facts row on the project page.                                                                     |
| `signature`               | The one thing the project should be remembered for.                                                    |
| `links`                   | `{ label, href }`. Links must go somewhere: `https://…` or a site path like `/studies`.                |
| `brief`                   | The write-up: a list of `{ heading, body: [paragraphs] }` sections.                                    |
| `listed`                  | Optional. `false` keeps the entry valid but off the site and out of the book. Leave it out to list it. |

### Media

`media` is one `{ kind, src, alt, width, height }`:

- `kind` is `'image'` or `'video'`.
- `src` is a site path. Put the file in `public/media/` and write `/media/bezl.png`.
- `alt` says what the picture shows. For a video it becomes the player's label.
- `width` and `height` are the file's pixel size. They reserve the space, so the page
  doesn't jump when it loads.

Images load lazily and videos download nothing until played.

### How status shows up

The site never states a status without a date:

- **In progress:** "In progress · as of 22 Oct 2026". The date is the day the site
  was built, so a fresh deploy refreshes it.
- **Planned:** "Planned · Jan 2027", from `startsOn`.
- **Shipped:** "Shipped · 3 Mar 2027", from `shippedOn`.

The home page's "Now building" line names the in-progress endeavor with the lowest
`order`.

## Studies

Studies work the same way, in `studies.ts`. They differ from projects in a few fields:

| Field        | What it's for                                                                      |
| ------------ | ---------------------------------------------------------------------------------- |
| `format`     | `'teardown'` (pulling apart a real system) or `'legacy'` (shown as "Redesign").    |
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
- **Project media has alt text, a source, and a whole-number width and height.**
- **Every study's `feeds` point at projects that exist and are listed.**

The checks run on every entry, hidden ones included, so a hidden project can come back
by deleting its `listed: false` line.

`app/portfolio/content/content.test.ts` runs the same checks in `bun run test`, so you
find out before you build. That file also pins the current lineup on purpose: three
endeavors in season order (Bezl, kbui, then Mugen Arena), Bezl as "now building", the
two earlier endeavors kept but hidden, and four studies. Every study must feed a listed
project, and every endeavor must be fed by at least one study.
When you add, remove or reorder projects or studies, update those expectations in the
same change.

## The 3D book needs a little more

The 2D site picks up new content automatically: a new project gets its own page and
a row in the work index on the next build. The book doesn't, because each of its
pages is laid out by hand.

- **Projects:** the book has exactly two chapters, for `bezl` and `kbui`. Mugen Arena
  is listed on the site but has no chapter yet. The two chapters'
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
