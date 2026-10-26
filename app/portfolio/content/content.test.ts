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

  it('features Bezl, kbui and Mugen Arena, by rank', () => {
    expect(featured(content.projects).map((p) => p.title)).toEqual([
      'Bezl',
      'kbui',
      'Mugen Arena',
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

  it('says Bezl is built on kbui, and names no release that will go stale', () => {
    const copy = (slug: string) =>
      content.projects
        .find((p) => p.slug === slug)!
        .brief.flatMap((s) => s.body)
        .join('\n')
    expect(copy('bezl')).toContain('being built on kbui')
    expect(copy('kbui')).toContain('Bezl’s first screen is being built on it')
    expect(copy('kbui')).not.toMatch(/\b\d+\.\d+\.\d+\b/)
  })

  it('registers Bezl by its private progress repo, kbui and Mugen Arena by their public ones', () => {
    expect(registered(content.projects)).toEqual([
      { slug: 'bezl', repo: 'KhallilB/bezl-internal' },
      { slug: 'kbui', repo: 'KhallilB/kbui' },
      { slug: 'mugen-arena', repo: 'KhallilB/arena-mugen-3d' },
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
