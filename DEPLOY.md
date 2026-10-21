# Deploying kcb.pro

kcb.pro deploys through **Cloudflare Pages Git builds**. A push to `main` builds and
ships production; any other branch or PR gets a preview URL. GitHub Actions
(`.github/workflows/ci.yml`) only gates: lint, typecheck, build, unit, integration and
e2e tests. It never deploys, and it needs no Cloudflare secret.

| Thing           | Value                              |
| --------------- | ---------------------------------- |
| Cloudflare acct | `0b827447f7f4b7fc3434ebb1a9bdef91` |
| Pages project   | `kcb-pro` (`kcb-pro.pages.dev`)    |
| Production      | `main`                             |
| Output          | `build/`                           |
| Bun             | `1.3.11` (same in CI and Pages)    |

## One-time dashboard setup

These are dashboard clicks; nothing in the repo does them.

### 1. Reconnect the GitHub repo

Workers & Pages → **kcb-pro** → Settings → **Builds**.

- If the Git repository shows as disconnected or errors, choose **Manage** /
  **Connect**, authorise the Cloudflare Pages GitHub app for `KhallilB/kcb.pro`, and
  pick that repo.
- Build system version: **3** (needed for `BUN_VERSION` ≥ 1.2).

### 2. Build configuration

| Setting                | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| Production branch      | `main`                                                  |
| Framework preset       | None                                                    |
| Build command          | `bun install --frozen-lockfile && bun run build:client` |
| Build output directory | `build`                                                 |
| Root directory         | `/` (leave blank)                                       |

Preview branches: **All non-production branches** (or _None_ to save build minutes).
The old `prod-client` / `prod-server` preview branches are retired; remove them from
any include list.

Why the install is in the build command: installing with Bun explicitly, and skipping
Pages' automatic install (below), keeps the build on the same frozen `bun.lock` CI
uses. `package.json` declares `"packageManager": "bun@1.3.11"` to match.

### 3. Build variables (Production **and** Preview)

| Variable                  | Value             | Note                                                         |
| ------------------------- | ----------------- | ------------------------------------------------------------ |
| `BUN_VERSION`             | `1.3.11`          | Matches CI and `bun.lock`.                                   |
| `SKIP_DEPENDENCY_INSTALL` | `1`               | Build command does the Bun install.                          |
| `BUILD_DAY`               | e.g. `2026-10-21` | Optional; pins the gallery's build date (unset = build day). |

### 4. Trigger the first build

Push a commit to `main` (merging the PR that adds this file does it). Do **not**
retry the old production deploy: it was built from `a96f5b3`, which no longer
exists after the Feb 2026 reset of `main`. Then run the checks in [Verifying a deploy](#verifying-a-deploy) against the new
`<hash>.kcb-pro.pages.dev` URL **before** moving the domain.

### 5. Attach the custom domains

kcb-pro → **Custom domains** → Set up a domain:

1. `kcb.pro`
2. `www.kcb.pro`

The zone is already on Cloudflare, so Pages offers to write the DNS records: accept
replacing the existing Render records with proxied CNAMEs to `kcb-pro.pages.dev`.
Confirm the dashboard shows both as **Active** with a certificate.

Canonical host: today `kcb.pro` 301s to `www`. Keep one direction with a Redirect
Rule (Rules → Redirect Rules) or a `public/_redirects` entry, not both.

### 6. Retire Render

Only after `https://www.kcb.pro` and `https://kcb.pro` pass the checks below **and**
no longer return an `rndr-id` response header:

1. Render → kcb.pro service → Settings → **Auto-Deploy: No**.
2. Watch for a day, then **Suspend** (or delete) the service.

## Verifying a deploy

Run from the repo, logged in to Wrangler:

```bash
bunx wrangler pages deployment list --project-name kcb-pro
```

The newest **Production** row must show `Branch main`, `Source` = the commit you
pushed (`git rev-parse --short origin/main`), and a non-failed status. Then curl that
row's deployment URL (and later the custom domains):

```bash
URL=https://<hash>.kcb-pro.pages.dev
for p in / /work/deck-workshop /definitely-not-a-page; do
  printf '%-24s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$URL$p"
done
curl -sI https://www.kcb.pro | grep -iE '^(server|cf-ray|rndr-id)'
```

Expected:

| Path                  | Expect                                 | Why                                                                                               |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/`                   | 200                                    | Body is the app's `index.html`, not Cloudflare's placeholder.                                     |
| `/work/deck-workshop` | 200                                    | A prerendered project page.                                                                       |
| unknown path          | 404                                    | Pages serves `build/404.html` with a 404 status.                                                  |
| custom domain headers | `server: cloudflare`, **no** `rndr-id` | Render no longer in the path.                                                                     |

Also confirm the body is real: `curl -s $URL/ | grep -o '<title>[^<]*'`.
