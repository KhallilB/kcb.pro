export const REMOTE_VERSIONS = {
  home: '^1.0.0',
  design: '^1.0.0', 
  frontend: '^1.0.0',
  backend: '^1.0.0',
  devops: '^1.0.0',
  dsa: '^1.0.0'
} as const;

export type RemoteName = keyof typeof REMOTE_VERSIONS;

export function isCompatibleVersion(remote: RemoteName, version: string): boolean {
  const requiredVersion = REMOTE_VERSIONS[remote];
  // Simple semver compatible check - in production you'd use a proper semver library
  return version.startsWith(requiredVersion.replace('^', '').split('.')[0]);
}