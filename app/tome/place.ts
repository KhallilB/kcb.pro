// A reader's place, named the same in the book and on the list.
export const TOME_PLACES = [
  'contents',
  'about',
  'deck-workshop',
  'mugen-arena',
  'wander',
  'studies',
  'contact',
] as const

export type TomePlace = (typeof TOME_PLACES)[number]

function isTomePlace(value: unknown): value is TomePlace {
  return TOME_PLACES.includes(value as TomePlace)
}

export function placeOfPath(pathname: string): TomePlace | null {
  const [, section, slug] = pathname.split('/')
  if (section === 'about' && !slug) return 'about'
  if (section === 'studies') return 'studies'
  if (section === 'work' && slug && isTomePlace(slug)) return slug
  return null
}

// The 2D page that says what a book place says; null where the list itself is that page.
export function pathOfPlace(place: TomePlace): string | null {
  if (place === 'about') return '/about'
  if (place === 'studies') return '/studies'
  if (place === 'contents' || place === 'contact') return null
  return `/work/${place}`
}
