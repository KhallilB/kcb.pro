import { formatDay, formatMonth } from './dates'

describe('dates', () => {
  it('formats an ISO day as the as-of stamp reads it', () => {
    expect(formatDay('2026-10-21')).toBe('21 Oct 2026')
    expect(formatDay('2027-01-04')).toBe('4 Jan 2027')
  })

  it('formats an ISO day as a month for timelines', () => {
    expect(formatMonth('2026-09-20')).toBe('Sep 2026')
  })

  it('refuses a date that is not a real ISO day', () => {
    expect(() => formatDay('2026-13-01')).toThrow(/ISO day/)
    expect(() => formatDay('2026-02-30')).toThrow(/ISO day/)
    expect(() => formatDay('21 Oct 2026')).toThrow(/ISO day/)
  })
})
