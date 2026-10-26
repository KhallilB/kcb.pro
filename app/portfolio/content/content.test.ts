import { catalog, content } from './index'
import { validateCatalog } from '../domain/validate'
import { featured, nowBuilding } from '../domain/catalog'

describe('published content', () => {
  it('passes every catalog rule, hidden entries included', () => {
    expect(validateCatalog(catalog)).toEqual([])
  })

  it('features Bezl, kbui and Mugen Arena, in season order', () => {
    expect(featured(content.projects).map((p) => p.title)).toEqual([
      'Bezl',
      'kbui',
      'Mugen Arena',
    ])
  })

  it('names no project a reader cannot find, and does not keep saying it is dated', () => {
    const text = JSON.stringify(content)
    // loupe uses kbui but has no page on the site.
    expect(text).not.toMatch(/loupe/i)
    expect(text).not.toMatch(/is dated|polish alone|the site you are reading/i)
  })

  it('is building Bezl now', () => {
    expect(nowBuilding(content.projects)?.title).toBe('Bezl')
  })

  it('keeps the earlier endeavors in the catalog but off the site', () => {
    const hidden = ['deck-workshop', 'wander']
    const all = catalog.projects.map((p) => p.slug)
    const shown = content.projects.map((p) => p.slug)
    expect(all).toEqual(expect.arrayContaining(hidden))
    expect(shown.filter((slug) => hidden.includes(slug))).toEqual([])
  })

  it('carries four work studies, in the order they start', () => {
    expect(content.studies.map((s) => s.slug)).toEqual([
      'figma-canvas',
      'terminal-speed',
      'design-rules',
      'fighter-editor',
    ])
  })

  it('aims every study at a listed project, and leaves no endeavor without one', () => {
    const shown = content.projects.map((p) => p.slug)
    for (const s of content.studies) {
      expect(s.feeds.length, s.slug).toBeGreaterThan(0)
      for (const fed of s.feeds) expect(shown, s.slug).toContain(fed)
    }
    const fed = new Set(content.studies.flatMap((s) => s.feeds))
    const unfed = featured(content.projects).filter((p) => !fed.has(p.slug))
    expect(unfed.map((p) => p.title)).toEqual([])
  })
})
