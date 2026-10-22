import type { TomeData } from './copy'

export function mountTome(
  host: HTMLElement,
  opts: {
    data: TomeData
    onList: () => void
    onNavigate: (path: string) => void
    /** Pixels at the top the book must stay clear of. */
    insetTop: () => number
  }
): (() => void) | null
