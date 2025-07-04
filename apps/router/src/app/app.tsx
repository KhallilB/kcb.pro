import '../styles.css';

import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

const HOME_CDN_URL = process.env.CDN_URL ?? 'http://localhost:4201';

async function loadHome() {
  try {
    const response = await fetch(`${HOME_CDN_URL}/manifest-home.json`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch manifest: ${response.status} ${response.statusText}`
      );
    }

    const manifest = await response.json();

    // NO CONSOLE LOGGING AT ALL - just validate
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Invalid manifest format');
    }

    if (!manifest['main.mjs']) {
      throw new Error('main.mjs not found in manifest');
    }

    // Import the module
    const module = await import(
      /* webpackIgnore: true */
      manifest['main.mjs']
    );

    // Debug what we actually got
    const moduleKeys = Object.keys(module);
    const hasDefault = 'default' in module;
    const hasApp = 'App' in module;

    // Validate the module has a default export
    if (!module.default && !module.App) {
      throw new Error(
        `Home module missing exports. Available keys: ${moduleKeys.join(
          ', '
        )}. Has default: ${hasDefault}, Has App: ${hasApp}`
      );
    }

    // Use App export as fallback if default doesn't exist
    if (!module.default && module.App) {
      return { default: module.App };
    }

    return module;
  } catch (error) {
    // Create a simple error component instead of logging
    return {
      default: () => {
        return (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              border: '1px solid #e74c3c',
              borderRadius: '8px',
              margin: '20px',
              backgroundColor: '#ffeaea',
            }}
          >
            <h2 style={{ color: '#e74c3c', marginBottom: '16px' }}>
              Module Loading Error
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Error: {(error as Error).message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        );
      },
    };
  }
}

const Home = lazy(loadHome);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          border: '1px solid #f39c12',
          borderRadius: '8px',
          margin: '20px',
          backgroundColor: '#fef9e7',
        }}
      >
        <h2 style={{ color: '#f39c12', marginBottom: '16px' }}>Router Error</h2>
        <p style={{ marginBottom: '16px' }}>
          An error occurred in the router. This is likely a problem with the
          Home module.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reload Page
        </button>
      </div>
    ),
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

export default App;
