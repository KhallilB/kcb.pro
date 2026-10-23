import Ajv from 'ajv'
import schema from '../../../schema/progress.v1.json'
import { validateProgress } from '../domain/progress'

const ctx = { slug: 'bezl', buildDay: '2026-10-21' }

describe('schema/progress.v1.json', () => {
  it('describes contract version 1', () => {
    expect(schema.properties.schema.const).toBe(1)
  })

  it('lists the kinds and results the contract allows', () => {
    expect(schema.definitions.entry.properties.kind.enum).toEqual([
      'experiment',
      'tests',
      'release',
      'milestone',
    ])
    expect(schema.definitions.entry.properties.result.enum).toEqual([
      'pass',
      'partial',
      'fail',
      'not-run',
    ])
  })

  it('requires exactly these entry fields', () => {
    expect(schema.definitions.entry.required).toEqual([
      'id',
      'subject',
      'date',
      'kind',
      'title',
      'result',
      'measured',
      'evidence',
    ])
  })
})

type Doc = Record<string, unknown>

const url = { label: 'Run', url: 'https://example.com/run' }
const release = (over: Doc = {}): Doc => ({
  id: 'r1',
  subject: 'bezl',
  date: '2026-10-20',
  kind: 'release',
  title: 'Ships',
  result: 'pass',
  measured: [],
  evidence: [url],
  ...over,
})
const withPath = (path: string, over: Doc = {}) =>
  release({
    evidence: [{ label: 'Result', path }],
    commit: '01e47db',
    ...over,
  })
const file = (...entries: Doc[]): Doc => ({
  schema: 1,
  project: 'bezl',
  entries,
})
const without = (e: Doc, field: string) => {
  const rest = { ...e }
  delete rest[field]
  return rest
}

const corpus: [string, unknown, boolean][] = [
  ['no entries', file(), true],
  ['release with a url', file(release()), true],
  ['unknown extra fields are allowed', file(release({ note: 'x' })), true],
  [
    'experiment with a pass mark and a path at a commit',
    file(withPath('spikes/a.md', { kind: 'experiment', passMark: '< 100 ms' })),
    true,
  ],
  [
    'not-run may have no evidence',
    file(release({ result: 'not-run', evidence: [] })),
    true,
  ],
  ['commit on a url entry', file(release({ commit: '01e47db' })), true],
  [
    'experiment without a pass mark',
    file(release({ kind: 'experiment' })),
    false,
  ],
  [
    'tests with a blank pass mark',
    file(release({ kind: 'tests', passMark: '  ' })),
    false,
  ],
  ['release with a blank pass mark', file(release({ passMark: ' ' })), false],
  ['pass without evidence', file(release({ evidence: [] })), false],
  [
    'evidence with both path and url',
    file(
      release({
        evidence: [{ label: 'x', path: 'a.md', url: url.url }],
        commit: '01e47db',
      })
    ),
    false,
  ],
  [
    'evidence with neither',
    file(release({ evidence: [{ label: 'x' }] })),
    false,
  ],
  [
    'evidence with a blank label',
    file(release({ evidence: [{ label: ' ', url: url.url }] })),
    false,
  ],
  [
    'http url',
    file(release({ evidence: [{ label: 'x', url: 'http://example.com' }] })),
    false,
  ],
  [
    'url with a space',
    file(release({ evidence: [{ label: 'x', url: 'https://a b' }] })),
    false,
  ],
  ['path without a commit', file(without(withPath('a.md'), 'commit')), false],
  [
    'commit that is not a hash',
    file(withPath('a.md', { commit: 'main' })),
    false,
  ],
  ['commit with uppercase hex', file(release({ commit: '01E47DB' })), false],
  ['id with whitespace', file(release({ id: 'a b' })), false],
  ['empty id', file(release({ id: '' })), false],
  ['unknown kind', file(release({ kind: 'demo' })), false],
  ['unknown result', file(release({ result: 'ok' })), false],
  [
    'measured missing a value',
    file(release({ measured: [{ label: 'p50' }] })),
    false,
  ],
  ['measured not a list', file(release({ measured: 'fast' })), false],
  ['missing evidence list', file(without(release(), 'evidence')), false],
  ['malformed date', file(release({ date: '20-10-2026' })), false],
  ['schema version 2', { ...file(release()), schema: 2 }, false],
  ['schema version as a string', { ...file(release()), schema: '1' }, false],
  ['entries not a list', { schema: 1, project: 'bezl', entries: {} }, false],
  ['blank project', { schema: 1, project: ' ', entries: [] }, false],
  [
    'partial with a summary',
    file(release({ result: 'partial', summary: 'Runs; one limit left.' })),
    true,
  ],
  ['partial without a summary', file(release({ result: 'partial' })), false],
  [
    'partial with a blank summary',
    file(release({ result: 'partial', summary: ' ' })),
    false,
  ],
  ['pass with a summary', file(release({ summary: 'Done and shipped.' })), true],
  ['summary padded with spaces', file(release({ summary: '  Done.  ' })), true],
  [
    'summary of 140 characters',
    file(release({ summary: 'x'.repeat(140) })),
    true,
  ],
  [
    'summary of 140 characters inside padding',
    file(release({ summary: ` ${'x'.repeat(140)} ` })),
    true,
  ],
  [
    'summary of 141 characters',
    file(release({ summary: 'x'.repeat(141) })),
    false,
  ],
  [
    'summary of 140 emoji',
    file(release({ summary: '🙂'.repeat(140) })),
    true,
  ],
  ['blank summary', file(release({ summary: '  ' })), false],
  ['summary with a line feed', file(release({ summary: 'a\nb' })), false],
  [
    'summary with a carriage return',
    file(release({ summary: 'a\rb' })),
    false,
  ],
  [
    'summary ending in a line feed',
    file(release({ summary: 'Done.\n' })),
    false,
  ],
  ['summary that is not a string', file(release({ summary: 5 })), false],
]

const paths: [string, boolean][] = [
  ['a/b', true],
  ['a..b', true],
  ['a/..b', true],
  ['.hidden/x', true],
  ['a\nb', true],
  ['a/../b', false],
  ['..', false],
  ['../a', false],
  ['a/..', false],
  ['/a', false],
  ['  ', false],
  ['', false],
]

describe('schema agrees with validateProgress', () => {
  const accepts = new Ajv().compile(schema)

  it.each(corpus)('%s', (_name, doc, ok) => {
    expect(accepts(doc)).toBe(ok)
    expect(validateProgress(doc, ctx).length === 0).toBe(ok)
  })

  it.each(paths)('evidence path %j', (path, ok) => {
    const doc = file(withPath(path))
    expect(accepts(doc)).toBe(ok)
    expect(validateProgress(doc, ctx).length === 0).toBe(ok)
  })
})
