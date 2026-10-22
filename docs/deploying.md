# Deploying

kcb.pro is a folder of static files (`build/`) hosted on **Cloudflare Pages**. You
don't deploy by hand: GitHub Actions does it.

## What happens when you push

The workflow in `.github/workflows/ci.yml` has two jobs:

1. **gate** builds the site once, then runs lint, the typecheck, and the unit,
   integration and browser tests against that build.
2. **deploy** uploads that same `build/` folder to Pages, but only if the gate passed.

| You…                           | Checks | Deploys to                                  |
| ------------------------------ | ------ | ------------------------------------------- |
| push to `main` (or merge a PR) | yes    | **Production**: kcb.pro and www.kcb.pro     |
| open or update a PR            | yes    | A preview at `<branch>.kcb-pro.pages.dev`   |
| open a PR from a fork          | yes    | Nothing (forks don't get the deploy secret) |

The preview URL is shown in the summary of the workflow run.

If a check fails, nothing deploys and the live site stays as it was.

## The setup, for reference

| Thing                 | Value                              |
| --------------------- | ---------------------------------- |
| Pages project         | `kcb-pro` (`kcb-pro.pages.dev`)    |
| Custom domains        | `kcb.pro`, `www.kcb.pro`           |
| Production branch     | `main`                             |
| Cloudflare account ID | `0b827447f7f4b7fc3434ebb1a9bdef91` |
| Repo secret           | `CLOUDFLARE_API_TOKEN`             |
| Tool versions         | Bun `1.3.11`, Wrangler `4.151.3`   |

The Pages project uses Direct Upload: it has no Git connection and no build settings
of its own. The GitHub workflow is the entire pipeline, so change deploy behaviour
there, not in the Cloudflare dashboard.

### Replacing the API token

If the token expires or is revoked, deploys fail at the "Deploy to Cloudflare Pages"
step. To make a new one:

1. Cloudflare → My Profile → **API Tokens** → Create Token → Custom token.
2. Permission: **Account · Cloudflare Pages · Edit**, limited to the account above.
3. Save it as the repo secret. The command prompts for the value, so it never ends up
   in a file or your shell history:

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN --repo KhallilB/kcb.pro
   ```

4. Re-run the failed workflow.

## Checking a deploy

List recent deploys and their URLs:

```bash
bunx wrangler pages deployment list --project-name kcb-pro
```

Then spot-check one:

```bash
URL=https://www.kcb.pro   # or a <hash>.kcb-pro.pages.dev deploy URL
for p in / /work/deck-workshop /definitely-not-a-page; do
  printf '%-24s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$URL$p"
done
```

| Path                  | Expect | Why                                                   |
| --------------------- | ------ | ----------------------------------------------------- |
| `/`                   | 200    | The home page.                                        |
| `/work/deck-workshop` | 200    | A prerendered project page.                           |
| an unknown path       | 404    | Pages serves `build/404.html` with a real 404 status. |

To confirm the page is the real site rather than an error page:
`curl -s $URL/ | grep -o '<title>[^<]*'` should print the site title.

## Deploying by hand

Only for emergencies, such as CI being down. From a clean checkout of `main`, logged
in to Wrangler (`bunx wrangler login`):

```bash
bun run check && bun run deploy
```

`bun run check` matters: deploying by hand skips the CI gate, so this is the only
thing standing between a broken build and production.
