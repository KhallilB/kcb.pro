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
