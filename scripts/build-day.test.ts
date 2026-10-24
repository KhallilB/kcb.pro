import { buildDay, pinBuildDay } from './build-day'

const lateOn21st = new Date('2026-10-21T23:59:59Z')
const earlyOn22nd = new Date('2026-10-22T00:00:01Z')

describe('buildDay', () => {
  it('is the UTC day when BUILD_DAY is absent', () => {
    expect(buildDay({}, new Date('2026-10-21T23:30:00-05:00'))).toBe(
      '2026-10-22'
    )
  })

  it('is BUILD_DAY when set', () => {
    expect(buildDay({ BUILD_DAY: '2026-10-21' }, earlyOn22nd)).toBe(
      '2026-10-21'
    )
  })

  it('rejects a BUILD_DAY that is not a calendar day', () => {
    expect(() => buildDay({ BUILD_DAY: '2026-10-2' })).toThrow(
      'BUILD_DAY must be YYYY-MM-DD, got "2026-10-2"'
    )
    expect(() => buildDay({ BUILD_DAY: '2026-02-30' })).toThrow('BUILD_DAY')
  })
})

describe('pinBuildDay', () => {
  it('fixes the day for later steps that run past midnight UTC', () => {
    const env: Record<string, string | undefined> = {}
    expect(pinBuildDay(env, lateOn21st)).toBe('2026-10-21')
    expect(env.BUILD_DAY).toBe('2026-10-21')
    expect(buildDay(env, earlyOn22nd)).toBe('2026-10-21')
  })

  it('keeps a BUILD_DAY that is already set', () => {
    const env = { BUILD_DAY: '2026-10-01' }
    expect(pinBuildDay(env, lateOn21st)).toBe('2026-10-01')
    expect(env.BUILD_DAY).toBe('2026-10-01')
  })
})
