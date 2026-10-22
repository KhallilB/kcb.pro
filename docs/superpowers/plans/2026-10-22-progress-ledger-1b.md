# Progress Ledger 1b: Generated Book and Wax Seals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The 3D book generates its chapters, contents, ribbons, places and More work sheet from content, and each chapter page shows wax seals for the project's latest checked results.

**Architecture:** A pure `app/tome/layout.ts` `layoutBook()` decides every page, number, colour, ribbon, place and spread label. A golden test pins it to today's hand-laid book before `engine.js` reads it. `copy.ts` turns content plus progress entries into `TomeData` (chapters by rank, More work rows, seals, `book: layoutBook(...)`). `engine.js` keeps painting, geometry and interaction. Places come from content (`place.ts`), and validation guards the new `book` copy and slugs the book keeps for itself.

**Tech Stack:** TypeScript, React 19, React Router 7, Three.js r128 (`engine.js`, untyped, dense single-line style), Vitest + Testing Library (jsdom), Playwright (stub engine), Bun.

**Spec:** `docs/superpowers/specs/2026-10-22-progress-ledger-design.md`, section "3D: the generated book (plan 1b)".

**Runs after plan 1a has merged.** 1a provides, and this plan uses without re-implementing:

- `app/portfolio/domain/progress.ts`: `ProgressResult`, `ProgressEntry`, `current(entries, day)` (latest per subject on or before `day`, newest first), `overallSeal(entries, day)`, `ProjectProgress` (`{ file: { entries, ... }, commits, ... }`).
- `useSite()` provides `progress: Record<string, ProjectProgress>` and `asOf`.
- `Project.repo?: string`, `Project.rank?: 1 | 2 | 3`, and `featured(projects)`, which returns ranked listed endeavors ordered by rank (Bezl 1, kbui 2).
- 2D ledger entries render with `id` equal to the entry id on `/work/<slug>`.

---

## Conventions for every task

- Work only in `/Users/khallil/proj/kcb.pro/.claude/worktrees/feat-progress-ledger-1b` (Task 0 creates it). All paths below are relative to it.
- **TDD:** write the failing test, run it and see it fail for the stated reason, write the minimal code, then see it pass. `engine.js` cannot be unit tested: headless browsers cannot render the WebGL book, and e2e uses a stub engine. Engine changes are refactors guarded by the golden test (Task 4) and the manual browser checks the task names. Task 5, Task 6 and Task 9 record this test-first exception.
- **Single test file:** `npx vitest run --config vitest.config.ts <path>`
- **The gate** (every commit must pass it on its own):

  ```bash
  bun run lint && bun run typecheck && bun run build && bun run test && bun run test:integration && bun run test:e2e
  ```

  Expected: each command exits 0. Vitest reports `Test Files  N passed`, and Playwright reports `N passed`. If `bun run build` needs network for the progress fetch (1a) and you are offline, prefix it with `PROGRESS_OFFLINE=1`.

- **Style:** TS/TSX files use 2 spaces, single quotes, no semicolons. Run `bunx prettier --write <touched .ts/.tsx files>`. **Never run prettier on `app/tome/engine.js`:** it is dense single-line JS on purpose, so match the lines around each edit by hand.
- **Comments:** at most one line, and only for an intent, invariant or constraint.
- **Commits:** `git commit -S`, Conventional Commits subject, no `Co-authored-by` and no AI attribution of any kind.

## File structure

| File                                                | Responsibility                                                                                  | Task                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------- |
| `app/portfolio/domain/types.ts`                     | `BookLine`, `BookCopy`, `Project.book?`                                                         | 1                   |
| `app/portfolio/domain/book.ts` (new)                | `RESERVED_SLUGS`, `BOOK_LIMITS`: what the book keeps for itself and its page limits             | 1                   |
| `app/portfolio/domain/validate.ts`                  | book copy rules, reserved slugs for ranked projects                                             | 1                   |
| `app/portfolio/domain/fixtures.ts`                  | `bookCopy()`, `shelf()` test builders                                                           | 1, 3                |
| `app/portfolio/content/projects.ts`                 | Bezl and kbui `book` copy (moved from `copy.ts`)                                                | 1                   |
| `app/portfolio/domain/catalog.ts`                   | `unranked()`: listed endeavors with no chapter                                                  | 2                   |
| `app/tome/place.ts`                                 | places from content: `placesOf`, `placeOfPath` (with `more-work`), `pathOfPlace`, `TOME_PLACES` | 2                   |
| `app/site/pages/Home.tsx`                           | `data-place="more-work"` on the All work link                                                   | 2                   |
| `app/tome/copy.ts`                                  | `TomeData`: chapters by rank, generated About, More work rows, seals, `book`                    | 3, 5, 7             |
| `app/tome/layout.ts` (new)                          | pure `layoutBook()`; dyes by role                                                               | 4                   |
| `app/tome/layout.test.ts` (new)                     | golden test plus every book shape                                                               | 4                   |
| `app/tome/engine.js`                                | reads `data.book`; More work and All work painters; wax seals                                   | 3 (bridge), 5, 6, 9 |
| `app/site/components/TomeStage.tsx`                 | passes catalog and progress; keeps the hash on navigation                                       | 3, 7, 8             |
| `app/site/tome.test.tsx`, `tests/e2e/smoke.spec.ts` | updated for generated chapters, the hash, the stub                                              | 2, 3, 5, 7, 8       |
| `docs/the-tome.md`, `docs/content.md`               | describe the generated book, seals, `book` and `rank`                                           | 10                  |

---

### Task 0: Worktree, 1a interfaces and baseline

**Files:** none changed. Nothing is committed in this task.

- [ ] **Step 1: Confirm plan 1a has merged**

```bash
git -C /Users/khallil/proj/kcb.pro fetch origin
git -C /Users/khallil/proj/kcb.pro log origin/main --oneline -15
```

Expected: the 1a merge (progress contract, ingestion, 2D ledger) is on `origin/main`. If it is not, stop: this plan depends on it.

- [ ] **Step 2: Create the worktree and the PR branch**

```bash
cd /Users/khallil/proj/kcb.pro
git worktree add .claude/worktrees/feat-progress-ledger-1b -b worktree/feat-progress-ledger-1b origin/main
cd .claude/worktrees/feat-progress-ledger-1b
git switch -c feat/progress-ledger-book
bun install --frozen-lockfile
```

Expected: `Switched to a new branch 'feat/progress-ledger-book'`, and install finishes without lockfile changes. The `worktree/...` branch is scratch only and is never pushed.

- [ ] **Step 3: Prove signing and GitHub access before any commit**

```bash
git config user.name; git config user.email
git config commit.gpgsign; git config gpg.format; git config user.signingkey
gh api repos/KhallilB/kcb.pro --jq .full_name
```

Expected: your name and email, `true`, `ssh`, a key path or key, and `KhallilB/kcb.pro`. If any check fails, fix identity, signing or `gh auth` first, and do not commit until all of them pass.

- [ ] **Step 4: Record the exact 1a names this plan uses**

```bash
grep -n "^export" app/portfolio/domain/progress.ts
grep -n "rank\|repo" app/portfolio/domain/types.ts
grep -n -A8 "export function featured" app/portfolio/domain/catalog.ts
grep -n "progress" app/site/site.ts app/site/site-context.tsx app/main.tsx app/entry-server.tsx
grep -n "more-work\|fixed place\|reserved" app/portfolio/domain/validate.ts
grep -rn "Pass\|Partial\|Not run\|label" app/portfolio/domain/progress.ts | head
ls app/portfolio/progress/fixtures
```

Check each of the following, and adapt the named step if 1a differs:

1. `progress.ts` exports `ProgressResult`, `ProgressEntry`, `current`, `overallSeal` and `ProjectProgress`, and `ProjectProgress` reaches entries as `p.file.entries`. Task 7 uses these names. Read 1a's `progress.test.ts` to confirm two behaviours. First, `current()` returns entries **newest first**. If it returns oldest first, Task 7's `chapter()` must sort by `date` descending before `.slice(0, 3)`. Second, `overallSeal()` returns `null`, not `undefined`, when there are no entries. If it returns `undefined`, Task 7 must write `?? null` after it.
2. `Project.rank?: 1 | 2 | 3` exists, and `featured()` filters to listed endeavors with a rank, sorted by rank.
3. `useSite()` returns `progress`, and the value is created once at module level (for example in `main.tsx`), not per render. `TomeStage` lists it in an effect's dependencies (Task 7); a new object on every render would rebuild the book.
4. Find whether 1a already refuses a ranked slug equal to a fixed place. If so, Task 1 Step 3 **extends that check** to the full `RESERVED_SLUGS` list and moves the list into `domain/book.ts`, instead of adding a second check.
5. If 1a exports a word for each result (for example `resultLabel` or `RESULT_LABEL`), Task 7 imports it instead of defining `RESULT_WORD`, so 2D badges and 3D seals use the same words.
6. `app/portfolio/progress/fixtures/bezl.json` and `kbui.json` each have at least one entry. Task 7's e2e check relies on this.

- [ ] **Step 5: Run the gate on the untouched branch**

Run the gate (see Conventions). Expected: all green. If anything fails here, it is a 1a problem; fix it before changing code.

- [ ] **Step 6: Capture the hand-laid book as a visual baseline**

```bash
bun run build
PORT=4199 bun scripts/serve-build.ts
```

Open `http://127.0.0.1:4199/` in a real browser with WebGL (Chrome) at a fixed window size (for example 1440×900). Open the book and screenshot each spread from 1 to 6 (arrow right), plus the closed book with its ribbons. Save the screenshots outside the repo, for example `~/Desktop/tome-baseline/`. Task 5 compares against them. Stop the server with Ctrl-C.

---

### Task 1: `book` copy on projects, validated

**Files:**

- Create: `app/portfolio/domain/book.ts`
- Modify: `app/portfolio/domain/types.ts`, `app/portfolio/domain/validate.ts`, `app/portfolio/domain/fixtures.ts`, `app/portfolio/content/projects.ts`
- Test: `app/portfolio/domain/validate.test.ts`, `app/portfolio/content/content.test.ts` (unchanged; it goes red, then green)

- [ ] **Step 1: Add the types and the fixture builder** (types only, so the tests can compile)

In `app/portfolio/domain/types.ts`, above `export interface Project`:

```ts
// One labelled line of chapter copy.
export type BookLine = [label: string, text: string]

export interface BookCopy {
  notes: BookLine[]
  facts: BookLine[]
}
```

Inside `Project`, after `listed?: boolean`:

```ts
  // The chapter's notes and facts in the book; required once ranked.
  book?: BookCopy
```

In `app/portfolio/domain/fixtures.ts`, change the type import to `import type { BookCopy, Catalog, Project, Study } from './types'` and add:

```ts
export function bookCopy(overrides: Partial<BookCopy> = {}): BookCopy {
  return {
    notes: [['The idea', 'One short note.']],
    facts: [
      ['Built with', 'TypeScript'],
      ['Data', 'Local'],
      ['Started', 'Jan 2027'],
    ],
    ...overrides,
  }
}
```

- [ ] **Step 2: Write the failing validation tests**

Append to `app/portfolio/domain/validate.test.ts`. Change its imports to `import { bookCopy, catalog, project, study } from './fixtures'` and `import type { Project } from './types'`:

```ts
describe('book copy', () => {
  const ranked = (overrides: Partial<Project> = {}) =>
    project({ rank: 1, book: bookCopy(), ...overrides })

  it('accepts a ranked project with its book copy', () => {
    expect(validateCatalog(catalog([ranked()]))).toEqual([])
  })

  it('refuses a ranked project with no book copy', () => {
    expect(validateCatalog(catalog([ranked({ book: undefined })]))).toContain(
      '"alpha" is ranked but has no book copy'
    )
  })

  it.each([
    'contents',
    'about',
    'more-work',
    'studies',
    'contact',
    'colophon',
    'finis',
  ])(
    'refuses a ranked project named "%s", a page the book keeps for itself',
    (slug) => {
      expect(validateCatalog(catalog([ranked({ slug })]))).toContain(
        `"${slug}" is ranked, but the book keeps "${slug}" for a page of its own`
      )
    }
  )

  it('lets an unranked project use one of those names', () => {
    expect(validateCatalog(catalog([project({ slug: 'contact' })]))).toEqual([])
  })

  it('refuses a chapter summary its page would clip', () => {
    expect(
      validateCatalog(catalog([ranked({ summary: 'x'.repeat(71) })]))
    ).toContain(
      '"alpha" summary is over 70 characters, so its chapter page would clip it'
    )
    expect(
      validateCatalog(catalog([ranked({ summary: 'x'.repeat(70) })]))
    ).toEqual([])
  })

  it('leaves the summary of an unranked project alone', () => {
    expect(
      validateCatalog(catalog([project({ summary: 'x'.repeat(90) })]))
    ).toEqual([])
  })

  it('needs exactly three facts', () => {
    const book = bookCopy({ facts: [['Built with', 'TypeScript']] })
    expect(validateCatalog(catalog([ranked({ book })]))).toContain(
      '"alpha" book needs exactly 3 facts'
    )
  })

  it('allows at most three notes', () => {
    const note: [string, string] = ['Note', 'Short.']
    const book = bookCopy({ notes: [note, note, note, note] })
    expect(validateCatalog(catalog([ranked({ book })]))).toContain(
      '"alpha" book has more than 3 notes'
    )
  })

  it('refuses a note longer than its page holds', () => {
    const book = bookCopy({ notes: [['Long', 'x'.repeat(191)]] })
    expect(validateCatalog(catalog([ranked({ book })]))).toContain(
      '"alpha" book note "Long" is over 190 characters'
    )
  })

  it('finds placeholder text in book copy', () => {
    const book = bookCopy({ notes: [['Plan', 'TODO later']] })
    expect(validateCatalog(catalog([ranked({ book })])).join('\n')).toMatch(
      /placeholder/i
    )
  })
})
```

