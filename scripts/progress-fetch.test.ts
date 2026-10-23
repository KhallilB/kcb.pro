import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SCRIPT = join(__dirname, 'progress-fetch.ts')

// Runs in an empty cwd: no fixtures there, so the offline fetch fails.
function run(env: Record<string, string>) {
  const cwd = mkdtempSync(join(tmpdir(), 'progress-fetch-'))
  const out = join(cwd, 'build-data', 'progress')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'stale.json'), '{}')
  const result = spawnSync('bun', [SCRIPT], {
    cwd,
    env: { ...process.env, PROGRESS_OFFLINE: '1', ...env },
    encoding: 'utf8',
  })
  const left = existsSync(out)
  rmSync(cwd, { recursive: true, force: true })
  return { status: result.status, stderr: result.stderr, left }
}

describe('progress-fetch', () => {
  it('removes stale progress when the build day is invalid', () => {
    const { status, stderr, left } = run({ BUILD_DAY: '2026-13-01' })
    expect(status).toBe(1)
    expect(stderr).toContain('Progress failed; nothing was written:')
    expect(stderr).toContain('BUILD_DAY must be YYYY-MM-DD')
    expect(left).toBe(false)
  })

  it('removes stale progress when a project fails', () => {
    const { status, stderr, left } = run({ BUILD_DAY: '2026-10-21' })
    expect(status).toBe(1)
    expect(stderr).toContain('no offline fixture')
    expect(left).toBe(false)
  })
})
