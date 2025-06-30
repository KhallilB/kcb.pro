#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

/**
 * Updates versions for affected apps before release-it runs
 * Called automatically by release-it hook
 */

const BUMP_TYPE = process.argv[2] || 'patch';
const BASE_REF = process.argv[3] || getLastReleaseTag();
const VALID_BUMP_TYPES = ['patch', 'minor', 'major', 'prerelease'];

if (!VALID_BUMP_TYPES.includes(BUMP_TYPE)) {
  console.error(`❌ Invalid bump type: ${BUMP_TYPE}`);
  console.error(`Valid types: ${VALID_BUMP_TYPES.join(', ')}`);
  process.exit(1);
}

function getLastReleaseTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch {
    return 'origin/main';
  }
}

function getAffectedApps(baseRef) {
  try {
    const output = execSync(`npx nx show projects --affected --base="${baseRef}" --json`, { 
      encoding: 'utf8' 
    });
    const projects = JSON.parse(output);
    return projects.filter(project => 
      ['backend', 'design', 'devops', 'dsa', 'frontend', 'home', 'shell'].includes(project)
    );
  } catch (error) {
    console.error('❌ Failed to get affected apps:', error.message);
    process.exit(1);
  }
}

function updatePackageVersion(appPath, newVersion) {
  const packageJsonPath = path.join(appPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const oldVersion = packageJson.version;
  packageJson.version = newVersion;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  return { oldVersion, newVersion };
}

function main() {
  console.log(`🔍 Detecting affected apps since: ${BASE_REF}`);
  
  const affectedApps = getAffectedApps(BASE_REF);
  
  if (affectedApps.length === 0) {
    console.log('✅ No affected apps found. Only root version will be bumped.');
    return;
  }
  
  console.log(`📦 Affected apps: ${affectedApps.join(', ')}`);
  
  // Get current root version - release-it will handle the root bump
  // We just need to sync the affected apps to match
  const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentVersion = rootPackageJson.version;
  
  // Pre-calculate what the new version will be (release-it will do this same calculation)
  const newVersion = semver.inc(currentVersion, BUMP_TYPE);
  
  console.log(`📈 Syncing affected apps to upcoming version: ${newVersion}`);
  
  // Update affected app package.json files to match the upcoming root version
  for (const app of affectedApps) {
    const appPath = path.join('apps', app);
    const update = updatePackageVersion(appPath, newVersion);
    console.log(`   📝 ${app}: ${update.oldVersion} → ${update.newVersion}`);
  }
  
  // Update version compatibility config if shell is affected
  if (affectedApps.includes('shell')) {
    console.log('🔧 Updating shell version compatibility config...');
    updateShellVersionConfig(newVersion);
  }
  
  console.log(`✅ Affected apps synced! release-it will handle the root version bump.`);
}

function updateShellVersionConfig(newVersion) {
  const configPath = 'apps/shell/src/app/remote-versions.config.ts';
  let content = fs.readFileSync(configPath, 'utf8');
  
  // Update version constraints to use the new major version
  const majorVersion = semver.major(newVersion);
  const versionPattern = `^${majorVersion}.0.0`;
  
  content = content.replace(
    /: '\^[\d.]+'/g,
    `: '${versionPattern}'`
  );
  
  fs.writeFileSync(configPath, content);
  console.log(`   📝 Updated shell version config to use ${versionPattern}`);
}

if (require.main === module) {
  main();
}