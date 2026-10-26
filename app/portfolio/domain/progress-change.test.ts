import { entry, progressFile } from './fixtures'
import { appendOnlyErrors, missingEvidence } from './progress-change'

const first = entry()
const second = entry({
  id: '2026-10-21-beta',
  subject: 'beta',
  date: '2026-10-21',
  commit: 'abc1234',
  evidence: [{ label: 'Notes', path: 'docs/beta.md' }],
})

describe('appendOnlyErrors', () => {
  it('accepts new entries after the published ones', () => {
    expect(
      appendOnlyErrors(
        progressFile([first]),
        progressFile([first, second]),
        'alpha'
      )
    ).toEqual([])
  })

  it('accepts a first file with no published entries', () => {
    expect(appendOnlyErrors(undefined, progressFile([first]), 'alpha')).toEqual(
      []
    )
  })

  it('refuses an edit to a published entry', () => {
    const edited = { ...first, result: 'fail' as const }
    expect(
      appendOnlyErrors(progressFile([first]), progressFile([edited]), 'alpha')
    ).toEqual([
      '"alpha" progress.json entry "2026-10-20-alpha" was changed; published entries are never edited. Add a new entry with the same subject.',
    ])
  })

  it('refuses a removed entry', () => {
    expect(
      appendOnlyErrors(
        progressFile([first, second]),
        progressFile([second]),
        'alpha'
      )
    ).toEqual([
      '"alpha" progress.json entry "2026-10-20-alpha" was removed; published entries are never removed. Add a new entry with the same subject.',
    ])
  })

  it('ignores key order inside an entry', () => {
    const reordered = Object.fromEntries(Object.entries(first).reverse())
    expect(
      appendOnlyErrors(
        progressFile([first]),
        { ...progressFile([]), entries: [reordered] },
        'alpha'
      )
    ).toEqual([])
  })
})

describe('missingEvidence', () => {
  it('names each path that does not exist at its commit', () => {
    const exists = (commit: string, path: string) =>
      commit === '01e47db' && path === 'spikes/alpha/RESULT.md'
    expect(
      missingEvidence(progressFile([first, second]), exists, 'alpha')
    ).toEqual([
      '"alpha" progress.json entry "2026-10-21-beta" links docs/beta.md, which is not in abc1234',
    ])
  })

  it('does not look up url evidence', () => {
    const linked = entry({
      evidence: [
        { label: 'CI run', url: 'https://github.com/a/b/actions/runs/1' },
      ],
      commit: undefined,
    })
    const exists = () => {
      throw new Error('no lookup expected')
    }
    expect(missingEvidence(progressFile([linked]), exists, 'alpha')).toEqual([])
  })
})
