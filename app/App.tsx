import { RouterProvider } from 'react-router'
import router from '@app/routes'

export default function App() {
  return (
    <div className="h-screen w-screen">
      <RouterProvider router={router} />
    </div>
  )
}
