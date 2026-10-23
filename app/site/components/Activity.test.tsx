import { render, screen, within } from '@testing-library/react'
import { commit } from '@app/portfolio/domain/fixtures'
import type { Commit } from '@app/portfolio/domain/progress'
import { SiteProvider } from '../site-context'
import { Activity } from './Activity'

function show(commits: Commit[]) {
  return render(
    <SiteProvider asOf="2026-10-21">
      <Activity repo="KhallilB/alpha" commits={commits} />
    </SiteProvider>
  )
}

describe('Activity', () => {
  it('backs the commit squares with a table of days', () => {
    const { container } = show([
      commit({ date: '2026-10-21' }),
      commit({ sha: 'bbbbbbb', date: '2026-10-21' }),
    ])
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
    show([commit({ date: '2026-10-21' })])
    expect(
      screen.getByRole('table', {
        name: 'Commits per day for the 12 weeks to 21 Oct 2026: 1 commit on 1 day',
      })
    ).toBeInTheDocument()
  })

  it('reads each square as a plain count, singular for one', () => {
    show([
      commit({ date: '2026-10-20' }),
      commit({ sha: 'bbbbbbb', date: '2026-10-21' }),
      commit({ sha: 'ccccccc', date: '2026-10-21' }),
    ])
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
    const day = `2026-10-${label.slice(0, 2)}`
    show(
      Array.from({ length: count }, (_, i) =>
        commit({ sha: `00000${i}`, date: day })
      )
    )
    const cell = screen.getByTitle(
      `${count} ${count === 1 ? 'commit' : 'commits'} on ${label}`
    )
    expect(cell).toHaveAttribute('data-level', level)
  })

  it('states the total for the grid and a less-to-more legend', () => {
    const { container } = show([
      commit({ date: '2026-10-21' }),
      commit({ sha: 'bbbbbbb', date: '2026-10-20' }),
      commit({ sha: 'ccccccc', date: '2026-07-29' }),
    ])
    const region = screen.getByRole('region', { name: 'Activity' })
    expect(region).toHaveTextContent('2 commits in the last 12 weeks')
    expect(region).toHaveTextContent('Less')
    expect(region).toHaveTextContent('More')
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
    show([commit({ date: '2026-10-21' })])
    expect(screen.getByRole('region', { name: 'Activity' })).toHaveTextContent(
      '1 commit in the last 12 weeks'
    )
  })

  it('labels the grouped list as covering 90 days, not the grid’s 12 weeks', () => {
    show([commit()])
    expect(screen.getByText('Recent commits, last 90 days')).toBeInTheDocument()
  })

  it('groups recent commits by type, each linking to GitHub', () => {
    show([
      commit({ subject: 'feat: add alpha' }),
      commit({
        sha: 'bbbbbbb',
        type: 'fix',
        subject: 'fix: steady alpha',
        url: 'https://github.com/KhallilB/alpha/commit/bbbbbbb',
      }),
    ])
    const region = screen.getByRole('region', { name: 'Activity' })
    expect(
      within(region)
        .getAllByRole('heading', { level: 4 })
        .map((h) => h.textContent)
    ).toEqual(['Features · 1', 'Fixes · 1'])
    expect(
      within(region).getByRole('link', { name: 'fix: steady alpha' })
    ).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/alpha/commit/bbbbbbb'
    )
  })

  it('shows the five newest commits of a type and counts them all', () => {
    show(
      Array.from({ length: 7 }, (_, i) =>
        commit({
          sha: `000000${i}`,
          date: `2026-10-1${i}`,
          subject: `feat: step ${i}`,
        })
      )
    )
    expect(
      screen.getByRole('heading', { name: 'Features · 7' })
    ).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link', { name: /^feat: step/ })
        .map((a) => a.textContent)
    ).toEqual([
      'feat: step 6',
      'feat: step 5',
      'feat: step 4',
      'feat: step 3',
      'feat: step 2',
    ])
    expect(
      screen.getByRole('link', { name: 'All commits on GitHub' })
    ).toHaveAttribute('href', 'https://github.com/KhallilB/alpha/commits')
  })

  it('says so when nothing was committed', () => {
    show([])
    expect(screen.getByRole('region', { name: 'Activity' })).toHaveTextContent(
      'No commits in the last 90 days.'
    )
  })
})
