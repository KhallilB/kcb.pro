import '../styles.css';

export function App() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1>Home</h1>
      <p>Version: {process.env.npm_package_version}</p>
    </div>
  );
}

export default App;
