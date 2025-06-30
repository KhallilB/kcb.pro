#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getApps, getAffectedApps, hasUnreleasedChanges, releaseApp, getLastReleaseBase } = require('./release-app.js');

// Validate apps have actual changes before releasing
const validateAndRelease = (appNames, options = {}) => {
  const { base = null, skipValidation = false } = options;
  const validApps = [];
  
  console.log('🔍 Validating apps for release...\n');
  
  for (const appName of appNames) {
    if (skipValidation) {
      validApps.push(appName);
      console.log(`✅ ${appName} - Skipping validation (forced)`);
      continue;
    }
    
    const hasChanges = hasUnreleasedChanges(appName, base);
    if (hasChanges) {
      validApps.push(appName);
      console.log(`✅ ${appName} - Has unreleased changes`);
    } else {
      console.log(`⏭️  ${appName} - No changes detected, skipping`);
    }
  }
  
  if (validApps.length === 0) {
    console.log('\n🎉 No apps need releasing. All apps are up to date!');
    return;
  }
  
  console.log(`\n🚀 Releasing ${validApps.length} app(s): ${validApps.join(', ')}\n`);
  
  // Release each valid app
  for (const appName of validApps) {
    try {
      console.log(`\n📦 Releasing ${appName}...`);
      releaseApp(appName, options);
      console.log(`✅ Successfully released ${appName}`);
    } catch (error) {
      console.error(`❌ Failed to release ${appName}:`, error.message);
      if (!options.continueOnError) {
        process.exit(1);
      }
    }
  }
  
  console.log(`\n🎉 Release workflow completed for: ${validApps.join(', ')}`);
};

// Smart release workflow
const smartRelease = (options = {}) => {
  const { base = null } = options;
  
  console.log('🤖 Starting smart release workflow...\n');
  
  // First, try to get affected apps using NX
  const affectedApps = getAffectedApps(base);
  
  if (affectedApps.length === 0) {
    console.log('✅ No affected apps detected. Nothing to release.');
    return;
  }
  
  // Validate and release affected apps
  validateAndRelease(affectedApps, options);
};

// CLI interface
const main = () => {
  const args = process.argv.slice(2);
  const options = {};
  let workflow = 'smart';
  let appNames = [];
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--pre-release') {
      options.preRelease = true;
    } else if (arg === '--ci') {
      options.ci = true;
    } else if (arg === '--continue-on-error') {
      options.continueOnError = true;
    } else if (arg === '--skip-validation') {
      options.skipValidation = true;
    } else if (arg.startsWith('--increment=')) {
      options.increment = arg.split('=')[1];
    } else if (arg.startsWith('--base=')) {
      options.base = arg.split('=')[1];
    } else if (arg === '--smart') {
      workflow = 'smart';
    } else if (arg === '--validate') {
      workflow = 'validate';
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Release Workflow Script

Usage:
  node scripts/release-workflow.js [workflow] [options]
  node scripts/release-workflow.js --validate <app1> <app2> [options]

Workflows:
  --smart            Smart release (affected apps with validation) [default]
  --validate         Validate and release specific apps

Options:
  --dry-run              Show what would be released without making changes
  --pre-release          Create a pre-release
  --increment=TYPE       Specify version increment (patch, minor, major, prerelease)
  --base=BRANCH         Base branch for affected detection (default: origin/main)
  --skip-validation     Skip change validation (force release)
  --continue-on-error   Continue releasing other apps if one fails
  --ci                  Run in CI mode (non-interactive)
  --help, -h            Show this help message

Examples:
  node scripts/release-workflow.js --smart --dry-run
  node scripts/release-workflow.js --validate backend frontend
  node scripts/release-workflow.js --smart --base=main --increment=patch
      `);
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      appNames.push(arg);
    }
  }
  
  // Execute workflow
  if (workflow === 'smart') {
    smartRelease(options);
  } else if (workflow === 'validate') {
    if (appNames.length === 0) {
      console.error('❌ No apps specified for validation workflow');
      process.exit(1);
    }
    validateAndRelease(appNames, options);
  }
};

if (require.main === module) {
  main();
}

module.exports = { validateAndRelease, smartRelease };