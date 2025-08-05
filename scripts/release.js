#!/usr/bin/env node

/**
 * Release helper script for managing semantic versioning across apps and libs
 * Usage: node scripts/release.js [app/lib-name] [--dry-run]
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const APPS = ['router', 'home']
const LIBS = ['styles']

function showUsage() {
  console.log(`
Usage: node scripts/release.js [target] [options]

Targets:
  ${APPS.map((app) => `apps/${app}`).join(', ')}
  ${LIBS.map((lib) => `libs/${lib}`).join(', ')}

Options:
  --dry-run    Show what would be released without making changes
  --help       Show this help message

Examples:
  node scripts/release.js apps/router
  node scripts/release.js libs/styles --dry-run
  `)
}

function validateTarget(target) {
  const [type, name] = target.split('/')

  if (type === 'apps' && APPS.includes(name)) {
    return { type, name, path: join('apps', name) }
  }

  if (type === 'libs' && LIBS.includes(name)) {
    return { type, name, path: join('libs', name) }
  }

  throw new Error(`Invalid target: ${target}. Use --help for available targets.`)
}

function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.length === 0) {
    showUsage()
    return
  }

  const target = args[0]
  const isDryRun = args.includes('--dry-run')

  try {
    const { path } = validateTarget(target)

    if (!existsSync(path)) {
      throw new Error(`Target directory does not exist: ${path}`)
    }

    const releaseItPath = join(path, '.release-it.json')
    if (!existsSync(releaseItPath)) {
      throw new Error(`Release configuration not found: ${releaseItPath}`)
    }

    console.log(`🚀 ${isDryRun ? 'Dry run for' : 'Releasing'} ${target}...`)

    const command = `cd ${path} && release-it${isDryRun ? ' --dry-run' : ''}`
    execSync(command, { stdio: 'inherit' })

    console.log(`✅ ${isDryRun ? 'Dry run completed' : 'Release completed'} for ${target}`)
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

main()
