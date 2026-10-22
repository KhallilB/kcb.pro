import type { ReactNode } from 'react'
import { content, profile } from '@app/portfolio/content'
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

export function SiteProvider({
  asOf,
  tome = browserTome,
  children,
}: {
  asOf: IsoDay
  tome?: TomeHooks
  children: ReactNode
}) {
  return (
    <SiteContext.Provider value={{ asOf, catalog: content, profile, tome }}>
      {children}
    </SiteContext.Provider>
  )
}
