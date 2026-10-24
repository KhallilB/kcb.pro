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
