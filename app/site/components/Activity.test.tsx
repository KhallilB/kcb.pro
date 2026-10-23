import { render, screen, within } from '@testing-library/react'
import { days } from '@app/portfolio/domain/fixtures'
import type { IsoDay } from '@app/portfolio/domain/types'
import { SiteProvider } from '../site-context'
import { Activity } from './Activity'

function show(counts: Record<IsoDay, number> = {}) {
  return render(
    <SiteProvider asOf="2026-10-21">
      <Activity days={days('2026-10-21', counts)} />
    </SiteProvider>
  )
}

const region = () => screen.getByRole('region', { name: 'Activity' })

describe('Activity', () => {
  it('backs the commit squares with a table of days', () => {
    const { container } = show({ '2026-10-21': 2 })
    const table = screen.getByRole('table', {
      name: 'Commits per day for the 12 weeks to 21 Oct 2026: 2 commits on 1 day',
    })
    expect(container.querySelectorAll('td[data-level]')).toHaveLength(84)
    const wednesday = within(table)
      .getByRole('rowheader', { name: 'Wednesday' })
      .closest('tr') as HTMLElement
    const today = wednesday.querySelectorAll('td')[11]
    expect(today).toHaveTextContent('2')
    expect(today).toHaveAttribute('data-level', '2')
  })

  it('summarises the caption in singular and plural', () => {
    show({ '2026-10-21': 1 })
    expect(
      screen.getByRole('table', {
        name: 'Commits per day for the 12 weeks to 21 Oct 2026: 1 commit on 1 day',
      })
    ).toBeInTheDocument()
  })

  it('reads each square as a plain count, singular for one', () => {
    show({ '2026-10-20': 1, '2026-10-21': 2 })
    expect(screen.getByTitle('0 commits on 19 Oct 2026')).toBeInTheDocument()
    expect(screen.getByTitle('1 commit on 20 Oct 2026')).toBeInTheDocument()
    expect(screen.getByTitle('2 commits on 21 Oct 2026')).toBeInTheDocument()
  })

  it.each([
    ['15 Oct 2026', 0, '0'],
    ['16 Oct 2026', 1, '1'],
    ['17 Oct 2026', 3, '2'],
    ['18 Oct 2026', 4, '3'],
    ['19 Oct 2026', 6, '3'],
    ['20 Oct 2026', 7, '4'],
  ])('shades %s with %i commits as level %s', (label, count, level) => {
    show({ [`2026-10-${label.slice(0, 2)}`]: count })
    const cell = screen.getByTitle(
      `${count} ${count === 1 ? 'commit' : 'commits'} on ${label}`
    )
    expect(cell).toHaveAttribute('data-level', level)
  })

  it('states the total for the grid and a less-to-more legend', () => {
    const { container } = show({ '2026-10-20': 1, '2026-10-21': 1 })
    expect(region()).toHaveTextContent('2 commits in the last 12 weeks')
    expect(region()).toHaveTextContent('Less')
    expect(region()).toHaveTextContent('More')
    const swatches = container.querySelectorAll(
      '.activity__legend [data-level]'
    )
    expect(Array.from(swatches, (s) => s.getAttribute('data-level'))).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
    ])
    swatches.forEach((s) =>
      expect(s.closest('[aria-hidden="true"]')).not.toBeNull()
    )
  })

  it('says one commit in the singular', () => {
    show({ '2026-10-21': 1 })
    expect(region()).toHaveTextContent('1 commit in the last 12 weeks')
  })

  it('says so when nothing was committed', () => {
    show()
    expect(region()).toHaveTextContent('No commits in the last 12 weeks.')
    expect(region()).not.toHaveTextContent('0 commits in the last 12 weeks')
  })

  it('lists no commits and links nowhere', () => {
    show({ '2026-10-21': 3 })
    expect(within(region()).queryAllByRole('link')).toEqual([])
    expect(region()).not.toHaveTextContent('Recent commits')
  })
})
