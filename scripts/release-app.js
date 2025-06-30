#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get available apps
const getApps = () => {
  const appsDir = path.join(__dirname, '..', 'apps');
  return fs.readdirSync(appsDir).filter(item => {
    const appPath = path.join(appsDir, item);
    const packageJsonPath = path.join(appPath, 'package.json');
    return fs.statSync(appPath).isDirectory() && fs.existsSync(packageJsonPath);
  });
};

// Get affected apps using NX
const getAffectedApps = (base = 'origin/main') => {
  try {
    console.log(`🔍 Checking for affected apps since ${base}...`);
    const command = `npx nx show projects --affected --base=${base}`;
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Parse the output to get affected projects
    const affectedProjects = output
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(project => {
        // Filter for app projects only
        const allApps = getApps();
        return allApps.includes(project);
      });
    
    console.log(`📋 Affected apps: ${affectedProjects.length > 0 ? affectedProjects.join(', ') : 'none'}`);
    return affectedProjects;
  } catch (error) {
    console.warn(`⚠️  Could not determine affected apps: ${error.message}`);
    console.warn('Falling back to manual app selection');
    return [];
  }
};

// Check if app has unreleased changes
const hasUnreleasedChanges = (appName, base = 'origin/main') => {
  try {
    const command = `git log ${base}..HEAD --oneline --pretty=format:"%h %s" -- apps/${appName}`;
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const hasChanges = output.trim().length > 0;
    if (hasChanges) {
      console.log(`📝 ${appName} has unreleased changes since ${base}`);
    }
    return hasChanges;
  } catch (error) {
    console.warn(`⚠️  Could not check changes for ${appName}: ${error.message}`);
    return false;
  }
};

// Release a single app
const releaseApp = (appName, options = {}) => {
  const apps = getApps();
  
  if (!apps.includes(appName)) {
    console.error(`❌ App '${appName}' not found. Available apps: ${apps.join(', ')}`);
    process.exit(1);
  }

  const appDir = path.join(__dirname, '..', 'apps', appName);
  const packageJsonPath = path.join(appDir, 'package.json');
  
  console.log(`🚀 Releasing ${appName}...`);
  
  try {
    // Build release-it command
    const releaseItArgs = [
      '--config', path.join(__dirname, '..', 'release-it.config.js'),
      `--app=${appName}`
    ];
    
    // Add additional options
    if (options.dryRun) releaseItArgs.push('--dry-run');
    if (options.preRelease) releaseItArgs.push('--preRelease');
    if (options.increment) releaseItArgs.push(`--increment=${options.increment}`);
    if (options.ci) releaseItArgs.push('--ci');
    
    const command = `npx release-it ${releaseItArgs.join(' ')}`;
    console.log(`Running: ${command}`);
    
    execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    console.log(`✅ Successfully released ${appName}`);
  } catch (error) {
    console.error(`❌ Failed to release ${appName}:`, error.message);
    process.exit(1);
  }
};

// Release multiple apps in sequence
const releaseMultiple = (appNames, options = {}) => {
  console.log(`🚀 Releasing multiple apps in sequence: ${appNames.join(', ')}`);
  
  for (const appName of appNames) {
    try {
      releaseApp(appName, options);
    } catch (error) {
      console.error(`❌ Failed to release ${appName}, stopping batch release`);
      process.exit(1);
    }
  }
  
  console.log(`✅ Successfully released all apps: ${appNames.join(', ')}`);
};

// CLI interface
const main = () => {
  const args = process.argv.slice(2);
  const options = {};
  const appNames = [];
  let base = 'origin/main';
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--pre-release') {
      options.preRelease = true;
    } else if (arg === '--ci') {
      options.ci = true;
    } else if (arg.startsWith('--increment=')) {
      options.increment = arg.split('=')[1];
    } else if (arg.startsWith('--base=')) {
      base = arg.split('=')[1];
    } else if (arg === '--all') {
      appNames.push(...getApps());
    } else if (arg === '--affected') {
      const affectedApps = getAffectedApps(base);
      if (affectedApps.length === 0) {
        console.log('✅ No affected apps found. Nothing to release.');
        process.exit(0);
      }
      appNames.push(...affectedApps);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Release App Script

Usage:
  node scripts/release-app.js <app-name> [options]
  node scripts/release-app.js <app1> <app2> [options]
  node scripts/release-app.js --all [options]
  node scripts/release-app.js --affected [options]

Options:
  --dry-run          Show what would be released without making changes
  --pre-release      Create a pre-release
  --increment=TYPE   Specify version increment (patch, minor, major, prerelease)
  --base=BRANCH      Base branch for affected detection (default: origin/main)
  --affected         Only release apps affected by changes since base branch
  --ci               Run in CI mode (non-interactive)
  --help, -h         Show this help message

Available apps: ${getApps().join(', ')}

Examples:
  node scripts/release-app.js backend
  node scripts/release-app.js backend frontend --dry-run
  node scripts/release-app.js --all --increment=patch
  node scripts/release-app.js --affected --dry-run
  node scripts/release-app.js --affected --base=main --increment=patch
      `);
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      appNames.push(arg);
    }
  }
  
  if (appNames.length === 0) {
    console.error('❌ No app specified. Use --help for usage information.');
    process.exit(1);
  }
  
  // Remove duplicates
  const uniqueAppNames = [...new Set(appNames)];
  
  if (uniqueAppNames.length === 1) {
    releaseApp(uniqueAppNames[0], options);
  } else {
    releaseMultiple(uniqueAppNames, options);
  }
};

if (require.main === module) {
  main();
}

module.exports = { releaseApp, releaseMultiple, getApps };