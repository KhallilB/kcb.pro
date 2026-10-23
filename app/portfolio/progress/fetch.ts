import { classifyCommit } from '../domain/activity'
import { addDays } from '../domain/dates'
import {
  ACTIVITY_DAYS,
  validateCommits,
  validateProgress,
  type Commit,
  type ProjectProgress,
} from '../domain/progress'
import type { IsoDay } from '../domain/types'

export interface Registered {
  slug: string
  repo: string
}

export interface GitHubToken {
  name: 'PROGRESS_TOKEN' | 'GITHUB_TOKEN'
  value: string
}

export interface CollectOptions {
  buildDay: IsoDay
  // Fixtures stand in for GitHub in dev and e2e.
  offline: boolean
  fetch: typeof globalThis.fetch
  token?: GitHubToken
  readFixture: (slug: string) => Promise<unknown>
}

const API = 'https://api.github.com'
const PAGE_SIZE = 100
const MAX_PAGES = 50
const TIMEOUT_MS = 15_000

// Actions passes an unset secret as '', so empty values are skipped.
export function chooseToken(
  env: Record<string, string | undefined>
): GitHubToken | undefined {
  for (const name of ['PROGRESS_TOKEN', 'GITHUB_TOKEN'] as const) {
    const value = env[name]
    if (value) return { name, value }
  }
  return undefined
}

interface ApiCommit {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { date: string } | null
    committer?: { date: string } | null
  }
}

// Any failure throws: the build stops rather than show a partial ledger.
export async function collectProgress(
  projects: Registered[],
  options: CollectOptions
): Promise<Record<string, ProjectProgress>> {
  const collected: Record<string, ProjectProgress> = {}
  const failures: string[] = []
  for (const project of projects) {
    try {
      collected[project.slug] = options.offline
        ? await fromFixture(project, options)
        : await fromGitHub(project, options)
    } catch (error) {
      failures.push(`"${project.slug}" (${project.repo}): ${describe(error)}`)
    }
  }
  if (failures.length > 0) throw new Error(failures.join('\n'))
  return collected
}

async function fromFixture(
  { slug }: Registered,
  options: CollectOptions
): Promise<ProjectProgress> {
  const data = await options.readFixture(slug)
  if (data === undefined) {
    throw new Error(
      `no offline fixture. Add app/portfolio/progress/fixtures/${slug}.json.`
    )
  }
  const { file, commits } = (data ?? {}) as {
    file?: unknown
    commits?: unknown
  }
  return checkProgress(slug, file, commits, options.buildDay)
}

async function fromGitHub(
  { slug, repo }: Registered,
  options: CollectOptions
): Promise<ProjectProgress> {
  const get = (path: string, accept = 'application/vnd.github+json') =>
    options.fetch(`${API}${path}`, {
      headers: headers(accept, options.token),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

  const about = await get(`/repos/${repo}`)
  if (about.status === 404) {
    throw new Error(
      `the repository was not found, or ${cannotRead(options.token)}.`
    )
  }
  if (!about.ok)
    throw new Error(unexpected(about, 'the repository', options.token))
  const { default_branch: branch } = (await about.json()) as {
    default_branch?: string
  }
  if (!branch) {
    throw new Error('GitHub named no default branch for the repository. Retry.')
  }

  const raw = await get(
    `/repos/${repo}/contents/progress.json?ref=${encodeURIComponent(branch)}`,
    'application/vnd.github.raw+json'
  )
  if (raw.status === 404) {
    throw new Error(
      `there is no progress.json on ${branch}. Add one that follows schema/progress.v1.json.`
    )
  }
  if (!raw.ok) throw new Error(unexpected(raw, 'progress.json', options.token))
  let file: unknown
  try {
    file = JSON.parse(await raw.text())
  } catch {
    throw new Error(
      `progress.json on ${branch} is not valid JSON. Fix it and push.`
    )
  }
  const commits = await recentCommits(repo, branch, options, get)
  return checkProgress(slug, file, commits, options.buildDay)
}

async function recentCommits(
  repo: string,
  branch: string,
  { buildDay, token }: CollectOptions,
  get: (path: string) => Promise<Response>
): Promise<Commit[]> {
  const query = new URLSearchParams({
    sha: branch,
    since: `${addDays(buildDay, 1 - ACTIVITY_DAYS)}T00:00:00Z`,
    until: `${buildDay}T23:59:59Z`,
    per_page: String(PAGE_SIZE),
  })
  const commits: Commit[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await get(`/repos/${repo}/commits?${query}&page=${page}`)
    if (!response.ok) {
      throw new Error(unexpected(response, 'the commit history', token))
    }
    const batch: unknown = await response.json()
    if (!Array.isArray(batch)) {
      throw new Error('the commit history is not a list')
    }
    commits.push(...(batch as ApiCommit[]).map(toCommit))
    if (batch.length < PAGE_SIZE) return commits
  }
  throw new Error(`the commit history runs past ${MAX_PAGES} pages`)
}

function toCommit(c: ApiCommit): Commit {
  const sha = c.sha.slice(0, 7)
  // GitHub's since/until window filters on the committer date.
  const stamp = c.commit.committer?.date ?? c.commit.author?.date
  if (!stamp) throw new Error(`commit ${sha} has no date`)
  const subject = c.commit.message.split('\n')[0] || '(no message)'
  return {
    sha,
    date: stamp.slice(0, 10),
    type: classifyCommit(subject),
    subject,
    url: c.html_url,
  }
}

export function checkProgress(
  slug: string,
  file: unknown,
  commits: unknown,
  buildDay: IsoDay
): ProjectProgress {
  const errors = [
    ...validateProgress(file, { slug, buildDay }),
    ...validateCommits(commits, slug),
  ]
  if (errors.length > 0) {
    throw new Error(`fails the progress contract:\n  ${errors.join('\n  ')}`)
  }
  return { file, commits } as ProjectProgress
}

// Names the variable in use, never its value.
function cannotRead(token?: GitHubToken): string {
  if (!token) return 'no token is set; private repositories need PROGRESS_TOKEN'
  if (token.name === 'PROGRESS_TOKEN') return 'PROGRESS_TOKEN cannot read it'
  return `${token.name} cannot read it; private repositories need PROGRESS_TOKEN`
}

function unexpected(
  response: Response,
  what: string,
  token?: GitHubToken
): string {
  const head = `GitHub answered ${response.status} for ${what}`
  if (response.status === 401) {
    return token
      ? `${head}: ${token.name} was rejected. Replace it; it may have expired.`
      : `${head}: the request was rejected.`
  }
  if (response.status === 403 || response.status === 429) {
    const hint = token ? '' : ' Set GITHUB_TOKEN to raise the limit.'
    return `${head}: rate limited. Retry later.${hint}`
  }
  return `${head}. Retry.`
}

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause instanceof Error ? error.cause.message : ''
  return cause ? `${error.message} (${cause})` : error.message
}

function headers(accept: string, token?: GitHubToken): Record<string, string> {
  return {
    accept,
    'user-agent': 'kcb.pro-build',
    'x-github-api-version': '2022-11-28',
    ...(token ? { authorization: `Bearer ${token.value}` } : {}),
  }
}
