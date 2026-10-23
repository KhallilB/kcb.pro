import { commit, entry, progressFile } from '../domain/fixtures'
import {
  chooseToken,
  collectProgress,
  type CollectOptions,
  type GitHubToken,
} from './fetch'

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

const fullPage = () =>
  Array.from({ length: 100 }, (_, i) =>
    apiCommit(String(i).padStart(7, '0'), '2026-10-20', 'chore: tidy')
  )

function repoRoutes(file: unknown = goodFile(), commits: unknown[] = []) {
  const routes: Record<string, Route> = {
    '/repos/KhallilB/bezl': () =>
      json({ private: false, default_branch: 'trunk' }),
    '/repos/KhallilB/bezl/contents/progress.json': () => json(file),
    '/repos/KhallilB/bezl/commits': () => json(commits),
  }
  return routes
}

function github(routes: Record<string, Route>) {
  const calls: {
    url: URL
    headers: Record<string, string>
    signal?: AbortSignal | null
  }[] = []
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    calls.push({
      url,
      headers: (init?.headers ?? {}) as Record<string, string>,
      signal: init?.signal,
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
  it('reads progress.json from the default branch with 84 days of classified commits', async () => {
    const full = '01e47db2f079b759ac01a43e4aad0b9f9fe35467'
    const { fetch, calls } = github(
      repoRoutes(goodFile(), [
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
      since: '2026-07-30T00:00:00Z',
      until: '2026-10-21T23:59:59Z',
      per_page: '100',
      page: '1',
    })
  })

  it('authenticates with GITHUB_TOKEN when it has one', async () => {
    const withToken = github(repoRoutes())
    await collectProgress(
      [bezl],
      options({
        fetch: withToken.fetch,
        token: { name: 'GITHUB_TOKEN', value: 't0k' },
      })
    )
    expect(
      withToken.calls.every((c) => c.headers.authorization === 'Bearer t0k')
    ).toBe(true)
    const anonymous = github(repoRoutes())
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
    const routes = repoRoutes()
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
      'is not found',
      { '/repos/KhallilB/bezl': missing },
      'the repository was not found',
    ],
    [
      'names no default branch',
      { '/repos/KhallilB/bezl': () => json({ private: false }) },
      'GitHub named no default branch',
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
      const { fetch } = github({ ...repoRoutes(), ...override })
      await expect(collectProgress([bezl], options({ fetch }))).rejects.toThrow(
        `"bezl" (KhallilB/bezl): ${message}`
      )
    }
  )

  it('fails the build on a file that breaks the contract', async () => {
    const late = progressFile([entry({ date: '2026-10-22' })], {
      project: 'bezl',
    })
    const { fetch } = github(repoRoutes(late))
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

describe('collectProgress GitHub failures', () => {
  it('fails, with no partial result, when a later commits page errors', async () => {
    const routes = repoRoutes()
    routes['/repos/KhallilB/bezl/commits'] = (url) =>
      url.searchParams.get('page') === '1'
        ? json(fullPage())
        : new Response('Forbidden', { status: 403 })
    await expect(
      collectProgress([bezl], options({ fetch: github(routes).fetch }))
    ).rejects.toThrow('"bezl" (KhallilB/bezl): GitHub answered 403')
  })

  it.each([
    [429, '/repos/KhallilB/bezl'],
    [500, '/repos/KhallilB/bezl'],
    [429, '/repos/KhallilB/bezl/contents/progress.json'],
    [500, '/repos/KhallilB/bezl/contents/progress.json'],
  ])('names status %i when %s answers with it', async (status, path) => {
    const routes = {
      ...repoRoutes(),
      [path]: () => new Response('', { status }),
    }
    await expect(
      collectProgress([bezl], options({ fetch: github(routes).fetch }))
    ).rejects.toThrow(`"bezl" (KhallilB/bezl): GitHub answered ${status}`)
  })

  it.each(['PROGRESS_TOKEN', 'GITHUB_TOKEN'] as const)(
    'on a 401 says %s was rejected, without printing it',
    async (name) => {
      const routes = {
        ...repoRoutes(),
        '/repos/KhallilB/bezl': () => new Response('', { status: 401 }),
      }
      const error = await collectProgress(
        [bezl],
        options({
          fetch: github(routes).fetch,
          token: { name, value: 'secret-401' },
        })
      ).catch((e: Error) => e.message)
      expect(error).toContain(
        `GitHub answered 401 for the repository: ${name} was rejected.`
      )
      expect(error).not.toContain('secret-401')
    }
  )

  it.each([403, 429])(
    'says rate limited on %i and suggests GITHUB_TOKEN only without one',
    async (status) => {
      const routes = {
        ...repoRoutes(),
        '/repos/KhallilB/bezl': () => new Response('', { status }),
      }
      const run = (token?: string) =>
        collectProgress(
          [bezl],
          options({
            fetch: github(routes).fetch,
            token: token ? { name: 'GITHUB_TOKEN', value: token } : undefined,
          })
        ).catch((e: Error) => e.message)
      const anonymous = await run()
      expect(anonymous).toMatch(/rate limited/)
      expect(anonymous).toMatch(/GITHUB_TOKEN/)
      const authed = await run('t0k')
      expect(authed).toMatch(/rate limited/)
      expect(authed).not.toMatch(/GITHUB_TOKEN/)
    }
  )

  it('stops after 50 commit pages with a named error', async () => {
    const routes = repoRoutes()
    routes['/repos/KhallilB/bezl/commits'] = () => json(fullPage())
    const { fetch, calls } = github(routes)
    await expect(collectProgress([bezl], options({ fetch }))).rejects.toThrow(
      '"bezl" (KhallilB/bezl): the commit history runs past 50 pages'
    )
    expect(
      calls.filter((c) => c.url.pathname.endsWith('/commits'))
    ).toHaveLength(50)
  })

  it('fails clearly when the commits response is not a list', async () => {
    const routes = repoRoutes()
    routes['/repos/KhallilB/bezl/commits'] = () => json({ message: 'odd' })
    await expect(
      collectProgress([bezl], options({ fetch: github(routes).fetch }))
    ).rejects.toThrow(
      '"bezl" (KhallilB/bezl): the commit history is not a list'
    )
  })

  it('includes the cause of a network error', async () => {
    const failing = () =>
      Promise.reject(
        new TypeError('fetch failed', { cause: new Error('ECONNRESET') })
      )
    await expect(
      collectProgress([bezl], options({ fetch: failing }))
    ).rejects.toThrow('"bezl" (KhallilB/bezl): fetch failed (ECONNRESET)')
  })

  it('prints a non-Error throw as text', async () => {
    const failing = () => Promise.reject('boom')
    await expect(
      collectProgress([bezl], options({ fetch: failing }))
    ).rejects.toThrow('"bezl" (KhallilB/bezl): boom')
  })

  it('gives every request a timeout signal', async () => {
    const { fetch, calls } = github(repoRoutes())
    await collectProgress([bezl], options({ fetch }))
    expect(calls.length).toBeGreaterThan(0)
    expect(
      calls.every((c) => c.signal instanceof AbortSignal && !c.signal.aborted)
    ).toBe(true)
  })

  it('asks for the raw media type on progress.json', async () => {
    const { fetch, calls } = github(repoRoutes())
    await collectProgress([bezl], options({ fetch }))
    const file = calls.find((c) => c.url.pathname.endsWith('/progress.json'))
    expect(file?.headers.accept).toBe('application/vnd.github.raw+json')
  })
})

describe('collectProgress commit mapping', () => {
  const withCommit = (c: unknown) =>
    collectProgress(
      [bezl],
      options({ fetch: github(repoRoutes(goodFile(), [c])).fetch })
    )

  it('dates a commit by its committer date, the one GitHub filters on', async () => {
    const progress = await withCommit({
      sha: '01e47db2f079',
      html_url: 'https://github.com/KhallilB/bezl/commit/01e47db2f079',
      commit: {
        message: 'fix: rebased',
        author: { date: '2026-10-01T09:00:00Z' },
        committer: { date: '2026-10-20T09:00:00Z' },
      },
    })
    expect(progress.bezl.commits[0].date).toBe('2026-10-20')
  })

  it('falls back to the author date when there is no committer date', async () => {
    const progress = await withCommit(
      apiCommit('01e47db', '2026-10-19', 'x: y')
    )
    expect(progress.bezl.commits[0].date).toBe('2026-10-19')
  })

  it('names the commit when it has no date at all', async () => {
    await expect(
      withCommit({
        sha: '01e47db2f079',
        html_url: 'https://github.com/KhallilB/bezl/commit/01e47db2f079',
        commit: { message: 'feat: x', author: null, committer: null },
      })
    ).rejects.toThrow('"bezl" (KhallilB/bezl): commit 01e47db has no date')
  })

  it('gives an empty message the subject (no message)', async () => {
    const progress = await withCommit(apiCommit('01e47db', '2026-10-19', ''))
    expect(progress.bezl.commits[0]).toMatchObject({
      subject: '(no message)',
      type: 'other',
    })
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

describe('private repositories and tokens', () => {
  const progressToken: GitHubToken = {
    name: 'PROGRESS_TOKEN',
    value: 'secret-p',
  }

  it('reads a private repository with a token', async () => {
    const routes = {
      ...repoRoutes(),
      '/repos/KhallilB/bezl': () =>
        json({ private: true, default_branch: 'trunk' }),
    }
    const { fetch, calls } = github(routes)
    const progress = await collectProgress(
      [bezl],
      options({ fetch, token: progressToken })
    )
    expect(progress.bezl.file).toEqual(goodFile())
    expect(
      calls.every((c) => c.headers.authorization === 'Bearer secret-p')
    ).toBe(true)
  })

  it.each([
    [
      progressToken,
      'the repository was not found, or PROGRESS_TOKEN cannot read it.',
    ],
    [
      { name: 'GITHUB_TOKEN', value: 'secret-g' } as GitHubToken,
      'the repository was not found, or GITHUB_TOKEN cannot read it; private repositories need PROGRESS_TOKEN.',
    ],
    [
      undefined,
      'the repository was not found, or no token is set; private repositories need PROGRESS_TOKEN.',
    ],
  ])('on a 404 names the token in use (case %#)', async (token, message) => {
    const { fetch } = github({
      ...repoRoutes(),
      '/repos/KhallilB/bezl': missing,
    })
    const error = await collectProgress(
      [bezl],
      options({ fetch, token })
    ).catch((e: Error) => e.message)
    expect(error).toContain(`"bezl" (KhallilB/bezl): ${message}`)
    if (token) expect(error).not.toContain(token.value)
  })
})

describe('chooseToken', () => {
  it('prefers PROGRESS_TOKEN', () => {
    expect(chooseToken({ PROGRESS_TOKEN: 'p', GITHUB_TOKEN: 'g' })).toEqual({
      name: 'PROGRESS_TOKEN',
      value: 'p',
    })
  })

  it('skips an empty PROGRESS_TOKEN, as Actions passes an unset secret', () => {
    expect(chooseToken({ PROGRESS_TOKEN: '', GITHUB_TOKEN: 'g' })).toEqual({
      name: 'GITHUB_TOKEN',
      value: 'g',
    })
  })

  it('has no token when both are empty or unset', () => {
    expect(
      chooseToken({ PROGRESS_TOKEN: '', GITHUB_TOKEN: '' })
    ).toBeUndefined()
    expect(chooseToken({})).toBeUndefined()
  })
})
