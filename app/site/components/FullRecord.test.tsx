import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Link, MemoryRouter } from 'react-router'
import { publicEntry, publicProgress } from '@app/portfolio/domain/fixtures'
import { SiteProvider } from '../site-context'
import { FullRecord } from './FullRecord'

const entries = () => [
  publicEntry({
    id: 'a1',
    subject: 'a',
    date: '2026-10-01',
    title: 'Speed holds',
    result: 'fail',
  }),
  publicEntry({
    id: 'b1',
    subject: 'b',
    date: '2026-10-02',
    title: 'Snapshots match',
    summary: 'Matches on the first try.',
  }),
  publicEntry({
    id: 'a2',
    subject: 'a',
    date: '2026-10-05',
    title: 'Speed holds',
    result: 'partial',
    summary: 'Fast enough; memory is next.',
  }),
  publicEntry({
    id: 'c1',
    subject: 'c',
    date: '2026-10-06',
    title: 'Reviewers cannot write',
    result: 'not-run',
  }),
  publicEntry({
    id: 'a3',
    subject: 'a',
    date: '2026-10-09',
    title: 'Speed holds',
    result: 'partial',
    summary: 'Memory is under the limit at rest.',
  }),
]

function tree(path: string) {
  return (
    <SiteProvider asOf="2026-10-21">
      <MemoryRouter initialEntries={[path]}>
        <h2 id="the-problem">The problem</h2>
        <FullRecord progress={publicProgress(entries(), { '2026-10-21': 3 })} />
        <Link to="/work/alpha#a1">to a1</Link>
        <Link to="/work/alpha#a2">to a2</Link>
        <Link to="/work/beta#a2">to beta a2</Link>
      </MemoryRouter>
    </SiteProvider>
  )
}

const record = () => document.getElementById('record') as HTMLDetailsElement
const landed = () =>
  Array.from(document.querySelectorAll('[data-landed]'), (el) => el.id)
const rowIds = () =>
  Array.from(document.querySelectorAll('.record__row'), (row) => row.id)

describe('FullRecord', () => {
  afterEach(() => vi.restoreAllMocks())

  it('starts closed under the summary The full record', () => {
    render(tree('/work/alpha'))
    expect(record()).not.toHaveAttribute('open')
    expect(record().querySelector('summary')).toHaveTextContent(
      'The full record'
    )
  })

  it('names the record with a level-two heading inside its summary', () => {
    render(tree('/work/alpha'))
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'The full record',
    })
    expect(heading.closest('summary')).toBe(record().querySelector('summary'))
  })

  it('rows the current step per subject, grouped Done, In progress, Up next', () => {
    render(tree('/work/alpha'))
    expect(rowIds()).toEqual(['b1', 'a3', 'c1'])
  })

  it('shows each row’s mark and word, title, summary when present, and date', () => {
    render(tree('/work/alpha'))
    const row = document.getElementById('a3') as HTMLElement
    expect(row.querySelector('.mark')).toHaveAttribute('data-result', 'partial')
    expect(row.querySelector('.mark')).toHaveAttribute('aria-hidden', 'true')
    expect(row.querySelector('.result')).toHaveTextContent('In progress')
    expect(row).toHaveTextContent('Speed holds')
    expect(row).toHaveTextContent('Memory is under the limit at rest.')
    expect(row).toHaveTextContent('9 Oct 2026')
    expect(
      document.getElementById('c1')?.querySelector('.record__text')
    ).toBeNull()
  })

  it('lists earlier entries under their row, newest first, each anchored', () => {
    render(tree('/work/alpha'))
    const lines = Array.from(
      (document.getElementById('a3') as HTMLElement).querySelectorAll(
        '.record__line'
      )
    )
    expect(lines.map((line) => line.id)).toEqual(['a2', 'a1'])
    expect(lines[0]).toHaveTextContent(
      '5 Oct 2026 · In progress · Fast enough; memory is next.'
    )
    expect(lines[1]).toHaveTextContent('1 Oct 2026 · Rethinking · Speed holds')
  })

  it('holds the activity grid built from the shipped days', () => {
    render(tree('/work/alpha'))
    record().open = true
    expect(
      within(record()).getByRole('region', { name: 'Activity' })
    ).toHaveTextContent('3 commits in the last 12 weeks')
  })

  it('opens and scrolls to an entry on a client navigation', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(tree('/work/alpha'))
    fireEvent.click(screen.getByRole('link', { name: 'to a2' }))
    expect(record()).toHaveAttribute('open')
    expect(scroll.mock.contexts.at(-1)).toBe(document.getElementById('a2'))
  })

  it('marks only the entry the latest client navigation landed on', () => {
    render(tree('/work/alpha'))
    fireEvent.click(screen.getByRole('link', { name: 'to a2' }))
    expect(landed()).toEqual(['a2'])
    fireEvent.click(screen.getByRole('link', { name: 'to a1' }))
    expect(landed()).toEqual(['a1'])
  })

  it('moves focus to the entry it lands on, without a second scroll', () => {
    render(tree('/work/alpha'))
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    fireEvent.click(screen.getByRole('link', { name: 'to a2' }))
    const target = document.getElementById('a2') as HTMLElement
    expect(document.activeElement).toBe(target)
    expect(target.tabIndex).toBe(-1)
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true })
  })

  it('opens again when the same entry link is followed a second time', () => {
    render(tree('/work/alpha'))
    fireEvent.click(screen.getByRole('link', { name: 'to a2' }))
    record().open = false
    fireEvent.click(screen.getByRole('link', { name: 'to a2' }))
    expect(record()).toHaveAttribute('open')
  })

  it('opens for #record itself', () => {
    render(tree('/work/alpha#record'))
    expect(record()).toHaveAttribute('open')
  })

  it('opens again when the path changes under the same hash', () => {
    render(tree('/work/alpha#a2'))
    record().open = false
    fireEvent.click(screen.getByRole('link', { name: 'to beta a2' }))
    expect(record()).toHaveAttribute('open')
  })

  it('stays closed for a hash that names something outside the record', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(tree('/work/alpha#the-problem'))
    expect(document.getElementById('the-problem')).not.toBeNull()
    expect(record()).not.toHaveAttribute('open')
    expect(scroll).not.toHaveBeenCalled()
    expect(landed()).toEqual([])
  })

  it('renders closed on the server even when the hash matches', () => {
    expect(renderToString(tree('/work/alpha#a2'))).toContain(
      '<details id="record" class="record">'
    )
  })

  it('opens on a direct load with a matching hash, with no hydration warning', async () => {
    const path = '/work/alpha#a2'
    const container = document.createElement('div')
    container.innerHTML = renderToString(tree(path))
    document.body.append(container)
    expect(container.querySelector('#record')).not.toHaveAttribute('open')
    const logged = vi.spyOn(console, 'error')
    const recovered: unknown[] = []
    let root: Root | undefined
    await act(async () => {
      root = hydrateRoot(container, tree(path), {
        onRecoverableError: (error) => recovered.push(error),
      })
    })
    expect(container.querySelector('#record')).toHaveAttribute('open')
    expect(recovered).toEqual([])
    expect(logged).not.toHaveBeenCalled()
    act(() => root?.unmount())
    container.remove()
  })
})
