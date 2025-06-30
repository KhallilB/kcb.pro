import * as React from 'react';
import { Link, Route, Routes } from 'react-router';

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
        <Route path="/dsa" element={<Dsa />} />
        <Route path="/home" element={<Home />} />
        <Route path="/design" element={<Design />} />
        <Route path="/frontend" element={<Frontend />} />
        <Route path="/backend" element={<Backend />} />
        <Route path="/devops" element={<Devops />} />
      </Routes>
    </React.Suspense>
  );
}

export default App;
// Bump for release 20250629-183439
