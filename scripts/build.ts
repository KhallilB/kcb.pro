// Runs every build step under one pinned BUILD_DAY; the first failing step stops the build.
import { join } from 'node:path'
import { pinBuildDay } from './build-day'

// The repo's own tools: a missing install fails here instead of using a global or a download.
const bin = (tool: string) => join('node_modules', '.bin', tool)

const STEPS = [
  ['bun', 'run', 'progress'],
  [bin('tsc'), '-b'],
  [bin('vite'), 'build'],
  [
    bin('vite'),
    'build',
    '--ssr',
    'app/entry-server.tsx',
    '--outDir',
    'build-ssr',
  ],
  ['bun', 'scripts/prerender.ts'],
]

pinBuildDay()
for (const cmd of STEPS) {
  const { exitCode } = Bun.spawnSync(cmd, {
    env: process.env,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if (exitCode !== 0) process.exit(exitCode ?? 1)
}
