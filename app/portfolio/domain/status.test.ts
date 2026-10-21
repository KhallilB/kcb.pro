import { statusLabel, statusLine } from './status'

describe('status', () => {
  it('names every status in plain words', () => {
    expect(statusLabel('in-progress')).toBe('In progress')
    expect(statusLabel('planned')).toBe('Planned')
    expect(statusLabel('shipped')).toBe('Shipped')
  })

  it('dates work in progress with the build day', () => {
    expect(
      statusLine({ status: 'in-progress', startsOn: '2026-09-20' }, '2026-10-21')
    ).toBe('In progress · as of 21 Oct 2026')
  })

  it('dates planned work by the month it starts, not the build day', () => {
    expect(
      statusLine({ status: 'planned', startsOn: '2027-01-04' }, '2026-10-21')
    ).toBe('Planned · Jan 2027')
  })

  it('dates shipped work by the day it shipped', () => {
    expect(
      statusLine(
        { status: 'shipped', startsOn: '2026-01-01', shippedOn: '2026-03-02' },
        '2026-10-21'
      )
    ).toBe('Shipped · 2 Mar 2026')
  })
})
