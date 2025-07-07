/* eslint-disable @nx/enforce-module-boundaries */
import styles from './app.module.scss';

import { lazy } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';

const Home = lazy(() => import('@home'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
]);

export function App() {
  return (
    <div className={styles.app_container}>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
