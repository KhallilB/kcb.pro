import { classifyCommit } from '../domain/activity'
import { addDays } from '../domain/dates'
import {
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

export interface CollectOptions {
  buildDay: IsoDay
  // Fixtures stand in for GitHub in dev and e2e.
  offline: boolean
  fetch: typeof globalThis.fetch
  token?: string
  readFixture: (slug: string) => Promise<unknown>
}

const API = 'https://api.github.com'
const HISTORY_DAYS = 90
const PAGE_SIZE = 100

interface ApiCommit {
  sha: string
  html_url: string
  commit: { message: string; author: { date: string } | null }
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
      failures.push(
        `"${project.slug}" (${project.repo}): ${(error as Error).message}`
      )
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
  return checked(slug, file, commits, options.buildDay)
}

async function fromGitHub(
  { slug, repo }: Registered,
  options: CollectOptions
): Promise<ProjectProgress> {
  const get = (path: string, accept = 'application/vnd.github+json') =>
    options.fetch(`${API}${path}`, { headers: headers(accept, options.token) })

  const about = await get(`/repos/${repo}`)
  if (about.status === 404) {
    throw new Error(
      'the repository is missing or private. Make it public, or remove "repo" from the project.'
    )
  }
  if (!about.ok) throw new Error(unexpected(about, 'the repository'))
  const meta = (await about.json()) as {
    private?: boolean
    default_branch?: string
  }
  if (meta.private !== false || !meta.default_branch) {
    throw new Error(
      'the repository is not public. Make it public, or remove "repo" from the project.'
    )
  }
  const branch = meta.default_branch

  const raw = await get(
    `/repos/${repo}/contents/progress.json?ref=${encodeURIComponent(branch)}`,
    'application/vnd.github.raw+json'
  )
  if (raw.status === 404) {
    throw new Error(
      `there is no progress.json on ${branch}. Add one that follows schema/progress.v1.json.`
    )
  }
  if (!raw.ok) throw new Error(unexpected(raw, 'progress.json'))
  let file: unknown
  try {
    file = JSON.parse(await raw.text())
  } catch {
    throw new Error(
      `progress.json on ${branch} is not valid JSON. Fix it and push.`
    )
  }
  const commits = await recentCommits(repo, branch, options.buildDay, get)
  return checked(slug, file, commits, options.buildDay)
}

async function recentCommits(
  repo: string,
  branch: string,
  buildDay: IsoDay,
  get: (path: string) => Promise<Response>
): Promise<Commit[]> {
  const query = new URLSearchParams({
    sha: branch,
    since: `${addDays(buildDay, 1 - HISTORY_DAYS)}T00:00:00Z`,
    until: `${buildDay}T23:59:59Z`,
    per_page: String(PAGE_SIZE),
  })
  const commits: Commit[] = []
  for (let page = 1; ; page++) {
    const response = await get(`/repos/${repo}/commits?${query}&page=${page}`)
    if (!response.ok)
      throw new Error(unexpected(response, 'the commit history'))
    const batch = (await response.json()) as ApiCommit[]
    commits.push(...batch.map(toCommit))
    if (batch.length < PAGE_SIZE) return commits
  }
}

function toCommit(c: ApiCommit): Commit {
  const subject = c.commit.message.split('\n')[0]
  return {
    sha: c.sha.slice(0, 7),
    date: (c.commit.author?.date ?? '').slice(0, 10),
    type: classifyCommit(subject),
    subject,
    url: c.html_url,
  }
}

function checked(
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

function unexpected(response: Response, what: string): string {
  return `GitHub answered ${response.status} for ${what}. Retry; set GITHUB_TOKEN if this is a rate limit.`
}

function headers(accept: string, token?: string): Record<string, string> {
  return {
    accept,
    'user-agent': 'kcb.pro-build',
    'x-github-api-version': '2022-11-28',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}
