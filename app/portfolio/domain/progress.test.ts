import {
  validateCommits,
  validateProgress,
  type Evidence,
  type Measure,
  type ProgressEntry,
  type ProgressKind,
  type ProgressResult,
} from './progress'
import { commit, entry, progressFile } from './fixtures'

const ctx = { slug: 'alpha', buildDay: '2026-10-21' }
const check = (entries: ProgressEntry[]) =>
  validateProgress(progressFile(entries), ctx)
const at = '"alpha" progress.json entry "2026-10-20-alpha"'

describe('validateProgress', () => {
  it('accepts a complete file', () => {
    expect(check([entry()])).toEqual([])
  })

  it('accepts evidence as an https url with no commit', () => {
    const run = {
      label: 'CI run',
      url: 'https://github.com/o/r/actions/runs/1',
    }
    expect(check([entry({ evidence: [run], commit: undefined })])).toEqual([])
  })

  it('refuses anything that is not an object', () => {
    expect(validateProgress([], ctx)).toEqual([
      '"alpha" progress.json is not a JSON object',
    ])
  })

  it.each([0, 2, '1'])('refuses schema %j', (schema) => {
    expect(validateProgress({ ...progressFile([]), schema }, ctx)).toEqual([
      `"alpha" progress.json uses schema ${JSON.stringify(schema)}; kcb.pro reads schema 1`,
    ])
  })

  it('refuses a file written for another project', () => {
    expect(
      validateProgress(progressFile([], { project: 'beta' }), ctx)
    ).toEqual([
      '"alpha" progress.json names project "beta"; it must be "alpha"',
    ])
  })

  it('refuses a file with no entries list', () => {
    expect(validateProgress({ schema: 1, project: 'alpha' }, ctx)).toEqual([
      '"alpha" progress.json needs an entries list',
    ])
  })

  it('refuses two entries with one id', () => {
    expect(check([entry(), entry()])).toContain(`${at} repeats an earlier id`)
  })

  it('refuses an id that cannot be an anchor', () => {
    expect(check([entry({ id: 'two words' })])).toContain(
      '"alpha" progress.json entry "two words" needs an id with no spaces'
    )
    expect(check([entry({ id: '' })])).toContain(
      '"alpha" progress.json entry 1 needs an id with no spaces'
    )
  })

  it('refuses a date after the build day', () => {
    expect(check([entry({ date: '2026-10-22' })])).toContain(
      `${at} is dated 2026-10-22, after the build day 2026-10-21`
    )
  })

  it('refuses a date that is not an ISO day', () => {
    expect(check([entry({ date: '2026-13-01' })])).toContain(
      `${at} needs a date as YYYY-MM-DD`
    )
  })

  it('refuses entries out of date order', () => {
    const errors = check([
      entry({ id: 'b', date: '2026-10-20' }),
      entry({ id: 'a', subject: 'other', date: '2026-10-19' }),
    ])
    expect(errors).toContain(
      '"alpha" progress.json entry "a" is out of order; entries go oldest first'
    )
  })

  it('refuses an unknown kind or result', () => {
    expect(check([entry({ kind: 'demo' as ProgressKind })])).toContain(
      `${at} has an unknown kind "demo"`
    )
    expect(check([entry({ result: 'flaky' as ProgressResult })])).toContain(
      `${at} has an unknown result "flaky"`
    )
  })

  it.each(['experiment', 'tests'] as ProgressKind[])(
    'requires a pass mark for %s',
    (kind) => {
      expect(check([entry({ kind, passMark: undefined })])).toContain(
        `${at} needs a passMark, set before the result`
      )
    }
  )

  it.each(['release', 'milestone'] as ProgressKind[])(
    'lets %s go without a pass mark',
    (kind) => {
      expect(check([entry({ kind, passMark: undefined })])).toEqual([])
    }
  )

  it('requires evidence unless the result is not-run', () => {
    expect(check([entry({ evidence: [], commit: undefined })])).toContain(
      `${at} needs evidence unless its result is not-run`
    )
    expect(
      check([entry({ result: 'not-run', evidence: [], commit: undefined })])
    ).toEqual([])
  })

  it('requires a commit when evidence is a repository path', () => {
    expect(check([entry({ commit: undefined })])).toContain(
      `${at} links a repository path, so it needs a commit`
    )
  })

  it('refuses a commit that is not a hash', () => {
    expect(check([entry({ commit: 'main' })])).toContain(
      `${at} has a commit that is not a hash: "main"`
    )
  })

  it.each([
    [
      { label: 'Run', url: 'http://example.com' },
      'evidence "Run" needs an https url',
    ],
    [
      { label: 'Doc', path: '/etc/passwd' },
      'evidence "Doc" needs a path inside the repository',
    ],
    [
      { label: 'Doc', path: 'a/../../b' },
      'evidence "Doc" needs a path inside the repository',
    ],
    [
      { label: 'Both', path: 'a', url: 'https://x.y' },
      'evidence "Both" needs exactly one of path or url',
    ],
    [{ path: 'a' }, 'evidence needs a label'],
  ])('refuses evidence %j', (item, problem) => {
    expect(check([entry({ evidence: [item as Evidence] })])).toContain(
      `${at} ${problem}`
    )
  })

  it('accepts two entries on the same day', () => {
    expect(
      check([entry(), entry({ id: '2026-10-20-beta', subject: 'beta' })])
    ).toEqual([])
  })

  it('reports only the out-of-order entry, not the one after it', () => {
    const errors = check([
      entry({ id: 'b', date: '2026-10-20' }),
      entry({ id: 'a', subject: 'other', date: '2026-10-19' }),
      entry({ id: 'c', subject: 'third', date: '2026-10-20' }),
    ])
    expect(errors).toEqual([
      '"alpha" progress.json entry "a" is out of order; entries go oldest first',
    ])
  })

  it('does not let a future-dated entry make later entries out of order', () => {
    const errors = check([
      entry({ id: 'a', date: '2026-10-20' }),
      entry({ id: 'b', subject: 'other', date: '2026-10-22' }),
      entry({ id: 'c', subject: 'third', date: '2026-10-21' }),
    ])
    expect(errors).toEqual([
      '"alpha" progress.json entry "b" is dated 2026-10-22, after the build day 2026-10-21',
    ])
  })

  it.each([null, 5, 'x'])('does not throw on file %j', (file) => {
    expect(validateProgress(file, ctx)).toEqual([
      '"alpha" progress.json is not a JSON object',
    ])
  })

  it('names the position of each junk entry without throwing', () => {
    const file = {
      schema: 1,
      project: 'alpha',
      entries: [null, 1, 'a', [], {}],
    }
    const errors = validateProgress(file, ctx)
    for (const n of [1, 2, 3, 4]) {
      expect(errors).toContain(
        `"alpha" progress.json entry ${n} is not an object`
      )
    }
    const row = '"alpha" progress.json entry 5'
    expect(errors).toEqual(
      expect.arrayContaining([
        `${row} needs an id with no spaces`,
        `${row} needs a subject`,
        `${row} needs a date as YYYY-MM-DD`,
        `${row} needs a title`,
        `${row} needs measured as a list of { label, value }`,
        `${row} needs an evidence list`,
      ])
    )
  })

  it('refuses evidence that is not a list, without throwing', () => {
    const bad = entry({ evidence: 'RESULT.md' as unknown as Evidence[] })
    expect(check([bad])).toContain(`${at} needs an evidence list`)
  })

  it('accepts an empty measured list', () => {
    expect(check([entry({ measured: [] })])).toEqual([])
  })

  it.each(['release', 'milestone'] as ProgressKind[])(
    'refuses a blank pass mark on %s',
    (kind) => {
      expect(check([entry({ kind, passMark: '  ' })])).toEqual([
        `${at} passMark is blank; omit it or fill it in`,
      ])
    }
  )

  it('refuses unreadable schema without running the entry rules', () => {
    const file = { schema: 2, project: 'alpha', entries: [null, {}] }
    expect(validateProgress(file, ctx)).toEqual([
      '"alpha" progress.json uses schema 2; kcb.pro reads schema 1',
    ])
  })

  it('refuses measured values that are not label and value', () => {
    expect(
      check([entry({ measured: [{ label: 'Median' }] as Measure[] })])
    ).toContain(`${at} needs measured as a list of { label, value }`)
  })
})

describe('validateCommits', () => {
  it('accepts well-formed commits', () => {
    expect(validateCommits([commit()], 'alpha')).toEqual([])
  })

  it('refuses anything but a list', () => {
    expect(validateCommits({}, 'alpha')).toEqual([
      '"alpha" commits are not a list',
    ])
  })

  it('refuses a malformed commit, by position', () => {
    expect(validateCommits([commit({ date: 'yesterday' })], 'alpha')).toEqual([
      '"alpha" commit 1 is not a { sha, date, type, subject, url } record',
    ])
  })

  it.each([
    ['sha', { sha: 'nope' }],
    ['type', { type: 'wip' as never }],
    ['subject', { subject: '' }],
    ['url', { url: 'http://github.com/o/r/commit/01e47db' }],
  ])('refuses a commit with a bad %s', (_field, overrides) => {
    expect(validateCommits([commit(overrides)], 'alpha')).toEqual([
      '"alpha" commit 1 is not a { sha, date, type, subject, url } record',
    ])
  })
})
