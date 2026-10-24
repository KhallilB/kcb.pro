import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { AppRoutes } from './site/AppRoutes'
import { pageMeta, type PageMeta } from './site/meta'
import { SiteProvider } from './site/site-context'
import type { PublicProgress } from './portfolio/domain/progress'
import type { IsoDay } from './portfolio/domain/types'

export { sitePaths } from './portfolio/domain/catalog'
export { validateCatalog } from './portfolio/domain/validate'
export { catalog, content } from './portfolio/content'
export { builtProgress } from './site/progress-data'

export const buildDay: IsoDay = __BUILD_DAY__

export function renderPage(
  path: string,
  asOf: IsoDay,
  progress: Record<string, PublicProgress>
): PageMeta & { html: string } {
  const html = renderToString(
    <SiteProvider asOf={asOf} progress={progress}>
      <StaticRouter location={path}>
        <AppRoutes />
      </StaticRouter>
    </SiteProvider>
  )
  return { html, ...pageMeta(path) }
}
