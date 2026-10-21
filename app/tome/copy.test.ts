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
  it('titles its three chapters after the featured endeavors, in order', () => {
    const { deckWorkshop, mugenArena, wander } = data.chapters
    expect([deckWorkshop.title, mugenArena.title, wander.title]).toEqual(
      featured(content.projects).map((p) => p.title)
    )
  })

  it('dates each chapter with the same status line the site shows', () => {
    expect(data.chapters.deckWorkshop.status).toBe('In progress · as of 21 Oct 2026')
    expect(data.chapters.mugenArena.status).toBe('Planned · Jan 2027')
    expect(data.chapters.wander.status).toBe('Planned · Apr 2027')
    expect(data.asOf).toBe('21 October 2026')
  })

  it('names what is being built now', () => {
    expect(data.nowBuilding).toBe('Deck Workshop')
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
