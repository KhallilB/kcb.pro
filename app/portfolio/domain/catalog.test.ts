import {
  featured,
  nowBuilding,
  published,
  registered,
  sitePaths,
  workIndex,
} from './catalog'
import { catalog, project, study } from './fixtures'

describe('catalog', () => {
  const site = project({
    slug: 'site',
    kind: 'site',
    status: 'in-progress',
    order: 0,
    startsOn: '2026-10-19',
  })
  const building = project({
    slug: 'building',
    status: 'in-progress',
    order: 1,
    startsOn: '2026-09-20',
  })
  const next = project({ slug: 'next', order: 2, startsOn: '2027-01-04' })
  const later = project({ slug: 'later', order: 3, startsOn: '2027-04-12' })
  const done = project({
    slug: 'done',
    status: 'shipped',
    order: 4,
    startsOn: '2025-01-01',
    shippedOn: '2025-06-01',
  })

  it('reports the endeavor being built now, never the site itself', () => {
    expect(nowBuilding([site, next, building])?.slug).toBe('building')
  })

  it('reports nothing being built when no endeavor is in progress', () => {
    expect(nowBuilding([site, next])).toBeUndefined()
  })

  it('features ranked endeavors by rank, never by season order', () => {
    const first = project({ slug: 'first', order: 3, rank: 1 })
    const second = project({ slug: 'second', order: 1, rank: 2 })
    const unranked = project({ slug: 'unranked', order: 0 })
    expect(
      featured([second, unranked, site, first]).map((p) => p.slug)
    ).toEqual(['first', 'second'])
  })

  it('registers listed projects that name a repo', () => {
    const tracked = project({ slug: 'tracked', repo: 'KhallilB/tracked' })
    const hidden = project({
      slug: 'hidden',
      repo: 'KhallilB/hidden',
      listed: false,
    })
    expect(registered([tracked, hidden, next])).toEqual([
      { slug: 'tracked', repo: 'KhallilB/tracked' },
    ])
  })

  it('orders the work index as live now, then next, then done', () => {
    expect(
      workIndex([done, later, site, next, building]).map((p) => p.slug)
    ).toEqual(['site', 'building', 'next', 'later', 'done'])
  })

  it('lists every page the site must prerender', () => {
    const paths = sitePaths(
      catalog([building, next], [study({ slug: 'labels' })])
    )
    expect(paths).toEqual([
      '/',
      '/work',
      '/work/building',
      '/work/next',
      '/studies',
      '/studies/labels',
      '/about',
    ])
  })

  it('publishes listed projects only, and every study', () => {
    const hidden = project({ slug: 'hidden', listed: false })
    const shown = published(
      catalog([building, hidden, next], [study({ slug: 'labels' })])
    )
    expect(shown.projects.map((p) => p.slug)).toEqual(['building', 'next'])
    expect(shown.studies.map((s) => s.slug)).toEqual(['labels'])
  })
})
