import { activityWeeks, classifyCommit, commitGroups } from './activity'
import { commit } from './fixtures'

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
  ])('reads "%s" as %s', (subject, type) => {
    expect(classifyCommit(subject)).toBe(type)
  })
})

describe('activityWeeks', () => {
  it('lays out twelve weeks of days ending on the build day', () => {
    const weeks = activityWeeks([], '2026-10-21')
    expect(weeks).toHaveLength(12)
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks[0][0].day).toBe('2026-07-30')
    expect(weeks[11][6].day).toBe('2026-10-21')
  })

  it('counts commits per day and ignores days outside the window', () => {
    const weeks = activityWeeks(
      [
        commit({ date: '2026-10-21' }),
        commit({ sha: 'bbbbbbb', date: '2026-10-21' }),
        commit({ sha: 'ccccccc', date: '2026-07-29' }),
      ],
      '2026-10-21'
    )
    expect(weeks[11][6].count).toBe(2)
    expect(weeks.flat().reduce((sum, d) => sum + d.count, 0)).toBe(2)
  })
})

describe('commitGroups', () => {
  it('groups by type in a fixed order, newest first, skipping empty types', () => {
    const older = commit({ sha: 'aaaaaaa', date: '2026-10-01' })
    const newer = commit({ sha: 'bbbbbbb', date: '2026-10-09' })
    const fix = commit({ sha: 'ccccccc', type: 'fix' })
    const other = commit({ sha: 'ddddddd', type: 'other' })
    expect(
      commitGroups([other, older, fix, newer]).map((g) => [
        g.type,
        g.commits.map((c) => c.sha),
      ])
    ).toEqual([
      ['feat', ['bbbbbbb', 'aaaaaaa']],
      ['fix', ['ccccccc']],
      ['other', ['ddddddd']],
    ])
  })
})