- [ ] **Step 3: Run the tests and see them fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/validate.test.ts`
Expected: FAIL. The new `book copy` tests fail, for example `expected [] to include '"alpha" is ranked but has no book copy'`. The tests that expect `[]` pass already.

- [ ] **Step 4: Implement the rules**

Create `app/portfolio/domain/book.ts`:

```ts
// Names the book keeps for its own places and pages; a ranked slug may not take one.
export const RESERVED_SLUGS: readonly string[] = [
  'contents',
  'about',
  'more-work',
  'studies',
  'contact',
  'exlibris',
  'finis',
  'moreWork',
  'moreWorkBack',
  'studyNotes',
  'colophon',
]

// Past these the chapter pages overflow or clip.
export const BOOK_LIMITS = {
  facts: 3,
  notes: 3,
  note: 190,
  summary: 70,
} as const
```

In `app/portfolio/domain/validate.ts`, import `import { BOOK_LIMITS, RESERVED_SLUGS } from './book'` and change the type import to `import type { BriefSection, Catalog, Project } from './types'`. Add this function above `validateCatalog`:

```ts
function bookErrors(p: Project): string[] {
  const errors: string[] = []
  if (p.rank !== undefined) {
    if (RESERVED_SLUGS.includes(p.slug)) {
      errors.push(
        `"${p.slug}" is ranked, but the book keeps "${p.slug}" for a page of its own`
      )
    }
    if (!p.book) errors.push(`"${p.slug}" is ranked but has no book copy`)
    if (p.summary.length > BOOK_LIMITS.summary) {
      errors.push(
        `"${p.slug}" summary is over ${BOOK_LIMITS.summary} characters, so its chapter page would clip it`
      )
    }
  }
  if (!p.book) return errors
  if (p.book.facts.length !== BOOK_LIMITS.facts) {
    errors.push(`"${p.slug}" book needs exactly ${BOOK_LIMITS.facts} facts`)
  }
  if (p.book.notes.length > BOOK_LIMITS.notes) {
    errors.push(`"${p.slug}" book has more than ${BOOK_LIMITS.notes} notes`)
  }
  for (const [label, text] of p.book.notes) {
    if (text.length > BOOK_LIMITS.note) {
      errors.push(
        `"${p.slug}" book note "${label}" is over ${BOOK_LIMITS.note} characters`
      )
    }
  }
  return errors
}
```

In `validateCatalog`'s project loop, include the book text in the placeholder scan by changing the `texts(...)` call's field list to:

```ts
      [
        p.title, p.summary, p.about, p.role, p.domain, p.signature, ...p.stack,
        ...(p.book ? [...p.book.notes, ...p.book.facts].flat() : []),
      ],
```

At the end of the same loop body, add `errors.push(...bookErrors(p))`. If Task 0 Step 4 found a 1a fixed-place check, delete it now. `bookErrors` replaces it with the full list, and the test above pins the message. Also delete 1a's `validate.test.ts` cases that pin the old message: the `it.each` above covers the same rule. Without that, this commit fails the gate.

- [ ] **Step 5: Run the validation tests and see them pass**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/validate.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the content test and see it fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/content/content.test.ts`
Expected: FAIL in `passes every catalog rule, hidden entries included`, with `"bezl" is ranked but has no book copy` and `"kbui" is ranked but has no book copy`.

- [ ] **Step 7: Move the chapter copy into the content**

In `app/portfolio/content/projects.ts`, in the `bezl` entry, add this directly after its `links: [...]` line. The text is copied verbatim from `app/tome/copy.ts`; keep the curly apostrophes.

```ts
    book: {
      notes: [
        [
          'The problem',
          'Several AI coding assistants on one codebase step on each other, and afterwards nobody can say who changed what.',
        ],
        [
          'One writer',
          'Each task has one assistant that may write and any number that may only read, held in place by each tool’s own sandbox.',
        ],
        [
          'Proven so far',
          'Three terminals took a 20 MB stream each with no bytes lost and 2 ms typing latency. Memory is the open question.',
        ],
      ],
      facts: [
        ['Built with', 'Tauri · Rust · React'],
        ['Data', 'On your machine'],
        ['Started', 'Oct 2026'],
      ],
    },
```

In the `kbui` entry, directly after its `links: [...]` line:

```ts
    book: {
      notes: [
        [
          'The idea',
          'One set of tokens, plain CSS that any framework can render, and a thin React layer for behaviour.',
        ],
        [
          'The contract',
          'Each stylesheet opens with an anatomy line naming its classes and attributes. The build fails when it is missing.',
        ],
        [
          'Checked',
          'Every story is rendered in a real browser and scanned for accessibility problems on each run.',
        ],
      ],
      facts: [
        ['Built with', 'CSS · React · Base UI'],
        ['Used by', 'loupe; Bezl planned'],
        ['Started', 'Oct 2026'],
      ],
    },
```

`app/tome/copy.ts` still has its own copy of this text until Task 3; that is expected.

- [ ] **Step 8: Run the content test and see it pass**

Run: `npx vitest run --config vitest.config.ts app/portfolio/content/content.test.ts`
Expected: PASS.

- [ ] **Step 9: Run the gate, then commit**

Run the gate. Expected: all green.

```bash
bunx prettier --write app/portfolio/domain/book.ts app/portfolio/domain/types.ts app/portfolio/domain/validate.ts app/portfolio/domain/validate.test.ts app/portfolio/domain/fixtures.ts app/portfolio/content/projects.ts
git add app/portfolio/domain/book.ts app/portfolio/domain/types.ts app/portfolio/domain/validate.ts app/portfolio/domain/validate.test.ts app/portfolio/domain/fixtures.ts app/portfolio/content/projects.ts
git commit -S -m "feat(domain): give ranked projects validated book copy"
```

---

### Task 2: Places derived from content

**Files:**

- Modify: `app/portfolio/domain/catalog.ts`, `app/tome/place.ts`, `app/site/pages/Home.tsx`
- Test: `app/portfolio/domain/catalog.test.ts`, `app/tome/place.test.ts`, `app/site/tome.test.tsx`

- [ ] **Step 1: Write the failing `unranked` test**

In `app/portfolio/domain/catalog.test.ts`, add `unranked` to the import from `./catalog`, and inside `describe('catalog', ...)` add:

```ts
it('leaves listed endeavors with no rank for More work, in work-index order', () => {
  const ranked = project({ slug: 'ranked', rank: 1 })
  const hidden = project({ slug: 'hidden', listed: false })
  expect(
    unranked([done, ranked, later, site, hidden, building]).map((p) => p.slug)
  ).toEqual(['building', 'later', 'done'])
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run --config vitest.config.ts app/portfolio/domain/catalog.test.ts`
Expected: FAIL with `unranked is not a function`.

- [ ] **Step 3: Implement `unranked`**

In `app/portfolio/domain/catalog.ts`, after `featured`:

```ts
// Listed endeavors with no chapter: the book's More work.
export function unranked(projects: Project[]): Project[] {
  return workIndex(
    projects.filter(
      (p) => p.kind === 'endeavor' && p.listed !== false && p.rank === undefined
    )
  )
}
```

Run the same command. Expected: PASS.

- [ ] **Step 4: Rewrite the place tests**

Replace `app/tome/place.test.ts` with:

```ts
import { bookCopy, project } from '@app/portfolio/domain/fixtures'
import { pathOfPlace, placeOfPath, placesOf, TOME_PLACES } from './place'

describe('the book page a site page belongs to', () => {
  it.each([
    ['/about', 'about'],
    ['/work/bezl', 'bezl'],
    ['/work/kbui', 'kbui'],
    ['/studies', 'studies'],
    ['/studies/map-labels', 'studies'],
  ])('%s opens the book at %s', (path, place) => {
    expect(placeOfPath(path)).toBe(place)
  })

  it.each(['/', '/work', '/work/gallery', '/work/wander', '/nowhere'])(
    '%s has no page of its own',
    (path) => {
      expect(placeOfPath(path)).toBeNull()
    }
  )
})

describe('places when some listed work has no chapter', () => {
  const projects = [
    project({ slug: 'alpha', rank: 1, book: bookCopy() }),
    project({ slug: 'beta' }),
    project({ slug: 'site', kind: 'site' }),
    project({ slug: 'hidden', listed: false }),
  ]

  it('puts More work between the chapters and the studies', () => {
    expect(placesOf(projects)).toEqual([
      'contents',
      'about',
      'alpha',
      'more-work',
      'studies',
      'contact',
    ])
  })

  it.each([
    ['/work/alpha', 'alpha'],
    ['/work/beta', 'more-work'],
    ['/work', 'more-work'],
    ['/work/site', null],
    ['/work/hidden', null],
  ])('%s opens the book at %s', (path, place) => {
    expect(placeOfPath(path, projects)).toBe(place)
  })

  it('sends More work back to the work index', () => {
    expect(pathOfPlace('more-work')).toBe('/work')
  })
})

describe('the page a book place belongs to', () => {
  it('names today’s places from the content', () => {
    expect(TOME_PLACES).toEqual([
      'contents',
      'about',
      'bezl',
      'kbui',
      'studies',
      'contact',
    ])
  })

  it.each(TOME_PLACES.filter((place) => pathOfPlace(place)))(
    '%s round-trips through its page',
    (place) => {
      expect(placeOfPath(pathOfPlace(place)!)).toBe(place)
    }
  )

  it.each(['contents', 'contact'])('%s stays on the list', (place) => {
    expect(pathOfPlace(place)).toBeNull()
  })
})
```

- [ ] **Step 5: Run it and see it fail**

Run: `npx vitest run --config vitest.config.ts app/tome/place.test.ts`
Expected: FAIL with `placesOf is not a function`, and `/work/beta` returns `null` instead of `more-work`.

- [ ] **Step 6: Implement the content-derived places**

Replace `app/tome/place.ts` with:

```ts
import { content } from '@app/portfolio/content'
import { featured, unranked } from '@app/portfolio/domain/catalog'
import type { Project } from '@app/portfolio/domain/types'

// A reader's place, named the same in the book and on the list: a fixed place or a ranked slug.
export type TomePlace = string

export function placesOf(projects: Project[]): TomePlace[] {
  const more = unranked(projects).length > 0 ? ['more-work'] : []
  return [
    'contents',
    'about',
    ...featured(projects).map((p) => p.slug),
    ...more,
    'studies',
    'contact',
  ]
}

export const TOME_PLACES: readonly TomePlace[] = placesOf(content.projects)

export function placeOfPath(
  pathname: string,
  projects: Project[] = content.projects
): TomePlace | null {
  const [, section, slug] = pathname.split('/')
  if (section === 'about' && !slug) return 'about'
  if (section === 'studies') return 'studies'
  if (section !== 'work') return null
  const more = unranked(projects)
  if (!slug) return more.length > 0 ? 'more-work' : null
  if (featured(projects).some((p) => p.slug === slug)) return slug
  if (more.some((p) => p.slug === slug)) return 'more-work'
  return null
}

// The 2D page that says what a book place says; null where the list itself is that page.
export function pathOfPlace(place: TomePlace): string | null {
  if (place === 'about') return '/about'
  if (place === 'studies') return '/studies'
  if (place === 'more-work') return '/work'
  if (place === 'contents' || place === 'contact') return null
  return `/work/${place}`
}
```

Run the same command. Expected: PASS.

- [ ] **Step 7: Write the failing home test for More work**

In `app/site/tome.test.tsx`, inside `describe('the tome on the home page', ...)`, after `lands the list on the chapter the book was open at`:

```tsx
it('lands the list on the All work link when the book was at More work', async () => {
  const scrolled: Element[] = []
  Element.prototype.scrollIntoView ??= () => {}
  const scroll = vi
    .spyOn(Element.prototype, 'scrollIntoView')
    .mockImplementation(function (this: Element) {
      scrolled.push(this)
    })
  const { hooks } = fakeEngine('mount', 'more-work')
  await visit('/', hooks)
  fireEvent.click(option('List'))
  await waitFor(() => expect(scrolled).toHaveLength(1))
  expect(scrolled[0]).toHaveAttribute('href', '/work')
  scroll.mockRestore()
})
```

