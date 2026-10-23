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
      name: 'Commits per day for the 12 weeks to 21 Oct 2026',
    })
    expect(container.querySelectorAll('td[data-level]')).toHaveLength(84)
    const wednesday = within(table)
      .getByRole('rowheader', { name: 'Wednesday' })
      .closest('tr') as HTMLElement
    const today = wednesday.querySelectorAll('td')[11]
    expect(today).toHaveTextContent('2')
    expect(today).toHaveAttribute('data-level', '2')
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
