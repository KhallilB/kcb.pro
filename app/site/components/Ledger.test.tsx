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
    ).toEqual(['All', 'Experiments', 'Releases'])
    expect(button('All')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing 2 of 2 entries'
    )

    fireEvent.click(button('Releases'))
    expect(entryIds()).toEqual(['shipped'])
    expect(button('Releases')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing 1 of 2 entries'
    )

    fireEvent.click(button('All'))
    expect(entryIds()).toEqual(['shipped', 'trial'])
    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing 2 of 2 entries'
    )
  })

  it('offers only the kinds present, in the usual order', () => {
    show([
      entry({ id: 'm', subject: 'm', kind: 'milestone', passMark: undefined }),
      entry({ id: 'e', subject: 'e' }),
      entry({ id: 't', subject: 't', kind: 'tests' }),
    ])
    const filters = screen.getByRole('group', { name: 'Filter entries' })
    expect(
      within(filters)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['All', 'Experiments', 'Tests', 'Milestones'])
  })

  it('offers no filters when entries are all one kind', () => {
    show([entry({ id: 'a', subject: 'a' }), entry({ id: 'b', subject: 'b' })])
    expect(
      screen.queryByRole('group', { name: 'Filter entries' })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('offers no filters when there are no entries', () => {
    show([])
    expect(
      screen.queryByRole('group', { name: 'Filter entries' })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('falls back to all entries when the chosen kind is gone', () => {
    const view = render(ledger(mixed()))
    fireEvent.click(screen.getByRole('button', { name: 'Releases' }))
    view.rerender(ledger([entry({ id: 'solo', subject: 'solo' })]))
    expect(entryIds()).toEqual(['solo'])
  })

  it('lists every entry and offers no filters before JavaScript runs', () => {
    const html = renderToString(ledger(mixed()))
    expect(html).toContain('id="trial"')
    expect(html).toContain('id="shipped"')
    expect(html).not.toContain('Filter entries')
  })
})
