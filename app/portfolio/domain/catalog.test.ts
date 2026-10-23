import {
  featured,
  finishedStudies,
  nowBuilding,
  published,
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

  it('features endeavors only, in season order', () => {
    expect(featured([later, site, next, building]).map((p) => p.slug)).toEqual([
      'building',
      'next',
      'later',
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

  it('lists finished studies only, most recently shipped first', () => {
    const studies = [
      study({ slug: 'planned' }),
      study({ slug: 'older', status: 'shipped', shippedOn: '2026-11-08' }),
      study({ slug: 'started', status: 'in-progress' }),
      study({ slug: 'newer', status: 'shipped', shippedOn: '2026-12-13' }),
    ]
    expect(finishedStudies(studies).map((s) => s.slug)).toEqual(['newer', 'older'])
  })
})
