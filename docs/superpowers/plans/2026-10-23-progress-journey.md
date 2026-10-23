# Progress as a Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A registered project page says in plain words what the project is for, how far along it is and what comes next, and the site ships only those outcomes: no pass marks, measurements, evidence, commit hashes, commit messages or links into the repository reach the HTML or the JavaScript bundle.

**Architecture:** The fetch keeps validating the full `progress.json` and commits, then a pure `toPublic()` in `app/portfolio/domain/progress.ts` trims each project to `PublicProgress` (`entries` with six fields, `days` with 84 daily counts) before anything is written to `build-data/`. The loader accepts only that shape and fails closed on anything else. The page renders a "Where it stands" journey card under the header and a closed "The full record" `<details>` after the brief; an effect opens the record when the URL hash names an entry. Journey order, the next step and the status words (`STATUS_WORD`) are pure domain functions shared with plan 1b.

**Tech Stack:** React 19, React Router 7, Vite 6, TypeScript 5.7, Vitest 3 + Testing Library (jsdom), Playwright, Ajv 8, Bun 1.3.11, GitHub REST API, GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-10-23-progress-journey-design.md` (commit `1ef7814`), which amends `docs/superpowers/specs/2026-10-22-progress-ledger-design.md`.

---

## Where this runs

- **Worktree:** `/Users/khallil/proj/kcb.pro/.claude/worktrees/feat-progress-ledger-1a`, branch `feat/progress-ledger`, starting at `c2e5fb1`. Every path in Tasks 0–13 and 15 is relative to it. Do not create a new worktree.
- **PR:** KhallilB/kcb.pro#131. Every task adds one new signed commit to it.
- **Task 14** edits plan 1b in `/Users/khallil/proj/kcb.pro/.claude/worktrees/spec-progress-ledger` (branch `worktree/spec-progress-ledger`, a local session branch that is never pushed).

## Conventions (read once, apply everywhere)

- **TDD:** @superpowers:test-driven-development. Every behaviour change starts with a failing test you run and watch fail for the stated reason, then the minimal code, then green. Exceptions (CI YAML, docs, plan text) are called out in their task with the verification used instead.
- **Single test file:** `npx vitest run --config vitest.config.ts <path>`. Vitest pins `__BUILD_DAY__` to `2026-10-21`.
- **Gate** (must pass before every commit; each commit must stand on its own). Offline is fine unless the task says otherwise:

  ```bash
  lsof -ti tcp:4173 | xargs kill 2>/dev/null; bun run lint && bun run typecheck && PROGRESS_OFFLINE=1 bun run build && bun run test && bun run test:integration && bun run test:e2e
  ```

  Expected: every command exits 0; Vitest prints `Test Files  N passed`; Playwright ends with `N passed` and no `failed`. Killing anything on port 4173 first stops Playwright reusing an old server (and an old `build/`).

- **Online build** (only where a task says so): proves the commit works with the live `progress.json` files.

  ```bash
  GITHUB_TOKEN=$(gh auth token) bun run build
  ```

  From Task 11 on use `PROGRESS_TOKEN=$(gh auth token) bun run build`. Expected output includes `Progress from GitHub for bezl, kbui as of <today>` and `Prerendered N pages as of <today>`, exit 0. Run it before the offline gate: the e2e step rebuilds `build/` offline afterwards, and that offline build must never be deployed.

- **Style:** match the surrounding code: 2-space indent, single quotes, no semicolons, trailing commas `es5` (`.prettierrc`). Run `bunx prettier --write <file>` on files you **create**; do not reformat existing files wholesale (several, such as `app/site/pages.test.tsx`, are wider than prettier's 80 columns on purpose).
- **Comments:** one line at most, only for intent, invariant, constraint or a non-obvious tradeoff. No narration.
- **CSS:** raw colour and size literals (`px`, `rem`, `em`, hex, `rgba`) go only in `app/styles/tokens.css`. `site.css` uses `var(--…)`. Percentages inside gradients and `border-radius: 50%` follow the existing pattern. Media-query widths stay literal, as they already are (custom properties do not work there).
- **Git:** never `git stash`. Stage named files only (`git add <paths>`), never `git add -A`.
- **Commits:** Conventional Commit subjects, SSH-signed with `git commit -S`, no `Co-authored-by` trailer and no AI attribution of any kind. After each commit:

  ```bash
  git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
  ```

  Expected: `1`.

- **Verification:** @superpowers:verification-before-completion. Report only checks actually run.

## Order of work and its consequences

1. Bezl's and kbui's summary PRs (being done in parallel, merged by the owner) give every `partial` entry in the live files a `summary`. **Task 2 makes `summary` required on `partial`, so Task 2 Step 1 checks the live files first and stops if any partial entry lacks one.**
2. This plan adds the change to PR #131. kcb.pro's own offline fixtures get their summary in Task 1, before the rule exists.
3. After #131 merges, the owner creates `PROGRESS_TOKEN`, runs the workflow, makes Bezl private, and runs it again (documented in Task 13, not done here).

Tasks 6–9 keep the page working while the data is still the full shape by trimming it on the page with `toPublic()`. Task 10 moves the trim into the build and deletes that interim line.

## Shared contract with plan 1b (do not rename)

- `app/portfolio/domain/progress.ts` exports `PublicEntry`, `PublicProgress`, `DayCount`, `ACTIVITY_DAYS`, `toPublic(full, buildDay)`, `validatePublicProgress(data, ctx)`, `STATUS_WORD`, `STATUS_ORDER`, `journeySteps(entries, day)`, `nextStep(steps)`, `earlierEntries(entries, step, day)`, and keeps `current`, `progressCounts`, `overallSeal`, `quietSince`, all accepting `PublicEntry`. `resultLabel`, `kindLabel` and `evidenceHref` are removed.
- `useSite().progress` is `Record<string, PublicProgress>`; entries are `progress[slug].entries`.
- Every entry id is an element `id` on `/work/<slug>`, inside `<details id="record">`. The record opens itself when the hash names one, on load and on every client navigation.

## File structure

| File                                                                                        | Responsibility                                                                        | Task        |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------- |
| `app/portfolio/progress/fixtures/bezl.json` (modify)                                        | `summary` on the partial fixture entry                                                | 1           |
| `app/portfolio/domain/text.ts` (create)                                                     | `isShortLine()`: one line, 1 to 140 characters trimmed                                | 2           |
| `app/portfolio/domain/progress.ts` (modify)                                                 | `summary` rules; public shape; `toPublic`; `STATUS_WORD`; journey order; loader check | 2, 5, 9, 10 |
| `schema/progress.v1.json` (modify)                                                          | `summary` and the partial rule                                                        | 2           |
| `app/portfolio/domain/types.ts`, `validate.ts` (modify)                                     | `goal` on a project; required with `repo`                                             | 3           |
| `app/portfolio/content/projects.ts` (modify)                                                | Goal drafts; Bezl loses its Source link; briefs state outcomes, not measurements      | 3, 4, 4b    |
| `app/tome/copy.ts` (modify)                                                                 | The book's Bezl note states outcomes, not measurements                                | 4b          |
| `app/portfolio/domain/activity.ts` (modify)                                                 | `activityWeeks(days)` reshapes 84 days; `commitGroups` removed                        | 5, 6        |
| `app/portfolio/domain/fixtures.ts` (modify)                                                 | `days()`, `publicEntry()`, `publicProgress()` builders                                | 6, 7        |
| `app/site/components/Activity.tsx` (modify)                                                 | The 12-week grid from `days` only                                                     | 6           |
| `app/site/components/Journey.tsx` (create)                                                  | "Where it stands": goal, step line, counts, Next, as of, quiet                        | 7           |
| `app/site/components/anchor.ts` (modify)                                                    | `idFromHash()`                                                                        | 8           |
| `app/site/components/FullRecord.tsx` (create)                                               | "The full record": rows, earlier lines, activity, open on hash                        | 8           |
| `app/test/setup.ts` (modify)                                                                | `scrollIntoView` no-op for jsdom                                                      | 8           |
| `app/site/pages/ProjectPage.tsx` (modify)                                                   | Header, Journey, Brief, FullRecord                                                    | 9, 10       |
| `app/site/components/Ledger.tsx`, `LedgerEntry.tsx`, `Ledger.test.tsx`                      | Deleted                                                                               | 9           |
| `app/styles/site.css`, `app/styles/tokens.css` (modify)                                     | Journey, mark and record styles in; ledger, entry and commit-list styles out          | 6, 7, 8, 9  |
| `app/portfolio/progress/load.ts` (modify)                                                   | Accepts only `PublicProgress`                                                         | 10          |
| `app/portfolio/progress/fixture-progress.ts` (modify)                                       | Fixtures checked, then `toPublic`, then loaded                                        | 10          |
| `app/site/site.ts`, `site-context.tsx`, `progress-data.ts`, `app/entry-server.tsx` (modify) | `PublicProgress` types                                                                | 10          |
| `scripts/progress-fetch.ts` (modify)                                                        | Writes `toPublic(...)`; picks the token                                               | 10, 11      |
| `app/portfolio/progress/fetch.ts` (modify)                                                  | Private repos, `chooseToken`, 404/401 messages, 84-day window, `checkProgress` export | 10, 11      |
| `tests/e2e/smoke.spec.ts` (modify)                                                          | Page order, closed record, open on hash, leak scan                                    | 9, 10       |
| `.github/workflows/ci.yml` (modify)                                                         | `PROGRESS_TOKEN` env on the build                                                     | 12          |
| `docs/content.md`, `docs/architecture.md`, `docs/deploying.md` (modify)                     | Docs                                                                                  | 13          |
| `../spec-progress-ledger/docs/superpowers/plans/2026-10-22-progress-ledger-1b.md`           | Plan 1b uses `PublicProgress` and `STATUS_WORD`                                       | 14          |

---

### Task 0: Confirm the branch, signing and a green baseline

**Files:** none changed.

- [ ] **Step 1: Confirm the worktree and branch**

```bash
cd /Users/khallil/proj/kcb.pro/.claude/worktrees/feat-progress-ledger-1a
git status --short
git rev-parse --abbrev-ref HEAD
git fetch https://github.com/KhallilB/kcb.pro.git feat/progress-ledger
git rev-parse --short HEAD FETCH_HEAD
```

Expected: no output from `git status --short`; branch `feat/progress-ledger`; both hashes `c2e5fb1`. If `FETCH_HEAD` is ahead, stop and ask the owner: someone pushed to #131.

- [ ] **Step 2: Confirm signing and GitHub access**

```bash
git config user.name; git config user.email
git config commit.gpgSign; git config gpg.format; git config user.signingkey
gh api repos/KhallilB/kcb.pro --jq .full_name
gh pr view 131 --repo KhallilB/kcb.pro --json state,headRefName --jq '.state + " " + .headRefName'
```

Expected: a name and email; `true`; `ssh`; a key path or key; `KhallilB/kcb.pro`; `OPEN feat/progress-ledger`. If any check fails, fix the identity, signing or `gh auth` before going on; if it cannot be fixed, stop and ask. Do not commit without it.

- [ ] **Step 3: Run the gate on the untouched branch**

Run the gate (see Conventions). Expected: all green. A failure here is a problem in the branch as it stands; fix it before changing anything.

---

### Task 1: Give kcb.pro's partial fixture entry a summary

The new rule (Task 2) rejects a `partial` entry with no `summary`. The offline fixtures must comply first. Unknown fields are allowed today, so this is valid now.

**Files:**

- Modify: `app/portfolio/progress/fixtures/bezl.json`
- Test: `app/portfolio/progress/fixture-progress.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside `describe('offline fixtures', ...)` in `app/portfolio/progress/fixture-progress.test.ts`:

```ts
it('give every partial entry a summary', () => {
  const partial = Object.values(fixtureProgress).flatMap((p) =>
    p.file.entries.filter((e) => e.result === 'partial')
  )
  expect(partial.map((e) => e.id)).toEqual(['2026-10-20-pty-throughput'])
  expect(partial.every((e) => 'summary' in e)).toBe(true)
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/progress/fixture-progress.test.ts`
Expected: FAIL in `give every partial entry a summary`: `expected false to be true`.

- [ ] **Step 3: Add the summary**

In `app/portfolio/progress/fixtures/bezl.json`, in the `2026-10-20-pty-throughput` entry, add a line right after `"result": "partial",`:

```json
        "summary": "No bytes lost and typing keeps up; memory runs high, so two tighter limits come next.",
```

The sentence is public copy: it must not quote the pass mark, a measured label or value, or an evidence path (Task 10's leak scan checks some of these).

- [ ] **Step 4: Run it and see it pass**

Run: `npx vitest run --config vitest.config.ts app/portfolio/progress/fixture-progress.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the gate, then commit**

```bash
git add app/portfolio/progress/fixtures/bezl.json app/portfolio/progress/fixture-progress.test.ts
git commit -S -m "test(progress): give the partial fixture entry a summary"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 2: The `summary` contract: one line, required on `partial`

**Files:**

- Create: `app/portfolio/domain/text.ts`, `app/portfolio/domain/text.test.ts`
- Modify: `app/portfolio/domain/progress.ts`, `schema/progress.v1.json`
- Test: `app/portfolio/domain/progress.test.ts`, `app/portfolio/progress/schema.test.ts`

- [ ] **Step 1: Check the live files before adding the rule**

```bash
for repo in KhallilB/bezl KhallilB/kbui; do
  gh api "repos/$repo/contents/progress.json" -H 'Accept: application/vnd.github.raw+json' \
    | jq -r --arg repo "$repo" '.entries[] | select(.result == "partial")
        | (.summary // "") as $s
        | ($s | gsub("^\\s+|\\s+$"; "") | length) as $n
        | "\($repo) \(.id): \(if $n >= 1 and $n <= 140 and ($s | test("[\\n\\r]") | not) then "ok" else "MISSING OR TOO LONG" end)"'
done
```

Expected: every printed line ends in `ok` (no lines at all is also fine: no partial entries). If any line says `MISSING OR TOO LONG`, **stop**: the summary PRs in Bezl or kbui have not merged yet, and this task's online build would fail by design. Tell the owner which entry.

- [ ] **Step 2: Write the failing test for the one-line rule**

Create `app/portfolio/domain/text.test.ts`:

```ts
import { isShortLine } from './text'

describe('isShortLine', () => {
  it.each([
    ['a short sentence', 'Done.', true],
    ['140 characters', 'x'.repeat(140), true],
    ['140 characters inside padding', `  ${'x'.repeat(140)}  `, true],
    ['141 characters', 'x'.repeat(141), false],
    ['140 emoji, counted as characters', '🙂'.repeat(140), true],
    ['blank', '   ', false],
    ['empty', '', false],
    ['a line feed', 'a\nb', false],
    ['a carriage return', 'a\rb', false],
    ['a trailing line feed', 'Done.\n', false],
    ['not a string', 5, false],
  ])('%s', (_name, text, ok) => {
    expect(isShortLine(text)).toBe(ok)
  })
})
```

- [ ] **Step 3: Run it and see it fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/text.test.ts`
Expected: FAIL: `Failed to resolve import "./text"`.

- [ ] **Step 4: Write the rule**

Create `app/portfolio/domain/text.ts`:

```ts
export const SHORT_LINE_MAX = 140

// Counts code points after trimming, as the schema's pattern does; any line break fails.
export function isShortLine(text: unknown): text is string {
  if (typeof text !== 'string' || /[\n\r]/.test(text)) return false
  const length = [...text.trim()].length
  return length >= 1 && length <= SHORT_LINE_MAX
}
```

Run: `bunx prettier --write app/portfolio/domain/text.ts app/portfolio/domain/text.test.ts`

Run the test again. Expected: PASS (11 tests).

- [ ] **Step 5: Write the failing contract tests**

In `app/portfolio/domain/progress.test.ts`, append inside `describe('validateProgress', ...)` (before its closing `})`):

```ts
it('requires a summary on a partial entry', () => {
  expect(check([entry({ result: 'partial' })])).toEqual([
    `${at} is partial, so it needs a summary of what works and what is left`,
  ])
  expect(
    check([entry({ result: 'partial', summary: 'Works; memory is next.' })])
  ).toEqual([])
})

it('accepts a summary on any result, padded or not', () => {
  expect(check([entry({ summary: '  Holds up.  ' })])).toEqual([])
})

it.each(['  ', 'x'.repeat(141), 'a\nb', 'a\rb', 5])(
  'refuses the summary %j',
  (summary) => {
    expect(check([entry({ summary: summary as unknown as string })])).toEqual([
      `${at} needs a summary of one line, 1 to 140 characters`,
    ])
  }
)

it('reports one problem for a partial entry with a blank summary', () => {
  expect(check([entry({ result: 'partial', summary: ' ' })])).toEqual([
    `${at} needs a summary of one line, 1 to 140 characters`,
  ])
})
```

- [ ] **Step 6: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/progress.test.ts`
Expected: FAIL in the four new tests: the arrays are empty where an error is expected.

- [ ] **Step 7: Add `summary` to the contract**

In `app/portfolio/domain/progress.ts`:

1. Add after the `dates` import: `import { isShortLine } from './text'`
2. In `interface ProgressEntry`, after `result: ProgressResult`, add:

```ts
  // One line on what works and what is left; required when partial.
  summary?: string
```

3. In `entryErrors`, right after the `if (!isOneOf(PROGRESS_RESULTS, e.result)) { ... }` block, add:

```ts
if (e.summary !== undefined && !isShortLine(e.summary)) {
  errors.push(`${where} needs a summary of one line, 1 to 140 characters`)
} else if (e.summary === undefined && e.result === 'partial') {
  errors.push(
    `${where} is partial, so it needs a summary of what works and what is left`
  )
}
```

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/progress.test.ts`
Expected: PASS.

- [ ] **Step 8: Write the failing schema corpus rows**

In `app/portfolio/progress/schema.test.ts`, append these rows at the end of the `corpus` array, just before its closing `]`:

```ts
  [
    'partial with a summary',
    file(release({ result: 'partial', summary: 'Runs; one limit left.' })),
    true,
  ],
  ['partial without a summary', file(release({ result: 'partial' })), false],
  [
    'partial with a blank summary',
    file(release({ result: 'partial', summary: ' ' })),
    false,
  ],
  ['pass with a summary', file(release({ summary: 'Done and shipped.' })), true],
  ['summary padded with spaces', file(release({ summary: '  Done.  ' })), true],
  [
    'summary of 140 characters',
    file(release({ summary: 'x'.repeat(140) })),
    true,
  ],
  [
    'summary of 140 characters inside padding',
    file(release({ summary: ` ${'x'.repeat(140)} ` })),
    true,
  ],
  [
    'summary of 141 characters',
    file(release({ summary: 'x'.repeat(141) })),
    false,
  ],
  [
    'summary of 140 emoji',
    file(release({ summary: '🙂'.repeat(140) })),
    true,
  ],
  ['blank summary', file(release({ summary: '  ' })), false],
  ['summary with a line feed', file(release({ summary: 'a\nb' })), false],
  [
    'summary with a carriage return',
    file(release({ summary: 'a\rb' })),
    false,
  ],
  [
    'summary ending in a line feed',
    file(release({ summary: 'Done.\n' })),
    false,
  ],
  ['summary that is not a string', file(release({ summary: 5 })), false],
