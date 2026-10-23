import {
  addDays,
  daysBetween,
  formatDay,
  formatMonth,
  formatWeekday,
  isIsoDay,
} from './dates'

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

  it('tells a real ISO day from anything else', () => {
    expect(isIsoDay('2026-10-21')).toBe(true)
    expect(isIsoDay('2026-02-30')).toBe(false)
    expect(isIsoDay('21 Oct 2026')).toBe(false)
  })

  it('steps whole days across month and year ends', () => {
    expect(addDays('2026-10-21', -83)).toBe('2026-07-30')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('counts the days from one day to a later one', () => {
    expect(daysBetween('2026-09-20', '2026-10-21')).toBe(31)
    expect(daysBetween('2026-10-21', '2026-10-21')).toBe(0)
  })

  it('names the weekday of a day', () => {
    expect(formatWeekday('2026-10-21')).toBe('Wednesday')
  })
})
