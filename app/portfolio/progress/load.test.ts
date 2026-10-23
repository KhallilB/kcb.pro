import { commit, entry, progressFile } from '../domain/fixtures'
import { loadProgress } from './load'

const day = '2026-10-21'
const data = (slug: string) => ({
  file: progressFile([entry()], { project: slug }),
  commits: [commit()],
})

describe('loadProgress', () => {
  it('reads no files as no progress', () => {
    expect(loadProgress({}, day)).toEqual({})
  })

  it('keys each file by its slug', () => {
    expect(
      loadProgress({ '/build-data/progress/alpha.json': data('alpha') }, day)
    ).toEqual({ alpha: data('alpha') })
  })

  it('refuses a file that breaks the contract, naming the file', () => {
    const late = {
      ...data('alpha'),
      file: progressFile([entry({ date: '2026-10-22' })]),
    }
    expect(() =>
      loadProgress({ '/build-data/progress/alpha.json': late }, day)
    ).toThrow(/build-data\/progress\/alpha\.json[\s\S]*after the build day/)
  })

  it('takes the slug from the file path, not from the file', () => {
    expect(() => loadProgress({ '/x/beta.json': data('alpha') }, day)).toThrow(
      'must be "beta"'
    )
  })

  it('refuses malformed commits', () => {
    expect(() =>
      loadProgress(
        { '/x/alpha.json': { ...data('alpha'), commits: [{}] } },
        day
      )
    ).toThrow('"alpha" commit 1')
  })
})
