import { content } from '@app/portfolio/content'
import { featured, sitePaths } from '@app/portfolio/domain/catalog'
import { hasPlaceholder } from '@app/portfolio/domain/validate'
import { tomeData } from './copy'

const data = tomeData('2026-10-21')

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

describe('tome data', () => {
  it('keeps measurements out of the chapters', () => {
    const text = strings(data.chapters).join('\n')
    // `%` sits outside `\b`: a word boundary never follows it before a space.
    expect(text).not.toMatch(
      /\d[\s-]?(?:(?:ms|[kmgt]i?b|s|secs?|seconds?|mins?|minutes?|x)\b|%)/i
    )
    expect(text).not.toMatch(/\d+ (component )?(tests|stories)\b/i)
    for (const phrase of [
      'Zig',
      'instantly',
      'accurate text snapshot',
      'builds quickly',
      'Releases are versioned',
    ]) {
      expect(text).not.toContain(phrase)
    }
  })

  it('lists Bezl as a current user of kbui', () => {
    expect(strings(data.chapters)).toContain('loupe; Bezl, in progress')
  })

  it('titles its two chapters after the featured endeavors, in order', () => {
    const { bezl, kbui } = data.chapters
    expect([bezl.title, kbui.title]).toEqual(
      featured(content.projects).map((p) => p.title)
    )
  })

  it('dates each chapter with the same status line the site shows', () => {
    expect(data.chapters.bezl.status).toBe('In progress · as of 21 Oct 2026')
    expect(data.chapters.kbui.status).toBe('In progress · as of 21 Oct 2026')
    expect(data.asOf).toBe('21 October 2026')
  })

  it('names what is being built now', () => {
    expect(data.nowBuilding).toBe('Bezl')
  })

  it('never names a hidden project', () => {
    const text = strings(data).join(' ')
    for (const name of ['Deck Workshop', 'Mugen Arena', 'Wander']) {
      expect(text).not.toContain(name)
    }
  })

  it('links every study to a page the site prerenders', () => {
    const paths = sitePaths(content)
    expect(data.studies).toHaveLength(3)
    for (const s of data.studies) expect(paths).toContain(s.path)
  })

  it('carries no placeholder text anywhere', () => {
    expect(strings(data).filter(hasPlaceholder)).toEqual([])
  })

  it('gives each chapter three facts and at most three notes, so pages never overflow', () => {
    for (const chapter of Object.values(data.chapters)) {
      expect(chapter.facts).toHaveLength(3)
      expect(chapter.notes.length).toBeLessThanOrEqual(3)
      for (const [, note] of chapter.notes) expect(note.length).toBeLessThanOrEqual(190)
      // The chapter page sets the summary on one italic line; longer clips at both edges.
      expect(chapter.summary.length, chapter.title).toBeLessThanOrEqual(70)
    }
  })

  it('says what each chapter is in the catalog’s own words, with no sample data', () => {
    for (const p of featured(content.projects)) {
      const chapter = Object.values(data.chapters).find((c) => c.title === p.title)
      expect(chapter?.about).toBe(p.about)
      expect(Object.keys(chapter ?? {})).toEqual(['title', 'summary', 'about', 'status', 'notes', 'facts'])
    }
  })
})
