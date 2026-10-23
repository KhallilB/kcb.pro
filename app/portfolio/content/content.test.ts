import { catalog, content } from './index'
import { validateCatalog } from '../domain/validate'
import { featured, nowBuilding, registered } from '../domain/catalog'

describe('published content', () => {
  it('passes every catalog rule, hidden entries included', () => {
    expect(validateCatalog(catalog)).toEqual([])
  })

  it('features exactly Bezl and kbui, by rank', () => {
    expect(featured(content.projects).map((p) => p.title)).toEqual([
      'Bezl',
      'kbui',
    ])
  })

  // Outcomes only: test numbers stay in each project's own record.
  it.each(['bezl', 'kbui'])('keeps measurements out of the %s copy', (slug) => {
    const p = content.projects.find((project) => project.slug === slug)!
    const text = [
      p.summary,
      p.about,
      p.goal,
      ...p.brief.flatMap((s) => [s.heading, ...s.body]),
    ].join('\n')
    expect(text).not.toMatch(/\d\s?(ms|MB|GB|KiB|MiB)\b/)
    for (const phrase of [
      'Zig',
      'pass mark',
      '28 component tests',
      '16 stories',
      'no version numbers',
    ]) {
      expect(text).not.toContain(phrase)
    }
  })

  it('registers Bezl and kbui by their public repositories', () => {
    expect(registered(content.projects)).toEqual([
      { slug: 'bezl', repo: 'KhallilB/bezl' },
      { slug: 'kbui', repo: 'KhallilB/kbui' },
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
