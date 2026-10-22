# kcb.pro

The Gallery: a portfolio where every project is dated and every claim is checkable. It holds three endeavors (Deck Workshop, Mugen Arena, Wander) and three work studies.

The home page opens as the Tome, a 3D leather book built in Three.js r128, ported from the Portfolio Tome artifact. Its chapters are painted from the same catalog as the site. The prerendered list underneath is the fallback for no JavaScript, no WebGL, and anyone who picks "List view".

## Layout

| Path | Owns |
| --- | --- |
| `app/portfolio/domain` | Rules: status lines, dates, catalog order, content validation |
| `app/portfolio/content` | The published projects, studies and profile, as typed data |
| `app/site` | Routes, pages, components, page titles |
| `app/tome` | The book: `engine.js` (scene, pages, ribbons, chapter faces) and `copy.ts` (chapter text from the catalog) |
| `app/styles` | `tokens.css` (the only place for colour and size literals) and `site.css` |
| `app/entry-server.tsx` | Server render used by the prerender step |
| `scripts/prerender.ts` | Writes one HTML file per route into `build/`; fails the build on catalog errors |
| `scripts/serve-build.ts` | Serves `build/` the way Cloudflare Pages does, for e2e tests |

## Commands

```sh
bun install
bun run dev:client          # dev server
bun run build:client        # typecheck, client build, SSR build, prerender
bun run test:unit           # domain, content, pages, server render
bun run test:e2e            # Playwright against the prerendered build
bun run deploy:client       # Cloudflare Pages
```

Set `BUILD_DAY=YYYY-MM-DD` to pin the as-of stamp; it defaults to the build day in UTC.

## Adding a project

Add an entry to `app/portfolio/content/projects.ts`. The build validates it: unique slug, no filler text, a ship date when shipped, real link destinations. A project page and a work-index row appear on the next build.
