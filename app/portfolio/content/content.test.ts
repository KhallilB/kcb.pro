import { catalog, content } from './index'
import { validateCatalog } from '../domain/validate'
import { featured, nowBuilding } from '../domain/catalog'

describe('published content', () => {
  it('passes every catalog rule, hidden entries included', () => {
    expect(validateCatalog(catalog)).toEqual([])
  })

  it('features exactly Bezl and kbui, in season order', () => {
    expect(featured(content.projects).map((p) => p.title)).toEqual([
      'Bezl',
      'kbui',
    ])
  })

  it('is building Bezl now', () => {
    expect(nowBuilding(content.projects)?.title).toBe('Bezl')
  })

  it('keeps the earlier endeavors in the catalog but off the site', () => {
    const hidden = ['deck-workshop', 'mugen-arena', 'wander']
    const all = catalog.projects.map((p) => p.slug)
    const shown = content.projects.map((p) => p.slug)
    expect(all).toEqual(expect.arrayContaining(hidden))
    expect(shown.filter((slug) => hidden.includes(slug))).toEqual([])
  })

  it('carries exactly three work studies', () => {
    expect(content.studies.map((s) => s.slug)).toEqual([
      'figma-canvas',
      'map-labels',
      'benefits-application',
    ])
  })
})
