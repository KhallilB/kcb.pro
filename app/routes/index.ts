import { createBrowserRouter } from 'react-router'

import { Home } from '@app/pages/Home'
import { InteractionLab } from '@app/pages/InteractionLab'

const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/interaction-lab',
    Component: InteractionLab,
  },
])

export default router
