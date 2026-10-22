import { placeOfPath } from './place'

describe('the book page a site page belongs to', () => {
  it.each([
    ['/about', 'about'],
    ['/work/deck-workshop', 'deck-workshop'],
    ['/work/mugen-arena', 'mugen-arena'],
    ['/work/wander', 'wander'],
    ['/studies', 'studies'],
    ['/studies/map-labels', 'studies'],
  ])('%s opens the book at %s', (path, place) => {
    expect(placeOfPath(path)).toBe(place)
  })

  it.each(['/', '/work', '/work/gallery', '/nowhere'])('%s has no page of its own', (path) => {
    expect(placeOfPath(path)).toBeNull()
  })
})
