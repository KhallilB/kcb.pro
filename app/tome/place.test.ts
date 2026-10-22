import { pathOfPlace, placeOfPath, TOME_PLACES } from './place'

describe('the book page a site page belongs to', () => {
  it.each([
    ['/about', 'about'],
    ['/work/bezl', 'bezl'],
    ['/work/kbui', 'kbui'],
    ['/studies', 'studies'],
    ['/studies/map-labels', 'studies'],
  ])('%s opens the book at %s', (path, place) => {
    expect(placeOfPath(path)).toBe(place)
  })

  it.each(['/', '/work', '/work/gallery', '/work/wander', '/nowhere'])('%s has no page of its own', (path) => {
    expect(placeOfPath(path)).toBeNull()
  })
})

describe('the page a book place belongs to', () => {
  it.each(TOME_PLACES.filter((place) => pathOfPlace(place)))('%s round-trips through its page', (place) => {
    expect(placeOfPath(pathOfPlace(place)!)).toBe(place)
  })

  it.each(['contents', 'contact'] as const)('%s stays on the list', (place) => {
    expect(pathOfPlace(place)).toBeNull()
  })
})
