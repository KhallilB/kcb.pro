// Runs every build step under one pinned BUILD_DAY; the first failing step stops the build.
import { pinBuildDay } from './build-day'

const STEPS = [
  ['bun', 'run', 'progress'],
  ['tsc', '-b'],
  ['vite', 'build'],
  ['vite', 'build', '--ssr', 'app/entry-server.tsx', '--outDir', 'build-ssr'],
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