Run: `npx vitest run --config vitest.config.ts app/site/tome.test.tsx`
Expected: FAIL. `waitFor` times out because `scrolled` has length 0: no element carries `data-place="more-work"`.

- [ ] **Step 8: Mark the All work link**

In `app/site/pages/Home.tsx`, add `data-place="more-work"` to the `<Link to="/work" ...>` that reads "All work". Keep it wherever 1a placed the link.

Run the same command. Expected: PASS.

- [ ] **Step 9: Run the gate, then commit**

```bash
bunx prettier --write app/portfolio/domain/catalog.ts app/portfolio/domain/catalog.test.ts app/tome/place.ts app/tome/place.test.ts app/site/pages/Home.tsx app/site/tome.test.tsx
git add app/portfolio/domain/catalog.ts app/portfolio/domain/catalog.test.ts app/tome/place.ts app/tome/place.test.ts app/site/pages/Home.tsx app/site/tome.test.tsx
git commit -S -m "feat(tome): derive book places from content, with More work"
```

---

### Task 3: Chapters, About and More work rows generated in `copy.ts`

**Files:**

- Modify: `app/tome/copy.ts`, `app/tome/engine.js:143` (one-line bridge), `app/site/components/TomeStage.tsx`, `app/portfolio/domain/fixtures.ts`, `tests/e2e/smoke.spec.ts`
- Test: `app/tome/copy.test.ts`, `app/site/tome.test.tsx`

- [ ] **Step 1: Add the `shelf` builder**

Append to `app/portfolio/domain/fixtures.ts`:

```ts
// Ranked Alpha, Beta, Gamma, then unranked endeavors: a book of any shape.
export function shelf(chapters: number, more = 0): Project[] {
  return [
    ...['Alpha', 'Beta', 'Gamma'].slice(0, chapters).map((title, i) =>
      project({
        slug: title.toLowerCase(),
        title,
        order: i + 1,
        rank: (i + 1) as 1 | 2 | 3,
        book: bookCopy(),
      })
    ),
    ...Array.from({ length: more }, (_, i) =>
      project({ slug: `more-${i + 1}`, title: `More ${i + 1}`, order: 10 + i })
    ),
  ]
}
```

- [ ] **Step 2: Rewrite the copy tests**

Replace `app/tome/copy.test.ts` with:

```ts
import { content } from '@app/portfolio/content'
import { featured, sitePaths } from '@app/portfolio/domain/catalog'
import {
  bookCopy,
  catalog,
  project,
  shelf,
} from '@app/portfolio/domain/fixtures'
import { hasPlaceholder } from '@app/portfolio/domain/validate'
import { tomeData } from './copy'

const data = tomeData(content, '2026-10-21')

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object')
    return Object.values(value).flatMap(strings)
  return []
}

describe('tome data', () => {
  it('gives each ranked endeavor a chapter, in rank order', () => {
    expect(data.chapters.map((c) => c.slug)).toEqual(
      featured(content.projects).map((p) => p.slug)
    )
    expect(data.chapters.map((c) => c.title)).toEqual(['Bezl', 'kbui'])
  })

  it('orders chapters by rank, not by season', () => {
    const books = catalog([
      project({ slug: 'first', order: 1, rank: 2, book: bookCopy() }),
      project({ slug: 'second', order: 2, rank: 1, book: bookCopy() }),
    ])
    expect(tomeData(books, '2026-10-21').chapters.map((c) => c.slug)).toEqual([
      'second',
      'first',
    ])
  })

  it('takes each chapter’s notes and facts from its project’s book copy', () => {
    featured(content.projects).forEach((p, i) => {
      expect(data.chapters[i].notes).toEqual(p.book?.notes)
      expect(data.chapters[i].facts).toEqual(p.book?.facts)
    })
  })

  it('dates each chapter with the same status line the site shows', () => {
    expect(data.chapters.map((c) => c.status)).toEqual([
      'In progress · as of 21 Oct 2026',
      'In progress · as of 21 Oct 2026',
    ])
    expect(data.asOf).toBe('21 October 2026')
  })

  it('names what is being built now', () => {
    expect(data.nowBuilding).toBe('Bezl')
  })

  it('writes About from the chapter titles', () => {
    expect(data.about[0]).toBe(
      'I build web apps that do real work. This book gives a chapter each to Bezl and kbui.'
    )
  })

  it.each([
    [
      1,
      0,
      'I build web apps that do real work. This book gives a chapter to Alpha.',
    ],
    [
      3,
      0,
      'I build web apps that do real work. This book gives a chapter each to Alpha, Beta and Gamma.',
    ],
    [
      2,
      1,
      'I build web apps that do real work. This book gives a chapter each to Alpha and Beta, then lists the rest of my work.',
    ],
  ])('writes About for %i chapters and %i more', (chapters, more, text) => {
    expect(
      tomeData(catalog(shelf(chapters, more)), '2026-10-21').about[0]
    ).toBe(text)
  })

  it('lists listed endeavors with no rank as More work, linked to their pages', () => {
    const books = catalog([
      ...shelf(1),
      project({ slug: 'beta', title: 'Beta', summary: 'Second thing.' }),
    ])
    expect(tomeData(books, '2026-10-21').moreWork).toEqual([
      {
        slug: 'beta',
        title: 'Beta',
        summary: 'Second thing.',
        path: '/work/beta',
      },
    ])
  })

  it('moves kbui to More work when its rank is removed', () => {
    const projects = content.projects.map((p) =>
      p.slug === 'kbui' ? { ...p, rank: undefined } : p
    )
    const book = tomeData({ ...content, projects }, '2026-10-21')
    expect(book.chapters.map((c) => c.slug)).toEqual(['bezl'])
    expect(book.moreWork.map((r) => r.slug)).toEqual(['kbui'])
  })

  it('never names a hidden project', () => {
    const text = strings(data).join(' ')
    for (const name of ['Deck Workshop', 'Mugen Arena', 'Wander']) {
      expect(text).not.toContain(name)
    }
  })

  it('links every study to a page the site prerenders', () => {
    const paths = sitePaths(content)
    expect(data.studies).toHaveLength(3)
    for (const s of data.studies) expect(paths).toContain(s.path)
  })

  it('carries no placeholder text anywhere', () => {
    expect(strings(data).filter(hasPlaceholder)).toEqual([])
  })

  it('says what each chapter is in the catalog’s own words, with no sample data', () => {
    featured(content.projects).forEach((p, i) => {
      expect(data.chapters[i].about).toBe(p.about)
      expect(Object.keys(data.chapters[i])).toEqual([
        'slug',
        'title',
        'summary',
        'about',
        'status',
        'notes',
        'facts',
      ])
    })
  })
})
```

The old "three facts and at most three notes" test is removed on purpose: `validateCatalog` enforces those limits now (Task 1).

- [ ] **Step 3: Run the tests and see them fail**

Run: `npx vitest run --config vitest.config.ts app/tome/copy.test.ts`
Expected: FAIL. The whole file errors when it loads: the module-level `tomeData(content, '2026-10-21')` call passes the catalog where the old signature expects a day, so `formatDay` throws `Not an ISO day: [object Object]`. That is the signature change this task makes.

- [ ] **Step 4: Rewrite `copy.ts`**

Replace everything in `app/tome/copy.ts` above `const STUDY_NOTES` with the code below. Keep `STUDY_NOTES` exactly as it is, and replace `tomeData` as shown.

```ts
import { profile } from '@app/portfolio/content'
import { featured, nowBuilding, unranked } from '@app/portfolio/domain/catalog'
import { formatLongDay, formatMonth } from '@app/portfolio/domain/dates'
import { formatLabel, statusLine } from '@app/portfolio/domain/status'
import type {
  BookLine,
  Catalog,
  IsoDay,
  Project,
} from '@app/portfolio/domain/types'

export interface Chapter {
  slug: string
  title: string
  summary: string
  about: string
  status: string
  notes: BookLine[]
  facts: BookLine[]
}

export interface MoreWorkRow {
  slug: string
  title: string
  summary: string
  path: string
}

export interface TomeData {
  name: string
  role: string
  asOf: string
  nowBuilding: string
  about: string[]
  contactLine: string
  github: { label: string; href: string }
  studies: {
    slug: string
    title: string
    short: string
    why: string
    when: string
    format: string
    path: string
  }[]
  // Ranked endeavors, by rank.
  chapters: Chapter[]
  moreWork: MoreWorkRow[]
}

function chapter(p: Project, asOf: IsoDay): Chapter {
  // validateCatalog guarantees book copy; this stops a bad build from painting blank pages.
  if (!p.book) throw new Error(`Chapter "${p.slug}" needs book copy`)
  return {
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    about: p.about,
    status: statusLine(p, asOf),
    notes: p.book.notes,
    facts: p.book.facts,
  }
}

// "A", "A and B", "A, B and C".
function series(names: string[]): string {
  if (names.length < 2) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function aboutBook(titles: string[], more: boolean): string {
  const lead = 'I build web apps that do real work.'
  if (titles.length === 0) return lead
  const each = titles.length > 1 ? ' each' : ''
  const rest = more ? ', then lists the rest of my work' : ''
  return `${lead} This book gives a chapter${each} to ${series(titles)}${rest}.`
}
```

```ts
export function tomeData(catalog: Catalog, asOf: IsoDay): TomeData {
  const live = nowBuilding(catalog.projects)
  const chapters = featured(catalog.projects).map((p) => chapter(p, asOf))
  const moreWork = unranked(catalog.projects).map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    path: `/work/${p.slug}`,
  }))
  return {
    name: profile.name,
    role: profile.role,
    asOf: formatLongDay(asOf),
    nowBuilding: live?.title ?? 'Between projects',
    about: [
      aboutBook(
        chapters.map((c) => c.title),
        moreWork.length > 0
      ),
      'Everything here shows the date it was last true. If something isn’t finished, it says so.',
    ],
    contactLine:
      'I’m looking for frontend roles where the interface is the hard part.',
    github: { label: 'github.com/KhallilB', href: profile.github },
    studies: catalog.studies.map((s) => ({
      slug: s.slug,
      title: s.title,
      ...STUDY_NOTES[s.slug],
      when: formatMonth(s.startsOn),
      format: formatLabel(s.format),
      path: `/studies/${s.slug}`,
    })),
    chapters,
    moreWork,
  }
}
```

The `content` import, `findProject`, `project()` and the inline notes and facts are gone.

- [ ] **Step 5: Run the copy tests and see them pass**

Run: `npx vitest run --config vitest.config.ts app/tome/copy.test.ts`
Expected: PASS.

- [ ] **Step 6: Keep the engine working with a one-line bridge**

In `app/tome/engine.js`, replace exactly

```js
const D = data.chapters
```

with

```js
const D = Object.fromEntries(data.chapters.map((c) => [c.slug, c]))
```

Task 5 removes this line when the engine reads `data.book`.

- [ ] **Step 7: Pass the catalog from `TomeStage`**

In `app/site/components/TomeStage.tsx`:

- `const { asOf, tome } = useSite()` becomes `const { asOf, catalog, tome } = useSite()`
- `data: tomeData(asOf),` becomes `data: tomeData(catalog, asOf),`
- the mount effect's dependencies `[asOf, tome, engine]` become `[asOf, catalog, tome, engine]`

- [ ] **Step 8: Update the site test and the e2e stub for the chapter list**

In `app/site/tome.test.tsx`, test `hands the engine the portfolio’s own chapters`, replace

```tsx
expect(calls[0].data.chapters.kbui.title).toBe('kbui')
```

with

```tsx
expect(calls[0].data.chapters.map((c) => c.slug)).toEqual(['bezl', 'kbui'])
```

In `tests/e2e/smoke.spec.ts`, inside the stub body, replace

```js
const c = document.createElement('canvas')
c.dataset.chapters = Object.keys(opts.data.chapters).join(',')
```

with

```js
const c = document.createElement('canvas')
c.dataset.chapters = opts.data.chapters.map((ch) => ch.slug).join(',')
```

The test's expectation `'bezl,kbui'` stays.

- [ ] **Step 9: Run the site tests**

Run: `npx vitest run --config vitest.config.ts app/site/tome.test.tsx`
Expected: PASS.

- [ ] **Step 10: Run the gate, check the book by hand, then commit**

Run the gate. Expected: all green, and e2e confirms the stub receives `bezl,kbui`.

Manual: `bun run build && PORT=4199 bun scripts/serve-build.ts`, open the book, and check that the About page reads "This book gives a chapter each to Bezl and kbui." and that both chapter pages and their notes are unchanged from the Task 0 baseline. Stop the server.

```bash
bunx prettier --write app/tome/copy.ts app/tome/copy.test.ts app/portfolio/domain/fixtures.ts app/site/components/TomeStage.tsx app/site/tome.test.tsx tests/e2e/smoke.spec.ts
git add app/tome/copy.ts app/tome/copy.test.ts app/tome/engine.js app/portfolio/domain/fixtures.ts app/site/components/TomeStage.tsx app/site/tome.test.tsx tests/e2e/smoke.spec.ts
git commit -S -m "feat(tome): build chapters and About from ranked projects"
```

---

