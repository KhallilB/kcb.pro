import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import router from '@app/routes'

import './index.css'
import React from 'react'

const rootElement = document.getElementById('root')

if (rootElement) {
  const root = createRoot(rootElement)

  const strictModeElement = React.createElement(
    StrictMode,
    null,
    React.createElement(RouterProvider, { router })
  )

  root.render(strictModeElement)
}
