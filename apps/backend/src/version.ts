import packageJson from '../package.json';

export const VERSION = packageJson.version;
export const NAME = packageJson.name;

export const getRemoteInfo = () => ({
  name: NAME,
  version: VERSION,
  buildTime: new Date().toISOString(),
});

export default {
  VERSION,
  NAME,
  getRemoteInfo,
};