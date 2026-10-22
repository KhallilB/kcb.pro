import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { AppRoutes } from './site/AppRoutes'
import { pageMeta, type PageMeta } from './site/meta'
import { SiteProvider } from './site/site-context'
import type { IsoDay } from './portfolio/domain/types'

export { sitePaths } from './portfolio/domain/catalog'
export { validateCatalog } from './portfolio/domain/validate'
export { content } from './portfolio/content'

export const buildDay: IsoDay = __BUILD_DAY__

export function renderPage(
  path: string,
  asOf: IsoDay
): PageMeta & { html: string } {
  const html = renderToString(
    <SiteProvider asOf={asOf}>
      <StaticRouter location={path}>
        <AppRoutes />
      </StaticRouter>
    </SiteProvider>
  )
  return { html, ...pageMeta(path) }
}
