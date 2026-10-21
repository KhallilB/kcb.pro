import type { TomeData } from './copy'

export function mountTome(
  host: HTMLElement,
  opts: {
    data: TomeData
    onList: () => void
    onNavigate: (path: string) => void
  }
): (() => void) | null
