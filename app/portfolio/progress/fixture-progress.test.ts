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
    expect(progressCounts(fixtureProgress.bezl.entries, '2026-10-21')).toEqual({
      proven: 3,
      partial: 1,
      failed: 0,
      open: 2,
    })
  })

  it('give every partial entry a summary', () => {
    const partial = Object.values(fixtureProgress).flatMap((p) =>
      p.entries.filter((e) => e.result === 'partial')
    )
    expect(partial.map((e) => e.id)).toEqual([
      '2026-10-20-pty-throughput',
      '2026-10-20-gate0-multi-height',
      '2026-10-20-m1-m2-arena-runtime',
      '2026-10-20-m3-combat',
      '2026-10-20-m4-fighter-factory',
      '2026-10-20-m5-roster-watch-mode',
    ])
    expect(partial.every((e) => 'summary' in e)).toBe(true)
  })

  it('ship the public shape only', () => {
    expect(Object.keys(fixtureProgress.bezl)).toEqual(['entries', 'days'])
    expect(fixtureProgress.bezl.days.at(-1)).toEqual({
      day: '2026-10-21',
      count: 11,
    })
  })
})
