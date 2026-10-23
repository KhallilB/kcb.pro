import type { IsoDay } from './types'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function parse(day: IsoDay): { year: number; month: number; date: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) throw new Error(`Not an ISO day: ${day}`)
  const [year, month, date] = match.slice(1).map(Number)
  // UTC round-trip rejects 2026-02-30 and month 13.
  const probe = new Date(Date.UTC(year, month - 1, date))
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== date) {
    throw new Error(`Not an ISO day: ${day}`)
  }
  return { year, month, date }
}

export function formatDay(day: IsoDay): string {
  const { year, month, date } = parse(day)
  return `${date} ${MONTHS[month - 1]} ${year}`
}

const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatLongDay(day: IsoDay): string {
  const { year, month, date } = parse(day)
  return `${date} ${LONG_MONTHS[month - 1]} ${year}`
}

export function formatMonth(day: IsoDay): string {
  const { year, month } = parse(day)
  return `${MONTHS[month - 1]} ${year}`
}

export function isIsoDay(day: string): boolean {
  try {
    parse(day)
    return true
  } catch {
    return false
  }
}

const DAY_MS = 86_400_000

function utc(day: IsoDay): number {
  const { year, month, date } = parse(day)
  return Date.UTC(year, month - 1, date)
}

export function addDays(day: IsoDay, days: number): IsoDay {
  return new Date(utc(day) + days * DAY_MS).toISOString().slice(0, 10)
}

export function daysBetween(from: IsoDay, to: IsoDay): number {
  return Math.round((utc(to) - utc(from)) / DAY_MS)
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function formatWeekday(day: IsoDay): string {
  return WEEKDAYS[new Date(utc(day)).getUTCDay()]
}
