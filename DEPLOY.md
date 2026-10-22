# Deploying kcb.pro

kcb.pro is a static, prerendered site on **Cloudflare Pages**. GitHub Actions
(`.github/workflows/ci.yml`) builds it once, runs every check against that build, and
only then uploads the same `build/` folder to Pages:

| Event                  | Gate | Deploy                                   |
| ---------------------- | ---- | ---------------------------------------- |
| Push to `main`         | yes  | **Production** (kcb.pro)                 |
| PR from this repo      | yes  | Preview: `<branch>.kcb-pro.pages.dev`    |
| PR from a fork         | yes  | none (forks get no secrets)              |

A failing check means no deploy. The Pages project uses Direct Upload, so it has no
Git connection and no build settings of its own; the workflow is the whole pipeline.

| Thing           | Value                                       |
| --------------- | ------------------------------------------- |
| Cloudflare acct | `0b827447f7f4b7fc3434ebb1a9bdef91`          |
| Pages project   | `kcb-pro` (`kcb-pro.pages.dev`)             |
| Production      | `main`                                      |
| Output          | `build/`                                    |
| Bun / Wrangler  | `1.3.11` / `4.151.3`                        |
| Repo secret     | `CLOUDFLARE_API_TOKEN` (Pages: Edit)        |

## One-time setup

### 1. API token and repo secret

Cloudflare → My Profile → **API Tokens** → Create Token → Custom token:

- Permissions: **Account · Cloudflare Pages · Edit**
- Account resources: the account above only

Add it to the repo (paste when prompted; it never lands in a file or shell history):

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo KhallilB/kcb.pro
```

Re-run CI on any open PR: the `deploy` job should post a preview URL in the run summary.

### 2. Stop Render from deploying

Until the domains move, Render still serves kcb.pro and rebuilds on every push to
`main`. Before merging to `main`: Render → kcb.pro service → Settings →
**Auto-Deploy: No**. Render keeps serving its last build.

### 3. First production deploy

Merge to `main`. Check the newest Production row and its URL:

```bash
bunx wrangler pages deployment list --project-name kcb-pro
```

Run [Verifying a deploy](#verifying-a-deploy) against that `<hash>.kcb-pro.pages.dev`
URL **before** moving the domains.

### 4. Attach the custom domains

Pages → kcb-pro → **Custom domains** → Set up a domain: `www.kcb.pro`, then `kcb.pro`.
The zone is on Cloudflare, so Pages offers to rewrite the DNS records: accept replacing
the Render records. Both must show **Active** with a certificate.

`kcb.pro` already 301s to `www` through a Cloudflare rule; keep that one redirect and
add none in the repo.

### 5. Retire Render

Once both domains pass the checks below with **no** `rndr-id` header, suspend (later
delete) the Render service.

## Verifying a deploy

```bash
URL=https://<hash>.kcb-pro.pages.dev
for p in / /work/deck-workshop /definitely-not-a-page; do
  printf '%-24s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$URL$p"
done
curl -sI https://www.kcb.pro | grep -iE '^(server|cf-ray|rndr-id)'
```

| Path                  | Expect                                 | Why                                               |
| --------------------- | -------------------------------------- | ------------------------------------------------- |
| `/`                   | 200                                    | The app's `index.html`, not a placeholder.        |
| `/work/deck-workshop` | 200                                    | A prerendered project page.                       |
| unknown path          | 404                                    | Pages serves `build/404.html` with a 404 status.  |
| custom domain headers | `server: cloudflare`, **no** `rndr-id` | Render is out of the path.                        |

Also confirm the body is real: `curl -s $URL/ | grep -o '<title>[^<]*'`.

## Manual deploy

From a clean checkout of `main`, logged in to Wrangler:

```bash
bun run build:client && bun run deploy:client
```