```

- [ ] **Step 9: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/progress/schema.test.ts`
Expected: FAIL on the Ajv side (`expect(accepts(doc)).toBe(ok)`) for `partial without a summary`, `partial with a blank summary`, `summary of 141 characters`, `blank summary`, `summary with a line feed`, `summary with a carriage return`, `summary ending in a line feed` and `summary that is not a string`: the schema still accepts them.

- [ ] **Step 10: Add `summary` to the schema**

In `schema/progress.v1.json`, inside `definitions.entry.properties`, add after the `"result"` property:

```json
        "summary": {
          "description": "One line on what works and what is left: 1 to 140 characters once trimmed, no line breaks. Required when result is partial.",
          "type": "string",
          "pattern": "^[^\\S\\n\\r]*\\S(?:[^\\n\\r]{0,138}\\S)?[^\\S\\n\\r]*$"
        },
```

and add this object as the first item of `definitions.entry.allOf`:

```json
        {
          "if": { "properties": { "result": { "const": "partial" } } },
          "then": { "required": ["summary"] }
        },
```

The pattern reads: optional spaces (no line breaks), then 1 to 140 characters starting and ending with a non-space and holding no line break, then optional spaces. Ajv compiles patterns with the `u` flag, so it counts code points, as `isShortLine` does.

Run: `npx vitest run --config vitest.config.ts app/portfolio/progress/schema.test.ts`
Expected: PASS.

- [ ] **Step 11: Build against the live files**

Run the online build (see Conventions) with `GITHUB_TOKEN=$(gh auth token)`.
Expected: `Progress from GitHub for bezl, kbui as of …` and `Prerendered …`, exit 0. A `needs a summary` error here means Step 1 was skipped or a file changed since; stop and tell the owner.

- [ ] **Step 12: Run the gate, then commit**

```bash
git add app/portfolio/domain/text.ts app/portfolio/domain/text.test.ts app/portfolio/domain/progress.ts app/portfolio/domain/progress.test.ts schema/progress.v1.json app/portfolio/progress/schema.test.ts
git commit -S -m "feat(progress): a one-line summary, required on partial entries"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 3: A goal sentence on every project with a repo

**Files:**

- Modify: `app/portfolio/domain/types.ts`, `app/portfolio/domain/validate.ts`, `app/portfolio/content/projects.ts`
- Test: `app/portfolio/domain/validate.test.ts`

- [ ] **Step 1: Write the failing tests**

In `app/portfolio/domain/validate.test.ts`, replace the existing `accepts a repo named owner/name` test with:

```ts
it('accepts a repo named owner/name with a goal', () => {
  expect(
    validateCatalog(
      catalog([project({ repo: 'KhallilB/bezl', goal: 'One clear aim.' })])
    )
  ).toEqual([])
})

it('refuses a repo with no goal sentence', () => {
  const errors = validateCatalog(catalog([project({ repo: 'KhallilB/bezl' })]))
  expect(errors).toContain('"alpha" has a repo, so it needs a goal sentence')
})

it.each(['  ', 'x'.repeat(141), 'One aim.\nAnother.'])(
  'refuses the goal %j',
  (goal) => {
    const errors = validateCatalog(
      catalog([project({ repo: 'KhallilB/bezl', goal })])
    )
    expect(errors).toEqual([
      '"alpha" needs a goal of one line, 1 to 140 characters',
    ])
  }
)

it('finds placeholder text in the goal', () => {
  const errors = validateCatalog(
    catalog([project({ repo: 'KhallilB/bezl', goal: 'TBD' })])
  )
  expect(errors.join('\n')).toMatch(/placeholder/i)
})