### Task 4: Pure `layoutBook()`, golden test first

**Files:**

- Create: `app/tome/layout.ts`, `app/tome/layout.test.ts`

- [ ] **Step 1: Write the golden test and the shape tests**

Create `app/tome/layout.test.ts`:

```ts
import { content } from '@app/portfolio/content'
import { featured, unranked } from '@app/portfolio/domain/catalog'
import { shelf } from '@app/portfolio/domain/fixtures'
import type { Project } from '@app/portfolio/domain/types'
import { layoutBook, MORE_WORK_DYE } from './layout'
import { pathOfPlace, placeOfPath, placesOf } from './place'

const bookOf = (projects: Project[]) =>
  layoutBook({
    chapters: featured(projects).map(({ slug, title }) => ({ slug, title })),
    moreWork: unranked(projects).map((p) => p.slug),
  })

// Copied from engine.js before the switch. Never edit these to make a change pass.
const HAND = ['#7b2a33', '#8a5a1e', '#9b2f2a', '#1e6b58', '#2f4d80', '#5e3a66']

describe('golden: today’s content lays out the hand-laid book exactly', () => {
  const book = bookOf(content.projects)
  const faces = book.sheets.flat()

  it('binds the same five sheets', () => {
    expect(book.sheets.map(([front, back]) => [front.name, back.name])).toEqual(
      [
        ['contents', 'about'],
        ['bezl', 'bezlNotes'],
        ['kbui', 'kbuiNotes'],
        ['studies', 'studyNotes'],
        ['contact', 'colophon'],
      ]
    )
  })

  it('heads, sides and numbers every page as before', () => {
    expect(
      faces.map((f) => [f.name, f.kind, f.side, f.title, f.folio])
    ).toEqual([
      ['contents', 'contents', 'R', 'Contents', 'i'],
      ['about', 'about', 'L', 'About', 'ii'],
      ['bezl', 'chapter', 'R', 'Chapter I', '1'],
      ['bezlNotes', 'notes', 'L', 'Bezl', '2'],
      ['kbui', 'chapter', 'R', 'Chapter II', '3'],
      ['kbuiNotes', 'notes', 'L', 'kbui', '4'],
      ['studies', 'studies', 'R', 'Studies', '5'],
      ['studyNotes', 'studyNotes', 'L', 'Notes', '6'],
      ['contact', 'contact', 'R', 'Contact', '7'],
      ['colophon', 'colophon', 'L', 'Colophon', '8'],
    ])
    expect(
      faces
        .filter((f) => f.kind === 'chapter' || f.kind === 'notes')
        .map((f) => f.chapter)
    ).toEqual([0, 0, 1, 1])
  })

  it('dyes every page as before', () => {
    expect(Object.fromEntries(faces.map((f) => [f.name, f.color]))).toEqual({
      contents: HAND[0],
      about: HAND[0],
      bezl: HAND[1],
      bezlNotes: HAND[1],
      kbui: HAND[2],
      kbuiNotes: HAND[2],
      studies: HAND[4],
      studyNotes: HAND[4],
      contact: HAND[5],
      colophon: HAND[5],
    })
  })

  it('lists the same contents rows with the same jumps', () => {
    expect(book.contents).toEqual([
      {
        title: 'About',
        sub: 'Who wrote this book',
        folio: 'ii',
        go: 2,
        color: HAND[0],
      },
      { title: 'Bezl', sub: 'Chapter I', folio: '1', go: 2, color: HAND[1] },
      { title: 'kbui', sub: 'Chapter II', folio: '3', go: 3, color: HAND[2] },
      {
        title: 'Work studies',
        sub: 'Three short deep dives',
        folio: '5',
        go: 4,
        color: HAND[4],
      },
      {
        title: 'Contact',
        sub: 'Where to find me',
        folio: '7',
        go: 5,
        color: HAND[5],
      },
      {
        title: 'Colophon',
        sub: 'How this book was made',
        folio: '8',
        go: 6,
        color: HAND[5],
      },
    ])
  })

  it('hangs the same five ribbons in the same spots', () => {
    expect(
      book.ribbons.map(({ label, color, sheet }) => ({ label, color, sheet }))
    ).toEqual([
      { label: 'Contents', color: HAND[0], sheet: 0 },
      { label: 'Bezl', color: HAND[1], sheet: 1 },
      { label: 'kbui', color: HAND[2], sheet: 2 },
      { label: 'Studies', color: HAND[4], sheet: 3 },
      { label: 'Contact', color: '#e6d9b8', sheet: 4 },
    ])
    book.ribbons.forEach((r, i) => expect(r.x).toBeCloseTo(0.1 + i * 0.155, 10))
  })

  it('opens at the same places', () => {
    expect(book.placeAt).toEqual({
      contents: [1, 'right'],
      about: [2, 'left'],
      bezl: [2, 'right'],
      kbui: [3, 'right'],
      studies: [4, 'right'],
      contact: [5, 'right'],
    })
    expect(Object.fromEntries(faces.map((f) => [f.name, f.place]))).toEqual({
      contents: 'contents',
      about: 'about',
      bezl: 'bezl',
      bezlNotes: 'bezl',
      kbui: 'kbui',
      kbuiNotes: 'kbui',
      studies: 'studies',
      studyNotes: 'studies',
      contact: 'contact',
      colophon: 'contact',
    })
  })

  it('announces the same seven spreads', () => {
    expect(book.spreads).toEqual([
      'The closed tome',
      'Ex libris and contents',
      'About and chapter one, Bezl',
      'Bezl notes and chapter two, kbui',
      'kbui notes and the work studies',
      'Why these studies, and contact',
      'Colophon and the last page',
    ])
  })
})

// engine.js RIBW: a ribbon's width as a share of the page.
const RIBBON_WIDTH = 0.1
const SHAPES = [1, 2, 3].flatMap((chapters) =>
  [0, 1, 6, 7, 12, 13].map((more) => [chapters, more])
)

describe.each(SHAPES)(
  'a book of %i chapters and %i more projects',
  (chapters, more) => {
    const projects = shelf(chapters, more)
    const book = bookOf(projects)
    const faces = book.sheets.flat()
    // Spread k shows the back of sheet k - 2 on the left and the front of sheet k - 1 on the right.
    const shown = (spread: number) => [
      book.sheets[spread - 2]?.[1],
      book.sheets[spread - 1]?.[0],
    ]

    it('numbers its pages in order', () => {
      expect(faces.slice(0, 2).map((f) => f.folio)).toEqual(['i', 'ii'])
      expect(faces.slice(2).map((f) => Number(f.folio))).toEqual(
        faces.slice(2).map((_, i) => i + 1)
      )
    })

    it('fits its contents page, and each row jumps to a spread showing its page', () => {
      expect(book.contents.length).toBeLessThanOrEqual(8)
      for (const row of book.contents)
        expect(shown(row.go).map((f) => f?.folio)).toContain(row.folio)
    })

    it('opens each place at a page of that place, and each place round-trips through its site page', () => {
      expect(Object.keys(book.placeAt)).toEqual(placesOf(projects))
      for (const [place, [spread, side]] of Object.entries(book.placeAt)) {
        expect(shown(spread)[side === 'left' ? 0 : 1]?.place).toBe(place)
        const path = pathOfPlace(place)
        if (path) expect(placeOfPath(path, projects)).toBe(place)
      }
    })

    it('hangs at most seven ribbons in distinct colours, all on the page and apart', () => {
      expect(book.ribbons.length).toBeLessThanOrEqual(7)
      expect(new Set(book.ribbons.map((r) => r.color)).size).toBe(
        book.ribbons.length
      )
      const xs = book.ribbons.map((r) => r.x)
      expect(Math.max(...xs) + RIBBON_WIDTH / 2).toBeLessThanOrEqual(0.95)
      xs.slice(1).forEach((x, i) =>
        expect(x - xs[i]).toBeGreaterThanOrEqual(RIBBON_WIDTH)
      )
    })

    it('announces every spread', () => {
      expect(book.spreads).toHaveLength(book.sheets.length + 2)
    })
  }
)

describe('the More work sheet', () => {
  const sheet = (more: number) =>
    bookOf(shelf(2, more)).sheets.find(([front]) => front.kind === 'moreWork')

  it('is left out when every listed endeavor has a chapter', () => {
    expect(sheet(0)).toBeUndefined()
  })

  it.each([
    [1, 1, 'allWork', 0, false],
    [6, 6, 'allWork', 0, false],
    [7, 6, 'moreWork', 1, false],
    [12, 6, 'moreWork', 6, false],
    [13, 6, 'moreWork', 5, true],
  ])(
    'with %i projects holds %i on the front and a %s page with %i rows behind',
    (more, front, kind, back, seeAll) => {
      const [f, b] = sheet(more)!
      expect(f.rows).toHaveLength(front)
      expect(b.kind).toBe(kind)
      expect(b.rows ?? []).toHaveLength(back)
      expect(b.seeAll ?? false).toBe(seeAll)
    }
  )

  it('keeps the projects in the order given', () => {
    const [f, b] = sheet(8)!
    expect([...f.rows!, ...b.rows!]).toEqual(
      Array.from({ length: 8 }, (_, i) => `more-${i + 1}`)
    )
  })

  it('takes the seventh dye, a ribbon and a contents row of its own', () => {
    const book = bookOf(shelf(3, 2))
    expect(book.ribbons.map((r) => r.label)).toEqual([
      'Contents',
      'Alpha',
      'Beta',
      'Gamma',
      'More work',
      'Studies',
      'Contact',
    ])
    expect(book.ribbons[4].color).toBe(MORE_WORK_DYE)
    expect(book.contents.map((r) => r.title)).toEqual([
      'About',
      'Alpha',
      'Beta',
      'Gamma',
      'More work',
      'Work studies',
      'Contact',
      'Colophon',
    ])
    expect(book.contents[4]).toMatchObject({
      sub: '2 more projects',
      color: MORE_WORK_DYE,
    })
  })
})

it('keeps every colour fixed by role as chapters are added', () => {
  const two = bookOf(shelf(2))
  const full = bookOf(shelf(3, 1))
  expect(full.ribbons.slice(0, 3)).toEqual(
    two.ribbons.slice(0, 3).map((r, i) => ({ ...r, x: full.ribbons[i].x }))
  )
  expect(full.ribbons.slice(-2).map((r) => r.color)).toEqual(
    two.ribbons.slice(-2).map((r) => r.color)
  )
})

it('refuses a fourth chapter', () => {
  const chapters = ['a', 'b', 'c', 'd'].map((slug) => ({ slug, title: slug }))
  expect(() => layoutBook({ chapters, moreWork: [] })).toThrow(
    'at most three chapters'
  )
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run --config vitest.config.ts app/tome/layout.test.ts`
Expected: FAIL with `Failed to resolve import "./layout"`.

- [ ] **Step 3: Implement `layoutBook()`**

Create `app/tome/layout.ts`:

