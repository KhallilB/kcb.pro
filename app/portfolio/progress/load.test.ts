import { commit, entry, progressFile } from '../domain/fixtures'
import { toPublic } from '../domain/progress'
import { loadProgress } from './load'

const day = '2026-10-21'
const shipped = () =>
  toPublic(
    {
      file: progressFile([entry({ summary: 'Holds up well.' })]),
      commits: [commit()],
    },
    day
  )

describe('loadProgress', () => {
  it('reads no files as no progress', () => {
    expect(loadProgress({}, day)).toEqual({})
  })

  it('keys each file by the slug in its path', () => {
    expect(
      loadProgress(
        {
          '/build-data/progress/alpha.json': shipped(),
          '/x/beta.json': shipped(),
        },
        day
      )
    ).toEqual({ alpha: shipped(), beta: shipped() })
  })

  it('refuses a stale full-shape file, naming the file', () => {
    const stale = { file: progressFile([entry()]), commits: [commit()] }
    expect(() =>
      loadProgress({ '/build-data/progress/alpha.json': stale }, day)
    ).toThrow(
      /build-data\/progress\/alpha\.json failed validation:[\s\S]*does not ship: "file"/
    )
  })

  it('refuses an entry that carries a private field', () => {
    const leaky = shipped()
    leaky.entries[0] = {
      ...leaky.entries[0],
      passMark: 'Under 100 ms',
    } as never
    expect(() => loadProgress({ '/x/alpha.json': leaky }, day)).toThrow(
      '"alpha" built progress entry "2026-10-20-alpha" has a field the site does not ship: "passMark"'
    )
  })

  it('refuses days built for another day', () => {
    expect(() =>
      loadProgress({ '/x/alpha.json': shipped() }, '2026-10-22')
    ).toThrow('"alpha" built progress needs days as the 84 days to 2026-10-22')
  })
})
