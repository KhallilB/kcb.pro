import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { commit, entry, progressFile } from '../app/portfolio/domain/fixtures'
import { toPublic } from '../app/portfolio/domain/progress'
import { writePublic } from './progress-fetch'

const SCRIPT = join(__dirname, 'progress-fetch.ts')

const FIXTURES = join(
  __dirname,
  '..',
  'app',
  'portfolio',
  'progress',
  'fixtures'
)

// Runs in an empty cwd; without fixtures copied in, the offline fetch fails.
function run(env: Record<string, string>, withFixtures = false) {
  const cwd = mkdtempSync(join(tmpdir(), 'progress-fetch-'))
  const out = join(cwd, 'build-data', 'progress')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'stale.json'), '{}')
  if (withFixtures) {
    cpSync(FIXTURES, join(cwd, 'app', 'portfolio', 'progress', 'fixtures'), {
      recursive: true,
    })
  }
  const result = spawnSync('bun', [SCRIPT], {
    cwd,
    env: { ...process.env, PROGRESS_OFFLINE: '1', ...env },
    encoding: 'utf8',
  })
  const left = existsSync(out)
  const written: Record<string, Record<string, unknown>> = left
    ? Object.fromEntries(
        readdirSync(out).map((name) => [
          name,
          JSON.parse(readFileSync(join(out, name), 'utf8')),
        ])
      )
    : {}
  rmSync(cwd, { recursive: true, force: true })
  return { status: result.status, stderr: result.stderr, left, written }
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

  it('writes only the public shape for each registered project', () => {
    const { status, written } = run({ BUILD_DAY: '2026-10-21' }, true)
    expect(status).toBe(0)
    expect(Object.keys(written).sort()).toEqual(['bezl.json', 'kbui.json'])
    const bezl = written['bezl.json'] as {
      entries: Record<string, unknown>[]
      days: unknown[]
    }
    expect(Object.keys(bezl)).toEqual(['entries', 'days'])
    expect(bezl.days).toHaveLength(84)
    expect(bezl.days.at(-1)).toEqual({ day: '2026-10-21', count: 11 })
    expect(Object.keys(bezl.entries[0])).toEqual([
      'id',
      'subject',
      'date',
      'title',
      'result',
      'summary',
    ])
  })
})

describe('writePublic', () => {
  const day = '2026-10-21'
  const shipped = () =>
    toPublic({ file: progressFile([entry()]), commits: [commit()] }, day)

  function inTemp(test: (file: string) => Promise<void>) {
    const dir = mkdtempSync(join(tmpdir(), 'progress-write-'))
    return test(join(dir, 'alpha.json')).finally(() =>
      rmSync(dir, { recursive: true, force: true })
    )
  }

  it('writes what passes the loader', () =>
    inTemp(async (file) => {
      await writePublic(file, shipped(), day)
      expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(shipped())
    }))

  it('fails on a written file the loader would refuse, naming it', () =>
    inTemp(async (file) => {
      const leaky = shipped()
      leaky.entries[0] = { ...leaky.entries[0], passMark: 'x' } as never
      await expect(writePublic(file, leaky, day)).rejects.toThrow(
        `${file} failed validation:\n"alpha" built progress entry "2026-10-20-alpha" has a field the site does not ship: "passMark"`
      )
    }))
})