```ts
// The book's plan: its pages, numbers, dyes, ribbons, places and spread labels. Pure; engine.js paints it.

export type FaceKind =
  | 'contents'
  | 'about'
  | 'chapter'
  | 'notes'
  | 'moreWork'
  | 'allWork'
  | 'studies'
  | 'studyNotes'
  | 'contact'
  | 'colophon'

export interface Face {
  // Texture key in engine.js; it also seeds the page's paper grain.
  name: string
  kind: FaceKind
  side: 'R' | 'L'
  title: string
  folio: string
  color: string
  place: string
  chapter?: number
  rows?: string[]
  seeAll?: boolean
}

export interface ContentsRow {
  title: string
  sub: string
  folio: string
  go: number
  color: string
}

export interface Ribbon {
  label: string
  color: string
  sheet: number
  x: number
}

export interface BookLayout {
  sheets: [Face, Face][]
  contents: ContentsRow[]
  ribbons: Ribbon[]
  placeAt: Record<string, [number, 'left' | 'right']>
  spreads: string[]
}

export interface BookInput {
  chapters: { slug: string; title: string }[]
  moreWork: string[]
}

// Leather dyes by role, fixed so a new chapter never recolours another.
export const SECT = [
  '#7b2a33',
  '#8a5a1e',
  '#9b2f2a',
  '#1e6b58',
  '#2f4d80',
  '#5e3a66',
]
export const MORE_WORK_DYE = '#55602c'
const CONTACT_RIBBON = '#e6d9b8'

const ROMAN = ['I', 'II', 'III']
const ORDINAL = ['one', 'two', 'three']
const ROWS_PER_PAGE = 6

type Page = Omit<Face, 'side' | 'folio'>

export function layoutBook({ chapters, moreWork }: BookInput): BookLayout {
  if (chapters.length > 3) {
    throw new Error(
      `The book holds at most three chapters, not ${chapters.length}`
    )
  }
  const sheets: [Face, Face][] = []
  // A spread reads "<lead of its left page> <open of its right page>".
  const opens: string[] = []
  const leads: string[] = []
  let page = 0
  const bind = (
    front: Page,
    back: Page,
    open: string,
    lead: string,
    folios?: [string, string]
  ) => {
    const [f, b] = folios ?? [String(++page), String(++page)]
    sheets.push([
      { ...front, side: 'R', folio: f },
      { ...back, side: 'L', folio: b },
    ])
    opens.push(open)
    leads.push(lead)
    return sheets.length - 1
  }

  const contents = bind(
    {
      name: 'contents',
      kind: 'contents',
      title: 'Contents',
      color: SECT[0],
      place: 'contents',
    },
    {
      name: 'about',
      kind: 'about',
      title: 'About',
      color: SECT[0],
      place: 'about',
    },
    'contents',
    'About and',
    ['i', 'ii']
  )
  const chapterSheets = chapters.map(({ slug, title }, i) =>
    bind(
      {
        name: slug,
        kind: 'chapter',
        title: `Chapter ${ROMAN[i]}`,
        color: SECT[1 + i],
        place: slug,
        chapter: i,
      },
      {
        name: `${slug}Notes`,
        kind: 'notes',
        title,
        color: SECT[1 + i],
        place: slug,
        chapter: i,
      },
      `chapter ${ORDINAL[i]}, ${title}`,
      `${title} notes and`
    )
  )
  let more: number | null = null
  if (moreWork.length > 0) {
    const seeAll = moreWork.length > 2 * ROWS_PER_PAGE
    const rest = moreWork.slice(
      ROWS_PER_PAGE,
      seeAll ? 2 * ROWS_PER_PAGE - 1 : undefined
    )
    const look = {
      title: 'More work',
      color: MORE_WORK_DYE,
      place: 'more-work',
    }
    more = bind(
      {
        ...look,
        name: 'moreWork',
        kind: 'moreWork',
        rows: moreWork.slice(0, ROWS_PER_PAGE),
      },
      rest.length > 0
        ? {
            ...look,
            name: 'moreWorkBack',
            kind: 'moreWork',
            rows: rest,
            seeAll,
          }
        : { ...look, name: 'moreWorkBack', kind: 'allWork', title: 'All work' },
      'more work',
      rest.length > 0 ? 'More work, continued, and' : 'All work, and'
    )
  }
  const studies = bind(
    {
      name: 'studies',
      kind: 'studies',
      title: 'Studies',
      color: SECT[4],
      place: 'studies',
    },
    {
      name: 'studyNotes',
      kind: 'studyNotes',
      title: 'Notes',
      color: SECT[4],
      place: 'studies',
    },
    'the work studies',
    'Why these studies, and'
  )
  const contact = bind(
    {
      name: 'contact',
      kind: 'contact',
      title: 'Contact',
      color: SECT[5],
      place: 'contact',
    },
    {
      name: 'colophon',
      kind: 'colophon',
      title: 'Colophon',
      color: SECT[5],
      place: 'contact',
    },
    'contact',
    'Colophon and'
  )

  // A sheet's front faces up at spread sheet + 1, its back at sheet + 2.
  const row = (
    title: string,
    sub: string,
    sheet: number,
    back = false
  ): ContentsRow => {
    const face = sheets[sheet][back ? 1 : 0]
    return {
      title,
      sub,
      folio: face.folio,
      go: sheet + (back ? 2 : 1),
      color: face.color,
    }
  }
  const count = `${moreWork.length} more ${moreWork.length === 1 ? 'project' : 'projects'}`
  const rows = [
    row('About', 'Who wrote this book', contents, true),
    ...chapters.map(({ title }, i) =>
      row(title, `Chapter ${ROMAN[i]}`, chapterSheets[i])
    ),
    ...(more === null ? [] : [row('More work', count, more)]),
    row('Work studies', 'Three short deep dives', studies),
    row('Contact', 'Where to find me', contact),
    row('Colophon', 'How this book was made', contact, true),
  ]

  const hung = [
    { label: 'Contents', color: SECT[0], sheet: contents },
    ...chapters.map(({ title }, i) => ({
      label: title,
      color: SECT[1 + i],
      sheet: chapterSheets[i],
    })),
    ...(more === null
      ? []
      : [{ label: 'More work', color: MORE_WORK_DYE, sheet: more }]),
    { label: 'Studies', color: SECT[4], sheet: studies },
    { label: 'Contact', color: CONTACT_RIBBON, sheet: contact },
  ]
  // Hand-laid spacing up to six ribbons; a seventh closes them up to stay on the page.
  const step = Math.min(0.155, 0.78 / Math.max(1, hung.length - 1))
  const ribbons = hung.map((r, i) => ({ ...r, x: 0.1 + i * step }))

  const placeAt: BookLayout['placeAt'] = {}
  sheets.forEach(([front, back], s) => {
    placeAt[front.place] ??= [s + 1, 'right']
    placeAt[back.place] ??= [s + 2, 'left']
  })

  const spreads = [
    'The closed tome',
    `Ex libris and ${opens[0]}`,
    ...leads.map((lead, s) => `${lead} ${opens[s + 1] ?? 'the last page'}`),
  ]

  return { sheets, contents: rows, ribbons, placeAt, spreads }
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `npx vitest run --config vitest.config.ts app/tome/layout.test.ts`
Expected: PASS, every golden test included. **The engine switch (Task 5) starts only after the golden tests pass.** If a golden test fails, fix `layout.ts`, never the golden values.

- [ ] **Step 5: Run the gate, then commit**

```bash
bunx prettier --write app/tome/layout.ts app/tome/layout.test.ts
git add app/tome/layout.ts app/tome/layout.test.ts
git commit -S -m "feat(tome): lay out the book in a pure layoutBook()"
```

---

### Task 5: The engine paints from `layoutBook()`

A refactor of `engine.js`. **Test-first exception:** the engine cannot be unit tested (WebGL, canvas painting). The data side is test-first (Step 1). The engine switch is guarded by the golden test (Task 4), the e2e stub, and a manual comparison with the Task 0 baseline.

**Files:**

- Modify: `app/tome/copy.ts`, `app/tome/engine.js`, `tests/e2e/smoke.spec.ts`
- Test: `app/tome/copy.test.ts`

- [ ] **Step 1: Write the failing test: the data carries the layout**

In `app/tome/copy.test.ts`, add `import { layoutBook } from './layout'` and:

```ts
it('lays the book out from its chapters and More work', () => {
  expect(data.book).toEqual(
    layoutBook({
      chapters: [
        { slug: 'bezl', title: 'Bezl' },
        { slug: 'kbui', title: 'kbui' },
      ],
      moreWork: [],
    })
  )
})
```

Run: `npx vitest run --config vitest.config.ts app/tome/copy.test.ts`
Expected: FAIL with `expected undefined to deeply equal { sheets: ... }`.

- [ ] **Step 2: Add `book` to `TomeData`**

In `app/tome/copy.ts`, add `import { layoutBook, type BookLayout } from './layout'`. Add `book: BookLayout` to `TomeData` after `moreWork`, and add this to the object `tomeData` returns, after `moreWork,`:

```ts
    book: layoutBook({
      chapters: chapters.map(({ slug, title }) => ({ slug, title })),
      moreWork: moreWork.map((r) => r.slug),
    }),
```

Run the same command. Expected: PASS.

- [ ] **Step 3: Switch `engine.js` to the layout**

Make these exact replacements in `app/tome/engine.js`. Keep the dense single-line style.

(a) Imports at the top. Replace

```js
import * as THREE from 'three'
```

with

```js
import * as THREE from 'three'
import { SECT } from './layout'
```

(b) After the line `  const { data, onList, onNavigate, insetTop } = opts;` add

```js
const LAYOUT = data.book,
  FACES = Object.fromEntries(LAYOUT.sheets.flat().map((f) => [f.name, f]))
