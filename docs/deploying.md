# Deploying

kcb.pro is a folder of static files (`build/`) hosted on **Cloudflare Pages**. You
don't deploy by hand: GitHub Actions does it.

## When it runs

The workflow in `.github/workflows/ci.yml` has two jobs:

1. **gate** builds the site once, fetching each registered project's `progress.json`
   from GitHub with `PROGRESS_TOKEN` (or, when that secret is empty, the workflow's own
   `GITHUB_TOKEN`), then runs lint, the typecheck, and the unit, integration and
   browser tests. It also checks that the Bezl and kbui pages built with their
   Progress card (`id="progress"`), so a build without progress never reaches the
   deploy artifact.
2. **deploy** uploads that same `build/` folder to Pages, but only if the gate passed.

| You…                                   | Checks | Deploys to                                  |
| -------------------------------------- | ------ | ------------------------------------------- |
| push to `main` (or merge a PR)         | yes    | **Production**: kcb.pro and www.kcb.pro     |
| open or update a PR                    | yes    | A preview at `<branch>.kcb-pro.pages.dev`   |
| open a PR from a fork                  | yes    | Nothing (forks don't get the deploy secret) |
| do nothing: the daily build, 06:00 UTC | yes    | **Production**, with fresh progress         |
| run it by hand on `main`               | yes    | **Production**                              |

The preview URL is shown in the summary of the workflow run.

If a check fails, nothing deploys and the live site stays as it was.

## Progress data and the daily build

Progress on project pages is baked in when the site is built, so a daily build
keeps it fresh. If GitHub is down or rate limits the build, or a project's
`progress.json` is missing or breaks a rule, the build fails, nothing deploys, and
production keeps the last good build. The next run recovers on its own once the cause
is fixed.

GitHub pauses scheduled workflows after 60 days without activity in the repository.
To run it by hand: Actions → CI → Run workflow on `main`, or:

```bash
gh workflow run CI --repo KhallilB/kcb.pro --ref main
```

`GITHUB_TOKEN` is provided by Actions and reads public repositories only. Private
ones need `PROGRESS_TOKEN` (below).

### Reading private repositories

The build authenticates with the first non-empty of `PROGRESS_TOKEN` and
`GITHUB_TOKEN`, and never prints either.

To create `PROGRESS_TOKEN` and make a project repository private, in this order:

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained
   tokens** → Generate new token.
2. Resource owner `KhallilB`. Pick an expiry and put the date in your calendar: the
   build fails the day it lapses.
3. Repository access: only `KhallilB/bezl`. Add `KhallilB/kbui` if you like; it is
   public, so it does not need it.
4. Permissions: Repository → **Contents: Read-only** and **Metadata: Read-only**.
   Nothing else.
5. Save it as the repo secret `PROGRESS_TOKEN` (the command prompts for the value):

   ```bash
   gh secret set PROGRESS_TOKEN --repo KhallilB/kcb.pro
   ```

6. Run the workflow by hand on `main` (see above) and check it passes.
7. Make the project repository private, then run the workflow again.

When it goes wrong, the Build step names the project and the variable, never its
value:

| What happened                           | The build says                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `PROGRESS_TOKEN` expired or was revoked | `GitHub answered 401 for the repository: PROGRESS_TOKEN was rejected. Replace it; it may have expired.`   |
| The secret was removed (falls back)     | `the repository was not found, or GITHUB_TOKEN cannot read it; private repositories need PROGRESS_TOKEN.` |
| The token cannot see that repository    | `the repository was not found, or PROGRESS_TOKEN cannot read it.`                                         |

Replace an expired token the same way and re-run the workflow.

## The setup, for reference

| Thing                 | Value                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Pages project         | `kcb-pro` (`kcb-pro.pages.dev`)                                        |
| Custom domains        | `kcb.pro`, `www.kcb.pro`                                               |
| Production branch     | `main`                                                                 |
| Cloudflare account ID | `0b827447f7f4b7fc3434ebb1a9bdef91`                                     |
| Schedule              | Daily at 06:00 UTC (`ci.yml`)                                          |
| Repo secrets          | `CLOUDFLARE_API_TOKEN`, `PROGRESS_TOKEN` (`GITHUB_TOKEN` is automatic) |
| Tool versions         | Bun `1.3.11`, Wrangler `4.151.3`                                       |

The Pages project uses Direct Upload: it has no Git connection and no build settings
of its own. The GitHub workflow is the entire pipeline, so change deploy behaviour
there, not in the Cloudflare dashboard.

Nothing a page shows is private, but anything on it can be scraped. Cloudflare's
AI-crawler blocking (dashboard → the `kcb.pro` zone → Security → Bots) deters
crawlers; it does not prevent copying. It is not set in code.

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
for p in / /work/bezl /definitely-not-a-page; do
  printf '%-24s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$URL$p"
done
```

| Path            | Expect | Why                                                   |
| --------------- | ------ | ----------------------------------------------------- |
| `/`             | 200    | The home page.                                        |
| `/work/bezl`    | 200    | A prerendered project page.                           |
| an unknown path | 404    | Pages serves `build/404.html` with a real 404 status. |

To confirm the page is the real site rather than an error page:
`curl -s $URL/ | grep -o '<title>[^<]*'` should print the site title.

## Deploying by hand

Only for emergencies, such as CI being down. From a clean checkout of `main`, logged
in to Wrangler (`bunx wrangler login`):

```bash
export PROGRESS_TOKEN=$(gh auth token)
bun run check && bun run build && bun run deploy
```

`bun run check` matters: deploying by hand skips the CI gate, so this is the only
thing standing between a broken build and production.

The build fetches progress from GitHub, so it needs a network connection. Run
`bun run build` again after `check`: the browser tests rebuild `build/` from the
offline fixtures, and that build must never be deployed.
