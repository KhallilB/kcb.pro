# kcb.pro

The portfolio of Khallil Bailey, live at [kcb.pro](https://kcb.pro).

It shows three projects (Deck Workshop, Mugen Arena and Wander) and three short
"work studies". Every project page says when it started, where it stands, and when
that was last true.

The home page opens as **the Tome**: a 3D leather book you can open, page through and
pull ribbons on. A toggle in the corner switches to a plain 2D site with the same
content. The 2D pages are prerendered HTML, so they also work without JavaScript and
on devices without WebGL.

## Run it

You need [Bun](https://bun.sh) 1.3.11 or newer.

```bash
bun install
bun run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Everyday commands

| Command                    | What it does                                                         |
| -------------------------- | -------------------------------------------------------------------- |
| `bun run dev`              | Starts the dev server with hot reload.                               |
| `bun run build`            | Typechecks, builds, and prerenders every page into `build/`.         |
| `bun run preview`          | Serves `build/` the way Cloudflare Pages will, on port 4173.         |
| `bun run test`             | Unit and component tests (Vitest).                                   |
| `bun run test:integration` | Renders pages on the server, as the build does, and checks the HTML. |
| `bun run test:e2e`         | Builds the site and drives it in a real browser (Playwright).        |
| `bun run check`            | Everything CI runs: lint, build, and all three test suites.          |
| `bun run deploy`           | Uploads `build/` to Cloudflare Pages by hand. Normally CI does this. |

Run `bun run check` before opening a pull request. If it passes locally, CI will
almost always pass too.

## Where things live

```text
app/
  portfolio/   The content and the rules about it
    content/   Projects, studies and profile, as typed data. Edit these to change the site.
    domain/    Status lines, dates, ordering and validation
  site/        Routes, pages, layout and the 3D/2D toggle
  tome/        The 3D book: the Three.js engine and the text painted on its pages
  styles/      Design tokens and site CSS
scripts/       Prerendering and the local Pages-style server
tests/e2e/     Browser tests
docs/          Guides (below)
```

## Guides

- [How the site fits together](docs/architecture.md): content to rules to pages to
  static HTML, and where each kind of change belongs.
- [Adding or editing a project or study](docs/content.md): the fields, the checks
  the build runs, and what the 3D book needs.
- [How the Tome works](docs/the-tome.md): loading, the engine's handle, switching
  between 3D and 2D, and how to debug the 3D scene.
- [Deploying](docs/deploying.md): how CI ships to Cloudflare Pages, and how to check a
  deploy.

## How changes ship

Every pull request runs the full check and gets a preview URL. Merging to `main`
deploys to production. If any check fails, nothing deploys.
