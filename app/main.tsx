import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource/cinzel/500.css'
import '@fontsource/cinzel/700.css'
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/600.css'
import '@kb.ui/css/components/card.css'
import '@kb.ui/css/components/grid.css'
import '@kb.ui/css/components/status.css'
import './styles/tokens.css'
import './styles/site.css'
import './styles/tome.css'
import { AppRoutes } from './site/AppRoutes'
import { SiteProvider } from './site/site-context'
import { builtProgress } from './site/progress-data'

const root = document.getElementById('root')

if (root) {
  const app = (
    <StrictMode>
      <SiteProvider
        asOf={__BUILD_DAY__}
        progress={builtProgress(__BUILD_DAY__)}
      >
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SiteProvider>
    </StrictMode>
  )
  // Prerendered pages hydrate; the dev server starts empty.
  if (root.hasChildNodes()) hydrateRoot(root, app)
  else createRoot(root).render(app)
}
