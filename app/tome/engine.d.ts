import type { TomeData } from './copy'
import type { TomePlace } from './place'

export interface TomeHandle {
  destroy(): void
  /** Wake from hide(); turns to place when given. */
  show(place: TomePlace | null): void
  /** Dolly into the page, then sleep until show(). */
  hide(): void
  /** Page being read; null while closed. */
  place(): TomePlace | null
}

export function mountTome(
  host: HTMLElement,
  opts: {
    data: TomeData
    onList: () => void
    onNavigate: (path: string) => void
    /** Pixels at the top the book must stay clear of. */
    insetTop: () => number
    /** Called once, after the first frame is drawn. */
    onReady?: () => void
    /** Called as the cover starts to open (true) or close (false). */
    onOpen?: (open: boolean) => void
  }
): TomeHandle | null
