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
  it('titles its chapters after the featured endeavors, in order', () => {
    const { bezl, kbui, mugenArena } = data.chapters
    expect([bezl.title, kbui.title, mugenArena.title]).toEqual(
      featured(content.projects).map((p) => p.title)
    )
  })

  it('dates each chapter with the same status line the site shows', () => {
    expect(data.chapters.bezl.status).toBe('In progress · as of 21 Oct 2026')
    expect(data.chapters.kbui.status).toBe('In progress · as of 21 Oct 2026')
    expect(data.chapters.mugenArena.status).toBe('In progress · as of 21 Oct 2026')
    expect(data.asOf).toBe('21 October 2026')
  })

  it('names what is being built now', () => {
    expect(data.nowBuilding).toBe('Bezl')
  })

  it('never names a hidden project', () => {
    const text = strings(data).join(' ')
    for (const name of ['Deck Workshop', 'Wander']) {
      expect(text).not.toContain(name)
    }
  })

  it('names no project a reader cannot find on the site', () => {
    // loupe uses kbui but has no page, so in the book it reads as an unexplained word.
    expect(strings(data).join(' ')).not.toMatch(/loupe/i)
  })

  it('introduces the book in plain words, without narrating its dates', () => {
    expect(data.about).toHaveLength(1)
    expect(data.about[0]).toContain('This book is my side work')
    for (const c of Object.values(data.chapters)) expect(data.about[0]).toContain(c.title)
  })

  it('links every study to a page the site prerenders', () => {
    const paths = sitePaths(content)
    expect(data.studies).toHaveLength(4)
    for (const s of data.studies) expect(paths).toContain(s.path)
  })

  it('gives every study a short name and a reason on the notes page', () => {
    for (const s of data.studies) {
      expect(s.short, s.slug).toBeTruthy()
      expect(s.why, s.slug).toBeTruthy()
    }
  })

  it('links each chapter to its project page in 2D', () => {
    const paths = sitePaths(content)
    expect(data.chapters.bezl.path).toBe('/work/bezl')
    expect(data.chapters.kbui.path).toBe('/work/kbui')
    expect(data.chapters.mugenArena.path).toBe('/work/mugen-arena')
    for (const c of Object.values(data.chapters)) expect(paths).toContain(c.path)
  })

  it('offers email, LinkedIn, GitHub and résumé on the contact page', () => {
    expect(data.contact.map((c) => c.label)).toEqual(['Email', 'LinkedIn', 'GitHub', 'Résumé'])
    expect(data.contact[0].href).toBe('mailto:hi@kcb.pro')
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
    for (const chapter of Object.values(data.chapters)) {
      const p = featured(content.projects).find((f) => f.title === chapter.title)
      expect(chapter.about).toBe(p?.about)
      expect(Object.keys(chapter)).toEqual(['title', 'summary', 'about', 'status', 'notes', 'facts', 'path'])
    }
  })
})
