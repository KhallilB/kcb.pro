import { createContext, useContext } from 'react'
import type { profile } from '@app/portfolio/content'
import type { PublicProgress } from '@app/portfolio/domain/progress'
import type { Catalog, IsoDay } from '@app/portfolio/domain/types'
import type { mountTome } from '@app/tome/engine.js'

// Seams for the 3D engine, so tests and browsers without WebGL never load three.
export interface TomeHooks {
  supportsWebGL: () => boolean
  load: () => Promise<{ mountTome: typeof mountTome }>
}

export interface Site {
  // Build day every as-of stamp reads; never the visitor's clock.
  asOf: IsoDay
  catalog: Catalog
  // Baked in at build time; a slug with no entry has no ledger.
  progress: Record<string, PublicProgress>
  profile: typeof profile
  tome: TomeHooks
}

export const SiteContext = createContext<Site | null>(null)

export function useSite(): Site {
  const site = useContext(SiteContext)
  if (!site) throw new Error('useSite needs a SiteProvider')
  return site
}
