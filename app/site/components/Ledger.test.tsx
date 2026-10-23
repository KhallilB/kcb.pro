import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { entry, progressFile } from '@app/portfolio/domain/fixtures'
import type { Commit, ProgressEntry } from '@app/portfolio/domain/progress'
import { SiteProvider } from '../site-context'
import { Ledger } from './Ledger'

function ledger(entries: ProgressEntry[], commits: Commit[] = []) {
  return (
    <SiteProvider asOf="2026-10-21">
      <Ledger
        repo="KhallilB/alpha"
        progress={{ file: progressFile(entries), commits }}
      />
    </SiteProvider>
  )
}

const show = (entries: ProgressEntry[], commits: Commit[] = []) =>
  render(ledger(entries, commits))
const region = () => screen.getByRole('region', { name: 'Progress' })
const entryIds = () =>
  Array.from(document.querySelectorAll('.entry')).map((e) => e.id)

describe('Ledger', () => {
  it('says when the newest entry is more than 30 days old', () => {
    show([entry({ date: '2026-09-20' })])
    expect(region()).toHaveTextContent('Quiet since 20 Sep 2026')
  })

  it('says nothing about quiet within 30 days', () => {
    show([entry({ date: '2026-09-21' })])
    expect(region()).not.toHaveTextContent('Quiet since')
  })

  it('lists every entry newest first, each anchored by its id', () => {
    show([
      entry({ id: 'old', subject: 'a', date: '2026-10-01' }),
      entry({ id: 'new', subject: 'b', date: '2026-10-20' }),
    ])
    expect(entryIds()).toEqual(['new', 'old'])
  })

  it('keeps superseded entries in the record', () => {
    show([
      entry({ id: 'first', result: 'fail', date: '2026-10-01' }),
      entry({ id: 'rerun', result: 'pass' }),
    ])
    expect(entryIds()).toEqual(['rerun', 'first'])
  })

  it('carries each result in shape and word, not colour alone', () => {
    show([entry({ result: 'partial' })])
    const item = document.getElementById('2026-10-20-alpha') as HTMLElement
    const badge = within(item).getByText('Partial').closest('.result')
    expect(badge).toHaveAttribute('data-result', 'partial')
    expect(badge?.querySelector('.result__mark')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(item).toHaveTextContent('Experiment')
  })

  it('links the commit an entry was recorded at', () => {
    show([entry()])
    expect(
      screen.getByRole('link', { name: 'Commit 01e47db' })
    ).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/alpha/commit/01e47db'
    )
  })

  it('sets the pass mark beside what was measured', () => {
    show([entry()])
    const facts = document.querySelector('.entry__facts') as HTMLElement
    expect(
      within(facts).getByText('Pass mark').nextElementSibling
    ).toHaveTextContent('Under 100 ms')
    expect(
      within(facts).getByText('Median').nextElementSibling
    ).toHaveTextContent('40 ms')
  })

  it('links evidence: a path at its commit, a url as given', () => {
    show([
      entry({
        evidence: [
          { label: 'RESULT.md', path: 'spikes/alpha/RESULT.md' },
          {
            label: 'CI run',
            url: 'https://github.com/KhallilB/alpha/actions/runs/1',
          },
        ],
      }),
    ])
    expect(screen.getByText('RESULT.md').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/alpha/blob/01e47db/spikes/alpha/RESULT.md'
    )
    expect(screen.getByText('CI run').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/alpha/actions/runs/1'
    )
  })

  it('counts the evidence on each entry', () => {
    show([
      entry({
        evidence: [
          { label: 'A', path: 'a.md' },
          { label: 'B', path: 'b.md' },
        ],
      }),
    ])
    expect(screen.getByText('Evidence (2)')).toBeInTheDocument()
  })

  it('says so when there are no entries yet', () => {
    show([])
    expect(region()).toHaveTextContent(
      '0 proven · 0 partial · 0 failed · 0 open'
    )
    expect(region()).toHaveTextContent('No entries yet.')
  })

  const mixed = () => [
    entry({ id: 'trial', subject: 'trial' }),
    entry({
      id: 'shipped',
      subject: 'shipped',
      kind: 'release',
      passMark: undefined,
    }),
  ]

  it('filters by kind once the page is live', () => {
    show(mixed())
    const filters = screen.getByRole('group', { name: 'Filter entries' })
    const button = (name: string) =>
      within(filters).getByRole('button', { name })
    expect(
      within(filters)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['All', 'Experiments', 'Tests', 'Releases', 'Milestones'])
    expect(button('All')).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(button('Releases'))
    expect(entryIds()).toEqual(['shipped'])
    expect(button('Releases')).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(button('Tests'))
    expect(region()).toHaveTextContent('No entries of this kind yet.')

    fireEvent.click(button('All'))
    expect(entryIds()).toEqual(['shipped', 'trial'])
  })

  it('lists every entry and offers no filters before JavaScript runs', () => {
    const html = renderToString(ledger(mixed()))
    expect(html).toContain('id="trial"')
    expect(html).toContain('id="shipped"')
    expect(html).not.toContain('Filter entries')
  })
})
