import { commit, entry, progressFile } from '../domain/fixtures'
import { collectProgress, type CollectOptions } from './fetch'

const bezl = { slug: 'bezl', repo: 'KhallilB/bezl' }
const kbui = { slug: 'kbui', repo: 'KhallilB/kbui' }
const goodFile = () => progressFile([entry()], { project: 'bezl' })

type Route = (url: URL) => Response
const json = (body: unknown) => new Response(JSON.stringify(body))
const missing = () => new Response('Not Found', { status: 404 })

function apiCommit(sha: string, date: string, message: string) {
  return {
    sha,
    html_url: `https://github.com/KhallilB/bezl/commit/${sha}`,
    commit: { message, author: { date: `${date}T12:00:00Z` } },
  }
}

function publicRepo(file: unknown = goodFile(), commits: unknown[] = []) {
  const routes: Record<string, Route> = {
    '/repos/KhallilB/bezl': () =>
      json({ private: false, default_branch: 'trunk' }),
    '/repos/KhallilB/bezl/contents/progress.json': () => json(file),
    '/repos/KhallilB/bezl/commits': () => json(commits),
  }
  return routes
}

function github(routes: Record<string, Route>) {
  const calls: { url: URL; headers: Record<string, string> }[] = []
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    calls.push({
      url,
      headers: (init?.headers ?? {}) as Record<string, string>,
    })
    return (routes[url.pathname] ?? missing)(url)
  }
  return { fetch: fetch as typeof globalThis.fetch, calls }
}

function options(overrides: Partial<CollectOptions> = {}): CollectOptions {
  return {
    buildDay: '2026-10-21',
    offline: false,
    fetch: () => Promise.reject(new Error('no network in this test')),
    readFixture: async () => undefined,
    ...overrides,
  }
}

describe('collectProgress from GitHub', () => {
  it('reads progress.json from the default branch with 90 days of classified commits', async () => {
    const full = '01e47db2f079b759ac01a43e4aad0b9f9fe35467'
    const { fetch, calls } = github(
      publicRepo(goodFile(), [
        apiCommit(full, '2026-10-20', 'feat: scaffold Bezl\n\nBody.'),
      ])
    )
    const progress = await collectProgress([bezl], options({ fetch }))
    expect(progress.bezl.file).toEqual(goodFile())
    expect(progress.bezl.commits).toEqual([
      {
        sha: '01e47db',
        date: '2026-10-20',
        type: 'feat',
        subject: 'feat: scaffold Bezl',
        url: `https://github.com/KhallilB/bezl/commit/${full}`,
      },
    ])
    const file = calls.find((c) => c.url.pathname.endsWith('/progress.json'))
    expect(file?.url.searchParams.get('ref')).toBe('trunk')
    const history = calls.find((c) => c.url.pathname.endsWith('/commits'))
    expect(Object.fromEntries(history?.url.searchParams ?? [])).toMatchObject({
      sha: 'trunk',
      since: '2026-07-24T00:00:00Z',
      until: '2026-10-21T23:59:59Z',
      per_page: '100',
      page: '1',
    })
  })

  it('authenticates with GITHUB_TOKEN when it has one', async () => {
    const withToken = github(publicRepo())
    await collectProgress(
      [bezl],
      options({ fetch: withToken.fetch, token: 't0k' })
    )
    expect(
      withToken.calls.every((c) => c.headers.authorization === 'Bearer t0k')
    ).toBe(true)
    const anonymous = github(publicRepo())
    await collectProgress([bezl], options({ fetch: anonymous.fetch }))
    expect(anonymous.calls.some((c) => 'authorization' in c.headers)).toBe(
      false
    )
  })

  it('pages through commits until a short page', async () => {
    const page = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        apiCommit(String(i).padStart(7, '0'), '2026-10-20', 'chore: tidy')
      )
    const routes = publicRepo()
    routes['/repos/KhallilB/bezl/commits'] = (url) =>
      json(url.searchParams.get('page') === '1' ? page(100) : page(1))
    const progress = await collectProgress(
      [bezl],
      options({ fetch: github(routes).fetch })
    )
    expect(progress.bezl.commits).toHaveLength(101)
  })

  it.each([
    [
      'is missing or private',
      { '/repos/KhallilB/bezl': missing },
      'the repository is missing or private',
    ],
    [
      'says it is private',
      {
        '/repos/KhallilB/bezl': () =>
          json({ private: true, default_branch: 'main' }),
      },
      'the repository is not public',
    ],
    [
      'has no progress.json',
      { '/repos/KhallilB/bezl/contents/progress.json': missing },
      'there is no progress.json on trunk',
    ],
    [
      'serves broken JSON',
      {
        '/repos/KhallilB/bezl/contents/progress.json': () => new Response('{'),
      },
      'progress.json on trunk is not valid JSON',
    ],
  ] as [string, Record<string, Route>, string][])(
    'fails the build, naming the project, when the repository %s',
    async (_, override, message) => {
      const { fetch } = github({ ...publicRepo(), ...override })
      await expect(collectProgress([bezl], options({ fetch }))).rejects.toThrow(
        `"bezl" (KhallilB/bezl): ${message}`
      )
    }
  )

  it('fails the build on a file that breaks the contract', async () => {
    const late = progressFile([entry({ date: '2026-10-22' })], {
      project: 'bezl',
    })
    const { fetch } = github(publicRepo(late))
    await expect(collectProgress([bezl], options({ fetch }))).rejects.toThrow(
      '"bezl" progress.json entry "2026-10-20-alpha" is dated 2026-10-22, after the build day 2026-10-21'
    )
  })

  it('fails the build when GitHub cannot be reached', async () => {
    await expect(collectProgress([bezl], options())).rejects.toThrow(
      '"bezl" (KhallilB/bezl): no network in this test'
    )
  })

  it('reports every failing project, not only the first', async () => {
    const error = await collectProgress([bezl, kbui], options()).catch(
      (e: Error) => e
    )
    expect(String(error)).toMatch(/"bezl"[\s\S]*"kbui"/)
  })

  it('fetches nothing when no project is registered', async () => {
    expect(await collectProgress([], options())).toEqual({})
  })
})

describe('collectProgress offline', () => {
  it('reads fixtures and never calls GitHub', async () => {
    const fixture = { file: goodFile(), commits: [commit()] }
    const progress = await collectProgress(
      [bezl],
      options({ offline: true, readFixture: async () => fixture })
    )
    expect(progress).toEqual({ bezl: fixture })
  })

  it('fails when a registered project has no fixture', async () => {
    await expect(
      collectProgress([bezl], options({ offline: true }))
    ).rejects.toThrow(
      '"bezl" (KhallilB/bezl): no offline fixture. Add app/portfolio/progress/fixtures/bezl.json.'
    )
  })

  it('fails on a fixture that breaks the contract', async () => {
    const fixture = {
      file: progressFile([entry({ result: 'flaky' as never })], {
        project: 'bezl',
      }),
      commits: [],
    }
    await expect(
      collectProgress(
        [bezl],
        options({ offline: true, readFixture: async () => fixture })
      )
    ).rejects.toThrow('has an unknown result "flaky"')
  })
})
