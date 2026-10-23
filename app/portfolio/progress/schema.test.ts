import schema from '../../../schema/progress.v1.json'
import { entry, progressFile } from '../domain/fixtures'
import {
  PROGRESS_KINDS,
  PROGRESS_RESULTS,
  PROGRESS_SCHEMA,
  validateProgress,
  type ProgressEntry,
} from '../domain/progress'

const ctx = { slug: 'alpha', buildDay: '2026-10-21' }

describe('schema/progress.v1.json', () => {
  it('describes the contract version the domain writes against', () => {
    expect(schema.properties.schema.const).toBe(PROGRESS_SCHEMA)
  })

  it('lists the same kinds and results as the domain', () => {
    expect(schema.$defs.entry.properties.kind.enum).toEqual([...PROGRESS_KINDS])
    expect(schema.$defs.entry.properties.result.enum).toEqual([
      ...PROGRESS_RESULTS,
    ])
  })

  it.each(schema.$defs.entry.required)(
    'requires %s, and so does the domain',
    (field) => {
      const bare: Record<string, unknown> = { ...entry() }
      delete bare[field]
      expect(
        validateProgress(progressFile([bare as unknown as ProgressEntry]), ctx)
      ).not.toEqual([])
    }
  )
})
