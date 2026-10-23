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

  it('give Bezl every kind of result but failed', () => {
    expect(
      progressCounts(fixtureProgress.bezl.file.entries, '2026-10-21')
    ).toEqual({
      proven: 3,
      partial: 1,
      failed: 0,
      open: 2,
    })
  })
})