```

(c) Delete these two lines. `SECT` now comes from `layout.ts` and only the fore-edge uses it; page colours come from `FACES`.

```js
const SECT = ['#7b2a33', '#8a5a1e', '#9b2f2a', '#1e6b58', '#2f4d80', '#5e3a66']
const FACE_COLOR = {
  contents: SECT[0],
  about: SECT[0],
  bezl: SECT[1],
  bezlNotes: SECT[1],
  kbui: SECT[2],
  kbuiNotes: SECT[2],
  studies: SECT[4],
  studyNotes: SECT[4],
  contact: SECT[5],
  colophon: SECT[5],
}
```

(d) Delete the Task 3 bridge line:

```js
const D = Object.fromEntries(data.chapters.map((c) => [c.slug, c]))
```

(e) Chapter and notes pages read their face. Replace

```js
  const chapterPage = (ctx, title, folio, d) => {
    const m = parchment(ctx, 'R', title, folio);
```

with

```js
  const chapterPage = (ctx, f, d) => {
    const m = parchment(ctx, f.side, f.title, f.folio);
```

and replace

```js
  const notesPage = (ctx, side, title, folio, d) => {
    const m = parchment(ctx, side, title, folio);
```

with

```js
  const notesPage = (ctx, f, d) => {
    const m = parchment(ctx, f.side, f.title, f.folio);
```

(f) Contents rows come from the layout. Replace

```js
    contents(ctx, hs) {
      const m = parchment(ctx, 'R', 'Contents', 'i');
      heading(ctx, m, 'Contents', 260);
      const rows = [['About', 'Who wrote this book', 'ii', 2, 0], [D.bezl.title, 'Chapter I', '1', 2, 1], [D.kbui.title, 'Chapter II', '3', 3, 2], ['Work studies', 'Three short deep dives', '5', 4, 4], ['Contact', 'Where to find me', '7', 5, 5], ['Colophon', 'How this book was made', '8', 6, 5]];
      let y = 360;
      for (const [t, s, n, go, ci] of rows) {
        ctx.fillStyle = SECT[ci]; ctx.globalAlpha = 0.9;
```

with

```js
    contents(ctx, hs, f) {
      const m = parchment(ctx, f.side, f.title, f.folio);
      heading(ctx, m, 'Contents', 260);
      let y = 360;
      for (const { title: t, sub: s, folio: n, go, color } of LAYOUT.contents) {
        ctx.fillStyle = color; ctx.globalAlpha = 0.9;
```

(g) Replace `    about(ctx) {\n      const m = parchment(ctx, 'L', 'About', 'ii');` with `    about(ctx, hs, f) {\n      const m = parchment(ctx, f.side, f.title, f.folio);`

(h) Painters by kind replace painters by slug. Replace

```js
    bezl(ctx) { chapterPage(ctx, 'Chapter I', '1', D.bezl); },
    bezlNotes(ctx) { notesPage(ctx, 'L', D.bezl.title, '2', D.bezl); },

    kbui(ctx) { chapterPage(ctx, 'Chapter II', '3', D.kbui); },
    kbuiNotes(ctx) { notesPage(ctx, 'L', D.kbui.title, '4', D.kbui); },
```

with

```js
    chapter(ctx, hs, f) { chapterPage(ctx, f, data.chapters[f.chapter]); },
    notes(ctx, hs, f) { notesPage(ctx, f, data.chapters[f.chapter]); },
```

(i) The remaining fixed pages read their face:

- `    studies(ctx, hs) {\n      const m = parchment(ctx, 'R', 'Studies', '5');` becomes `    studies(ctx, hs, f) {\n      const m = parchment(ctx, f.side, f.title, f.folio);`
- `    studyNotes(ctx) {\n      const m = parchment(ctx, 'L', 'Notes', '6');` becomes `    studyNotes(ctx, hs, f) {\n      const m = parchment(ctx, f.side, f.title, f.folio);`
- `    contact(ctx, hs) {\n      const m = parchment(ctx, 'R', 'Contact', '7');` becomes `    contact(ctx, hs, f) {\n      const m = parchment(ctx, f.side, f.title, f.folio);`
- `    colophon(ctx) {\n      const m = parchment(ctx, 'L', 'Colophon', '8');` becomes `    colophon(ctx, hs, f) {\n      const m = parchment(ctx, f.side, f.title, f.folio);`

`exlibris` and `finis` stay as they are; they have no face in the layout.

(j) `redraw` picks the painter by kind. Replace

```js
curColor = FACE_COLOR[name] || null
curName = name
curSide = null
faceHs[name] = []
faces[name](ctx, faceHs[name])
```

with

```js
const face = FACES[name]
curColor = face ? face.color : null
curName = name
curSide = null
faceHs[name] = []
faces[face ? face.kind : name](ctx, faceHs[name], face)
```

(k) Sheets and ribbons. Replace

```js
const SHEETS = [
  ['contents', 'about'],
  ['bezl', 'bezlNotes'],
  ['kbui', 'kbuiNotes'],
  ['studies', 'studyNotes'],
  ['contact', 'colophon'],
]
```

with

```js
const SHEETS = LAYOUT.sheets.map(([f, b]) => [f.name, b.name])
```

and replace

```js
const CHAPTERS = [
  { label: 'Contents', color: SECT[0], sheet: 0 },
  { label: 'Bezl', color: SECT[1], sheet: 1 },
  { label: 'kbui', color: SECT[2], sheet: 2 },
  { label: 'Studies', color: SECT[4], sheet: 3 },
  { label: 'Contact', color: '#e6d9b8', sheet: 4 },
]
```

with

```js
const CHAPTERS = LAYOUT.ribbons
```

(l) In `const ribbons = CHAPTERS.map(...)`, replace `ribX: 0.1 + i * 0.155,` with `ribX: ch.x,`.

(m) Replace the `const SPREADS = [...]` line with `  const SPREADS = LAYOUT.spreads;`.

(n) Places. Replace

```js
const PLACE_AT = {
  contents: [1, 'right'],
  about: [2, 'left'],
  bezl: [2, 'right'],
  kbui: [3, 'right'],
  studies: [4, 'right'],
  contact: [5, 'right'],
}
const FACE_PLACE = {
  contents: 'contents',
  about: 'about',
  bezl: 'bezl',
  bezlNotes: 'bezl',
  kbui: 'kbui',
  kbuiNotes: 'kbui',
  studies: 'studies',
  studyNotes: 'studies',
  contact: 'contact',
  colophon: 'contact',
}
```

with

```js
const PLACE_AT = LAYOUT.placeAt
```

and in `placeNow()` replace

```js
return (
  FACE_PLACE[(portrait() && focus === 'left') || !right ? left : right] || null
)
```

with

```js
const face = FACES[(portrait() && focus === 'left') || !right ? left : right]
return face ? face.place : null
```

(o) Check that no hand-laid names remain:

```bash
grep -n "FACE_COLOR\|FACE_PLACE\|D\.bezl\|D\.kbui\|const D = \|'Chapter I'" app/tome/engine.js
```

Expected: no output.

- [ ] **Step 4: Have the e2e stub report the generated sheets**

In `tests/e2e/smoke.spec.ts`, in the stub body after the `c.dataset.chapters = ...` line, add

```js
c.dataset.sheets = opts.data.book.sheets.map(([front]) => front.name).join(',')
```

In `the tome opens over the home page and steps aside for the list`, after the `data-chapters` expectation, add

```ts
await expect(page.locator('.tome[data-ready] canvas')).toHaveAttribute(
  'data-sheets',
  'contents,bezl,kbui,studies,contact'
)
```

- [ ] **Step 5: Run the gate**

Expected: all green. Vite resolves `./layout` from `engine.js` to `layout.ts`, so `bun run build` must succeed. A build error naming `./layout` means the import path is wrong.

- [ ] **Step 6: Manual check: the book is unchanged**

```bash
bun run build
PORT=4199 bun scripts/serve-build.ts
```

At the same window size as Task 0, open `http://127.0.0.1:4199/`, open the book, and compare every spread from 1 to 6 and the closed book with the baseline screenshots. Check that:

- page heads, page numbers, the coloured edge strip and title diamonds are identical
- contents rows have the same colours, numbers and dotted leaders, and each row jumps to its page
- five ribbons hang in the same colours and positions, the hover tip names each one, and clicking a ribbon opens its chapter
- arrow keys, Home and End work, and a screen reader's live region announces the same spread labels (inspect `.sr-only` in DevTools)
- on `/work/kbui`, pressing 3D opens at kbui; turning to Bezl and pressing 2D lands on `/work/bezl`

Any difference is a bug in this task. Stop the server.

- [ ] **Step 7: Commit**

```bash
bunx prettier --write app/tome/copy.ts app/tome/copy.test.ts tests/e2e/smoke.spec.ts
git add app/tome/copy.ts app/tome/copy.test.ts app/tome/engine.js tests/e2e/smoke.spec.ts
git commit -S -m "refactor(tome): paint the book from layoutBook()"
```

---

### Task 6: The More work sheet and ribbon lettering that fits

**Test-first exception:** painters only. Task 4's tests already cover the layout (rows per face, All work page, See all, dye, ribbon and contents row). Checked by hand with temporary content in Step 5.

**Files:**

- Modify: `app/tome/engine.js`

- [ ] **Step 1: Add a one-line clip helper**

After the line `  const centered = (ctx, text, x, y) => { ... };` add

```js
// One line with an ellipsis, measured in the font already set on ctx.
const clip = (ctx, text, maxW) => {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}
```

- [ ] **Step 2: Add the More work and All work painters**

In the `faces` object, after the `notes(ctx, hs, f) {...},` line, add

```js
    // Listed projects with no chapter, six to a page; a row opens the project's page.
    moreWork(ctx, hs, f) {
      const m = parchment(ctx, f.side, f.title, f.folio);
      heading(ctx, m, 'More work', 260, 64);
      let y = 360;
      for (const slug of f.rows) {
        const p = data.moreWork.find((r) => r.slug === slug);
        rule(ctx, m, y);
        ctx.fillStyle = P.ink; ctx.font = font(36, 600); ctx.fillText(clip(ctx, p.title, m.w - 56), m.L + 56, y + 58);
        ctx.fillStyle = P.muted; ctx.font = font(26, 400, BODY, true); ctx.fillText(clip(ctx, p.summary, m.w - 56), m.L + 56, y + 98);
        hs.push({ x: m.L, y, w: m.w, h: 124, act: () => onNavigate(p.path) });
        y += 132;
      }
      rule(ctx, m, y);
      if (f.seeAll) { ctx.fillStyle = P.accent; ctx.font = font(30, 500, BODY, true); ctx.fillText('See all on the list →', m.L, y + 60); hs.push({ x: m.L, y, w: m.w, h: 96, act: () => onNavigate('/work') }); }
    },
    allWork(ctx, hs, f) {
      const m = parchment(ctx, f.side, f.title, f.folio);
      heading(ctx, m, 'All work', 270, 64);
      let y = para(ctx, m, 'The plain list holds every project, with its progress in full.', 400, 32, 46) + 30;
      rule(ctx, m, y);
      smallcaps(ctx, 'The list', m.L, y + 56);
      ctx.fillStyle = P.accent; ctx.font = font(40, 600); ctx.fillText('kcb.pro/work →', m.L, y + 112);
      hs.push({ x: m.L, y: y + 20, w: m.w, h: 120, act: () => onNavigate('/work') });
    },
```

The rows start text at `m.L + 56`, which leaves room for the seal Task 9 adds.

- [ ] **Step 3: Fit ribbon lettering to its longest label**

"More work" and long chapter titles can outgrow the ribbon's name band. Directly above `  const ribbonTex = (color, labelText) => paint(RTW, RTH, (ctx, w, h) => {` add

```js
// One lettering size for all ribbons; it shrinks only for a label wider than both the band and the fixed labels.
const ribbonType = (ctx) => {
  const at = (s, labels) => {
    ctx.font = font(s, 700, HEAD)
    spaced(ctx, 9)
    return Math.max(
      ...labels.map((l) => ctx.measureText(l.toUpperCase()).width)
    )
  }
  const room = Math.max(RTH - 636, at(112, ['Contents', 'Studies', 'Contact'])),
    labels = CHAPTERS.map((c) => c.label)
  let size = 112,
    tl = at(size, labels)
  while (tl > room && size > 64) tl = at((size -= 4), labels)
  return tl
}
```

In `ribbonTex`, replace

```js
const text = labelText.toUpperCase()
ctx.font = font(112, 700, HEAD)
spaced(ctx, 9)
const tl = Math.max(
    ...CHAPTERS.map((c) => ctx.measureText(c.label.toUpperCase()).width)
  ),
  y0 = 400,
  y1 = y0 + tl + 76
```

with

```js
const text = labelText.toUpperCase(),
  tl = ribbonType(ctx),
  y0 = 400,
  y1 = y0 + tl + 76
```

In `ribbonBackTex`, replace the two lines

```js
const text = labelText.toUpperCase()
ctx.font = font(112, 700, HEAD)
spaced(ctx, 9)
const tl = Math.max(
    ...CHAPTERS.map((c) => ctx.measureText(c.label.toUpperCase()).width)
  ),
  y0 = 400,
  y1 = y0 + tl + 76
```

with

```js
const text = labelText.toUpperCase(),
  tl = ribbonType(ctx),
  y0 = 400,
  y1 = y0 + tl + 76
```

`RTH - 636` keeps the band above the bound point (`y0 400 + tl + 76 ≤ RTH - 160`). With today's labels the widest is a fixed one, so the size stays at 112 and the two-chapter ribbons do not change.

- [ ] **Step 4: Run the gate**

Expected: all green.

- [ ] **Step 5: Manual check with temporary content (not committed)**

In `app/portfolio/content/projects.ts`, delete `listed: false,` from `deck-workshop` and `mugen-arena`. That gives two unranked listed endeavors. Then:

```bash
bun run build
PORT=4199 bun scripts/serve-build.ts
```

In the browser, check that:

- a More work ribbon in the olive dye hangs between kbui and Studies, its lettering inside the band
- the contents page has a "More work · 2 more projects" row whose number matches the More work page, and the row jumps there
- the More work page lists Deck Workshop and Mugen Arena with summaries clipped to one line, and clicking a row opens `/work/deck-workshop`
- the back page is "All work" and its link opens `/work`
- on `/work/deck-workshop`, pressing 3D opens at More work, and on `/work` pressing 3D opens at More work
- the two-chapter ribbons look the same as the baseline

Stop the server, then restore the content and confirm it is clean:

```bash
git checkout -- app/portfolio/content/projects.ts
git status --short
```

Expected: only `app/tome/engine.js` is modified.

- [ ] **Step 6: Commit**

```bash
git add app/tome/engine.js
git commit -S -m "feat(tome): paint the More work sheet"
```

---

### Task 7: Seals in the book data

**Files:**

- Modify: `app/tome/copy.ts`, `app/site/components/TomeStage.tsx`, `tests/e2e/smoke.spec.ts`
- Test: `app/tome/copy.test.ts`

- [ ] **Step 1: Write the failing seal tests**

In `app/tome/copy.test.ts`, add `import type { ProgressEntry, ProgressResult } from '@app/portfolio/domain/progress'` and, above `describe`:

```ts
const entry = (
  id: string,
  subject: string,
  date: string,
  result: ProgressResult
): ProgressEntry => ({
  id,
  subject,
  date,
  kind: 'experiment',
  title: `Title ${id}`,
  passMark: 'Set before the run',
  result,
  measured: [],
  evidence: [{ label: 'Run', url: 'https://example.com/run' }],
})
```

Inside `describe('tome data', ...)` add:

```ts
it('seals a chapter with its three most recent subjects, newest first, as of the build day', () => {
  const entries = {
    alpha: [
      entry('a1', 'speed', '2026-10-01', 'fail'),
      entry('b1', 'memory', '2026-10-05', 'partial'),
      entry('a2', 'speed', '2026-10-10', 'pass'),
      entry('c1', 'sandbox', '2026-10-12', 'not-run'),
      entry('d1', 'docs', '2026-10-15', 'pass'),
      entry('e1', 'later', '2026-10-30', 'fail'),
    ],
  }
  const book = tomeData(catalog(shelf(1)), '2026-10-21', entries)
  expect(book.chapters[0].ledger).toEqual([
    {
      id: 'd1',
      title: 'Title d1',
      result: 'pass',
      word: 'Pass',
      path: '/work/alpha#d1',
    },
    {
      id: 'c1',
      title: 'Title c1',
      result: 'not-run',
      word: 'Not run',
      path: '/work/alpha#c1',
    },
    {
      id: 'a2',
      title: 'Title a2',
      result: 'pass',
      word: 'Pass',
      path: '/work/alpha#a2',
    },
  ])
})

it('leaves a chapter with no entries unsealed', () => {
  expect(tomeData(catalog(shelf(1)), '2026-10-21').chapters[0].ledger).toEqual(
    []
  )
})

it('seals each More work row with its project’s overall result', () => {
  const entries = {
    'more-1': [
      entry('x', 's', '2026-10-01', 'pass'),
      entry('y', 't', '2026-10-02', 'partial'),
    ],
  }
  const book = tomeData(catalog(shelf(1, 2)), '2026-10-21', entries)
  expect(book.moreWork.map((r) => [r.slug, r.seal, r.word])).toEqual([
    ['more-1', 'partial', 'Partial'],
    ['more-2', null, null],
  ])
})
```

Update two existing tests for the new fields:

- In `lists listed endeavors with no rank as More work...`, the expected row becomes `{ slug: 'beta', title: 'Beta', summary: 'Second thing.', path: '/work/beta', seal: null, word: null }`.
- In `says what each chapter is...`, the key list becomes `['slug', 'title', 'summary', 'about', 'status', 'notes', 'facts', 'ledger']`.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run --config vitest.config.ts app/tome/copy.test.ts`
Expected: FAIL. `ledger` is `undefined`, and the rows have no `seal`.

- [ ] **Step 3: Implement the seals**

In `app/tome/copy.ts`:

```ts
import {
  current,
  overallSeal,
  type ProgressEntry,
  type ProgressResult,
} from '@app/portfolio/domain/progress'

// The result as a word beside its seal, so colour never carries it alone.
const RESULT_WORD: Record<ProgressResult, string> = {
  pass: 'Pass',
  partial: 'Partial',
  fail: 'Fail',
  'not-run': 'Not run',
}

export interface Seal {
  id: string
  title: string
  result: ProgressResult
  word: string
  path: string
}
```

If Task 0 Step 4 found a 1a result-word export, import it and use it in place of `RESULT_WORD`. Then update the tests' expected words to match it.

Add `ledger: Seal[]` to `Chapter`, and `seal: ProgressResult | null` and `word: string | null` to `MoreWorkRow`. Change `chapter` and `tomeData`:

```ts
function chapter(p: Project, asOf: IsoDay, entries: ProgressEntry[]): Chapter {
  if (!p.book) throw new Error(`Chapter "${p.slug}" needs book copy`)
  return {
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    about: p.about,
    status: statusLine(p, asOf),
    notes: p.book.notes,
    facts: p.book.facts,
    ledger: current(entries, asOf)
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        title: e.title,
        result: e.result,
        word: RESULT_WORD[e.result],
        path: `/work/${p.slug}#${encodeURIComponent(e.id)}`,
      })),
  }
}
```

```ts
export function tomeData(
  catalog: Catalog,
  asOf: IsoDay,
  entries: Record<string, ProgressEntry[]> = {}
): TomeData {
  const live = nowBuilding(catalog.projects)
  const chapters = featured(catalog.projects).map((p) =>
    chapter(p, asOf, entries[p.slug] ?? [])
  )
  const moreWork = unranked(catalog.projects).map((p) => {
    const seal = overallSeal(entries[p.slug] ?? [], asOf)
    return {
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      path: `/work/${p.slug}`,
      seal,
      word: seal && RESULT_WORD[seal],
    }
  })
  return {
    name: profile.name,
    role: profile.role,
    asOf: formatLongDay(asOf),
    nowBuilding: live?.title ?? 'Between projects',
    about: [
      aboutBook(
        chapters.map((c) => c.title),
        moreWork.length > 0
      ),
      'Everything here shows the date it was last true. If something isn’t finished, it says so.',
    ],
    contactLine:
      'I’m looking for frontend roles where the interface is the hard part.',
    github: { label: 'github.com/KhallilB', href: profile.github },
    studies: catalog.studies.map((s) => ({
      slug: s.slug,
      title: s.title,
      ...STUDY_NOTES[s.slug],
      when: formatMonth(s.startsOn),
      format: formatLabel(s.format),
      path: `/studies/${s.slug}`,
    })),
    chapters,
    moreWork,
    book: layoutBook({
      chapters: chapters.map(({ slug, title }) => ({ slug, title })),
      moreWork: moreWork.map((r) => r.slug),
    }),
  }
}
```

Keep the "validateCatalog guarantees book copy" comment above the throw.

Run the same command. Expected: PASS.

- [ ] **Step 4: Hand the book the progress entries**

In `app/site/components/TomeStage.tsx`:

```ts
import type { ProjectProgress } from '@app/portfolio/domain/progress'

// The book shows evidence only; commit activity stays on the 2D page.
const entriesBySlug = (progress: Record<string, ProjectProgress>) =>
  Object.fromEntries(
    Object.entries(progress).map(([slug, p]) => [slug, p.file.entries])
  )
```

- `const { asOf, catalog, tome } = useSite()` becomes `const { asOf, catalog, progress, tome } = useSite()`
- `data: tomeData(catalog, asOf),` becomes `data: tomeData(catalog, asOf, entriesBySlug(progress)),`
- the dependencies become `[asOf, catalog, progress, tome, engine]`

- [ ] **Step 5: Check in e2e that the book stub receives seals**

In `tests/e2e/smoke.spec.ts`, in the stub body after the `c.dataset.sheets = ...` line, add

```js
c.dataset.seals = opts.data.chapters.map((ch) => ch.ledger.length).join(',')
```

After the `data-sheets` expectation, add

```ts
await expect(page.locator('.tome[data-ready] canvas')).toHaveAttribute(
  'data-seals',
  /^[1-3],[1-3]$/
)
```

This relies on 1a's offline fixtures having entries for Bezl and kbui (Task 0 Step 4).

- [ ] **Step 6: Run the gate, then commit**

Expected: all green. The engine ignores `ledger` and `seal` until Task 9.

```bash
bunx prettier --write app/tome/copy.ts app/tome/copy.test.ts app/site/components/TomeStage.tsx tests/e2e/smoke.spec.ts
git add app/tome/copy.ts app/tome/copy.test.ts app/site/components/TomeStage.tsx tests/e2e/smoke.spec.ts
git commit -S -m "feat(tome): carry progress seals into the book's data"
```

---

### Task 8: `TomeStage` navigation keeps the hash

**Files:**

- Modify: `app/site/components/TomeStage.tsx`
- Test: `app/site/tome.test.tsx`

- [ ] **Step 1: Write the failing test**

In `app/site/tome.test.tsx`, import `useLocation` from `react-router` (next to `MemoryRouter`), and add above `visit`:

```tsx
function Where() {
  const { pathname, hash } = useLocation()
  return <output data-testid="where">{pathname + hash}</output>
}
```

In `visit`, render `<Where />` after `<AppRoutes />` inside `MemoryRouter`. Then add these tests to the describe block:

```tsx
it('follows a seal to its entry, keeping the hash and scrolling there instead of the top', async () => {
  const scrolled: Element[] = []
  Element.prototype.scrollIntoView ??= () => {}
  const into = vi
    .spyOn(Element.prototype, 'scrollIntoView')
    .mockImplementation(function (this: Element) {
      scrolled.push(this)
    })
  const top = vi.spyOn(window, 'scrollTo')
  const { hooks, calls } = fakeEngine()
  await visit('/', hooks)
  act(() => calls[0].onNavigate('/work/bezl#how-it-works'))
  await waitFor(() => expect(scrolled).toHaveLength(1))
  expect(scrolled[0]).toHaveAttribute('id', 'how-it-works')
  expect(screen.getByTestId('where')).toHaveTextContent(
    '/work/bezl#how-it-works'
  )
  expect(top).not.toHaveBeenCalled()
  into.mockRestore()
  top.mockRestore()
})

it('starts a page with no hash at the top', async () => {
  const top = vi.spyOn(window, 'scrollTo')
  const { hooks, calls } = fakeEngine()
  await visit('/', hooks)
  act(() => calls[0].onNavigate('/studies/map-labels'))
  expect(top).toHaveBeenCalledWith(0, 0)
  top.mockRestore()
})
```

`how-it-works` is the id `Brief` gives Bezl's "How it works" heading. It stands in for a ledger entry id, so the test does not depend on 1a's fixtures.

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run --config vitest.config.ts app/site/tome.test.tsx`
Expected: FAIL in the first test. `waitFor` times out with `scrolled` empty, because the stage scrolls to the top instead. The second test passes already; it guards the plain path.

- [ ] **Step 3: Implement**

In `app/site/components/TomeStage.tsx`, add above `export function TomeStage`:

```ts
// The entry renders after the route commits, so look again for a few frames.
function seek(id: string, frames: number) {
  requestAnimationFrame(() => {
    const entry = document.getElementById(id)
    if (entry) entry.scrollIntoView({ block: 'start' })
    else if (frames > 0) seek(id, frames - 1)
    else window.scrollTo(0, 0)
  })
}
```

Replace

```ts
          onNavigate: (path) => {
            handlers.current.navigate(path)
            window.scrollTo(0, 0)
          },
```

with

```ts
          onNavigate: (path) => {
            handlers.current.navigate(path)
            const id = decodeURIComponent(path.split('#')[1] ?? '')
            if (id) seek(id, 10)
            else window.scrollTo(0, 0)
          },
```

- [ ] **Step 4: Run it and see it pass**

Run: `npx vitest run --config vitest.config.ts app/site/tome.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the gate, then commit**

```bash
bunx prettier --write app/site/components/TomeStage.tsx app/site/tome.test.tsx
git add app/site/components/TomeStage.tsx app/site/tome.test.tsx
git commit -S -m "feat(site): keep the hash when the book opens a page"
```

---

### Task 9: Wax seals on chapter and More work pages

**Test-first exception:** canvas painting and animation in `engine.js`. Task 7 tested the data (which subjects, order, words, paths). Task 8 tested the navigation. This task is checked by hand in Step 7.

**Files:**

- Modify: `app/tome/engine.js`

- [ ] **Step 1: Seal state and the seal painter**

Replace `  const faceTex = {}, faceHs = {};` with

```js
const faceTex = {},
  faceHs = {},
  faceSeals = {},
  pressing = {}
```

Directly after the closing `}` of `function deckle(ctx, side, backing) { ... }`, add

```js
// Wax by result; not-run is a hollow ring. k runs 0 to 1 as the seal is pressed.
const WAX = { pass: '#2f6b3c', partial: '#b07818', fail: '#9a2a24' }
function seal(ctx, s, k) {
  if (k <= 0) return
  const e = smooth(k),
    r = s.r * (1.5 - 0.5 * e)
  ctx.save()
  ctx.globalAlpha = Math.min(1, k * 2.5)
  ctx.translate(s.x, s.y)
  if (s.result === 'not-run') {
    ctx.strokeStyle = P.muted
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    return
  }
  ctx.shadowColor = 'rgba(40,20,5,0.45)'
  ctx.shadowBlur = 6 * e
  ctx.shadowOffsetX = ctx.shadowOffsetY = 2 * e + 4 * (1 - e)
  ctx.fillStyle = WAX[s.result]
  ctx.beginPath()
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI * 2,
      rr = r * (1 + 0.08 * Math.sin(i * 2.7 + s.x))
    i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(rr, 0)
  }
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,240,210,0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(-0.8, -0.8, r * 0.68, Math.PI, Math.PI * 1.5)
  ctx.stroke()
  // Die mark: tick, bar or cross, so the seal reads without its colour.
  const q = r * 0.34
  ctx.strokeStyle = 'rgba(255,240,210,0.75)'
  ctx.lineWidth = r * 0.14
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (s.result === 'pass') {
    ctx.moveTo(-q, 0)
    ctx.lineTo(-q * 0.2, q * 0.8)
    ctx.lineTo(q, -q * 0.7)
  } else if (s.result === 'partial') {
    ctx.moveTo(-q, 0)
    ctx.lineTo(q, 0)
  } else {
    ctx.moveTo(-q, -q)
    ctx.lineTo(q, q)
    ctx.moveTo(q, -q)
    ctx.lineTo(-q, q)
  }
  ctx.stroke()
  ctx.restore()
}
// Seals sit on the finished page; pressing repaints them over a cached plain copy, never the whole page.
function stampSeals(name, k) {
  const f = faceTex[name],
    ctx = f.canvas.getContext('2d')
  ctx.clearRect(0, 0, TW, TH)
  ctx.drawImage(f.plain, 0, 0)
  for (const s of faceSeals[name]) seal(ctx, s, k)
  f.tex.needsUpdate = true
}
```

Use `smooth`, not `ease`: `ease` is a `const` declared later in the file, and the first `redraw` runs before it exists.

- [ ] **Step 2: `redraw` collects seals and stamps them last**

In `redraw`, replace

```js
faceHs[name] = []
faces[face ? face.kind : name](ctx, faceHs[name], face)
```

with

```js
faceHs[name] = []
faceSeals[name] = []
faces[face ? face.kind : name](ctx, faceHs[name], face)
```

and replace

```js
if (name !== 'exlibris')
  deckle(ctx, curSide, name === 'finis' ? P.parchEdge : null)
tex.needsUpdate = true
```

with

```js
if (name !== 'exlibris')
  deckle(ctx, curSide, name === 'finis' ? P.parchEdge : null)
if (faceSeals[name].length) {
  const p =
    faceTex[name].plain ||
    (faceTex[name].plain = document.createElement('canvas'))
  p.width = TW
  p.height = TH
  p.getContext('2d').drawImage(canvas, 0, 0)
  stampSeals(name, pressing[name] ? 0 : 1)
}
tex.needsUpdate = true
```

- [ ] **Step 3: The chapter page's ledger block**

Replace the whole `chapterPage` arrow function (from `  const chapterPage = (ctx, f, d) => {` to its closing `  };`) with

```js
const chapterPage = (ctx, hs, f, d) => {
  const m = parchment(ctx, f.side, f.title, f.folio)
  chapterHead(ctx, m, d)
  let y = para(ctx, m, d.about, 450, 34, 50) + 40
  rule(ctx, m, y)
  smallcaps(ctx, 'Progress', m.L, y + 64)
  if (!d.ledger.length) {
    ctx.fillStyle = P.muted
    ctx.font = font(30, 400, BODY, true)
    wrap(ctx, 'No checked results yet.', m.L, y + 116, m.w, 42)
  }
  y += 100
  for (const s of d.ledger) {
    faceSeals[f.name].push({ x: m.L + 24, y: y + 28, r: 22, result: s.result })
    ctx.font = font(20, 500, HEAD)
    spaced(ctx, 3)
    const ww = ctx.measureText(s.word.toUpperCase()).width
    spaced(ctx, 0)
    smallcaps(ctx, s.word, m.R, y + 38, P.muted, 'right')
    ctx.fillStyle = P.ink
    ctx.font = font(30, 600)
    ctx.fillText(clip(ctx, s.title, m.w - 64 - ww - 24), m.L + 64, y + 38)
    hs.push({ x: m.L, y, w: m.w, h: 60, act: () => onNavigate(s.path) })
    y += 72
  }
  footnote(ctx, m, d.status, TH - 158)
}
```

and replace `    chapter(ctx, hs, f) { chapterPage(ctx, f, data.chapters[f.chapter]); },` with `    chapter(ctx, hs, f) { chapterPage(ctx, hs, f, data.chapters[f.chapter]); },`.

Three rows take 216 px. The block ends well above the status footnote at `TH - 158`, even after a seven-line `about`.

- [ ] **Step 4: Seals on More work rows**

In the `moreWork` painter, replace

```js
rule(ctx, m, y)
ctx.fillStyle = P.ink
ctx.font = font(36, 600)
ctx.fillText(clip(ctx, p.title, m.w - 56), m.L + 56, y + 58)
```

with

```js
rule(ctx, m, y)
let room = m.w - 56
if (p.seal) {
  faceSeals[f.name].push({ x: m.L + 22, y: y + 48, r: 20, result: p.seal })
  ctx.font = font(20, 500, HEAD)
  spaced(ctx, 3)
  room -= ctx.measureText(p.word.toUpperCase()).width + 24
  spaced(ctx, 0)
  smallcaps(ctx, p.word, m.R, y + 58, P.muted, 'right')
}
ctx.fillStyle = P.ink
ctx.font = font(36, 600)
ctx.fillText(clip(ctx, p.title, room), m.L + 56, y + 58)
```

- [ ] **Step 5: Press seals as their page turns into view**

In `goTo`, directly after `    live.textContent = SPREADS[current];` add

```js
// Both faces landing here start hidden, so resetting their seals to unpressed is never seen.
if (!reduce)
  for (const face of [
    SHEETS[current - 2] && SHEETS[current - 2][1],
    SHEETS[current - 1] && SHEETS[current - 1][0],
  ])
    if (face && faceSeals[face] && faceSeals[face].length) {
      pressing[face] = now + d + 600
      stampSeals(face, 0)
    }
```

In `loop(now)`, directly after `    step(coverState, now, dt); step(claspState, now, dt); sheets.forEach((s) => step(s, now, dt));` add

```js
for (const name in pressing) {
  if (now < pressing[name]) continue
  const k = Math.min(1, (now - pressing[name]) / 420)
  stampSeals(name, k)
  if (k >= 1) delete pressing[name]
}
```

With reduced motion `pressing` stays empty, so every seal is painted pressed (`k = 1`) by `redraw`.

- [ ] **Step 6: Run the gate**

Expected: all green.

- [ ] **Step 7: Manual check**

```bash
bun run build
PORT=4199 bun scripts/serve-build.ts
```

In the browser:

- Turn to Bezl and to kbui. Each chapter page shows "Progress" with up to three rows: seal, title (clipped to one line), and result word on the right, newest first. They match the newest three subjects in the 2D Progress section of `/work/bezl` and `/work/kbui`.
- Seals press in shortly after the page lands: they grow from larger to their size and their shadow tightens. Turning away and back presses them again.
- A not-run entry shows a hollow dashed ring. Each seal's tick, bar or cross is legible.
- Clicking a seal row opens `/work/<slug>#<entry-id>` with that entry at the top of the viewport, and the URL keeps the hash.
- Turn on reduced motion (macOS System Settings › Accessibility › Display › Reduce motion, or DevTools › Rendering › `prefers-reduced-motion: reduce`) and reload. Seals are already in place with no animation.
- Turning pages stays smooth while a seal presses (no visible stall).
- With the Task 6 temporary content (two unranked endeavors), More work rows carry their overall seal and word, or none when the project has no progress. Restore with `git checkout -- app/portfolio/content/projects.ts`.

Stop the server.

- [ ] **Step 8: Commit**

```bash
git status --short
git add app/tome/engine.js
git commit -S -m "feat(tome): press wax seals on chapter and More work pages"
```

Expected before `git add`: only `app/tome/engine.js` modified.

---

### Task 10: Documentation

**Files:**

- Modify: `docs/the-tome.md`, `docs/content.md`

- [ ] **Step 1: Update `docs/the-tome.md`**

Under "Reading it as a visitor", add these bullets after the contents-page bullet:

```markdown
- Each chapter page shows the project's three most recent checked results, newest
  first, each with a wax seal and its result word: green pass, amber partial, red
  fail, a hollow ring for not run. Each seal also carries a tick, bar or cross, so
  colour is never the only cue. Click one to open that entry on the project's page.
- The More work pages list every listed project that has no chapter, each with its
  overall seal. A row opens the project's page.
```

In "The engine's handle", after the `onNavigate(path)` bullet, add: `A path may end in #<entry-id>; TomeStage keeps the hash and scrolls to that entry instead of the top.`

Replace the "Keeping your place" table with:

```markdown
| Book place                                         | Site page                                   |
| -------------------------------------------------- | ------------------------------------------- |
| About                                              | `/about`                                    |
| A chapter (a ranked project)                       | `/work/<slug>`                              |
| More work (only when a listed project has no rank) | `/work`, and the page of each project on it |
| Work studies                                       | `/studies` and every study                  |
| Contents, Contact                                  | stay where you are                          |

The places come from the content (`placesOf()` in `app/tome/place.ts`), so a new
chapter needs no entry there.
```

Add a new section after "How it loads":

```markdown
## How the book is laid out

`app/tome/layout.ts` exports `layoutBook({ chapters, moreWork })`. It is a pure function that
decides every sheet, page number, contents row, ribbon, place and spoken spread label.
It has no Three.js or canvas code, so `app/tome/layout.test.ts` tests it directly, and
a golden test pins the two-chapter book to the pages it had when it was laid out by
hand. `copy.ts` calls it and hands the result to the engine as `data.book`. `engine.js`
paints and animates whatever it says.

Sheets, in order (each is a right-hand page with a left-hand page on its back):

1. Contents / About
2. One per ranked project, by rank: chapter page / notes page
3. More work, only when a listed endeavor has no `rank`: up to six projects on the
   front; projects 7 to 12 on the back, or a page linking to `/work` when there are six
   or fewer. Past twelve, the back shows eleven and a "See all on the list" row.
4. Work studies / study notes
5. Contact / colophon

The book holds at most three chapters, eight contents rows and seven ribbons. Colours
are fixed by role, so adding a chapter never recolours another:

| Role            | Pages and ribbon                         |
| --------------- | ---------------------------------------- |
| Contents, About | `SECT[0]`                                |
| Chapters I–III  | `SECT[1]`, `SECT[2]`, `SECT[3]` by rank  |
| More work       | `MORE_WORK_DYE`, the seventh leather dye |
| Studies         | `SECT[4]`                                |
| Contact         | pages `SECT[5]`, ribbon `#e6d9b8`        |

## Wax seals

A chapter's seals are the three most recent subjects from `current(entries, buildDay)`
in the project's `progress.json`. A More work row's seal is the project's overall seal.
Seals are painted last, over a cached copy of the finished page, and press in as their
page turns into view. With reduced motion they are already in place.
```

- [ ] **Step 2: Update `docs/content.md`**

In the Projects field table, add these rows after `listed`. Skip the `rank` row if 1a already added one, but keep its wording consistent.

```markdown
| `rank` | Optional `1`, `2` or `3`. A ranked endeavor gets a chapter in the book and a card under "Selected work", in rank order. Each rank once, listed endeavors only. |
| `book` | Required once `rank` is set. `notes`: at most three `[heading, text]` pairs, each text at most 190 characters. `facts`: exactly three `[label, value]` pairs. |
```

Under "What the build checks", add:

```markdown
- **A ranked project has book copy**: exactly three facts, at most three notes of at
  most 190 characters, and a summary of at most 70 characters (the chapter page sets
  it on one line).
- **A ranked slug isn't a name the book keeps for itself**: `contents`, `about`,
  `more-work`, `studies`, `contact`, and its page names `exlibris`, `finis`,
  `moreWork`, `moreWorkBack`, `studyNotes` and `colophon`.
```

Replace the whole section "The 3D book needs a little more" with:

```markdown
## The 3D book

The book is generated from the same content as the site:

- **Chapters:** every listed endeavor with a `rank` gets a chapter, in rank order, with
  its notes and facts from `book`. At most three.
- **More work:** listed endeavors without a `rank` are listed on the More work pages,
  each with its overall seal and a link to its page. Removing a project's `rank` moves
  it there; no code changes.
- **About:** the About page names the chapters for you.
- **Seals:** come from each project's `progress.json` (see the progress contract).
- **Studies:** every study still needs an entry in `STUDY_NOTES` in `app/tome/copy.ts`:
  a short name for the book's study list and one sentence on why it matters. Without
  one, the book's study page shows blank lines for it.
```

- [ ] **Step 3: Check, then commit**

```bash
bunx prettier --check docs/the-tome.md docs/content.md || bunx prettier --write docs/the-tome.md docs/content.md
git add docs/the-tome.md docs/content.md
git commit -S -m "docs: describe the generated book and its wax seals"
```

---

### Task 11: Manual browser check, final gate, push and PR

**Files:** temporary content edits only; nothing from this task's content edits is committed.

- [ ] **Step 1: Two chapters (committed content)**

```bash
bun run build
PORT=4199 bun scripts/serve-build.ts
```

Go through the whole book: covers, every spread, ribbons, contents jumps, seals, seal links, More work absent, 2D↔3D places on `/`, `/work/bezl`, `/work/kbui` and `/studies`. Repeat at a portrait width (375 wide) and with reduced motion. Stop the server.

- [ ] **Step 2: Three chapters (temporary)**

In `app/portfolio/content/projects.ts`, in `wander`: delete `listed: false,` and add

```ts
    rank: 3,
    book: {
      notes: [['The idea', 'A walking map of what a city’s open data knows about the street you are on.']],
      facts: [
        ['Built with', 'MapLibre · PMTiles'],
        ['Data', 'City open data'],
        ['Starts', 'Apr 2027'],
      ],
    },
```

Rebuild and serve as in Step 1. Check that:

- Chapter III, "Wander", has its own ribbon in the third chapter dye, and Bezl's and kbui's colours are unchanged
- six ribbons hang, spaced as before
- contents has seven rows with matching numbers, and each row jumps to its page
- About reads "…gives a chapter each to Bezl, kbui and Wander."
- `/work/wander` opens the book at Wander, and the chapter shows "No checked results yet." (Wander has no `repo`)

- [ ] **Step 3: Three chapters plus More work (temporary)**

Also delete `listed: false,` from `deck-workshop` and `mugen-arena`. Rebuild and serve. Check that:

- seven ribbons hang (the More work one is olive) and all of them sit on the page and are clickable
- contents has eight rows that all fit above the page number
- the More work page lists Deck Workshop and Mugen Arena, the back is "All work", and both links work
- `/work` and `/work/mugen-arena` open the book at More work; leaving the book from More work lands on `/work`
- About ends "…then lists the rest of my work."

- [ ] **Step 4: Unranking moves a chapter to More work (temporary)**

Restore the content (`git checkout -- app/portfolio/content/projects.ts`), then delete only `rank: 2,` from `kbui`. Rebuild and serve. Check that the book has one chapter (Bezl) and a More work page listing kbui with its overall seal, and that `/work/kbui` opens the book at More work. This is the spec's "no code change" acceptance.

- [ ] **Step 5: Restore and confirm clean**

```bash
git checkout -- app/portfolio/content/projects.ts
git status --short
```

Expected: no output.

- [ ] **Step 6: Final gate on the branch tip**

Run the gate. Expected: all green.

- [ ] **Step 7: Push, open the PR and verify signatures on GitHub**

```bash
git push -u origin feat/progress-ledger-book
for sha in $(git rev-list origin/main..HEAD); do
  gh api repos/KhallilB/kcb.pro/git/commits/$sha --jq '"\(.sha[0:7]) \(.verification.verified) \(.verification.reason)"'
done
```

Expected: every line ends `true valid`. If any does not, rewrite that commit with the correct identity and an SSH signature, force-push the branch, and recheck before continuing.

The repository has no PR template. Follow its recent PR style: title `feat(tome): generated book and wax seals`, and a body with a short summary, the spec link, and the checks actually run (the gate commands and the manual browser configurations from Steps 1 to 4). No AI attribution.

```bash
gh pr create --base main --title "feat(tome): generated book and wax seals" --body "$(cat <<'EOF'
Plan 1b of docs/superpowers/specs/2026-10-22-progress-ledger-design.md.

- The book's sheets, contents, ribbons, places and spread labels come from a pure `layoutBook()`; a golden test pins the hand-laid two-chapter book.
- Chapters are ranked projects with `book` copy (validated); listed endeavors without a rank go to a new More work sheet.
- Chapter pages show the three most recent results as wax seals that link to their ledger entry; More work rows carry each project's overall seal.

Checks run: bun run lint, typecheck, build, test, test:integration, test:e2e; manual browser check with two chapters, three chapters, three chapters plus More work, and kbui unranked.
EOF
)"
```
