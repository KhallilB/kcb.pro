import { content } from './index'
import { validateCatalog } from '../domain/validate'
import { featured, nowBuilding } from '../domain/catalog'

describe('published content', () => {
  it('passes every catalog rule', () => {
    expect(validateCatalog(content)).toEqual([])
  })

  it('features exactly the three endeavors, in season order', () => {
    expect(featured(content.projects).map((p) => p.title)).toEqual([
      'Deck Workshop',
      'Mugen Arena',
      'Wander',
    ])
  })

  it('is building Deck Workshop now', () => {
    expect(nowBuilding(content.projects)?.title).toBe('Deck Workshop')
  })

  it('carries exactly three work studies', () => {
    expect(content.studies.map((s) => s.slug)).toEqual([
      'figma-canvas',
      'map-labels',
      'benefits-application',
    ])
  })
})
