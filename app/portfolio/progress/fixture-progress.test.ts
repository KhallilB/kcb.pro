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

  it('give every partial entry a summary', () => {
    const partial = Object.values(fixtureProgress).flatMap((p) =>
      p.file.entries.filter((e) => e.result === 'partial')
    )
    expect(partial.map((e) => e.id)).toEqual(['2026-10-20-pty-throughput'])
    expect(partial.every((e) => 'summary' in e)).toBe(true)
  })
})
