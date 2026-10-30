import { existsSync } from 'node:fs'
import { catalog, content } from './index'
import { validateCatalog } from '../domain/validate'
import { featured, nowBuilding, registered } from '../domain/catalog'

// `%` sits outside `\b`: a word boundary never follows it before a space.
const MEASUREMENT =
  /\d[\s-]?(?:(?:ms|[kmgt]i?b|s|secs?|seconds?|mins?|minutes?|x)\b|%)/i
const TEST_COUNT = /\d+ (component )?(tests|stories)\b/i
// Studies stand on their own; the project they help is never named in them.
const PROJECT_NAMES = /bezl|kbui|live ?league|mugen|deck workshop/i
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

  it('features Bezl and kbui, by rank', () => {
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

  it('links Bezl to its public source and downloads, never its private repo', () => {
    const bezl = content.projects.find((p) => p.slug === 'bezl')!
    expect(bezl.links).toEqual([
      { label: 'Download', href: 'https://github.com/KhallilB/bezl/releases' },
      { label: 'Source', href: 'https://github.com/KhallilB/bezl' },
    ])
  })

  // The thing you can use comes first, then the source behind it.
  it('links kbui to the components you can try, the package and the source', () => {
    const kbui = content.projects.find((p) => p.slug === 'kbui')!
    expect(kbui.links).toEqual([
      { label: 'Components', href: 'https://kbui.kcb.pro' },
      { label: 'Package', href: 'https://www.npmjs.com/package/@kb.ui/react' },
      { label: 'Source', href: 'https://github.com/KhallilB/kbui' },
    ])
  })

  it('says Bezl is built on kbui, and names no release that will go stale', () => {
    const copy = (slug: string) =>
      content.projects
        .find((p) => p.slug === slug)!
        .brief.flatMap((s) => s.body)
        .join('\n')
    expect(copy('bezl')).toContain('built on kbui')
    expect(copy('kbui')).toContain('Bezl’s task screen')
    expect(copy('kbui')).not.toMatch(/\b\d+\.\d+\.\d+\b/)
  })

  // A named build is a dated fact, so the date has to travel with it.
  it('dates the Bezl release it names', () => {
    const copy = content.projects
      .find((p) => p.slug === 'bezl')!
      .brief.flatMap((s) => s.body)
      .join('\n')
    const release = copy.split('\n').filter((line) => line.includes('v0.1.0'))
    expect(release.length).toBeGreaterThan(0)
    for (const line of release) expect(line).toMatch(/\b\d{1,2} \w{3} \d{4}\b/)
  })

  // A src that points at nothing ships a broken image; only the file proves it.
  it('ships every screenshot it names', () => {
    for (const p of content.projects) {
      for (const shot of p.media ?? []) {
        expect(existsSync(`public${shot.src}`), `${p.slug}: ${shot.src}`).toBe(
          true
        )
      }
    }
  })

  it('registers Bezl by its private progress repo, kbui by its public one', () => {
    expect(registered(content.projects)).toEqual([
      { slug: 'bezl', repo: 'KhallilB/bezl-internal' },
      { slug: 'kbui', repo: 'KhallilB/kbui' },
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
    const hidden = ['deck-workshop', 'mugen-arena', 'wander']
    const all = catalog.projects.map((p) => p.slug)
    const shown = content.projects.map((p) => p.slug)
    expect(all).toEqual(expect.arrayContaining(hidden))
    expect(shown.filter((slug) => hidden.includes(slug))).toEqual([])
  })

  it('carries seven work studies, in the order they start', () => {
    expect(content.studies.map((s) => s.slug)).toEqual([
      'terminal-speed',
      'review-signal',
      'safe-fixes',
      'read-only',
      'trusted-checker',
      'decision-or-luck',
      'merge-queue',
    ])
  })

  it('names no project in a study, so each reads as its own problem', () => {
    for (const s of content.studies) {
      const text = [s.title, s.question, s.about, s.builtSlice, s.kitPiece]
        .concat(s.brief.flatMap((b) => [b.heading, ...b.body]))
        .join('\n')
      expect(text, s.slug).not.toMatch(PROJECT_NAMES)
    }
  })

  it('aims every attached study at a listed project, and leaves no endeavor without one', () => {
    const shown = content.projects.map((p) => p.slug)
    for (const s of content.studies) {
      for (const fed of s.feeds) expect(shown, s.slug).toContain(fed)
    }
    // Feeds work that has no page here.
    expect(
      content.studies.filter((s) => s.feeds.length === 0).map((s) => s.slug)
    ).toEqual(['decision-or-luck'])
    const fed = new Set(content.studies.flatMap((s) => s.feeds))
    const unfed = featured(content.projects).filter((p) => !fed.has(p.slug))
    expect(unfed.map((p) => p.title)).toEqual([])
  })
})
