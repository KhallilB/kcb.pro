import * as React from 'react';
import { Link, Route, Routes } from 'react-router';
import { RemoteLoader } from './remote-loader';

const Dsa = React.lazy(() => import('dsa/Module'));
const Home = React.lazy(() => import('home/Module'));
const Design = React.lazy(() => import('design/Module'));
const Frontend = React.lazy(() => import('frontend/Module'));
const Backend = React.lazy(() => import('backend/Module'));
const Devops = React.lazy(() => import('devops/Module'));

export function App() {
  return (
    <React.Suspense fallback={null}>
      <ul>
        <li>Bump</li>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/dsa">Dsa</Link>
        </li>
        <li>
          <Link to="/home">Home</Link>
        </li>
        <li>
          <Link to="/design">Design</Link>
        </li>
        <li>
          <Link to="/frontend">Frontend</Link>
        </li>
        <li>
          <Link to="/backend">Backend</Link>
        </li>
        <li>
          <Link to="/devops">Devops</Link>
        </li>
      </ul>
      <Routes>
        <Route path="/" element={<h1>Shell to me </h1>} />
        <Route
          path="/dsa"
          element={<RemoteLoader remoteName="dsa">{Dsa}</RemoteLoader>}
        />
        <Route
          path="/home"
          element={<RemoteLoader remoteName="home">{Home}</RemoteLoader>}
        />
        <Route
          path="/design"
          element={<RemoteLoader remoteName="design">{Design}</RemoteLoader>}
        />
        <Route
          path="/frontend"
          element={
            <RemoteLoader remoteName="frontend">{Frontend}</RemoteLoader>
          }
        />
        <Route
          path="/backend"
          element={<RemoteLoader remoteName="backend">{Backend}</RemoteLoader>}
        />
        <Route
          path="/devops"
          element={<RemoteLoader remoteName="devops">{Devops}</RemoteLoader>}
        />
      </Routes>
    </React.Suspense>
  );
}

export default App;
// Bump for release 20250629-183439
// Bump for release 20250629-185903
