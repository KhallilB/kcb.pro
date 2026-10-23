import { catalog, content } from './index'
import { validateCatalog } from '../domain/validate'
import { featured, nowBuilding, registered } from '../domain/catalog'

// `%` sits outside `\b`: a word boundary never follows it before a space.
const MEASUREMENT =
  /\d[\s-]?(?:(?:ms|[kmgt]i?b|s|secs?|seconds?|mins?|minutes?|x)\b|%)/i
const TEST_COUNT = /\d+ (component )?(tests|stories)\b/i
// Wording that claimed more than the experiments showed.
const OVERCLAIMS = [
  'instantly',
  'accurate text snapshot',
  'builds quickly',
  'Releases are versioned',
]

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
      p.title,
      p.summary,
      p.about,
      p.goal,
      p.domain,
      p.signature,
      ...p.stack,
      ...p.brief.flatMap((s) => [s.heading, ...s.body]),
    ].join('\n')
    expect(text).not.toMatch(MEASUREMENT)
    expect(text).not.toMatch(TEST_COUNT)
    for (const phrase of [
      'Zig',
      'pass mark',
      'no version numbers',
      ...OVERCLAIMS,
    ]) {
      expect(text).not.toContain(phrase)
    }
  })

  it('scopes the Bezl sandbox claim to the one assistant checked', () => {
    const bezl = content.projects.find((p) => p.slug === 'bezl')!
    expect(bezl.signature).toContain('Proven for Codex so far.')
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
