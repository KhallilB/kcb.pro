import { content } from '../content'
import { registered } from '../domain/catalog'
import { progressCounts } from '../domain/progress'
import { fixtureProgress } from './fixture-progress'

describe('offline fixtures', () => {
  it('cover every registered project', () => {
    expect(Object.keys(fixtureProgress).sort()).toEqual(
      registered(content.projects)
        .map((p) => p.slug)
        .sort()
    )
  })

  it('record the completed kbui entries', () => {
    expect(progressCounts(fixtureProgress.kbui.entries, '2026-10-21')).toEqual({
      proven: 3,
      partial: 0,
      failed: 0,
      open: 0,
    })
  })

  it('ship the public shape only', () => {
    expect(Object.keys(fixtureProgress.kbui)).toEqual(['entries', 'days'])
    expect(fixtureProgress.kbui.days.find(({ day }) => day === '2026-10-16')).toEqual({
      day: '2026-10-16',
      count: 12,
    })
  })
})
