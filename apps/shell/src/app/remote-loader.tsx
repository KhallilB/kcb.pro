import * as React from 'react';
import { REMOTE_VERSIONS, type RemoteName, isCompatibleVersion } from './remote-versions.config';

interface RemoteVersionInfo {
  name: string;
  version: string;
  buildTime?: string;
}

interface RemoteLoaderProps {
  remoteName: RemoteName;
  fallback?: React.ComponentType;
  children: React.ComponentType;
}

const VersionMismatchError: React.FC<{ remoteName: string; expectedVersion: string; actualVersion?: string }> = ({
  remoteName,
  expectedVersion,
  actualVersion,
}) => (
  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
    <h3 className="font-bold">Version Mismatch Error</h3>
    <p>Remote "{remoteName}" version incompatible:</p>
    <ul className="list-disc list-inside mt-2">
      <li>Expected: {expectedVersion}</li>
      <li>Actual: {actualVersion || 'unknown'}</li>
    </ul>
  </div>
);

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-gray-500">Loading remote module...</div>
  </div>
);

export const RemoteLoader: React.FC<RemoteLoaderProps> = ({
  remoteName,
  fallback: Fallback = LoadingFallback,
  children: Component,
}) => {
  const [versionInfo, setVersionInfo] = React.useState<RemoteVersionInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkVersion = async () => {
      try {
        setIsLoading(true);
        
        // Dynamically import the version info from the remote
        const { getRemoteInfo } = await import(`${remoteName}/Version`);
        const info = getRemoteInfo();
        
        setVersionInfo(info);
        
        if (!isCompatibleVersion(remoteName, info.version)) {
          setError(`Version ${info.version} is not compatible with required ${REMOTE_VERSIONS[remoteName]}`);
        }
      } catch (err) {
        console.error(`Failed to load version info for ${remoteName}:`, err);
        setError(`Failed to load remote ${remoteName}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkVersion();
  }, [remoteName]);

  if (isLoading) {
    return <Fallback />;
  }

  if (error) {
    return (
      <VersionMismatchError
        remoteName={remoteName}
        expectedVersion={REMOTE_VERSIONS[remoteName]}
        actualVersion={versionInfo?.version}
      />
    );
  }

  return <Component />;
};

export default RemoteLoader;