it('lets a project with no repo go without a goal', () => {
  expect(validateCatalog(catalog([project()]))).toEqual([])
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/validate.test.ts`
Expected: FAIL in `refuses a repo with no goal sentence`, the three `refuses the goal` cases and `finds placeholder text in the goal`. TypeScript does not run in Vitest, so the unknown `goal` key is not an error yet.

- [ ] **Step 3: Add the field and the rule**

In `app/portfolio/domain/types.ts`, in `interface Project`, after the `repo?: string` line:

```ts
  // Where the project is heading, in one sentence; required with repo.
  goal?: string
```

In `app/portfolio/domain/validate.ts`:

1. Add `import { isShortLine } from './text'` after the `./types` import.
2. In the project loop, change the `texts([...])` call's field list to include the goal right after `p.summary`:

```ts
const words = texts(
  [
    p.title,
    p.summary,
    p.goal,
    p.about,
    p.role,
    p.domain,
    p.signature,
    ...p.stack,
  ],
  p.brief
)
```

3. After the `if (p.repo !== undefined && !REPO.test(p.repo)) { ... }` block, add:

```ts
if (p.repo !== undefined && p.goal === undefined) {
  errors.push(`"${p.slug}" has a repo, so it needs a goal sentence`)
} else if (p.goal !== undefined && !isShortLine(p.goal)) {
  errors.push(`"${p.slug}" needs a goal of one line, 1 to 140 characters`)
}
```

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/validate.test.ts`
Expected: PASS.

- [ ] **Step 4: See the content fail the new rule**

Run: `npx vitest run --config vitest.config.ts app/portfolio/content/content.test.ts`
Expected: FAIL in `passes every catalog rule, hidden entries included`, listing `"bezl" has a repo, so it needs a goal sentence` and `"kbui" has a repo, so it needs a goal sentence`.

- [ ] **Step 5: Add the owner's draft goals**

In `app/portfolio/content/projects.ts`, add `goal` right after `repo` in each project:

```ts
    repo: 'KhallilB/bezl',
    goal: 'One window that runs AI coding assistants side by side, with one writer per task.',
```

```ts
    repo: 'KhallilB/kbui',
    goal: 'One design system every project shares, with the rules checked by the build.',
```

These are drafts from the spec for the owner to edit; any edit must stay one line of 1 to 140 characters.

Run: `npx vitest run --config vitest.config.ts app/portfolio/content/content.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the gate, then commit**

```bash
git add app/portfolio/domain/types.ts app/portfolio/domain/validate.ts app/portfolio/domain/validate.test.ts app/portfolio/content/projects.ts
git commit -S -m "feat(content): a goal sentence for every project with a repo"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 4: Drop Bezl's Source link before its repository goes private

**Files:**

- Modify: `app/portfolio/content/projects.ts`
- Test: `app/site/pages.test.tsx`

- [ ] **Step 1: Write the failing test**

In `app/site/pages.test.tsx`, replace the `it.each([...])('links %s to its public source', ...)` test with:

```tsx
it('links kbui to its public source', () => {
  visit('/work/kbui')
  expect(
    within(screen.getByRole('main')).getByRole('link', { name: /Source/ })
  ).toHaveAttribute('href', 'https://github.com/KhallilB/kbui')
})

it('offers no Source link for Bezl, whose repository goes private', () => {
  visit('/work/bezl')
  expect(
    within(screen.getByRole('main')).queryByRole('link', { name: /Source/ })
  ).toBeNull()
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run --config vitest.config.ts app/site/pages.test.tsx`
Expected: FAIL in `offers no Source link for Bezl…`: the link is found.

- [ ] **Step 3: Remove the link**

In `app/portfolio/content/projects.ts`, in the Bezl entry, change

```ts
    links: [{ label: 'Source', href: 'https://github.com/KhallilB/bezl' }],
```

to

```ts
    links: [],
```

Run: `npx vitest run --config vitest.config.ts app/site/pages.test.tsx`
Expected: PASS.

- [ ] **Step 4: Run the gate, then commit**

```bash
git add app/portfolio/content/projects.ts app/site/pages.test.tsx
git commit -S -m "content: drop Bezl's Source link before the repository goes private"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 4b: Outcomes, not measurements, in the Bezl and kbui copy

The owner chose to keep test numbers out of the public copy too. Bezl's "What is proven so far" quotes measurements (20 MB, 2 ms, 300/150/600 MB, a Zig version), kbui's "How it stays honest" quotes test counts, and the book's Bezl note repeats two of them. They are rewritten as plain outcomes, consistent with the summaries now live in KhallilB/bezl `progress.json`. Headings stay.

**Files:**

- Modify: `app/portfolio/content/projects.ts`, `app/tome/copy.ts`
- Test: `app/portfolio/content/content.test.ts`, `app/tome/copy.test.ts`

- [ ] **Step 1: Read the live summaries the copy must agree with**

```bash
gh api repos/KhallilB/bezl/contents/progress.json -H 'Accept: application/vnd.github.raw+json' \
  | jq -r '.entries[] | "\(.result)\t\(.title)\t\(.summary // "")"'
```

Expected (as of 2026-10-22): `partial` Terminal output into the window ("No terminal output is lost and typing echoes instantly; memory during heavy bursts is still above the target."); `pass` for Ghostty's engine ("builds quickly and captures an accurate text snapshot of a live vim screen") and the Codex reviewer ("stopped by the operating system when it tries to change a file, and says so"); `not-run` for the Claude Code and Gemini CLI reviewers and the memory trip-wires. If the live summaries now say something different, adjust the sentences in Step 5 to agree with them, keeping them free of numbers.

- [ ] **Step 2: Write the failing content test**

Append inside `describe('published content', ...)` in `app/portfolio/content/content.test.ts`:

```ts
// Outcomes only: test numbers stay in each project's own record.
it.each(['bezl', 'kbui'])('keeps measurements out of the %s copy', (slug) => {
  const p = content.projects.find((project) => project.slug === slug)!
  const text = [
    p.summary,
    p.about,
    p.goal,
    ...p.brief.flatMap((s) => [s.heading, ...s.body]),
  ].join('\n')
  expect(text).not.toMatch(/\d\s?(ms|MB|GB|KiB|MiB)\b/)
  for (const phrase of [
    'Zig',
    'pass mark',
    '28 component tests',
    '16 stories',
  ]) {
    expect(text).not.toContain(phrase)
  }
})
```

- [ ] **Step 3: Write the failing book test**

Append inside `describe('tome data', ...)` in `app/tome/copy.test.ts` (it already has the `strings()` helper):

```ts
it('keeps measurements out of the chapters', () => {
  const text = strings(data.chapters).join('\n')
  expect(text).not.toMatch(/\d\s?(ms|MB|GB|KiB|MiB)\b/)
  expect(text).not.toContain('Zig')
})
```

- [ ] **Step 4: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/content/content.test.ts app/tome/copy.test.ts`
Expected: FAIL in `keeps measurements out of the bezl copy` (matches `20 MB`), `keeps measurements out of the kbui copy` (contains `28 component tests`) and `keeps measurements out of the chapters` (matches `20 MB`).

- [ ] **Step 5: Rewrite the copy**

In `app/portfolio/content/projects.ts`, in Bezl's brief, replace the four paragraphs of the `What is proven so far` section's `body` with:

```ts
        body: [
          'Three short experiments ran on 22 Oct 2026, each with what would count as success decided before it started.',
          'Terminal output reaches the window with nothing lost, and typing echoes instantly. Memory during heavy bursts is still above the target, so the real terminal now has two memory limits to meet: one at rest and one during heavy output.',
          'Ghostty’s terminal engine builds quickly and captures an accurate text snapshot of a live vim screen. For now it builds with only one release of its compiler.',
          'A Codex reviewer was stopped by the operating system when it tried to change a file, and said so. The same check for Claude Code and Gemini CLI has not run yet.',
        ],
```

In kbui's brief, in the `How it stays honest` section, change the last sentence `The last recorded run passed all 28 component tests and all 16 stories.` to `The last recorded run passed every component test and every story.` (the rest of the paragraph is unchanged).

In `app/tome/copy.ts`, in the Bezl chapter's `Proven so far` note, replace

```ts
            'Three terminals took a 20 MB stream each with no bytes lost and 2 ms typing latency. Memory is the open question.',
```

with

```ts
            'Terminal output reaches the window with nothing lost, and typing echoes instantly. Memory is the open question.',
```

(105 characters, inside the 190-character note limit that `copy.test.ts` enforces.)

- [ ] **Step 6: Run them and see them pass**

Run: `npx vitest run --config vitest.config.ts app/portfolio/content app/tome app/site`
Expected: PASS. `app/site/pages.test.tsx` still finds the `What is proven so far` heading, and the home and work-index tests still find their `about` text, which did not change.

- [ ] **Step 7: Check nothing else quotes the old numbers**

```bash
grep -rnE --exclude-dir=fixtures "20 MB|2 ms typing|300 MB limit|150 MB|600 MB|Zig 0\.15|28 component tests|16 stories" app tests README.md
```

Expected: no output. Before this step it matches exactly `app/tome/copy.ts:117` and `app/portfolio/content/projects.ts` lines 77, 78 and 131. The offline fixtures are excluded on purpose: their private `passMark` and `measured` values hold numbers that are never shipped, and Task 10's leak scan guards them.

- [ ] **Step 8: Run the gate, then commit**

```bash
git add app/portfolio/content/projects.ts app/portfolio/content/content.test.ts app/tome/copy.ts app/tome/copy.test.ts
git commit -S -m "content: outcomes, not measurements, in the Bezl and kbui copy"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 5: The public shape, `toPublic`, `STATUS_WORD` and the journey order

Domain only; nothing renders these yet.

**Files:**

- Modify: `app/portfolio/domain/progress.ts`, `app/portfolio/domain/activity.ts`
- Test: `app/portfolio/domain/progress.test.ts`

- [ ] **Step 1: Write the failing tests**

In `app/portfolio/domain/progress.test.ts`:

1. Add to the import list from `./progress`: `earlierEntries`, `journeySteps`, `nextStep`, `STATUS_ORDER`, `STATUS_WORD`, `toPublic`, and `type ProjectProgress`.
2. Add `import { addDays } from './dates'` after the `./fixtures` import.
3. Append at the end of the file:

```ts
describe('toPublic', () => {
  const full = (): ProjectProgress => ({
    file: progressFile([
      entry({ id: 'b', summary: '  Mostly there.  ' }),
      entry({ id: 'a', subject: 'other' }),
    ]),
    commits: [
      commit({ date: '2026-10-21' }),
      commit({ sha: 'bbbbbbb', date: '2026-10-21' }),
      commit({ sha: 'ccccccc', date: '2026-07-30' }),
      commit({ sha: 'ddddddd', date: '2026-07-29' }),
      commit({ sha: 'eeeeeee', date: '2026-10-22' }),
    ],
  })

  it('keeps exactly the public fields, in file order, with the summary trimmed', () => {
    expect(toPublic(full(), day).entries).toEqual([
      {
        id: 'b',
        subject: 'alpha',
        date: '2026-10-20',
        title: 'Alpha holds up',
        result: 'pass',
        summary: 'Mostly there.',
      },
      {
        id: 'a',
        subject: 'other',
        date: '2026-10-20',
        title: 'Alpha holds up',
        result: 'pass',
      },
    ])
    expect(Object.keys(toPublic(full(), day).entries[1])).toEqual([
      'id',
      'subject',
      'date',
      'title',
      'result',
    ])
  })

  it('counts commits per day for the 84 consecutive days ending on the build day', () => {
    const { days } = toPublic(full(), day)
    expect(days).toHaveLength(84)
    expect(days[0]).toEqual({ day: '2026-07-30', count: 1 })
    expect(days.at(-1)).toEqual({ day: '2026-10-21', count: 2 })
    expect(
      days.every((d, i) => i === 0 || d.day === addDays(days[i - 1].day, 1))
    ).toBe(true)
    expect(days.reduce((sum, d) => sum + d.count, 0)).toBe(3)
  })

  it('ships no pass mark, measurement, evidence, kind or commit detail', () => {
    expect(Object.keys(toPublic(full(), day))).toEqual(['entries', 'days'])
    expect(JSON.stringify(toPublic(full(), day))).not.toMatch(
      /Under 100 ms|Median|40 ms|RESULT\.md|experiment|01e47db|feat: add alpha|github\.com/
    )
  })
})

describe('status words', () => {
  it('words every result plainly', () => {
    expect(PROGRESS_RESULTS.map((r) => STATUS_WORD[r])).toEqual([
      'Done',
      'In progress',
      'Rethinking',
      'Up next',
    ])
  })

  it('orders groups Done, In progress, Up next, Rethinking', () => {
    expect(STATUS_ORDER).toEqual(['pass', 'partial', 'not-run', 'fail'])
  })
})

describe('journeySteps', () => {
  it('groups current steps by status, then oldest first, then file order', () => {
    const entries = [
      entry({ id: 'f', subject: 'f', date: '2026-10-01', result: 'fail' }),
      entry({ id: 'n2', subject: 'n2', date: '2026-10-05', result: 'not-run' }),
      entry({
        id: 'p',
        subject: 'p',
        date: '2026-10-03',
        result: 'partial',
        summary: 'Half.',
      }),
      entry({ id: 'd2', subject: 'd2', date: '2026-10-04' }),
      entry({ id: 'n1', subject: 'n1', date: '2026-10-02', result: 'not-run' }),
      entry({ id: 'd1', subject: 'd1', date: '2026-10-04' }),
      entry({ id: 'd0', subject: 'd0', date: '2026-10-02' }),
    ]
    expect(journeySteps(entries, day).map((e) => e.id)).toEqual([
      'd0',
      'd2',
      'd1',
      'p',
      'n1',
      'n2',
      'f',
    ])
  })

  it('shows each subject once, at its latest entry on or before the day', () => {
    const entries = [
      entry({ id: 'a1', subject: 'a', date: '2026-10-01', result: 'fail' }),
      entry({ id: 'a2', subject: 'a', date: '2026-10-10' }),
      entry({ id: 'b1', subject: 'b', date: '2026-10-22', result: 'not-run' }),
    ]
    expect(journeySteps(entries, day).map((e) => e.id)).toEqual(['a2'])
  })
})

describe('nextStep', () => {
  it('is the first Up next step', () => {
    const steps = [
      entry({ id: 'p', result: 'partial' }),
      entry({ id: 'n1', result: 'not-run' }),
      entry({ id: 'n2', result: 'not-run' }),
    ]
    expect(nextStep(steps)?.id).toBe('n1')
  })

  it('falls back to the first In progress step', () => {
    const steps = [
      entry({ id: 'd' }),
      entry({ id: 'p1', result: 'partial' }),
      entry({ id: 'p2', result: 'partial' }),
    ]
    expect(nextStep(steps)?.id).toBe('p1')
  })

  it('is nothing when every step is done or being rethought', () => {
    expect(
      nextStep([entry({ id: 'd' }), entry({ id: 'f', result: 'fail' })])
    ).toBeUndefined()
  })
})

describe('earlierEntries', () => {
  it('lists the step’s superseded entries newest first, up to the day', () => {
    const entries = [
      entry({ id: 'a1', subject: 'a', date: '2026-10-01', result: 'fail' }),
      entry({ id: 'b1', subject: 'b', date: '2026-10-02' }),
      entry({
        id: 'a2',
        subject: 'a',
        date: '2026-10-05',
        result: 'partial',
        summary: 'x',
      }),
      entry({ id: 'a3', subject: 'a', date: '2026-10-05' }),
      entry({ id: 'a4', subject: 'a', date: '2026-10-30' }),
    ]
    const [step] = journeySteps(entries, day).filter((e) => e.subject === 'a')
    expect(step.id).toBe('a3')
    expect(earlierEntries(entries, step, day).map((e) => e.id)).toEqual([
      'a2',
      'a1',
    ])
  })
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/progress.test.ts`
Expected: FAIL in every new describe: `toPublic is not a function`, `Cannot read properties of undefined` for `STATUS_WORD`, and so on.

- [ ] **Step 3: Implement**

In `app/portfolio/domain/progress.ts`:

1. Change the first import to `import { addDays, daysBetween, isIsoDay } from './dates'`.
2. After `export type ProjectProgress = { file: ProgressFile; commits: Commit[] }`, add:

```ts
// Commit days a page shows: 12 weeks ending on the build day.
export const ACTIVITY_DAYS = 84

export interface PublicEntry {
  id: string
  subject: string
  date: IsoDay
  title: string
  result: ProgressResult
  summary?: string
}

export interface DayCount {
  day: IsoDay
  count: number
}

// All a page may ship: outcomes and daily commit counts.
export interface PublicProgress {
  entries: PublicEntry[]
  days: DayCount[]
}

// Fields are picked by name, so a new contract field stays private until listed here.
export function toPublic(
  full: ProjectProgress,
  buildDay: IsoDay
): PublicProgress {
  const counts = new Map<IsoDay, number>()
  for (const c of full.commits)
    counts.set(c.date, (counts.get(c.date) ?? 0) + 1)
  return {
    entries: full.file.entries.map(
      ({ id, subject, date, title, result, summary }) => ({
        id,
        subject,
        date,
        title,
        result,
        ...(summary === undefined ? {} : { summary: summary.trim() }),
      })
    ),
    days: Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
      const day = addDays(buildDay, i + 1 - ACTIVITY_DAYS)
      return { day, count: counts.get(day) ?? 0 }
    }),
  }
}
```

3. Make the derived views accept public entries. Replace the signatures (bodies unchanged):

```ts
export function current<E extends PublicEntry>(entries: E[], day: IsoDay): E[] {
```

```ts
export function progressCounts(
  entries: PublicEntry[],
  day: IsoDay
): ProgressCounts {
```

```ts
export function overallSeal(
  entries: PublicEntry[],
  day: IsoDay
): ProgressResult | null {
```

```ts
export function quietSince(
  entries: PublicEntry[],
  day: IsoDay
): IsoDay | null {
```

4. After `quietSince`, add:

```ts
export const STATUS_WORD: Record<ProgressResult, string> = {
  pass: 'Done',
  partial: 'In progress',
  'not-run': 'Up next',
  fail: 'Rethinking',
}

// Group order on every progress view.
export const STATUS_ORDER: readonly ProgressResult[] = [
  'pass',
  'partial',
  'not-run',
  'fail',
]

// Current step per subject: by status group, then oldest first, then file order.
export function journeySteps<E extends PublicEntry>(
  entries: E[],
  day: IsoDay
): E[] {
  const group = (e: E) => STATUS_ORDER.indexOf(e.result)
  return current(entries, day)
    .map((entry) => ({ entry, index: entries.indexOf(entry) }))
    .sort(
      (a, b) =>
        group(a.entry) - group(b.entry) ||
        a.entry.date.localeCompare(b.entry.date) ||
        a.index - b.index
    )
    .map(({ entry }) => entry)
}

// First Up next step, else the first In progress one.
export function nextStep<E extends PublicEntry>(steps: E[]): E | undefined {
  return (
    steps.find((s) => s.result === 'not-run') ??
    steps.find((s) => s.result === 'partial')
  )
}

// A step's superseded entries, newest first; a later same-day entry comes first.
export function earlierEntries<E extends PublicEntry>(
  entries: E[],
  step: E,
  day: IsoDay
): E[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(
      ({ entry }) =>
        entry.subject === step.subject && entry !== step && entry.date <= day
    )
    .sort(
      (a, b) => b.entry.date.localeCompare(a.entry.date) || b.index - a.index
    )
    .map(({ entry }) => entry)
}
```

In `app/portfolio/domain/activity.ts`, delete the local `export interface DayCount { … }` and change the progress import to:

```ts
import {
  COMMIT_TYPES,
  type Commit,
  type CommitType,
  type DayCount,
} from './progress'
```

(`DayCount` now lives in `progress.ts`; `activity.ts` keeps using it.)

- [ ] **Step 4: Run them and see them pass**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain`
Expected: PASS for every file in `app/portfolio/domain`.

- [ ] **Step 5: Run the gate, then commit**

```bash
git add app/portfolio/domain/progress.ts app/portfolio/domain/progress.test.ts app/portfolio/domain/activity.ts
git commit -S -m "feat(progress): the public shape, status words and journey order"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 6: Activity from daily counts only

Removes the commit-type list, "Recent commits, last 90 days" and "All commits on GitHub". The grid reads `days`; until Task 10 the ledger computes them with `toPublic`.

**Files:**

- Modify: `app/portfolio/domain/activity.ts`, `app/portfolio/domain/fixtures.ts`, `app/site/components/Activity.tsx`, `app/site/components/Ledger.tsx`, `app/styles/site.css`
- Test: `app/portfolio/domain/activity.test.ts`, `app/site/components/Activity.test.tsx`, `app/site/pages.test.tsx`

- [ ] **Step 1: Write the failing domain test**

Replace the whole of `app/portfolio/domain/activity.test.ts` with:

```ts
import { activityWeeks, classifyCommit } from './activity'
import { days } from './fixtures'

describe('classifyCommit', () => {
  it.each([
    ['feat(ui): add the Control Room', 'feat'],
    ['fix: stop the flicker', 'fix'],
    ['docs(spec): progress ledger', 'docs'],
    ['test(react): enforce story and test', 'test'],
    ['refactor!: rename Facet', 'refactor'],
    ['chore(main): release 0.1.0', 'chore'],
    ['build(deps): install kbui', 'other'],
    ['Merge pull request #3 from KhallilB/x', 'other'],
    ['content: link Bezl', 'other'],
    ['Feat: add the thing', 'feat'],
    ['FIX(ui)!: stop the flicker', 'fix'],
    ['Docs: tidy', 'docs'],
    ['feat(api)!: drop v1', 'feat'],
  ])('reads "%s" as %s', (subject, type) => {
    expect(classifyCommit(subject)).toBe(type)
  })
})

describe('activityWeeks', () => {
  it('lays the 84 days out as twelve weeks, oldest first, ending on the build day', () => {
    const weeks = activityWeeks(days('2026-10-21'))
    expect(weeks).toHaveLength(12)
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks[0][0].day).toBe('2026-07-30')
    expect(weeks[11][6].day).toBe('2026-10-21')
  })

  it('keeps each day’s count in its cell', () => {
    const weeks = activityWeeks(
      days('2026-10-21', { '2026-07-30': 1, '2026-10-21': 2 })
    )
    expect(weeks[0][0].count).toBe(1)
    expect(weeks[11][6].count).toBe(2)
  })
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/activity.test.ts`
Expected: FAIL in both `activityWeeks` tests: `days is not a function`.

- [ ] **Step 3: Add the builder and reshape the grid**

In `app/portfolio/domain/fixtures.ts`, change the imports to:

```ts
import { addDays } from './dates'
import {
  ACTIVITY_DAYS,
  type Commit,
  type DayCount,
  type ProgressEntry,
  type ProgressFile,
} from './progress'
import type { Catalog, IsoDay, Project, Study } from './types'
```

and append:

```ts
// The days a page ships, ending on end; days not named count none.
export function days(
  end: IsoDay,
  counts: Record<IsoDay, number> = {}
): DayCount[] {
  return Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const day = addDays(end, i + 1 - ACTIVITY_DAYS)
    return { day, count: counts[day] ?? 0 }
  })
}
```

Replace the whole of `app/portfolio/domain/activity.ts` with:

```ts
import { COMMIT_TYPES, type CommitType, type DayCount } from './progress'

const PREFIX = /^(\w+)(?:\([^)]*\))?!?:/

export function classifyCommit(subject: string): CommitType {
  // Conventional Commits: types are case-insensitive.
  const type = PREFIX.exec(subject)?.[1]?.toLowerCase()
  return COMMIT_TYPES.includes(type as CommitType)
    ? (type as CommitType)
    : 'other'
}

// Columns of seven days, oldest first; the last day is the build day.
export function activityWeeks(days: DayCount[]): DayCount[][] {
  return Array.from({ length: Math.ceil(days.length / 7) }, (_, week) =>
    days.slice(week * 7, week * 7 + 7)
  )
}
```

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/activity.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing component tests**

Replace the whole of `app/site/components/Activity.test.tsx` with:

```tsx
import { render, screen, within } from '@testing-library/react'
import { days } from '@app/portfolio/domain/fixtures'
import type { IsoDay } from '@app/portfolio/domain/types'
import { SiteProvider } from '../site-context'
import { Activity } from './Activity'

function show(counts: Record<IsoDay, number> = {}) {
  return render(
    <SiteProvider asOf="2026-10-21">
      <Activity days={days('2026-10-21', counts)} />
    </SiteProvider>
  )
}

const region = () => screen.getByRole('region', { name: 'Activity' })

describe('Activity', () => {
  it('backs the commit squares with a table of days', () => {
    const { container } = show({ '2026-10-21': 2 })
    const table = screen.getByRole('table', {
      name: 'Commits per day for the 12 weeks to 21 Oct 2026: 2 commits on 1 day',
    })
    expect(container.querySelectorAll('td[data-level]')).toHaveLength(84)
    const wednesday = within(table)
      .getByRole('rowheader', { name: 'Wednesday' })
      .closest('tr') as HTMLElement
    const today = wednesday.querySelectorAll('td')[11]
    expect(today).toHaveTextContent('2')
    expect(today).toHaveAttribute('data-level', '2')
  })

  it('summarises the caption in singular and plural', () => {
    show({ '2026-10-21': 1 })
    expect(
      screen.getByRole('table', {
        name: 'Commits per day for the 12 weeks to 21 Oct 2026: 1 commit on 1 day',
      })
    ).toBeInTheDocument()
  })

  it('reads each square as a plain count, singular for one', () => {
    show({ '2026-10-20': 1, '2026-10-21': 2 })
    expect(screen.getByTitle('0 commits on 19 Oct 2026')).toBeInTheDocument()
    expect(screen.getByTitle('1 commit on 20 Oct 2026')).toBeInTheDocument()
    expect(screen.getByTitle('2 commits on 21 Oct 2026')).toBeInTheDocument()
  })

  it.each([
    ['15 Oct 2026', 0, '0'],
    ['16 Oct 2026', 1, '1'],
    ['17 Oct 2026', 3, '2'],
    ['18 Oct 2026', 4, '3'],
    ['19 Oct 2026', 6, '3'],
    ['20 Oct 2026', 7, '4'],
  ])('shades %s with %i commits as level %s', (label, count, level) => {
    show({ [`2026-10-${label.slice(0, 2)}`]: count })
    const cell = screen.getByTitle(
      `${count} ${count === 1 ? 'commit' : 'commits'} on ${label}`
    )
    expect(cell).toHaveAttribute('data-level', level)
  })

  it('states the total for the grid and a less-to-more legend', () => {
    const { container } = show({ '2026-10-20': 1, '2026-10-21': 1 })
    expect(region()).toHaveTextContent('2 commits in the last 12 weeks')
    expect(region()).toHaveTextContent('Less')
    expect(region()).toHaveTextContent('More')
    const swatches = container.querySelectorAll(
      '.activity__legend [data-level]'
    )
    expect(Array.from(swatches, (s) => s.getAttribute('data-level'))).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
    ])
    swatches.forEach((s) =>
      expect(s.closest('[aria-hidden="true"]')).not.toBeNull()
    )
  })

  it('says one commit in the singular', () => {
    show({ '2026-10-21': 1 })
    expect(region()).toHaveTextContent('1 commit in the last 12 weeks')
  })

  it('says so when nothing was committed', () => {
    show()
    expect(region()).toHaveTextContent('No commits in the last 12 weeks.')
    expect(region()).not.toHaveTextContent('0 commits in the last 12 weeks')
  })

  it('lists no commits and links nowhere', () => {
    show({ '2026-10-21': 3 })
    expect(within(region()).queryAllByRole('link')).toEqual([])
    expect(region()).not.toHaveTextContent('Recent commits')
  })
})
```

In `app/site/pages.test.tsx`, replace the `shows commit activity under the Bezl ledger` test with:

```tsx
it('shows commit activity under the Bezl ledger', () => {
  visit('/work/bezl')
  const activity = within(
    screen.getByRole('region', { name: 'Progress' })
  ).getByRole('region', { name: 'Activity' })
  expect(activity).toHaveTextContent('11 commits in the last 12 weeks')
  expect(within(activity).queryAllByRole('link')).toEqual([])
})
```

(The Bezl fixture has 11 commits, all on 2026-10-21.)

- [ ] **Step 5: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/site/components/Activity.test.tsx app/site/pages.test.tsx`
Expected: FAIL. `Activity` still reads `commits` (`commits is not iterable` or wrong totals), and the Bezl activity still holds commit links.

- [ ] **Step 6: Build the grid from days**

Replace the whole of `app/site/components/Activity.tsx` with:

```tsx
import { activityWeeks } from '@app/portfolio/domain/activity'
import { formatDay, formatWeekday } from '@app/portfolio/domain/dates'
import type { DayCount } from '@app/portfolio/domain/progress'
import { useSite } from '../site'

// Square shade: none, 1, 2–3, 4–6, 7 or more commits.
function level(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return count <= 6 ? 3 : 4
}

const LEVELS = [0, 1, 2, 3, 4]

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}

export function Activity({ days }: { days: DayCount[] }) {
  const { asOf } = useSite()
  const weeks = activityWeeks(days)
  const total = days.reduce((sum, d) => sum + d.count, 0)
  const active = days.filter((d) => d.count > 0).length

  return (
    <section className="activity" aria-labelledby="activity">
      <h3 id="activity" className="h3">
        Activity
      </h3>
      {total > 0 ? (
        <p className="activity__total">
          {plural(total, 'commit')} in the last 12 weeks
        </p>
      ) : (
        <p className="activity__empty">No commits in the last 12 weeks.</p>
      )}
      <table className="activity__grid">
        <caption className="sr-only">
          Commits per day for the 12 weeks to {formatDay(asOf)}:{' '}
          {plural(total, 'commit')} on {plural(active, 'day')}
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Day</span>
            </th>
            {weeks.map((week) => (
              <th key={week[0].day} scope="col">
                <span className="sr-only">
                  Week of {formatDay(week[0].day)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks[0].map((first, row) => (
            <tr key={first.day}>
              <th scope="row">
                <span className="sr-only">{formatWeekday(first.day)}</span>
              </th>
              {weeks.map((week) => {
                const { day, count } = week[row]
                return (
                  <td
                    key={day}
                    data-level={level(count)}
                    title={`${plural(count, 'commit')} on ${formatDay(day)}`}
                  >
                    <span className="sr-only">{count}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="activity__legend secondary" aria-hidden="true">
        Less
        {LEVELS.map((n) => (
          <span key={n} className="activity__swatch" data-level={n} />
        ))}
        More
      </p>
    </section>
  )
}
```

In `app/site/components/Ledger.tsx`:

1. Add `toPublic` to the import from `@app/portfolio/domain/progress`.
2. Replace `<Activity repo={repo} commits={progress.commits} />` with:

```tsx
<Activity days={toPublic(progress, asOf).days} />
```

In `app/styles/site.css`, delete the `.activity__scope { … }`, `.activity__groups { … }`, `.activity__group { … }`, `.activity__group h4 { … }`, `.activity__group ul { … }` and `.activity__group a { … }` blocks, and add after the `.activity__total` block:

```css
.activity__empty {
  font-style: italic;
  color: var(--secondary);
}
```

- [ ] **Step 7: Run them and see them pass**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain app/site`
Expected: PASS.

Run: `grep -nE "activity__(scope|group)" app/styles/site.css app/site -r`
Expected: no output.

- [ ] **Step 8: Run the gate, then commit**

```bash
git add app/portfolio/domain/activity.ts app/portfolio/domain/activity.test.ts app/portfolio/domain/fixtures.ts app/site/components/Activity.tsx app/site/components/Activity.test.tsx app/site/components/Ledger.tsx app/site/pages.test.tsx app/styles/site.css
git commit -S -m "feat(site): activity from daily counts only, with no commit list"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 7: The journey card

A standalone component; Task 9 puts it on the page.

**Files:**

- Create: `app/site/components/Journey.tsx`, `app/site/components/Journey.test.tsx`
- Modify: `app/portfolio/domain/fixtures.ts`, `app/styles/site.css`, `app/styles/tokens.css`

- [ ] **Step 1: Add the public builders**

In `app/portfolio/domain/fixtures.ts`, add `type PublicEntry` and `type PublicProgress` to the `./progress` import and append:

```ts
export function publicEntry(overrides: Partial<PublicEntry> = {}): PublicEntry {
  return {
    id: '2026-10-20-alpha',
    subject: 'alpha',
    date: '2026-10-20',
    title: 'Alpha holds up',
    result: 'pass',
    ...overrides,
  }
}

// Shipped progress as of 2026-10-21, the day Vitest pins.
export function publicProgress(
  entries: PublicEntry[] = [],
  counts: Record<IsoDay, number> = {}
): PublicProgress {
  return { entries, days: days('2026-10-21', counts) }
}
```

- [ ] **Step 2: Write the failing tests**

Create `app/site/components/Journey.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { publicEntry, publicProgress } from '@app/portfolio/domain/fixtures'
import type { PublicEntry } from '@app/portfolio/domain/progress'
import { SiteProvider } from '../site-context'
import { Journey } from './Journey'

function show(entries: PublicEntry[], goal?: string) {
  return render(
    <SiteProvider asOf="2026-10-21">
      <Journey goal={goal} progress={publicProgress(entries)} />
    </SiteProvider>
  )
}

const card = () => screen.getByRole('region', { name: 'Where it stands' })
const marks = () => screen.getAllByRole('img')

const six = (): PublicEntry[] => [
  publicEntry({
    id: 'scaffold',
    subject: 'scaffold',
    date: '2026-10-02',
    title: 'App scaffolded',
  }),
  publicEntry({
    id: 'snap',
    subject: 'snap',
    date: '2026-10-01',
    title: 'Snapshots match',
  }),
  publicEntry({
    id: 'pipe',
    subject: 'pipe',
    date: '2026-10-03',
    title: 'Terminal output keeps up',
    result: 'partial',
    summary: 'No bytes lost; memory still runs high.',
  }),
  publicEntry({
    id: 'mem',
    subject: 'mem',
    date: '2026-10-05',
    title: 'Memory limits hold',
    result: 'not-run',
  }),
  publicEntry({
    id: 'review',
    subject: 'review',
    date: '2026-10-04',
    title: 'Reviewers cannot write',
    result: 'not-run',
  }),
  publicEntry({
    id: 'docs',
    subject: 'docs',
    date: '2026-10-06',
    title: 'Docs ship',
  }),
]

describe('Journey', () => {
  it('is the progress anchor, headed Where it stands', () => {
    show(six())
    expect(
      screen.getByRole('heading', { level: 2, name: 'Where it stands' })
    ).toHaveAttribute('id', 'progress')
  })

  it('states the goal', () => {
    show(six(), 'One window for every assistant.')
    expect(card()).toHaveTextContent('One window for every assistant.')
  })

  it('draws one mark per step, Done to Up next, each named in words', () => {
    show(six())
    expect(marks().map((m) => m.getAttribute('aria-label'))).toEqual([
      'Step 1 of 6: Snapshots match, done',
      'Step 2 of 6: App scaffolded, done',
      'Step 3 of 6: Docs ship, done',
      'Step 4 of 6: Terminal output keeps up, in progress',
      'Step 5 of 6: Reviewers cannot write, up next',
      'Step 6 of 6: Memory limits hold, up next',
    ])
  })

  it('carries status in each mark’s shape, not colour alone', () => {
    show(six())
    expect(marks().map((m) => m.getAttribute('data-result'))).toEqual([
      'pass',
      'pass',
      'pass',
      'partial',
      'not-run',
      'not-run',
    ])
    expect(marks().every((m) => m.classList.contains('mark'))).toBe(true)
  })

  it('counts the steps in plain words', () => {
    show(six())
    expect(card()).toHaveTextContent('3 done · 1 in progress · 2 up next')
  })

  it('names rethinking only when a step is being rethought, and skips empty groups', () => {
    show([
      publicEntry({ id: 'a', subject: 'a' }),
      publicEntry({ id: 'b', subject: 'b', result: 'fail' }),
    ])
    expect(card()).toHaveTextContent('1 done · 1 rethinking')
    expect(card()).not.toHaveTextContent('in progress')
    expect(card()).not.toHaveTextContent('up next')
  })

  it('names the first Up next step as Next', () => {
    show(six())
    expect(card()).toHaveTextContent('Next: Reviewers cannot write')
  })

  it('falls back to the first In progress step', () => {
    show([
      publicEntry({
        id: 'a',
        subject: 'a',
        title: 'Speed holds',
        result: 'partial',
        summary: 'Mostly.',
      }),
      publicEntry({ id: 'b', subject: 'b' }),
    ])
    expect(card()).toHaveTextContent('Next: Speed holds')
  })

  it('leaves Next out when every step is done', () => {
    show([publicEntry()])
    expect(card()).not.toHaveTextContent('Next:')
  })

  it('dates itself as of the build day', () => {
    show(six())
    expect(card()).toHaveTextContent('As of 21 Oct 2026')
  })

  it('says Quiet since when the newest entry is over 30 days old', () => {
    show([publicEntry({ date: '2026-09-20' })])
    expect(card()).toHaveTextContent('Quiet since 20 Sep 2026')
  })

  it('says nothing about quiet within 30 days', () => {
    show([publicEntry({ date: '2026-09-21' })])
    expect(card()).not.toHaveTextContent('Quiet since')
  })

  it('says so when no step is recorded yet', () => {
    show([])
    expect(card()).toHaveTextContent('No steps recorded yet.')
    expect(screen.queryAllByRole('img')).toEqual([])
  })
})
```

- [ ] **Step 3: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/site/components/Journey.test.tsx`
Expected: FAIL: `Failed to resolve import "./Journey"`.

- [ ] **Step 4: Write the component**

Create `app/site/components/Journey.tsx`:

```tsx
import { formatDay } from '@app/portfolio/domain/dates'
import {
  journeySteps,
  nextStep,
  quietSince,
  STATUS_ORDER,
  STATUS_WORD,
  type ProgressResult,
  type PublicProgress,
} from '@app/portfolio/domain/progress'
import { useSite } from '../site'

const word = (result: ProgressResult) => STATUS_WORD[result].toLowerCase()

// Where a project stands, in plain words: goal, steps, what comes next.
export function Journey({
  goal,
  progress,
}: {
  goal?: string
  progress: PublicProgress
}) {
  const { asOf } = useSite()
  const steps = journeySteps(progress.entries, asOf)
  const next = nextStep(steps)
  const quiet = quietSince(progress.entries, asOf)
  const counts = STATUS_ORDER.map((result) => ({
    result,
    n: steps.filter((s) => s.result === result).length,
  }))
    .filter(({ n }) => n > 0)
    .map(({ result, n }) => `${n} ${word(result)}`)
    .join(' · ')

  return (
    <section className="journey" aria-labelledby="progress">
      <h2 id="progress" className="h2">
        Where it stands
      </h2>
      {goal && <p className="journey__goal">{goal}</p>}
      {steps.length > 0 ? (
        <>
          <ol className="journey__steps">
            {steps.map((step, i) => (
              <li key={step.id}>
                <span
                  className="mark"
                  data-result={step.result}
                  role="img"
                  aria-label={`Step ${i + 1} of ${steps.length}: ${step.title}, ${word(step.result)}`}
                />
              </li>
            ))}
          </ol>
          <p className="journey__counts">{counts}</p>
        </>
      ) : (
        <p className="journey__empty">No steps recorded yet.</p>
      )}
      {next && <p className="journey__next">Next: {next.title}</p>}
      <p className="journey__asof mono secondary">
        As of <time dateTime={asOf}>{formatDay(asOf)}</time>
        {quiet && (
          <>
            {' · '}Quiet since <time dateTime={quiet}>{formatDay(quiet)}</time>
          </>
        )}
      </p>
    </section>
  )
}
```

Run: `bunx prettier --write app/site/components/Journey.tsx app/site/components/Journey.test.tsx`

- [ ] **Step 5: Run them and see them pass**

Run: `npx vitest run --config vitest.config.ts app/site/components/Journey.test.tsx`
Expected: PASS (13 tests).

- [ ] **Step 6: Style the card and the marks**

In `app/styles/tokens.css`, after `--mark-size: 8px;`:

```css
--step-size: 14px;
```

In `app/styles/site.css`, add before the `/* Progress ledger: evidence first, commit activity underneath. */` comment:

```css
/* Where it stands: the goal, one mark per step, what comes next. */
.journey {
  display: grid;
  gap: var(--space-3);
  margin-block-end: var(--space-8);
  padding: var(--space-5);
  border: var(--rule) solid var(--hairline);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.journey__goal {
  max-inline-size: var(--measure);
  font-size: var(--text-h3);
  line-height: var(--lh-h3);
}

.journey__steps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.journey__steps .mark {
  --mark-size: var(--step-size);
}

.journey__next {
  font-weight: 600;
}

.journey__empty {
  font-style: italic;
  color: var(--secondary);
}

/* Shape carries the status; fills are gradients so forced colours keep them. */
.mark {
  display: inline-block;
  flex: none;
  inline-size: var(--mark-size);
  block-size: var(--mark-size);
  border: var(--ring) solid currentColor;
  border-radius: 50%;
  color: var(--secondary);
}

.mark[data-result='pass'] {
  color: var(--passing);
  background: linear-gradient(currentColor, currentColor);
}

.mark[data-result='partial'] {
  color: var(--in-progress);
  background: linear-gradient(90deg, currentColor 50%, transparent 50%);
}

.mark[data-result='fail'] {
  color: var(--failing);
  background:
    linear-gradient(
      45deg,
      transparent 40%,
      currentColor 40% 60%,
      transparent 60%
    ),
    linear-gradient(
      -45deg,
      transparent 40%,
      currentColor 40% 60%,
      transparent 60%
    );
}
```

`not-run` keeps the empty ring from `.mark`. Nothing renders the card yet, so check the look in Task 9.

- [ ] **Step 7: Run the gate, then commit**

```bash
git add app/portfolio/domain/fixtures.ts app/site/components/Journey.tsx app/site/components/Journey.test.tsx app/styles/site.css app/styles/tokens.css
git commit -S -m "feat(site): the journey card: goal, steps, counts and what is next"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 8: The full record, opened by a link

A standalone component; Task 9 puts it on the page.

**Files:**

- Create: `app/site/components/FullRecord.tsx`, `app/site/components/FullRecord.test.tsx`, `app/site/components/anchor.test.ts`
- Modify: `app/site/components/anchor.ts`, `app/test/setup.ts`, `app/styles/site.css`

- [ ] **Step 1: Write the failing hash test**

Create `app/site/components/anchor.test.ts`:

```ts
import { idFromHash } from './anchor'

describe('idFromHash', () => {
  it.each([
    ['#2026-10-20-pty-throughput', '2026-10-20-pty-throughput'],
    ['#record', 'record'],
    ['#caf%C3%A9', 'café'],
    ['', ''],
    ['#', ''],
    ['#%E0%A4%A', ''],
  ])('reads %j as %j', (hash, id) => {
    expect(idFromHash(hash)).toBe(id)
  })
})
```

Run: `npx vitest run --config vitest.config.ts app/site/components/anchor.test.ts`
Expected: FAIL: `idFromHash is not a function`.

- [ ] **Step 2: Read an id from a hash**

Append to `app/site/components/anchor.ts`:

```ts
// The element id a URL hash names; '' when the hash is empty or malformed.
export function idFromHash(hash: string): string {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''))
  } catch {
    return ''
  }
}
```

Run the test again. Expected: PASS (6 tests).

- [ ] **Step 3: Let jsdom scroll elements**

In `app/test/setup.ts`, after `window.scrollTo = () => {}`, add:

```ts
Element.prototype.scrollIntoView ??= () => {}
```

(jsdom has no `scrollIntoView`; the existing comment above covers both lines.)

- [ ] **Step 4: Write the failing record tests**

Create `app/site/components/FullRecord.test.tsx`:

```tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Link, MemoryRouter } from 'react-router'
import { publicEntry, publicProgress } from '@app/portfolio/domain/fixtures'
import { SiteProvider } from '../site-context'
import { FullRecord } from './FullRecord'

const entries = () => [
  publicEntry({
    id: 'a1',
    subject: 'a',
    date: '2026-10-01',
    title: 'Speed holds',
    result: 'fail',
  }),
  publicEntry({
    id: 'b1',
    subject: 'b',
    date: '2026-10-02',
    title: 'Snapshots match',
    summary: 'Matches on the first try.',
  }),
  publicEntry({
    id: 'a2',
    subject: 'a',
    date: '2026-10-05',
    title: 'Speed holds',
    result: 'partial',
    summary: 'Fast enough; memory is next.',
  }),
  publicEntry({
    id: 'c1',
    subject: 'c',
    date: '2026-10-06',
    title: 'Reviewers cannot write',
    result: 'not-run',
  }),
  publicEntry({
    id: 'a3',
    subject: 'a',
    date: '2026-10-09',
    title: 'Speed holds',
    result: 'partial',
    summary: 'Memory is under the limit at rest.',
  }),
]

function tree(path: string) {
  return (
    <SiteProvider asOf="2026-10-21">
      <MemoryRouter initialEntries={[path]}>
        <FullRecord progress={publicProgress(entries(), { '2026-10-21': 3 })} />
        <Link to="/work/alpha#a2">to a2</Link>
        <Link to="/work/beta#a2">to beta a2</Link>
      </MemoryRouter>
    </SiteProvider>
  )
}

const record = () => document.getElementById('record') as HTMLDetailsElement
const rowIds = () =>
  Array.from(document.querySelectorAll('.record__row'), (row) => row.id)

describe('FullRecord', () => {
  afterEach(() => vi.restoreAllMocks())

  it('starts closed under the summary The full record', () => {
    render(tree('/work/alpha'))
    expect(record()).not.toHaveAttribute('open')
    expect(record().querySelector('summary')).toHaveTextContent(
      'The full record'
    )
  })

  it('rows the current step per subject, grouped Done, In progress, Up next', () => {
    render(tree('/work/alpha'))
    expect(rowIds()).toEqual(['b1', 'a3', 'c1'])
  })

  it('shows each row’s mark and word, title, summary when present, and date', () => {
    render(tree('/work/alpha'))
    const row = document.getElementById('a3') as HTMLElement
    expect(row.querySelector('.mark')).toHaveAttribute('data-result', 'partial')
    expect(row.querySelector('.mark')).toHaveAttribute('aria-hidden', 'true')
    expect(row.querySelector('.result')).toHaveTextContent('In progress')
    expect(row).toHaveTextContent('Speed holds')
    expect(row).toHaveTextContent('Memory is under the limit at rest.')
    expect(row).toHaveTextContent('9 Oct 2026')
    expect(
      document.getElementById('c1')?.querySelector('.record__text')
    ).toBeNull()
  })

  it('lists earlier entries under their row, newest first, each anchored', () => {
    render(tree('/work/alpha'))
    const lines = Array.from(
      (document.getElementById('a3') as HTMLElement).querySelectorAll(
        '.record__line'
      )
    )
    expect(lines.map((line) => line.id)).toEqual(['a2', 'a1'])
    expect(lines[0]).toHaveTextContent(
      '5 Oct 2026 · In progress · Fast enough; memory is next.'
    )
    expect(lines[1]).toHaveTextContent('1 Oct 2026 · Rethinking · Speed holds')
  })

  it('holds the activity grid built from the shipped days', () => {
    render(tree('/work/alpha'))
    record().open = true
    expect(
      within(record()).getByRole('region', { name: 'Activity' })
    ).toHaveTextContent('3 commits in the last 12 weeks')
  })

  it('opens and scrolls to an entry on a client navigation', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(tree('/work/alpha'))
    fireEvent.click(screen.getByRole('link', { name: 'to a2' }))
    expect(record()).toHaveAttribute('open')
    expect(scroll.mock.contexts.at(-1)).toBe(document.getElementById('a2'))
  })

  it('opens for #record itself', () => {
    render(tree('/work/alpha#record'))
    expect(record()).toHaveAttribute('open')
  })

  it('opens again when the path changes under the same hash', () => {
    render(tree('/work/alpha#a2'))
    record().open = false
    fireEvent.click(screen.getByRole('link', { name: 'to beta a2' }))
    expect(record()).toHaveAttribute('open')
  })

  it('stays closed for a hash that names nothing in the record', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(tree('/work/alpha#the-problem'))
    expect(record()).not.toHaveAttribute('open')
    expect(scroll).not.toHaveBeenCalled()
  })

  it('renders closed on the server even when the hash matches', () => {
    expect(renderToString(tree('/work/alpha#a2'))).toContain(
      '<details id="record" class="record">'
    )
  })

  it('opens on a direct load with a matching hash, with no hydration warning', async () => {
    const path = '/work/alpha#a2'
    const container = document.createElement('div')
    container.innerHTML = renderToString(tree(path))
    document.body.append(container)
    expect(container.querySelector('#record')).not.toHaveAttribute('open')
    const logged = vi.spyOn(console, 'error')
    const recovered: unknown[] = []
    let root: Root | undefined
    await act(async () => {
      root = hydrateRoot(container, tree(path), {
        onRecoverableError: (error) => recovered.push(error),
      })
    })
    expect(container.querySelector('#record')).toHaveAttribute('open')
    expect(recovered).toEqual([])
    expect(logged).not.toHaveBeenCalled()
    act(() => root?.unmount())
    container.remove()
  })
})
```

- [ ] **Step 5: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/site/components/FullRecord.test.tsx`
Expected: FAIL: `Failed to resolve import "./FullRecord"`.

- [ ] **Step 6: Write the component**

Create `app/site/components/FullRecord.tsx` (not `Record.tsx`: that name would shadow TypeScript's `Record` type wherever it is imported):

```tsx
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { formatDay } from '@app/portfolio/domain/dates'
import {
  earlierEntries,
  journeySteps,
  STATUS_WORD,
  type PublicProgress,
} from '@app/portfolio/domain/progress'
import { useSite } from '../site'
import { Activity } from './Activity'
import { idFromHash } from './anchor'

// Prerendered closed so hydration matches; a hash naming anything inside opens it after.
export function FullRecord({ progress }: { progress: PublicProgress }) {
  const { asOf } = useSite()
  const { pathname, hash } = useLocation()
  const ref = useRef<HTMLDetailsElement>(null)

  // Re-runs on every navigation, before the book's seek looks for the entry.
  useEffect(() => {
    const details = ref.current
    const target = document.getElementById(idFromHash(hash))
    if (!details || !target || !details.contains(target)) return
    details.open = true
    target.scrollIntoView({ block: 'start' })
  }, [pathname, hash])

  const steps = journeySteps(progress.entries, asOf)
  return (
    <details id="record" className="record" ref={ref}>
      <summary className="record__summary h2">The full record</summary>
      <ol className="record__rows">
        {steps.map((step) => {
          const earlier = earlierEntries(progress.entries, step, asOf)
          return (
            <li key={step.id} id={step.id} className="record__row">
              <p className="result">
                <span
                  className="mark"
                  data-result={step.result}
                  aria-hidden="true"
                />
                <span className="result__text">{STATUS_WORD[step.result]}</span>
              </p>
              <div className="record__main">
                <p className="record__title">{step.title}</p>
                {step.summary && <p className="record__text">{step.summary}</p>}
                <p className="mono secondary">
                  <time dateTime={step.date}>{formatDay(step.date)}</time>
                </p>
                {earlier.length > 0 && (
                  <ol
                    className="record__earlier"
                    aria-label={`Earlier: ${step.title}`}
                  >
                    {earlier.map((e) => (
                      <li key={e.id} id={e.id} className="record__line">
                        <time dateTime={e.date}>{formatDay(e.date)}</time> ·{' '}
                        {STATUS_WORD[e.result]} · {e.summary ?? e.title}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <Activity days={progress.days} />
    </details>
  )
}
```

The `open` attribute is set on the DOM node, never as a React prop, so React never reconciles it and the first client render matches the server's closed HTML. `pathname` is in the dependencies on purpose (react-hooks allows extra effect dependencies): a new path with the same hash must open the record too.

Run: `bunx prettier --write app/site/components/FullRecord.tsx app/site/components/FullRecord.test.tsx app/site/components/anchor.test.ts`

- [ ] **Step 7: Run them and see them pass**

Run: `npx vitest run --config vitest.config.ts app/site/components`
Expected: PASS for every file, including `FullRecord.test.tsx` (11 tests).

- [ ] **Step 8: Style the record**

In `app/styles/site.css`, add right after the `.mark[data-result='fail'] { … }` block from Task 7:

```css
/* The full record: closed until asked for or linked to. */
.record {
  margin-block: var(--space-8);
  border-block-start: var(--rule) solid var(--hairline);
}

.record__summary {
  cursor: pointer;
  padding-block: var(--space-4);
}

.record__rows,
.record__earlier {
  margin: 0;
  padding: 0;
  list-style: none;
}

.record__row {
  display: grid;
  grid-template-columns: 3fr 9fr;
  gap: var(--gutter);
  align-items: baseline;
  padding-block: var(--space-4);
  border-block-start: var(--rule) solid var(--hairline);
  scroll-margin-block-start: var(--space-5);
}

.record__main {
  display: grid;
  gap: var(--space-1);
  min-inline-size: 0;
  max-inline-size: var(--measure);
}

.record__title {
  font-weight: 600;
}

.record__earlier {
  display: grid;
  gap: var(--space-1);
  padding-block-start: var(--space-2);
  font-size: var(--text-small);
  line-height: var(--lh-small);
  color: var(--secondary);
}

.record__line {
  padding-inline-start: var(--space-2);
  scroll-margin-block-start: var(--space-5);
}

/* Landed-on entry: a rule, never a wash that costs text contrast. */
.record__row:target,
.record__line:target {
  box-shadow: inset var(--anchor-rule) 0 0 var(--gold);
}

@media (max-width: 760px) {
  .record__row {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }
}
```

The `.result` rule (inline-flex, small caps) already exists from the ledger and stays.

- [ ] **Step 9: Run the gate, then commit**

```bash
git add app/site/components/FullRecord.tsx app/site/components/FullRecord.test.tsx app/site/components/anchor.ts app/site/components/anchor.test.ts app/test/setup.ts app/styles/site.css
git commit -S -m "feat(site): the full record, opened by a link to any entry"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 9: Project pages tell the journey; the ledger goes

Page order becomes header, journey card, brief, full record. Removes the filters and their status count, `LedgerEntry` (pass mark, measured, evidence, commit links), `resultLabel`, `kindLabel` and `evidenceHref`. The page still trims full data with `toPublic`; Task 10 moves that into the build.

**Files:**

- Modify: `app/site/pages/ProjectPage.tsx`, `app/portfolio/domain/progress.ts`, `app/styles/site.css`
- Delete: `app/site/components/Ledger.tsx`, `app/site/components/LedgerEntry.tsx`, `app/site/components/Ledger.test.tsx`
- Test: `app/site/pages.test.tsx`, `app/site/render.integration.test.tsx`, `app/portfolio/domain/progress.test.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the failing page tests**

In `app/site/pages.test.tsx`, inside `describe('project page', ...)`, replace the three tests `opens with progress counted as of the build day`, `anchors every Bezl entry, newest first` and `shows commit activity under the Bezl ledger` with:

```tsx
it('tells where Bezl stands, under the header and above the brief', () => {
  visit('/work/bezl')
  const card = screen.getByRole('region', { name: 'Where it stands' })
  expect(card).toHaveTextContent(
    'One window that runs AI coding assistants side by side, with one writer per task.'
  )
  expect(card).toHaveTextContent('3 done · 1 in progress · 2 up next')
  expect(card).toHaveTextContent('Next: A Claude Code reviewer cannot write')
  expect(card).toHaveTextContent('As of 21 Oct 2026')
  expect(within(card).getAllByRole('img')).toHaveLength(6)
  const brief = screen.getByRole('heading', { level: 2, name: 'The problem' })
  expect(
    card.compareDocumentPosition(brief) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
})

it('keeps the full record closed after the brief, every step anchored in journey order', () => {
  visit('/work/bezl')
  const record = document.getElementById('record') as HTMLDetailsElement
  expect(record).not.toHaveAttribute('open')
  const last = screen.getByRole('heading', { level: 2, name: 'Use of AI' })
  expect(
    last.compareDocumentPosition(record) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
  expect(
    Array.from(record.querySelectorAll('.record__row'), (r) => r.id)
  ).toEqual([
    '2026-10-20-libghostty-vt',
    '2026-10-20-reviewer-readonly-codex',
    '2026-10-21-scaffold',
    '2026-10-20-pty-throughput',
    '2026-10-20-reviewer-readonly-claude',
    '2026-10-21-pty-memory',
  ])
})

it('shows commit activity inside the record', () => {
  visit('/work/bezl')
  const record = document.getElementById('record') as HTMLDetailsElement
  record.open = true
  expect(
    within(record).getByRole('region', { name: 'Activity' })
  ).toHaveTextContent('11 commits in the last 12 weeks')
})

it('shows outcomes only: no pass mark, measurement, evidence or link into Bezl’s repository', () => {
  const { container } = visit('/work/bezl')
  expect(container).not.toHaveTextContent('No lost bytes, echo under 100 ms')
  expect(container).not.toHaveTextContent('Surplus bytes per pane')
  expect(container).not.toHaveTextContent('RESULT.md')
  expect(screen.queryByRole('group', { name: 'Filter entries' })).toBeNull()
  const hrefs = Array.from(
    container.querySelectorAll('a'),
    (a) => a.getAttribute('href') ?? ''
  )
  expect(
    hrefs.filter((href) => href.includes('github.com/KhallilB/bezl'))
  ).toEqual([])
})
```

and change `keeps the empty build log for a project with no progress` so its last line reads:

```tsx
expect(screen.queryByRole('region', { name: 'Where it stands' })).toBeNull()
expect(document.getElementById('record')).toBeNull()
```

In `app/site/render.integration.test.tsx`, replace `renders the ledger it is given, every entry and no filters` with:

```tsx
it('renders the journey card and a closed record with every entry anchored', () => {
  const page = renderPage('/work/bezl', '2026-10-21', fixtureProgress)
  expect(page.html).toContain('id="progress"')
  expect(page.html).toContain('Where it stands')
  expect(page.html).toContain('<details id="record" class="record">')
  expect(page.html).toContain('id="2026-10-20-pty-throughput"')
  expect(page.html).not.toContain('Filter entries')
})
```

In `app/portfolio/domain/progress.test.ts`, delete the whole `describe('words and links', ...)` block, and remove `evidenceHref`, `kindLabel` and `resultLabel` (and `PROGRESS_KINDS` if nothing else uses it) from the import list.

- [ ] **Step 2: Write the failing browser tests**

In `tests/e2e/smoke.spec.ts`:

1. Replace the test `the progress ledger is in the prerendered project page` with:

```ts
// Built from the offline fixtures: Playwright's build sets PROGRESS_OFFLINE=1.
test('the journey card and the record are in the prerendered project page', async ({
  request,
}) => {
  const html = await (await request.get('/work/bezl')).text()
  expect(html).toContain('id="progress"')
  expect(html).toContain('<details id="record" class="record">')
  expect(html).toContain('id="2026-10-20-pty-throughput"')
})

test('a project page leads with where it stands, then the brief, then the closed record', async ({
  page,
}) => {
  await page.goto('/work/bezl')
  const card = page.getByRole('region', { name: 'Where it stands' })
  await expect(card).toContainText(
    'One window that runs AI coding assistants side by side'
  )
  await expect(card.getByRole('img', { name: /^Step \d of 6: / })).toHaveCount(
    6
  )
  await expect(card).toContainText('Next: A Claude Code reviewer cannot write')
  const inOrder = await page.evaluate(() => {
    const follows = (a: string, b: string) =>
      Boolean(
        document
          .getElementById(a)!
          .compareDocumentPosition(document.getElementById(b)!) &
        Node.DOCUMENT_POSITION_FOLLOWING
      )
    return (
      follows('progress', 'the-problem') && follows('the-problem', 'record')
    )
  })
  expect(inOrder).toBe(true)
  await expect(page.locator('details#record')).not.toHaveAttribute('open')
})

test('a link to an entry opens the record at that entry', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto('/work/bezl#2026-10-20-pty-throughput')
  await expect(page.locator('details#record')).toHaveAttribute('open', '')
  await expect(
    page.locator('[id="2026-10-20-pty-throughput"]')
  ).toBeInViewport()
  expect(errors, 'hydration must not log errors').toEqual([])
})
```

2. Replace the body of `test.describe('with JavaScript off', ...)` with:

```ts
test.use({ javaScriptEnabled: false })

test('the record is in the page, closed, with every step', async ({ page }) => {
  await page.goto('/work/bezl')
  const record = page.locator('details#record')
  await expect(record).not.toHaveAttribute('open')
  await expect(record.locator('.record__row')).toHaveCount(6)
})
```

3. Delete the test `the ledger filters by kind once the page is live`.
4. In `the activity squares are square at …px` and `the activity table corner is blank…`, add right after `await page.goto('/work/bezl')`:

```ts
await page.locator('#record > summary').click()
```

5. In `the phone layout has no horizontal scroll at 320 px`, change the loop body's first line to:

```ts
await page.goto(path)
if (path === '/work/bezl') await page.locator('#record > summary').click()
```

- [ ] **Step 3: Run the unit and integration tests and see them fail**

Run: `npx vitest run --config vitest.config.ts app/site/pages.test.tsx app/site/render.integration.test.tsx`
Expected: FAIL: no region named `Where it stands`, no `#record`, and the ledger's pass mark and `RESULT.md` text are on the page.

- [ ] **Step 4: Put the journey and the record on the page**

Replace the whole of `app/site/pages/ProjectPage.tsx` with:

```tsx
import { Link, useParams } from 'react-router'
import { findProject } from '@app/portfolio/domain/catalog'
import { toPublic } from '@app/portfolio/domain/progress'
import { Brief } from '../components/Brief'
import { BuildLog } from '../components/BuildLog'
import { FullRecord } from '../components/FullRecord'
import { Journey } from '../components/Journey'
import { StatusChip } from '../components/StatusChip'
import { useSite } from '../site'
import { NotFound } from './NotFound'

export function ProjectPage() {
  const { slug = '' } = useParams()
  const { asOf, catalog, progress } = useSite()
  const project = findProject(catalog.projects, slug)
  if (!project) return <NotFound />
  // Registered but not yet fetched (a fresh dev clone) keeps the empty log.
  const fetched = project.repo ? progress[project.slug] : undefined
  // Interim: trimmed here until the build writes the public shape.
  const ledger = fetched && toPublic(fetched, asOf)

  return (
    <article>
      <header className="page-head">
        <p className="crumb mono secondary">
          <Link to="/work">Work</Link> / {project.title}
        </p>
        <h1 className="h1">{project.title}</h1>
        <p className="lede">{project.summary}</p>
        <p className="about">{project.about}</p>
        <div className="spec" role="group" aria-label="Spec">
          <dl>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>{project.stack.join(', ')}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusChip item={project} />
              </dd>
            </div>
            <div>
              <dt>Domain</dt>
              <dd>{project.domain}</dd>
            </div>
          </dl>
          {project.links.length > 0 && (
            <ul className="spec__links">
              {project.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="link">
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      {ledger ? (
        <Journey goal={project.goal} progress={ledger} />
      ) : (
        <BuildLog />
      )}
      <Brief sections={project.brief} />
      {ledger && <FullRecord key={project.slug} progress={ledger} />}
    </article>
  )
}
```

`key={project.slug}` gives each project a fresh, closed record when navigating between project pages.

- [ ] **Step 5: Delete the ledger and the helpers only it used**

```bash
git rm app/site/components/Ledger.tsx app/site/components/LedgerEntry.tsx app/site/components/Ledger.test.tsx
```

In `app/portfolio/domain/progress.ts`, delete `RESULT_LABELS`, `resultLabel`, `KIND_LABELS`, `kindLabel` and `evidenceHref`: everything from `const RESULT_LABELS` to the end of the file. Task 5's additions sit above `RESULT_LABELS` and stay.

In `app/styles/site.css`, delete these rule blocks: the `/* Progress ledger: evidence first, commit activity underneath. */` comment, `.ledger`, `.ledger__head`, `.ledger__quiet, .ledger__empty`, `.ledger__entries`, `.entry`, the `/* Landed-on entry … */` comment with `.entry:target`, `.entry__main`, `.entry__meta`, `.entry__facts`, `.entry__facts dt`, `.entry__evidence summary`, `.entry__evidence ul`, `.result__mark`, `.result[data-result='pass'] .result__mark`, `.result[data-result='partial'] .result__mark`, `.result[data-result='fail'] .result__mark`, the `@media (max-width: 760px) { .entry { … } }` block, `.ledger__filters`, `.ledger__filter`, `.ledger__filter:hover`, `.ledger__filter[aria-pressed='true']`, `.ledger__count` and `.ledger__controls`. Keep `/* Result: shape and word, never colour alone. */` and `.result`, and every `.activity…` rule.

Check:

```bash
grep -rnE 'ledger__|^\.ledger[ ,{]|entry__|^\.entry[ :{]|className="entry"|result__mark|resultLabel|kindLabel|evidenceHref|LedgerEntry|<Ledger' app
```

Expected: no output. Before this task the pattern matches only what Task 6 and this step remove: the `.ledger…`, `.entry…` and `.result__mark` rules in `site.css`, `<Ledger` in `ProjectPage.tsx`, the label and `evidenceHref` exports in `progress.ts` and their tests in `progress.test.ts`, and the deleted `Ledger*` files (Task 6 already moved `Activity.tsx` off `ledger__empty`). It deliberately skips words that legitimately survive: `const ledger` in `ProjectPage.tsx`, comments that say "ledger", `entryErrors`, `schema.definitions.entry` and `result__text`.

- [ ] **Step 6: Run the unit and integration tests and see them pass**

Run: `npx vitest run --config vitest.config.ts app && bun run test:integration`
Expected: PASS.

- [ ] **Step 7: Run the browser tests and see them pass**

```bash
lsof -ti tcp:4173 | xargs kill 2>/dev/null; bun run test:e2e
```

Expected: PASS, including the three new progress tests and the JavaScript-off record test.

- [ ] **Step 8: Capture screenshots as evidence**

Set `SHOTS` to your session's scratchpad directory (not inside the worktree), then:

```bash
SHOTS=/path/to/your/scratchpad
PROGRESS_OFFLINE=1 bun run build
PORT=4199 bun scripts/serve-build.ts & SERVE=$!
curl -sf --retry 20 --retry-connrefused --retry-delay 1 -o /dev/null http://127.0.0.1:4199/work/bezl
for w in 1280 375; do
  bunx playwright screenshot --viewport-size="$w,900" --full-page --wait-for-selector '#progress' \
    http://127.0.0.1:4199/work/bezl "$SHOTS/bezl-$w.png"
  bunx playwright screenshot --viewport-size="$w,900" --wait-for-selector 'details#record[open]' \
    'http://127.0.0.1:4199/work/bezl#2026-10-21-pty-memory' "$SHOTS/bezl-record-$w.png"
done
kill $SERVE
ls -1 "$SHOTS"/bezl-*.png
```

Expected: four PNGs listed (`bezl-1280.png`, `bezl-375.png`, `bezl-record-1280.png`, `bezl-record-375.png`). The `details#record[open]` wait succeeding is itself proof that the hash opened the record after hydration. Open each PNG (the Read tool shows images) and check:

- `bezl-1280.png` and `bezl-375.png`: the card sits under the header with the goal, six marks (three filled, one half, two empty rings), "3 done · 1 in progress · 2 up next", "Next: A Claude Code reviewer cannot write" and the as-of line; "The problem" follows; "The full record" is a closed summary at the bottom; nothing overflows at 375 px.
- `bezl-record-1280.png` and `bezl-record-375.png`: the record is open with the "Terminal memory trip-wires" row at the top of the viewport and a gold rule on its left; rows show a mark and word, title and date.

Report the four file paths with the task result. If a check fails, fix the CSS and re-run this step before committing.

- [ ] **Step 9: Run the gate, then commit**

```bash
git add app/site/pages/ProjectPage.tsx app/portfolio/domain/progress.ts app/portfolio/domain/progress.test.ts app/styles/site.css app/site/pages.test.tsx app/site/render.integration.test.tsx tests/e2e/smoke.spec.ts
git commit -S -m "feat(site): project pages tell the journey, with the full record after the brief"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

(`git rm` in Step 5 already staged the deletions.)

---

### Task 10: Ship only the public shape

The fetch writes `toPublic(...)`, the loader accepts nothing else, fixtures go through the same trim, and the page stops trimming. A browser test scans the built pages and bundle for fixture-only private strings.

**Files:**

- Modify: `app/portfolio/domain/progress.ts`, `app/portfolio/progress/load.ts`, `app/portfolio/progress/fetch.ts`, `app/portfolio/progress/fixture-progress.ts`, `scripts/progress-fetch.ts`, `app/site/site.ts`, `app/site/site-context.tsx`, `app/site/progress-data.ts`, `app/entry-server.tsx`, `app/site/pages/ProjectPage.tsx`
- Test: `app/portfolio/domain/progress.test.ts`, `app/portfolio/progress/load.test.ts`, `app/portfolio/progress/fixture-progress.test.ts`, `scripts/progress-fetch.test.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the failing leak scan**

In `tests/e2e/smoke.spec.ts`, add at the top, after the Playwright import:

```ts
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Fixture-only private fields; the build must ship none of them.
const PRIVATE = [
  'No lost bytes, echo under 100 ms, memory under 300 MB', // a pass mark
  'Surplus bytes per pane', // a measurement label
  'spikes/01-pty-throughput/RESULT.md', // an evidence path
  '01e47db', // a commit sha
  'feat: scaffold Bezl and record the three stack spikes', // a commit message
]

const built = (dir: string, ext: string) =>
  readdirSync(dir)
    .filter((name) => name.endsWith(ext))
    .map((name) => join(dir, name))
```

and append at the end:

```ts
test('the pages and the bundle ship outcomes only', () => {
  const files = [
    ...built('build/work', '.html'),
    ...built('build/assets', '.js'),
  ]
  const texts = files.map((file) => ({
    file,
    text: readFileSync(file, 'utf8'),
  }))
  expect(
    texts.some(
      ({ file, text }) =>
        file.endsWith('.js') && text.includes('Terminal output into the window')
    ),
    'the bundle carries the shipped progress'
  ).toBe(true)
  for (const { file, text } of texts) {
    for (const secret of PRIVATE)
      expect(text.includes(secret), `${secret} in ${file}`).toBe(false)
  }
  expect(readFileSync('build/work/bezl.html', 'utf8')).not.toContain(
    'github.com/KhallilB/bezl'
  )
})
```

Run:

```bash
lsof -ti tcp:4173 | xargs kill 2>/dev/null; bun run test:e2e -- -g 'outcomes only'
```

Expected: FAIL naming a `PRIVATE` string in a `build/assets/*.js` file (the first one hit is the pass mark, `No lost bytes, echo under 100 ms, memory under 300 MB in build/assets/index-….js`): the bundle still carries the full `build-data/` files. This is the leak the task closes.

- [ ] **Step 2: Write the failing loader and shape tests**

In `app/portfolio/domain/progress.test.ts`, add `validatePublicProgress` and `type DayCount` to the `./progress` import, then append:

```ts
describe('validatePublicProgress', () => {
  const shipped = () =>
    toPublic(
      {
        file: progressFile([entry({ summary: 'Holds up well.' })]),
        commits: [commit()],
      },
      day
    )
  const ctx = { slug: 'alpha', buildDay: day }
  const at = '"alpha" built progress'
  const daysRule = `${at} needs days as the 84 days to 2026-10-21, each with a whole count of 0 or more`

  it('accepts what toPublic writes', () => {
    expect(validatePublicProgress(shipped(), ctx)).toEqual([])
  })

  it('refuses anything that is not an object', () => {
    expect(validatePublicProgress([], ctx)).toEqual([
      `${at} is not a JSON object`,
    ])
  })

  it('refuses the full shape', () => {
    expect(
      validatePublicProgress({ file: progressFile([]), commits: [] }, ctx)
    ).toEqual([
      `${at} has a field the site does not ship: "file"`,
      `${at} has a field the site does not ship: "commits"`,
      `${at} needs an entries list`,
      daysRule,
    ])
  })

  it.each(['kind', 'passMark', 'measured', 'evidence', 'commit'])(
    'refuses an entry carrying %s',
    (field) => {
      const data = shipped()
      data.entries[0] = { ...data.entries[0], [field]: 'x' }
      expect(validatePublicProgress(data, ctx)).toEqual([
        `${at} entry "2026-10-20-alpha" has a field the site does not ship: "${field}"`,
      ])
    }
  )

  it('checks every shipped entry field', () => {
    const bad = {
      id: 'a b',
      subject: ' ',
      date: 'soon',
      title: '',
      result: 'ok',
      summary: 'a\nb',
    }
    expect(
      validatePublicProgress({ ...shipped(), entries: [bad] }, ctx)
    ).toEqual([
      `${at} entry "a b" needs an id with no spaces`,
      `${at} entry "a b" needs a subject`,
      `${at} entry "a b" needs a date as YYYY-MM-DD`,
      `${at} entry "a b" needs a title`,
      `${at} entry "a b" has an unknown result "ok"`,
      `${at} entry "a b" needs a summary of one line, 1 to 140 characters`,
    ])
  })

  it.each([
    ['too few days', (d: DayCount[]) => d.slice(1)],
    ['two days swapped', (d: DayCount[]) => [d[1], d[0], ...d.slice(2)]],
    [
      'a negative count',
      (d: DayCount[]) => [{ ...d[0], count: -1 }, ...d.slice(1)],
    ],
    [
      'a fractional count',
      (d: DayCount[]) => [{ ...d[0], count: 0.5 }, ...d.slice(1)],
    ],
    [
      'a commit sha on a day',
      (d: DayCount[]) => [{ ...d[0], sha: '01e47db' }, ...d.slice(1)],
    ],
  ])('refuses days with %s', (_name, change) => {
    const data = shipped()
    expect(
      validatePublicProgress({ ...data, days: change(data.days) }, ctx)
    ).toEqual([daysRule])
  })

  it('refuses days that end before the build day', () => {
    expect(
      validatePublicProgress(shipped(), {
        slug: 'alpha',
        buildDay: '2026-10-22',
      })
    ).toEqual([
      `${at} needs days as the 84 days to 2026-10-22, each with a whole count of 0 or more`,
    ])
  })
})
```

Replace the whole of `app/portfolio/progress/load.test.ts` with:

```ts
import { commit, entry, progressFile } from '../domain/fixtures'
import { toPublic } from '../domain/progress'
import { loadProgress } from './load'

const day = '2026-10-21'
const shipped = () =>
  toPublic(
    {
      file: progressFile([entry({ summary: 'Holds up well.' })]),
      commits: [commit()],
    },
    day
  )

describe('loadProgress', () => {
  it('reads no files as no progress', () => {
    expect(loadProgress({}, day)).toEqual({})
  })

  it('keys each file by the slug in its path', () => {
    expect(
      loadProgress(
        {
          '/build-data/progress/alpha.json': shipped(),
          '/x/beta.json': shipped(),
        },
        day
      )
    ).toEqual({ alpha: shipped(), beta: shipped() })
  })

  it('refuses a stale full-shape file, naming the file', () => {
    const stale = { file: progressFile([entry()]), commits: [commit()] }
    expect(() =>
      loadProgress({ '/build-data/progress/alpha.json': stale }, day)
    ).toThrow(
      /build-data\/progress\/alpha\.json failed validation:[\s\S]*does not ship: "file"/
    )
  })

  it('refuses an entry that carries a private field', () => {
    const leaky = shipped()
    leaky.entries[0] = {
      ...leaky.entries[0],
      passMark: 'Under 100 ms',
    } as never
    expect(() => loadProgress({ '/x/alpha.json': leaky }, day)).toThrow(
      '"alpha" built progress entry "2026-10-20-alpha" has a field the site does not ship: "passMark"'
    )
  })

  it('refuses days built for another day', () => {
    expect(() =>
      loadProgress({ '/x/alpha.json': shipped() }, '2026-10-22')
    ).toThrow('"alpha" built progress needs days as the 84 days to 2026-10-22')
  })
})
```

In `app/portfolio/progress/fixture-progress.test.ts`, change `fixtureProgress.bezl.file.entries` to `fixtureProgress.bezl.entries` and `p.file.entries` to `p.entries`, and append:

```ts
it('ship the public shape only', () => {
  expect(Object.keys(fixtureProgress.bezl)).toEqual(['entries', 'days'])
  expect(fixtureProgress.bezl.days.at(-1)).toEqual({
    day: '2026-10-21',
    count: 11,
  })
})
```

In `scripts/progress-fetch.test.ts`:

1. Change the `node:fs` import to `import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'`.
2. Add after `const SCRIPT = …`:

```ts
const FIXTURES = join(
  __dirname,
  '..',
  'app',
  'portfolio',
  'progress',
  'fixtures'
)
```

3. Replace `function run(...) { … }` with:

```ts
// Runs in an empty cwd; without fixtures copied in, the offline fetch fails.
function run(env: Record<string, string>, withFixtures = false) {
  const cwd = mkdtempSync(join(tmpdir(), 'progress-fetch-'))
  const out = join(cwd, 'build-data', 'progress')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'stale.json'), '{}')
  if (withFixtures) {
    cpSync(FIXTURES, join(cwd, 'app', 'portfolio', 'progress', 'fixtures'), {
      recursive: true,
    })
  }
  const result = spawnSync('bun', [SCRIPT], {
    cwd,
    env: { ...process.env, PROGRESS_OFFLINE: '1', ...env },
    encoding: 'utf8',
  })
  const left = existsSync(out)
  const written: Record<string, Record<string, unknown>> = left
    ? Object.fromEntries(
        readdirSync(out).map((name) => [
          name,
          JSON.parse(readFileSync(join(out, name), 'utf8')),
        ])
      )
    : {}
  rmSync(cwd, { recursive: true, force: true })
  return { status: result.status, stderr: result.stderr, left, written }
}
```

4. Append inside `describe('progress-fetch', ...)`:

```ts
it('writes only the public shape for each registered project', () => {
  const { status, written } = run({ BUILD_DAY: '2026-10-21' }, true)
  expect(status).toBe(0)
  expect(Object.keys(written).sort()).toEqual(['bezl.json', 'kbui.json'])
  const bezl = written['bezl.json'] as {
    entries: Record<string, unknown>[]
    days: unknown[]
  }
  expect(Object.keys(bezl)).toEqual(['entries', 'days'])
  expect(bezl.days).toHaveLength(84)
  expect(bezl.days.at(-1)).toEqual({ day: '2026-10-21', count: 11 })
  expect(Object.keys(bezl.entries[0])).toEqual([
    'id',
    'subject',
    'date',
    'title',
    'result',
    'summary',
  ])
})
```

- [ ] **Step 3: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio scripts`
Expected: FAIL: `validatePublicProgress is not a function`; `loadProgress` still demands `file` and `commits`; the fixture keys are `file`, `commits`; the script writes `file` and `commits`.

- [ ] **Step 4: Check the public shape on load**

In `app/portfolio/domain/progress.ts`, replace the whole `entryErrors` function with these two functions:

```ts
// Fields a page ships; the contract and the built-data check share these rules.
function publicFieldErrors(e: Fields, where: string): string[] {
  const errors: string[] = []
  if (!isText(e.id) || /\s/.test(e.id)) {
    errors.push(`${where} needs an id with no spaces`)
  }
  if (!isText(e.subject)) errors.push(`${where} needs a subject`)
  if (typeof e.date !== 'string' || !isIsoDay(e.date)) {
    errors.push(`${where} needs a date as YYYY-MM-DD`)
  }
  if (!isText(e.title)) errors.push(`${where} needs a title`)
  if (!isOneOf(PROGRESS_RESULTS, e.result)) {
    errors.push(`${where} has an unknown result ${JSON.stringify(e.result)}`)
  }
  if (e.summary !== undefined && !isShortLine(e.summary)) {
    errors.push(`${where} needs a summary of one line, 1 to 140 characters`)
  }
  return errors
}

function entryErrors(e: Fields, where: string, buildDay: IsoDay): string[] {
  const errors = publicFieldErrors(e, where)
  if (typeof e.date === 'string' && isIsoDay(e.date) && e.date > buildDay) {
    errors.push(`${where} is dated ${e.date}, after the build day ${buildDay}`)
  }
  if (e.summary === undefined && e.result === 'partial') {
    errors.push(
      `${where} is partial, so it needs a summary of what works and what is left`
    )
  }
  if (!isOneOf(PROGRESS_KINDS, e.kind)) {
    errors.push(`${where} has an unknown kind ${JSON.stringify(e.kind)}`)
  }
  const needsMark = NEEDS_PASS_MARK.includes(e.kind as string)
  if (needsMark && !isText(e.passMark)) {
    errors.push(`${where} needs a passMark, set before the result`)
  } else if (!needsMark && e.passMark !== undefined && !isText(e.passMark)) {
    errors.push(`${where} passMark is blank; omit it or fill it in`)
  }
  const measured =
    Array.isArray(e.measured) &&
    e.measured.every((m) => isRecord(m) && isText(m.label) && isText(m.value))
  if (!measured) {
    errors.push(`${where} needs measured as a list of { label, value }`)
  }
  if (!Array.isArray(e.evidence)) {
    errors.push(`${where} needs an evidence list`)
  } else {
    for (const item of e.evidence) {
      const problem = evidenceProblem(item)
      if (problem) errors.push(`${where} evidence ${problem}`)
    }
    if (e.evidence.length === 0 && e.result !== 'not-run') {
      errors.push(`${where} needs evidence unless its result is not-run`)
    }
    const linksPath = e.evidence.some(
      (item) => isRecord(item) && 'path' in item
    )
    if (linksPath && !isText(e.commit)) {
      errors.push(`${where} links a repository path, so it needs a commit`)
    }
  }
  if (
    e.commit !== undefined &&
    !(typeof e.commit === 'string' && HASH.test(e.commit))
  ) {
    errors.push(
      `${where} has a commit that is not a hash: ${JSON.stringify(e.commit)}`
    )
  }
  return errors
}
```

Then, after `toPublic`, add:

```ts
const PUBLIC_FIELDS = ['entries', 'days']
const PUBLIC_ENTRY_FIELDS = [
  'id',
  'subject',
  'date',
  'title',
  'result',
  'summary',
]
const DAY_FIELDS = ['day', 'count']

const extraFields = (v: Fields, allowed: readonly string[]) =>
  Object.keys(v).filter((key) => !allowed.includes(key))

// Built data is checked again on load, so a stale full-shape file fails closed.
export function validatePublicProgress(
  data: unknown,
  ctx: { slug: string; buildDay: IsoDay }
): string[] {
  const at = `"${ctx.slug}" built progress`
  if (!isRecord(data)) return [`${at} is not a JSON object`]
  const errors = extraFields(data, PUBLIC_FIELDS).map(
    (key) => `${at} has a field the site does not ship: "${key}"`
  )
  if (!Array.isArray(data.entries)) {
    errors.push(`${at} needs an entries list`)
  } else {
    data.entries.forEach((entry: unknown, index) => {
      if (!isRecord(entry)) {
        errors.push(`${at} entry ${index + 1} is not an object`)
        return
      }
      const where = `${at} entry ${isText(entry.id) ? `"${entry.id}"` : index + 1}`
      errors.push(
        ...extraFields(entry, PUBLIC_ENTRY_FIELDS).map(
          (key) => `${where} has a field the site does not ship: "${key}"`
        ),
        ...publicFieldErrors(entry, where)
      )
    })
  }
  if (!isDense(data.days, ctx.buildDay)) {
    errors.push(
      `${at} needs days as the ${ACTIVITY_DAYS} days to ${ctx.buildDay}, each with a whole count of 0 or more`
    )
  }
  return errors
}

function isDense(days: unknown, buildDay: IsoDay): boolean {
  return (
    Array.isArray(days) &&
    days.length === ACTIVITY_DAYS &&
    days.every(
      (d: unknown, i) =>
        isRecord(d) &&
        extraFields(d, DAY_FIELDS).length === 0 &&
        d.day === addDays(buildDay, i + 1 - ACTIVITY_DAYS) &&
        Number.isInteger(d.count) &&
        (d.count as number) >= 0
    )
  )
}
```

`isRecord`, `isText`, `isOneOf` and `Fields` are declared above `validateProgress`; `toPublic` and `ACTIVITY_DAYS` come from Task 5. If TypeScript complains that a `const` is used before its declaration, move the `PUBLIC_FIELDS` block below `type Fields`.

Replace the whole of `app/portfolio/progress/load.ts` with:

```ts
import { validatePublicProgress, type PublicProgress } from '../domain/progress'
import type { IsoDay } from '../domain/types'

export const slugOf = (path: string) =>
  path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '')

// Keys are file paths; the file name is the project slug.
export function loadProgress(
  files: Record<string, unknown>,
  buildDay: IsoDay
): Record<string, PublicProgress> {
  const loaded: Record<string, PublicProgress> = {}
  for (const [path, data] of Object.entries(files)) {
    const slug = slugOf(path)
    const errors = validatePublicProgress(data, { slug, buildDay })
    if (errors.length > 0) {
      throw new Error(`${path} failed validation:\n${errors.join('\n')}`)
    }
    loaded[slug] = data as PublicProgress
  }
  return loaded
}
```

- [ ] **Step 5: Trim before writing, and trim the fixtures the same way**

In `app/portfolio/progress/fetch.ts`, rename `function checked(` to `export function checkProgress(` and update its two callers (`return checked(slug, …)` in `fromFixture` and `fromGitHub`) to `checkProgress`.

Replace the whole of `app/portfolio/progress/fixture-progress.ts` with:

```ts
import { toPublic } from '../domain/progress'
import { checkProgress } from './fetch'
import { loadProgress, slugOf } from './load'

const DAY = '2026-10-21'
const files: Record<string, unknown> = import.meta.glob('./fixtures/*.json', {
  eager: true,
  import: 'default',
})

// Checked and trimmed as the build does, so tests see the shape that ships.
export const fixtureProgress = loadProgress(
  Object.fromEntries(
    Object.entries(files).map(([path, data]) => {
      const { file, commits } = (data ?? {}) as {
        file?: unknown
        commits?: unknown
      }
      return [
        path,
        toPublic(checkProgress(slugOf(path), file, commits, DAY), DAY),
      ]
    })
  ),
  DAY
)
```

In `scripts/progress-fetch.ts`:

1. Change the first comment line to:

```ts
// Writes each registered project's public progress to build-data/progress/<slug>.json; any failure stops the build.
```

2. Add `import { toPublic } from '../app/portfolio/domain/progress'` after the `catalog` import.
3. In the write loop, change `JSON.stringify(data, null, 2)` to `JSON.stringify(toPublic(data, day), null, 2)`.

- [ ] **Step 6: Type the site with the public shape and stop trimming on the page**

- `app/site/site.ts`: `import type { PublicProgress } from '@app/portfolio/domain/progress'` replaces the `ProjectProgress` import, and `progress: Record<string, PublicProgress>`.
- `app/site/site-context.tsx`: same import swap; `NO_PROGRESS: Record<string, PublicProgress>` and `progress?: Record<string, PublicProgress>`.
- `app/site/progress-data.ts`: same import swap; the return type becomes `Record<string, PublicProgress>`.
- `app/entry-server.tsx`: `import type { PublicProgress } from './portfolio/domain/progress'` and `progress: Record<string, PublicProgress>`.
- `app/site/pages/ProjectPage.tsx`: delete the `toPublic` import and replace

```tsx
const { asOf, catalog, progress } = useSite()
```

with `  const { catalog, progress } = useSite()`, and replace the four lines from `// Registered but not yet fetched…` to `const ledger = fetched && toPublic(fetched, asOf)` with:

```tsx
// Registered but not yet fetched (a fresh dev clone) keeps the empty log.
const ledger = project.repo ? progress[project.slug] : undefined
```

Check:

```bash
grep -rn "ProjectProgress" app/site app/entry-server.tsx
```

Expected: no output.

- [ ] **Step 7: Run everything and see it pass**

```bash
npx vitest run --config vitest.config.ts app scripts && bun run typecheck && bun run test:integration
lsof -ti tcp:4173 | xargs kill 2>/dev/null; bun run test:e2e
```

Expected: PASS, including `the pages and the bundle ship outcomes only`.

- [ ] **Step 8: Build against the live files**

Run the online build (see Conventions) with `GITHUB_TOKEN=$(gh auth token)`, then:

```bash
jq -c 'keys, (.entries[0] | keys), (.days | length)' build-data/progress/bezl.json
```

Expected: `["days","entries"]`, a key list drawn only from `date`, `id`, `result`, `subject`, `summary`, `title`, and `84`.

- [ ] **Step 9: Run the gate, then commit**

```bash
git add app/portfolio/domain/progress.ts app/portfolio/domain/progress.test.ts app/portfolio/progress/load.ts app/portfolio/progress/load.test.ts app/portfolio/progress/fetch.ts app/portfolio/progress/fixture-progress.ts app/portfolio/progress/fixture-progress.test.ts scripts/progress-fetch.ts scripts/progress-fetch.test.ts app/site/site.ts app/site/site-context.tsx app/site/progress-data.ts app/entry-server.tsx app/site/pages/ProjectPage.tsx tests/e2e/smoke.spec.ts
git commit -S -m "feat(progress): ship only the public shape and refuse anything else"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 11: Read private repositories with `PROGRESS_TOKEN`

**Files:**

- Modify: `app/portfolio/progress/fetch.ts`, `scripts/progress-fetch.ts`
- Test: `app/portfolio/progress/fetch.test.ts`

- [ ] **Step 1: Write the failing tests**

In `app/portfolio/progress/fetch.test.ts`:

1. Change the second import to `import { chooseToken, collectProgress, type CollectOptions, type GitHubToken } from './fetch'`.
2. Rename the helper `publicRepo` to `repoRoutes` everywhere in the file (it no longer implies public).
3. In the first test, rename it to `reads progress.json from the default branch with 84 days of classified commits` and change `since: '2026-07-24T00:00:00Z'` to `since: '2026-07-30T00:00:00Z'`.
4. In `authenticates with GITHUB_TOKEN when it has one`, change `token: 't0k'` to `token: { name: 'GITHUB_TOKEN', value: 't0k' }`.
5. In the `it.each([...])('fails the build, naming the project, when the repository %s', ...)` table, replace the first two rows with:

```ts
    [
      'is not found',
      { '/repos/KhallilB/bezl': missing },
      'the repository was not found',
    ],
    [
      'names no default branch',
      { '/repos/KhallilB/bezl': () => json({ private: false }) },
      'GitHub named no default branch',
    ],
```

6. Replace `says the token was rejected on 401` with:

```ts
it.each(['PROGRESS_TOKEN', 'GITHUB_TOKEN'] as const)(
  'on a 401 says %s was rejected, without printing it',
  async (name) => {
    const routes = {
      ...repoRoutes(),
      '/repos/KhallilB/bezl': () => new Response('', { status: 401 }),
    }
    const error = await collectProgress(
      [bezl],
      options({
        fetch: github(routes).fetch,
        token: { name, value: 'secret-401' },
      })
    ).catch((e: Error) => e.message)
    expect(error).toContain(
      `GitHub answered 401 for the repository: ${name} was rejected.`
    )
    expect(error).not.toContain('secret-401')
  }
)
```

7. In `says rate limited on %i and suggests GITHUB_TOKEN only without one`, change the `run` helper to:

```ts
const run = (token?: string) =>
  collectProgress(
    [bezl],
    options({
      fetch: github(routes).fetch,
      token: token ? { name: 'GITHUB_TOKEN', value: token } : undefined,
    })
  ).catch((e: Error) => e.message)
```

8. Append a new describe block:

```ts
describe('private repositories and tokens', () => {
  const progressToken: GitHubToken = {
    name: 'PROGRESS_TOKEN',
    value: 'secret-p',
  }

  it('reads a private repository with a token', async () => {
    const routes = {
      ...repoRoutes(),
      '/repos/KhallilB/bezl': () =>
        json({ private: true, default_branch: 'trunk' }),
    }
    const { fetch, calls } = github(routes)
    const progress = await collectProgress(
      [bezl],
      options({ fetch, token: progressToken })
    )
    expect(progress.bezl.file).toEqual(goodFile())
    expect(
      calls.every((c) => c.headers.authorization === 'Bearer secret-p')
    ).toBe(true)
  })

  it.each([
    [
      progressToken,
      'the repository was not found, or PROGRESS_TOKEN cannot read it.',
    ],
    [
      { name: 'GITHUB_TOKEN', value: 'secret-g' } as GitHubToken,
      'the repository was not found, or GITHUB_TOKEN cannot read it; private repositories need PROGRESS_TOKEN.',
    ],
    [
      undefined,
      'the repository was not found, or no token is set; private repositories need PROGRESS_TOKEN.',
    ],
  ])('on a 404 names the token in use (case %#)', async (token, message) => {
    const { fetch } = github({
      ...repoRoutes(),
      '/repos/KhallilB/bezl': missing,
    })
    const error = await collectProgress(
      [bezl],
      options({ fetch, token })
    ).catch((e: Error) => e.message)
    expect(error).toContain(`"bezl" (KhallilB/bezl): ${message}`)
    if (token) expect(error).not.toContain(token.value)
  })
})

describe('chooseToken', () => {
  it('prefers PROGRESS_TOKEN', () => {
    expect(chooseToken({ PROGRESS_TOKEN: 'p', GITHUB_TOKEN: 'g' })).toEqual({
      name: 'PROGRESS_TOKEN',
      value: 'p',
    })
  })

  it('skips an empty PROGRESS_TOKEN, as Actions passes an unset secret', () => {
    expect(chooseToken({ PROGRESS_TOKEN: '', GITHUB_TOKEN: 'g' })).toEqual({
      name: 'GITHUB_TOKEN',
      value: 'g',
    })
  })

  it('has no token when both are empty or unset', () => {
    expect(
      chooseToken({ PROGRESS_TOKEN: '', GITHUB_TOKEN: '' })
    ).toBeUndefined()
    expect(chooseToken({})).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/progress/fetch.test.ts`
Expected: FAIL: `chooseToken is not a function`; the private repository is refused with `the repository is not public`; the 404 message is the old `missing or private` one; `since` is `2026-07-24…`; `authorization` is `Bearer [object Object]`.

- [ ] **Step 3: Implement**

Replace the whole of `app/portfolio/progress/fetch.ts` with:

```ts
import { classifyCommit } from '../domain/activity'
import { addDays } from '../domain/dates'
import {
  ACTIVITY_DAYS,
  validateCommits,
  validateProgress,
  type Commit,
  type ProjectProgress,
} from '../domain/progress'
import type { IsoDay } from '../domain/types'

export interface Registered {
  slug: string
  repo: string
}

export interface GitHubToken {
  name: 'PROGRESS_TOKEN' | 'GITHUB_TOKEN'
  value: string
}

export interface CollectOptions {
  buildDay: IsoDay
  // Fixtures stand in for GitHub in dev and e2e.
  offline: boolean
  fetch: typeof globalThis.fetch
  token?: GitHubToken
  readFixture: (slug: string) => Promise<unknown>
}

const API = 'https://api.github.com'
const PAGE_SIZE = 100
const MAX_PAGES = 50
const TIMEOUT_MS = 15_000

// Actions passes an unset secret as '', so empty values are skipped.
export function chooseToken(
  env: Record<string, string | undefined>
): GitHubToken | undefined {
  for (const name of ['PROGRESS_TOKEN', 'GITHUB_TOKEN'] as const) {
    const value = env[name]
    if (value) return { name, value }
  }
  return undefined
}

interface ApiCommit {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { date: string } | null
    committer?: { date: string } | null
  }
}

// Any failure throws: the build stops rather than show a partial ledger.
export async function collectProgress(
  projects: Registered[],
  options: CollectOptions
): Promise<Record<string, ProjectProgress>> {
  const collected: Record<string, ProjectProgress> = {}
  const failures: string[] = []
  for (const project of projects) {
    try {
      collected[project.slug] = options.offline
        ? await fromFixture(project, options)
        : await fromGitHub(project, options)
    } catch (error) {
      failures.push(`"${project.slug}" (${project.repo}): ${describe(error)}`)
    }
  }
  if (failures.length > 0) throw new Error(failures.join('\n'))
  return collected
}

async function fromFixture(
  { slug }: Registered,
  options: CollectOptions
): Promise<ProjectProgress> {
  const data = await options.readFixture(slug)
  if (data === undefined) {
    throw new Error(
      `no offline fixture. Add app/portfolio/progress/fixtures/${slug}.json.`
    )
  }
  const { file, commits } = (data ?? {}) as {
    file?: unknown
    commits?: unknown
  }
  return checkProgress(slug, file, commits, options.buildDay)
}

async function fromGitHub(
  { slug, repo }: Registered,
  options: CollectOptions
): Promise<ProjectProgress> {
  const get = (path: string, accept = 'application/vnd.github+json') =>
    options.fetch(`${API}${path}`, {
      headers: headers(accept, options.token),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

  const about = await get(`/repos/${repo}`)
  if (about.status === 404) {
    throw new Error(
      `the repository was not found, or ${cannotRead(options.token)}.`
    )
  }
  if (!about.ok)
    throw new Error(unexpected(about, 'the repository', options.token))
  const { default_branch: branch } = (await about.json()) as {
    default_branch?: string
  }
  if (!branch) {
    throw new Error('GitHub named no default branch for the repository. Retry.')
  }

  const raw = await get(
    `/repos/${repo}/contents/progress.json?ref=${encodeURIComponent(branch)}`,
    'application/vnd.github.raw+json'
  )
  if (raw.status === 404) {
    throw new Error(
      `there is no progress.json on ${branch}. Add one that follows schema/progress.v1.json.`
    )
  }
  if (!raw.ok) throw new Error(unexpected(raw, 'progress.json', options.token))
  let file: unknown
  try {
    file = JSON.parse(await raw.text())
  } catch {
    throw new Error(
      `progress.json on ${branch} is not valid JSON. Fix it and push.`
    )
  }
  const commits = await recentCommits(repo, branch, options, get)
  return checkProgress(slug, file, commits, options.buildDay)
}

async function recentCommits(
  repo: string,
  branch: string,
  { buildDay, token }: CollectOptions,
  get: (path: string) => Promise<Response>
): Promise<Commit[]> {
  const query = new URLSearchParams({
    sha: branch,
    since: `${addDays(buildDay, 1 - ACTIVITY_DAYS)}T00:00:00Z`,
    until: `${buildDay}T23:59:59Z`,
    per_page: String(PAGE_SIZE),
  })
  const commits: Commit[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await get(`/repos/${repo}/commits?${query}&page=${page}`)
    if (!response.ok) {
      throw new Error(unexpected(response, 'the commit history', token))
    }
    const batch: unknown = await response.json()
    if (!Array.isArray(batch)) {
      throw new Error('the commit history is not a list')
    }
    commits.push(...(batch as ApiCommit[]).map(toCommit))
    if (batch.length < PAGE_SIZE) return commits
  }
  throw new Error(`the commit history runs past ${MAX_PAGES} pages`)
}

function toCommit(c: ApiCommit): Commit {
  const sha = c.sha.slice(0, 7)
  // GitHub's since/until window filters on the committer date.
  const stamp = c.commit.committer?.date ?? c.commit.author?.date
  if (!stamp) throw new Error(`commit ${sha} has no date`)
  const subject = c.commit.message.split('\n')[0] || '(no message)'
  return {
    sha,
    date: stamp.slice(0, 10),
    type: classifyCommit(subject),
    subject,
    url: c.html_url,
  }
}

export function checkProgress(
  slug: string,
  file: unknown,
  commits: unknown,
  buildDay: IsoDay
): ProjectProgress {
  const errors = [
    ...validateProgress(file, { slug, buildDay }),
    ...validateCommits(commits, slug),
  ]
  if (errors.length > 0) {
    throw new Error(`fails the progress contract:\n  ${errors.join('\n  ')}`)
  }
  return { file, commits } as ProjectProgress
}

// Names the variable in use, never its value.
function cannotRead(token?: GitHubToken): string {
  if (!token) return 'no token is set; private repositories need PROGRESS_TOKEN'
  if (token.name === 'PROGRESS_TOKEN') return 'PROGRESS_TOKEN cannot read it'
  return `${token.name} cannot read it; private repositories need PROGRESS_TOKEN`
}

function unexpected(
  response: Response,
  what: string,
  token?: GitHubToken
): string {
  const head = `GitHub answered ${response.status} for ${what}`
  if (response.status === 401) {
    return token
      ? `${head}: ${token.name} was rejected. Replace it; it may have expired.`
      : `${head}: the request was rejected.`
  }
  if (response.status === 403 || response.status === 429) {
    const hint = token ? '' : ' Set GITHUB_TOKEN to raise the limit.'
    return `${head}: rate limited. Retry later.${hint}`
  }
  return `${head}. Retry.`
}

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause instanceof Error ? error.cause.message : ''
  return cause ? `${error.message} (${cause})` : error.message
}

function headers(accept: string, token?: GitHubToken): Record<string, string> {
  return {
    accept,
    'user-agent': 'kcb.pro-build',
    'x-github-api-version': '2022-11-28',
    ...(token ? { authorization: `Bearer ${token.value}` } : {}),
  }
}
```

In `scripts/progress-fetch.ts`, change the fetch import to `import { chooseToken, collectProgress } from '../app/portfolio/progress/fetch'` and `token: process.env.GITHUB_TOKEN,` to `token: chooseToken(process.env),`.

- [ ] **Step 4: Run them and see them pass**

Run: `npx vitest run --config vitest.config.ts app/portfolio/progress scripts && bun run typecheck`
Expected: PASS.

- [ ] **Step 5: Build against the live files with each token**

```bash
PROGRESS_TOKEN=$(gh auth token) bun run build
PROGRESS_TOKEN= GITHUB_TOKEN=$(gh auth token) bun run build
```

Expected: both succeed with `Progress from GitHub for bezl, kbui as of …` (Bezl is still public at this point; after the owner makes it private, only a token that can read it works).

- [ ] **Step 6: Run the gate, then commit**

```bash
git add app/portfolio/progress/fetch.ts app/portfolio/progress/fetch.test.ts scripts/progress-fetch.ts
git commit -S -m "feat(progress): read private repositories with PROGRESS_TOKEN"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 12: Pass `PROGRESS_TOKEN` to the CI build

**Test-first exception:** workflow YAML has no unit test here. Verification: the file parses and the Build step carries both variables; PR #131's CI run after Task 15's push is the end-to-end proof.

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add the variable**

In `.github/workflows/ci.yml`, replace the Build step's `env:` block:

```yaml
env:
  # Anonymous calls share the runner IP's 60 requests an hour.
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

with:

```yaml
env:
  # Reads private project repositories; empty on forks, which fall back to GITHUB_TOKEN.
  PROGRESS_TOKEN: ${{ secrets.PROGRESS_TOKEN }}
  # Anonymous calls share the runner IP's 60 requests an hour.
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Check it**

```bash
bun -e "const ci = Bun.YAML.parse(await Bun.file('.github/workflows/ci.yml').text()); console.log(Object.keys(ci.jobs.gate.steps.find((s) => s.name === 'Build').env).join(','))"
```

Expected: `PROGRESS_TOKEN,GITHUB_TOKEN`. (If this Bun lacks `Bun.YAML`, run `ruby -ryaml -e 'puts YAML.load_file(".github/workflows/ci.yml")["jobs"]["gate"]["steps"].find { |s| s["name"] == "Build" }["env"].keys.join(",")'` instead; same expected output.)

- [ ] **Step 3: Run the gate, then commit**

```bash
git add .github/workflows/ci.yml
git commit -S -m "ci: pass PROGRESS_TOKEN to the build for private repositories"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 13: Docs

**Test-first exception:** documentation only. Verification: every command and message quoted in the docs is checked against the code below, and the gate still passes.

**Files:**

- Modify: `docs/content.md`, `docs/architecture.md`, `docs/deploying.md`

- [ ] **Step 1: `docs/content.md`**

1. In the Projects field table, replace the `repo` row and add a `goal` row after it:

```markdown
| `repo` | Optional. The GitHub repository as `owner/name`, such as `KhallilB/bezl`. Registers the project's progress (below). A private repository needs `PROGRESS_TOKEN` ([deploying](deploying.md#reading-private-repositories)). |
| `goal` | Required with `repo`. One sentence on where the project is heading: 1 to 140 characters once trimmed, no line breaks. It heads the project's "Where it stands" card. |
```

2. Replace everything from `## Progress ledgers` up to (not including) `## Studies` with:

````markdown
## Progress

A listed project with a `repo` is **registered**. Its page shows a **Where it stands**
card under the header and **The full record** after the brief, instead of the empty
build log. The build fills both from `progress.json` at the root of the repository's
default branch, plus the last 12 weeks (84 days) of that branch's commits.

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

Outcomes only. Each result reads as a word, with a mark whose shape also carries it:

| `result`  | Word        | Mark    |
| --------- | ----------- | ------- |
| `pass`    | Done        | filled  |
| `partial` | In progress | half    |
| `not-run` | Up next     | empty   |
| `fail`    | Rethinking  | crossed |

- **Where it stands:** the project's `goal`; one mark per subject, ordered Done, In
  progress, Up next, Rethinking, and oldest first within each; counts such as "3 done
  · 1 in progress · 2 up next" (empty groups left out); "Next: <title>", the first Up
  next step or else the first In progress one; the build day; and "Quiet since
  <date>" when the newest entry is more than 30 days old.
- **The full record**, closed until opened: one row per subject in the same order,
  with its mark and word, title, summary and date, then that subject's earlier
  entries, newest first. Every entry keeps its `id` as an anchor. A link such as
  `/work/bezl#2026-10-22-pty-throughput` opens the record at that entry once the page
  has loaded; without JavaScript the record stays closed. Under the rows, a 12-week
  table of commit squares with its total.

### What never ships

`kind`, `passMark`, `measured`, `evidence`, `commit`, commit hashes and commit
messages are checked by the build but never published. The fetch writes only `id`,
`subject`, `date`, `title`, `result` and `summary` per entry, plus a count of commits
per day (`toPublic()` in `app/portfolio/domain/progress.ts`), and the pages load
nothing else. A `build-data/` file with any other field fails the build. A browser
test scans the built pages and bundle for private fixture text.

The build fails, naming the project and the fix, if a registered repository cannot be
found or read (a private one needs `PROGRESS_TOKEN`), has no `progress.json` on its
default branch, breaks a rule above, or GitHub cannot be reached or refuses (a
rejected token, a rate limit). A failed fetch leaves no stale `build-data/` behind.

`bun run dev` and the browser tests read `app/portfolio/progress/fixtures/<slug>.json`
(`{ "file": …, "commits": […] }`) instead of GitHub and trim them the same way. A newly
registered project needs a fixture there too; the unit tests and the offline build
fail without one.
````

3. In "What the build checks", add after `- **`repo`is`owner/name`.**`:

```markdown
- **A project with a `repo` has a `goal`** of one line, 1 to 140 characters.
```

and, in the bullet `**Every registered project has a valid `progress.json`**`, change `Progress ledgers` to `Progress`.

- [ ] **Step 2: `docs/architecture.md`**

1. Replace the `progress.ts` and `activity.ts` bullets under "`app/portfolio/domain`" with:

```markdown
- `progress.ts`: the `progress.json` contract and its rules; `toPublic()`, the only
  shape a page ships (outcomes and daily commit counts), and the check that built data
  has exactly that shape; the status words (`STATUS_WORD`); and the views built on it:
  the latest entry per subject, the journey order, the next step, counts and a
  project's overall result.
- `activity.ts`: commit types and the 12-week activity grid.
- `text.ts`: the one-line rule shared by an entry's `summary` and a project's `goal`.
```

2. Replace the `fetch.ts`, `load.ts` and `fixtures/` bullets under "`app/portfolio/progress`" with:

```markdown
- `fetch.ts`: fetches `progress.json` (from the default branch) and the last 84 days
  of commits from GitHub, or reads the offline fixtures, and refuses anything that
  breaks the contract. It authenticates with the first non-empty of `PROGRESS_TOKEN`
  and `GITHUB_TOKEN`, so private repositories work. Each request has a 15 s timeout
  and there are no retries: any failure fails the build. `scripts/progress-fetch.ts`
  runs it and writes each project's `toPublic()` to `build-data/` (gitignored).
- `load.ts`: checks that each file in `build-data/` has exactly the public shape, and
  keys it by slug.
- `fixtures/`: offline stand-ins for dev and the browser tests, trimmed the same way.
```

3. Replace the `components/Ledger.tsx` bullet with:

```markdown
- `components/Journey.tsx` ("Where it stands"), `FullRecord.tsx` ("The full record",
  which opens itself when the URL hash names one of its entries) and `Activity.tsx`:
  progress on a project page. `progress-data.ts` loads `build-data/` for both entry
  points.
```

4. In the Tests table, change the e2e row's "What it proves" to: `The prerendered build works in Chromium: navigation, toggle, layout, the progress card and record built from offline fixtures, and a scan that no private progress field reaches the pages or the bundle.`
5. In "Where does my change go?", add a row after "Change a page's layout or add a page":

```markdown
| Change how progress reads on a page | `app/site/components/Journey.tsx`, `FullRecord.tsx` |
```

- [ ] **Step 3: `docs/deploying.md`**

1. In "When it runs", replace item 1 (wrapped over lines 10–14 of the file) with:

```markdown
1. **gate** builds the site once, fetching each registered project's `progress.json`
   from GitHub with `PROGRESS_TOKEN` (or, when that secret is empty, the workflow's own
   `GITHUB_TOKEN`), then runs lint, the typecheck, and the unit, integration and
   browser tests. It also checks that the Bezl and kbui pages built with their "Where
   it stands" card (`id="progress"`), so a build without progress never reaches the
   deploy artifact.
```

Replace the whole item: the old wording crosses line breaks (for example, line 13 ends `pages built with their Progress section (`id="progress"`), so a build without the` and line 14 begins `ledger never reaches the deploy artifact.`), so a single-line search will not match. In "Progress data and the daily build", change `The ledgers on project pages are baked in` (all on one line) to `Progress on project pages is baked in`. 2. Replace `` `GITHUB_TOKEN` is provided by Actions; there is no secret to set. `` with:

````markdown
`GITHUB_TOKEN` is provided by Actions and reads public repositories only. Private
ones need `PROGRESS_TOKEN` (below).

### Reading private repositories

The build authenticates with the first non-empty of `PROGRESS_TOKEN` and
`GITHUB_TOKEN`, and never prints either.

To create `PROGRESS_TOKEN`:

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained
   tokens** → Generate new token.
2. Resource owner `KhallilB`. Pick an expiry and put the date in your calendar: the
   build fails the day it lapses.
3. Repository access: only `KhallilB/bezl` (add `KhallilB/kbui` if you like; it is
   public, so it does not need it).
4. Permissions: Repository → **Contents: Read-only** and **Metadata: Read-only**.
   Nothing else.
5. Save it as the repo secret (the command prompts for the value):

   ```bash
   gh secret set PROGRESS_TOKEN --repo KhallilB/kcb.pro
   ```
````

6. Run the workflow by hand on `main` (see above) and check it passes. Then make the
   project repository private and run it again.

How failures show up in the Build step:

| What happened                           | The build says                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `PROGRESS_TOKEN` expired or was revoked | `GitHub answered 401 for the repository: PROGRESS_TOKEN was rejected.`                                    |
| The secret was removed (falls back)     | `the repository was not found, or GITHUB_TOKEN cannot read it; private repositories need PROGRESS_TOKEN.` |
| The token cannot see that repository    | `the repository was not found, or PROGRESS_TOKEN cannot read it.`                                         |

Replace an expired token the same way and re-run the workflow.

````

3. In "The setup, for reference", change the `Repo secret` row to:

```markdown
| Repo secrets          | `CLOUDFLARE_API_TOKEN`, `PROGRESS_TOKEN` (`GITHUB_TOKEN` is automatic) |
````

and add after the paragraph that follows the table:

```markdown
Nothing a page shows is private, but anything on it can be scraped. Cloudflare's
AI-crawler blocking (dashboard → the `kcb.pro` zone → Security → Bots) deters
crawlers; it does not prevent copying. It is not set in code.
```

4. In "Deploying by hand", change `export GITHUB_TOKEN=$(gh auth token)` to `export PROGRESS_TOKEN=$(gh auth token)`.

- [ ] **Step 4: Check the docs against the code**

```bash
grep -n "was rejected. Replace it\|cannot read it; private repositories need PROGRESS_TOKEN\|PROGRESS_TOKEN cannot read it" app/portfolio/progress/fetch.ts
grep -ni "90 days\|Filter\|Pass mark\|Evidence (\|Recent commits\|All commits on GitHub\|ledger\|not public\|Progress section" docs/*.md README.md
bunx prettier --check docs/content.md docs/architecture.md docs/deploying.md
```

Expected: the first command finds the three messages in `fetch.ts`; the second prints nothing; prettier reports the files formatted (run `bunx prettier --write` on them if not, then re-check).

- [ ] **Step 5: Run the gate, then commit**

```bash
git add docs/content.md docs/architecture.md docs/deploying.md
git commit -S -m "docs: progress as a journey, the public shape and PROGRESS_TOKEN"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

---

### Task 14: Point plan 1b at `PublicProgress` and `STATUS_WORD`

**Test-first exception:** plan text only. Verification: the grep in Step 3.

**Files:**

- Modify: `/Users/khallil/proj/kcb.pro/.claude/worktrees/spec-progress-ledger/docs/superpowers/plans/2026-10-22-progress-ledger-1b.md`

All edits are in that file. Work in `/Users/khallil/proj/kcb.pro/.claude/worktrees/spec-progress-ledger`.

- [ ] **Step 1: Edit the prerequisites and Task 0**

1. In "Runs after plan 1a has merged", replace the `progress.ts` bullet and the `useSite()` bullet with:

```markdown
- `app/portfolio/domain/progress.ts`: `ProgressResult`, `PublicEntry` (`id`, `subject`, `date`, `title`, `result`, optional `summary`), `PublicProgress` (`{ entries, days }`), `toPublic(full, buildDay)`, `current(entries, day)` (latest per subject on or before `day`, newest first), `overallSeal(entries, day)`, and `STATUS_WORD` (`pass` Done, `partial` In progress, `not-run` Up next, `fail` Rethinking), the words 2D uses.
- `useSite()` provides `progress: Record<string, PublicProgress>` and `asOf`. Entries are `progress[slug].entries`; the site never holds pass marks, evidence or commit messages.
```

and replace the last bullet (`2D ledger entries render with id …`) with:

```markdown
- Every entry id is an element `id` on `/work/<slug>`, inside the closed `<details id="record">` ("The full record"). After hydration, and on every client navigation, an effect opens the record when the hash names one of its entries and scrolls it into view, so a seal link lands on a visible row.
```

2. In Task 0 Step 4's checklist, replace item 1 with:

```markdown
1. `progress.ts` exports `ProgressResult`, `PublicEntry`, `PublicProgress`, `toPublic`, `current`, `overallSeal` and `STATUS_WORD`, and `useSite().progress` reaches entries as `p.entries`. Task 7 uses these names. Read 1a's `progress.test.ts` to confirm two behaviours. First, `current()` returns entries **newest first**. If it returns oldest first, Task 7's `chapter()` must sort by `date` descending before `.slice(0, 3)`. Second, `overallSeal()` returns `null`, not `undefined`, when there are no entries. If it returns `undefined`, Task 7 must write `?? null` after it.
```

replace item 5 with:

```markdown
5. 1a exports `STATUS_WORD`. Task 7 imports it, so 2D and the seals use the same words; there is no `RESULT_WORD`.
```

and replace item 6 with:

```markdown
6. `app/portfolio/progress/fixtures/bezl.json` and `kbui.json` each have at least one entry. Task 7's e2e check relies on this. The build trims them with `toPublic`, and `fixtureProgress` already holds `PublicProgress`; any new test data is built with `publicEntry()` / `publicProgress()` from `app/portfolio/domain/fixtures.ts`, or `toPublic(...)`.
```

Also change the `grep -rn "Pass\|Partial\|Not run\|label" app/portfolio/domain/progress.ts | head` line in Step 4's command block to `grep -n "STATUS_WORD\|PublicProgress\|PublicEntry" app/portfolio/domain/progress.ts`.

- [ ] **Step 2: Edit Task 7, Task 8 and the docs task**

1. Task 7 Step 1: change the import line to `import type { ProgressResult, PublicEntry } from '@app/portfolio/domain/progress'` and replace the `entry` builder with:

```ts
const entry = (
  id: string,
  subject: string,
  date: string,
  result: ProgressResult
): PublicEntry => ({ id, subject, date, title: `Title ${id}`, result })
```

2. In Task 7's expected seals, change `word: 'Pass'` to `word: 'Done'` (twice) and `word: 'Not run'` to `word: 'Up next'`; in the More work expectation change `['more-1', 'partial', 'Partial']` to `['more-1', 'partial', 'In progress']`.
3. Task 7 Step 3: replace the import block and the `RESULT_WORD` constant with:

```ts
import {
  current,
  overallSeal,
  STATUS_WORD,
  type ProgressResult,
  type PublicEntry,
} from '@app/portfolio/domain/progress'
```

delete the sentence `If Task 0 Step 4 found a 1a result-word export, …`, change `entries: ProgressEntry[]` to `entries: PublicEntry[]` in `chapter()` and `entries: Record<string, ProgressEntry[]> = {}` to `entries: Record<string, PublicEntry[]> = {}` in `tomeData()`, and change both `RESULT_WORD[` to `STATUS_WORD[`. 4. Task 7 Step 4: replace the `TomeStage` snippet with:

```ts
import type { PublicProgress } from '@app/portfolio/domain/progress'

const entriesBySlug = (progress: Record<string, PublicProgress>) =>
  Object.fromEntries(
    Object.entries(progress).map(([slug, p]) => [slug, p.entries])
  )
```

5. Task 8, after the sentence that begins `` `how-it-works` is the id `Brief` gives ``, add:

```markdown
For an entry id, 1a's record opens itself on the hash change in an effect that runs before `seek`'s first animation frame, so `seek` finds a laid-out row. The record also scrolls the row into view; the second scroll is harmless.
```

6. Task 9 Step 7's first manual check: change `result word on the right` to `status word on the right` and `the 2D Progress section of` to `the 2D "Where it stands" card and full record of`. Add a bullet: `- A seal for a superseded subject is never shown: seals use current entries only, as the 2D record does.`
7. Task 10 Step 1's `the-tome.md` bullet. The text is wrapped across lines 2805–2808 of plan 1b, so the match crosses line breaks. Replace these four lines:

```markdown
- Each chapter page shows the project's three most recent checked results, newest
  first, each with a wax seal and its result word: green pass, amber partial, red
  fail, a hollow ring for not run. Each seal also carries a tick, bar or cross, so
  colour is never the only cue. Click one to open that entry on the project's page.
```

with:

```markdown
- Each chapter page shows the project's three most recent checked results, newest
  first, each with a wax seal and its status word: green Done, amber In progress,
  red Rethinking, a hollow ring for Up next. Each seal also carries a tick, bar or
  cross, so colour is never the only cue. Click one to open that entry on the
  project's page.
```

8. Task 1's Bezl `book` copy (about line 373 of plan 1b) still quotes the old measurements. Replace `'Three terminals took a 20 MB stream each with no bytes lost and 2 ms typing latency. Memory is the open question.',` with `'Terminal output reaches the window with nothing lost, and typing echoes instantly. Memory is the open question.',` so it matches what this plan's Task 4b puts in `app/tome/copy.ts`.

- [ ] **Step 3: Check, then commit**

```bash
cd /Users/khallil/proj/kcb.pro/.claude/worktrees/spec-progress-ledger
grep -nE "ProjectProgress|file\.entries|RESULT_WORD|resultLabel|ProgressEntry|'Pass'|'Not run'|'Partial'|20 MB|result word" docs/superpowers/plans/2026-10-22-progress-ledger-1b.md
```

Expected: no output. Then:

```bash
git add docs/superpowers/plans/2026-10-22-progress-ledger-1b.md
git commit -S -m "docs(plan): plan 1b reads the public progress shape and STATUS_WORD"
git cat-file commit HEAD | grep -c 'BEGIN SSH SIGNATURE'
```

Expected: `1`. Do not push this branch: `worktree/*` branches are local scratch.

---

### Task 15: Push to PR #131 and verify every signature

**Files:** none changed.

- [ ] **Step 1: Confirm the branch is ready**

```bash
cd /Users/khallil/proj/kcb.pro/.claude/worktrees/feat-progress-ledger-1a
git status --short
git log --oneline c2e5fb1..HEAD
for sha in $(git rev-list c2e5fb1..HEAD); do printf '%s ' "${sha:0:7}"; git cat-file commit "$sha" | grep -c 'BEGIN SSH SIGNATURE'; done
git log --format='%an <%ae>%n%b' c2e5fb1..HEAD | grep -ci 'co-authored-by\|claude\|anthropic\|codex' || true
```

Expected: no uncommitted changes; 14 commits (Tasks 1–13 and 4b); every commit prints `1`; the last command prints `0`.

- [ ] **Step 2: Run the gate one last time, plus an online build**

Run the online build with `PROGRESS_TOKEN=$(gh auth token)`, then the gate. Expected: all green.

- [ ] **Step 3: Push**

```bash
git push https://github.com/KhallilB/kcb.pro.git feat/progress-ledger
```

Expected: `c2e5fb1..<new head>  feat/progress-ledger -> feat/progress-ledger`, no force.

- [ ] **Step 4: Verify every new commit on GitHub**

```bash
for sha in $(git rev-list c2e5fb1..HEAD); do
  gh api "repos/KhallilB/kcb.pro/git/commits/$sha" --jq '"\(.sha[0:7]) \(.verification.verified) \(.verification.reason)"'
done
```

Expected: every line ends `true valid`. If any does not, rewrite that commit with the correct identity and SSH signature, push again (force-with-lease only after asking the owner), and re-check. Local `--show-signature` output does not count.

- [ ] **Step 5: Watch CI**

```bash
gh pr checks 131 --repo KhallilB/kcb.pro --watch
```

Expected: `gate` passes (it fetches the live files with `GITHUB_TOKEN`, since `PROGRESS_TOKEN` does not exist yet) and the preview deploy succeeds. Open the preview URL from the run summary at `/work/bezl` and check the card, the closed record, and `/work/bezl#<an entry id>` opening it.

- [ ] **Step 6: Refresh the PR description**

The repository has no PR template. Update #131's body with `gh pr edit 131 --repo KhallilB/kcb.pro --body-file <file>` so it describes the amendment: the spec link, the journey card and full record, outcomes-only public data (`toPublic`, strict loader, leak scan), `goal` and `summary`, private repositories and `PROGRESS_TOKEN`, the owner's post-merge steps from `docs/deploying.md#reading-private-repositories`, and the checks actually run in Steps 2–5. No AI attribution.

---

## Spec coverage

| Spec item                                                                                    | Task(s)           |
| -------------------------------------------------------------------------------------------- | ----------------- |
| `summary`: trimmed, 1–140, no `\n`/`\r`; required on `partial`                               | 2                 |
| Schema and conformance corpus gain `summary` and the partial rule                            | 2                 |
| kcb.pro fixtures get summaries first; live files checked before the rule                     | 1, 2 (Step 1)     |
| `PublicEntry`, `PublicProgress`, `toPublic` (file order, dense 84 days)                      | 5                 |
| Fetch validates full data, then writes `toPublic(...)`                                       | 10                |
| `loadProgress` validates the public shape, rejects unknown keys                              | 10                |
| `fixture-progress.ts` and offline mode go through `toPublic`                                 | 10                |
| `useSite().progress` is `PublicProgress`; views accept `PublicEntry`                         | 5, 10             |
| `STATUS_WORD`, group order, Next rule                                                        | 5                 |
| Journey card (heading `id="progress"`, goal, step line, counts, Next, as of, quiet)          | 7, 9              |
| Full record (rows, earlier lines with ids, activity, open on hash)                           | 8, 9              |
| No hydration mismatch; direct load and client navigation open the record                     | 8 (unit), 9 (e2e) |
| Removed: filters, commit list, evidence, measured, pass mark, commit links, All commits link | 6, 9              |
| Empty activity text; 84-day commit window                                                    | 6, 11             |
| Private repos; token choice; 404/401 messages; never printed                                 | 11                |
| `goal` field, validation, drafts                                                             | 3                 |
| Bezl Source link removed                                                                     | 4                 |
| No measurements in public copy (owner decision after review)                                 | 4b                |
| CI `PROGRESS_TOKEN`                                                                          | 12                |
| e2e: card before brief, record collapsed, leak scan                                          | 9, 10             |
| `docs/deploying.md` token, scopes, expiry, failure messages                                  | 13                |
| Plan 1b follow-up                                                                            | 14                |
