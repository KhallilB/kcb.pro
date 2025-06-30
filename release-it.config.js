const fs = require('fs');
const path = require('path');

// Get the app name from the current working directory or command line argument
const getAppName = () => {
  const appArg = process.argv.find(arg => arg.startsWith('--app='));
  if (appArg) {
    return appArg.split('=')[1];
  }
  
  const cwd = process.cwd();
  const appMatch = cwd.match(/apps\/([^\/]+)/);
  return appMatch ? appMatch[1] : null;
};

// Get the app directory based on app name
const getAppDir = (appName) => {
  const rootDir = path.resolve(__dirname);
  return path.join(rootDir, 'apps', appName);
};

// Generate configuration for a specific app
const generateConfig = (appName) => {
  if (!appName) {
    throw new Error('App name is required. Use --app=<app-name> or run from within an app directory.');
  }

  const appDir = getAppDir(appName);
  const packageJsonPath = path.join(appDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Package.json not found for app: ${appName}`);
  }

  return {
    "$schema": "https://unpkg.com/release-it@19/schema/release-it.json",
    "git": {
      "tagName": `${appName}-v\${version}`,
      "tagMatch": `${appName}-v*`,
      "tagAnnotation": `Release ${appName} v\${version}`,
      "commitMessage": `chore(${appName}): release v\${version}`,
      "commit": true,
      "tag": true,
      "push": false,
      "requireCleanWorkingDir": false
    },
    "github": {
      "release": true,
      "draft": true,
      "autoGenerate": true,
      "releaseName": `${appName} v\${version}`,
      "tagName": `${appName}-v\${version}`
    },
    "plugins": {
      "@release-it/bumper": {
        "in": `./apps/${appName}/package.json`,
        "out": false
      },
      "@release-it/conventional-changelog": {
        "preset": "angular",
        "path": ".",
        "infile": `apps/${appName}/CHANGELOG.md`,
        "header": "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n",
        "strictSemVer": false,
        "context": {
          "path": `apps/${appName}`
        },
        "gitRawCommitsOpts": {
          "path": `apps/${appName}`
        }
      }
    }
  };
};

const appName = getAppName();
module.exports = generateConfig(appName);