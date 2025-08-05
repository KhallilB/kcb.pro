import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

const Home = lazy(() => import('@home'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  }
])

function App() {
  return <RouterProvider router={router} />
}

export default App
