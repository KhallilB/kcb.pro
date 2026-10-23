import {
  current,
  earlierEntries,
  evidenceHref,
  journeySteps,
  kindLabel,
  nextStep,
  overallSeal,
  PROGRESS_KINDS,
  PROGRESS_RESULTS,
  progressCounts,
  quietSince,
  resultLabel,
  STATUS_ORDER,
  STATUS_WORD,
  toPublic,
  validateCommits,
  validateProgress,
  type Evidence,
  type Measure,
  type ProjectProgress,
  type ProgressEntry,
  type ProgressKind,
  type ProgressResult,
} from './progress'
import { commit, entry, progressFile } from './fixtures'
import { addDays } from './dates'

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
      expect(check([entry({ summary: summary as unknown as string })])).toEqual(
        [`${at} needs a summary of one line, 1 to 140 characters`]
      )
    }
  )

  it('reports one problem for a partial entry with a blank summary', () => {
    expect(check([entry({ result: 'partial', summary: ' ' })])).toEqual([
      `${at} needs a summary of one line, 1 to 140 characters`,
    ])
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

const day = '2026-10-21'

describe('current', () => {
  const first = entry({
    id: 'a1',
    subject: 'a',
    date: '2026-10-01',
    result: 'fail',
  })
  const other = entry({ id: 'b1', subject: 'b', date: '2026-10-05' })
  const rerun = entry({ id: 'a2', subject: 'a', date: '2026-10-10' })

  it('keeps the latest entry per subject, newest first', () => {
    expect(current([first, other, rerun], day).map((e) => e.id)).toEqual([
      'a2',
      'b1',
    ])
  })

  it('reads the record as it stood on an earlier day', () => {
    expect(
      current([first, other, rerun], '2026-10-06').map((e) => e.id)
    ).toEqual(['b1', 'a1'])
  })

  it('lets a later entry on the same day replace an earlier one', () => {
    const morning = entry({ id: 'm', subject: 's', result: 'fail' })
    const evening = entry({ id: 'e', subject: 's', result: 'pass' })
    expect(current([morning, evening], day).map((e) => e.id)).toEqual(['e'])
  })

  it('includes an entry dated on the day and excludes the day after', () => {
    const onDay = entry({ id: 'on', subject: 'p', date: '2026-10-21' })
    const after = entry({ id: 'after', subject: 'q', date: '2026-10-22' })
    expect(current([onDay, after], day).map((e) => e.id)).toEqual(['on'])
  })

  it('orders same-day subjects with the last written first', () => {
    const x = entry({ id: 'x', subject: 'x' })
    const y = entry({ id: 'y', subject: 'y' })
    expect(current([x, y], day).map((e) => e.id)).toEqual(['y', 'x'])
  })
})

describe('progressCounts', () => {
  it('counts current subjects as proven, partial, failed and open', () => {
    const entries = [
      entry({ id: '1', subject: 'a', date: '2026-10-01', result: 'fail' }),
      entry({ id: '2', subject: 'a', date: '2026-10-02', result: 'pass' }),
      entry({ id: '3', subject: 'b', result: 'partial' }),
      entry({ id: '4', subject: 'c', result: 'fail' }),
      entry({ id: '5', subject: 'd', result: 'not-run' }),
    ]
    expect(progressCounts(entries, day)).toEqual({
      proven: 1,
      partial: 1,
      failed: 1,
      open: 1,
    })
  })
})

describe('overallSeal as of a day', () => {
  it('flips when a later entry for the same subject arrives', () => {
    const entries = [
      entry({ id: 'a1', subject: 'a', date: '2026-10-01', result: 'fail' }),
      entry({ id: 'a2', subject: 'a', date: '2026-10-10', result: 'pass' }),
    ]
    expect(overallSeal(entries, '2026-10-05')).toBe('fail')
    expect(overallSeal(entries, day)).toBe('pass')
  })
})

describe('overallSeal', () => {
  it.each([
    [[], null],
    [['pass', 'pass'], 'pass'],
    [['pass', 'partial'], 'partial'],
    [['pass', 'not-run'], 'partial'],
    [['partial', 'fail'], 'fail'],
  ] as [ProgressResult[], ProgressResult | null][])(
    'seals %j as %s',
    (results, seal) => {
      const entries = results.map((result, i) =>
        entry({ id: `e${i}`, subject: `s${i}`, result })
      )
      expect(overallSeal(entries, day)).toBe(seal)
    }
  )
})

describe('quietSince', () => {
  it('names the newest entry once it is more than 30 days old', () => {
    const entries = [
      entry({ id: 'a', date: '2026-09-01' }),
      entry({ id: 'b', date: '2026-09-20' }),
    ]
    expect(quietSince(entries, day)).toBe('2026-09-20')
  })

  it('ignores entries dated after the day', () => {
    const entries = [
      entry({ id: 'old', date: '2026-09-01' }),
      entry({ id: 'future', date: '2026-10-22' }),
    ]
    expect(quietSince(entries, day)).toBe('2026-09-01')
  })

  it('stays silent within 30 days, or with no entries', () => {
    expect(quietSince([entry({ date: '2026-09-21' })], day)).toBeNull()
    expect(quietSince([], day)).toBeNull()
  })
})

describe('words and links', () => {
  it('words every result and kind', () => {
    expect(PROGRESS_RESULTS.map((r) => resultLabel(r))).toEqual([
      'Pass',
      'Partial',
      'Fail',
      'Not run',
    ])
    expect(PROGRESS_KINDS.map((k) => kindLabel(k))).toEqual([
      'Experiment',
      'Tests',
      'Release',
      'Milestone',
    ])
  })

  it('links a repository path at its commit, and a url as given', () => {
    expect(
      evidenceHref(
        { label: 'R', path: 'spikes/a/RESULT.md' },
        'KhallilB/bezl',
        '01e47db'
      )
    ).toBe('https://github.com/KhallilB/bezl/blob/01e47db/spikes/a/RESULT.md')
    expect(
      evidenceHref(
        { label: 'Run', url: 'https://github.com/o/r/actions/runs/1' },
        'KhallilB/bezl'
      )
    ).toBe('https://github.com/o/r/actions/runs/1')
  })

  it('refuses a repository path with no commit', () => {
    expect(() =>
      evidenceHref({ label: 'R', path: 'spikes/x.md' }, 'KhallilB/bezl')
    ).toThrow('Evidence "spikes/x.md" needs a commit')
  })

  it('encodes each path segment, keeping the slashes', () => {
    expect(
      evidenceHref(
        { label: 'R', path: 'spikes/my run/a#1.md' },
        'KhallilB/bezl',
        '01e47db'
      )
    ).toBe(
      'https://github.com/KhallilB/bezl/blob/01e47db/spikes/my%20run/a%231.md'
    )
  })
})

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

  it('puts a later same-day entry first', () => {
    const entries = [
      entry({ id: 'a1', subject: 'a', date: '2026-10-03', result: 'fail' }),
      entry({ id: 'a2', subject: 'a', date: '2026-10-03', result: 'not-run' }),
      entry({ id: 'a3', subject: 'a', date: '2026-10-05' }),
    ]
    expect(earlierEntries(entries, entries[2], day).map((e) => e.id)).toEqual([
      'a2',
      'a1',
    ])
  })

  it('leaves out the step even when given a copy of it', () => {
    const entries = [
      entry({ id: 'a1', subject: 'a', date: '2026-10-01', result: 'fail' }),
      entry({ id: 'a2', subject: 'a', date: '2026-10-05' }),
    ]
    const step = { ...entries[1] }
    expect(earlierEntries(entries, step, day).map((e) => e.id)).toEqual(['a1'])
  })
})
