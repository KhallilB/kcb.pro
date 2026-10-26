import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { entry, progressFile } from '../app/portfolio/domain/fixtures'
import type { ProgressEntry } from '../app/portfolio/domain/progress'

const SCRIPT = join(__dirname, 'progress-check.ts')

let repo: string
const git = (...args: string[]) =>
  spawnSync('git', args, { cwd: repo, encoding: 'utf8' }).stdout.trim()

// Commits progress.json (and any extra files) and returns the short hash.
function commitFile(
  entries: ProgressEntry[],
  files: Record<string, string> = {}
) {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(repo, path, '..'), { recursive: true })
    writeFileSync(join(repo, path), text)
  }
  writeFileSync(
    join(repo, 'progress.json'),
    JSON.stringify(progressFile(entries))
  )
  git('add', '-A')
  git('commit', '-q', '-m', 'progress')
  return git('rev-parse', '--short', 'HEAD')
}

function check(...args: string[]) {
  const result = spawnSync('bun', [SCRIPT, '--slug', 'alpha', ...args], {
    cwd: repo,
    env: { ...process.env, BUILD_DAY: '2026-10-25' },
    encoding: 'utf8',
  })
  return { status: result.status, out: result.stdout + result.stderr }
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'progress-check-'))
  git('init', '-q', '-b', 'main')
  for (const [k, v] of [
    ['user.email', 't@t'],
    ['user.name', 't'],
    ['commit.gpgSign', 'false'],
  ]) {
    git('config', k, v)
  }
})
afterEach(() => rmSync(repo, { recursive: true, force: true }))

describe('progress-check', () => {
  it('passes an appended entry whose evidence exists', () => {
    const sha = commitFile([], { 'spikes/alpha/RESULT.md': 'ok\n' })
    commitFile([entry({ commit: sha })])
    const { status, out } = check('--base', 'HEAD~1')
    expect(out).toContain('"alpha" progress.json is valid')
    expect(status).toBe(0)
  })

  it('fails an edited published entry', () => {
    const sha = commitFile([], { 'spikes/alpha/RESULT.md': 'ok\n' })
    commitFile([entry({ commit: sha })])
    commitFile([entry({ commit: sha, result: 'fail' })])
    const { status, out } = check('--base', 'HEAD~1')
    expect(out).toContain('"2026-10-20-alpha" was changed')
    expect(status).toBe(1)
  })

  it('fails evidence that is not in its commit', () => {
    const sha = commitFile([])
    commitFile([entry({ commit: sha })])
    const { status, out } = check()
    expect(out).toContain('links spikes/alpha/RESULT.md, which is not in')
    expect(status).toBe(1)
  })

  it('fails a file that breaks the contract', () => {
    commitFile([entry({ result: 'partial', evidence: [], commit: undefined })])
    const { status, out } = check()
    expect(out).toContain('needs a summary')
    expect(status).toBe(1)
  })

  it('passes when the base has no progress.json yet', () => {
    commitFile([])
    rmSync(join(repo, 'progress.json'))
    git('commit', '-qam', 'drop')
    const sha = commitFile([], { 'spikes/alpha/RESULT.md': 'ok\n' })
    commitFile([entry({ commit: sha })])
    const { status } = check('--base', 'HEAD~2')
    expect(status).toBe(0)
  })

  it('passes a published entry whose commit is not in this repository', () => {
    commitFile([entry({ commit: 'deadbee' })])
    const sha = commitFile([entry({ commit: 'deadbee' })], {
      'spikes/beta/RESULT.md': 'ok\n',
    })
    commitFile([
      entry({ commit: 'deadbee' }),
      entry({
        id: '2026-10-21-beta',
        subject: 'beta',
        date: '2026-10-21',
        commit: sha,
        evidence: [{ label: 'Result', path: 'spikes/beta/RESULT.md' }],
      }),
    ])
    const { status, out } = check('--base', 'HEAD~1')
    expect(out).toContain('"alpha" progress.json is valid')
    expect(status).toBe(0)
  })
})
