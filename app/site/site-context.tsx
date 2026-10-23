import type { ReactNode } from 'react'
import { content, profile } from '@app/portfolio/content'
import type { PublicProgress } from '@app/portfolio/domain/progress'
import type { IsoDay } from '@app/portfolio/domain/types'
import { SiteContext, type TomeHooks } from './site'

function supportsWebGL() {
  if (typeof WebGLRenderingContext === 'undefined') return false
  try {
    return Boolean(document.createElement('canvas').getContext('webgl'))
  } catch {
    return false
  }
}

const browserTome: TomeHooks = {
  supportsWebGL,
  load: () => import('@app/tome/engine.js'),
}

const NO_PROGRESS: Record<string, PublicProgress> = {}

export function SiteProvider({
  asOf,
  progress = NO_PROGRESS,
  tome = browserTome,
  children,
}: {
  asOf: IsoDay
  progress?: Record<string, PublicProgress>
  tome?: TomeHooks
  children: ReactNode
}) {
  return (
    <SiteContext.Provider
      value={{ asOf, catalog: content, profile, progress, tome }}
    >
      {children}
    </SiteContext.Provider>
  )
}
