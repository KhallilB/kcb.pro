import { render, screen } from '@testing-library/react'
import { publicEntry, publicProgress } from '@app/portfolio/domain/fixtures'
import type { PublicEntry } from '@app/portfolio/domain/progress'
import { SiteProvider } from '../site-context'
import { Journey } from './Journey'

function show(entries: PublicEntry[], goal?: string) {
  return render(
    <SiteProvider asOf="2026-10-21">
      <Journey goal={goal} progress={publicProgress(entries)} />
    </SiteProvider>
  )
}

const card = () => screen.getByRole('region', { name: 'Progress' })
const marks = () => screen.getAllByRole('img')
const counts = () => card().querySelector('.journey__counts')?.textContent

const six = (): PublicEntry[] => [
  publicEntry({
    id: 'scaffold',
    subject: 'scaffold',
    date: '2026-10-02',
    title: 'App scaffolded',
  }),
  publicEntry({
    id: 'snap',
    subject: 'snap',
    date: '2026-10-01',
    title: 'Snapshots match',
  }),
  publicEntry({
    id: 'pipe',
    subject: 'pipe',
    date: '2026-10-03',
    title: 'Terminal output keeps up',
    result: 'partial',
    summary: 'No bytes lost; memory still runs high.',
  }),
  publicEntry({
    id: 'mem',
    subject: 'mem',
    date: '2026-10-05',
    title: 'Memory limits hold',
    result: 'not-run',
  }),
  publicEntry({
    id: 'review',
    subject: 'review',
    date: '2026-10-04',
    title: 'Reviewers cannot write',
    result: 'not-run',
  }),
  publicEntry({
    id: 'docs',
    subject: 'docs',
    date: '2026-10-06',
    title: 'Docs ship',
  }),
]

describe('Journey', () => {
  it('is the progress anchor, headed Progress', () => {
    show(six())
    expect(
      screen.getByRole('heading', { level: 2, name: 'Progress' })
    ).toHaveAttribute('id', 'progress')
  })

  it('states the goal', () => {
    show(six(), 'One window for every assistant.')
    expect(card()).toHaveTextContent('One window for every assistant.')
  })

  it('draws one mark per step, Done to Planned, each named in words', () => {
    show(six())
    expect(marks().map((m) => m.getAttribute('aria-label'))).toEqual([
      'Step 1 of 6: Snapshots match, done',
      'Step 2 of 6: App scaffolded, done',
      'Step 3 of 6: Docs ship, done',
      'Step 4 of 6: Terminal output keeps up, in progress',
      'Step 5 of 6: Reviewers cannot write, planned',
      'Step 6 of 6: Memory limits hold, planned',
    ])
  })

  it('carries status in each mark’s shape, not colour alone', () => {
    show(six())
    expect(marks().map((m) => m.getAttribute('data-result'))).toEqual([
      'pass',
      'pass',
      'pass',
      'partial',
      'not-run',
      'not-run',
    ])
    expect(marks().every((m) => m.classList.contains('mark'))).toBe(true)
  })

  it('counts the steps in plain words, done out of the total', () => {
    show(six())
    expect(counts()).toBe('3 of 6 done, 1 in progress, 2 planned')
  })

  it('starts the counts with the first group present when none is done', () => {
    show([
      publicEntry({
        id: 'a',
        subject: 'a',
        result: 'partial',
        summary: 'Half.',
      }),
      publicEntry({ id: 'b', subject: 'b', result: 'not-run' }),
      publicEntry({ id: 'c', subject: 'c', result: 'not-run' }),
    ])
    expect(counts()).toBe('1 in progress, 2 planned')
  })

  it('names a rethought step in its mark and the counts', () => {
    show([
      publicEntry({ id: 'a', subject: 'a', title: 'Speed holds' }),
      publicEntry({
        id: 'b',
        subject: 'b',
        title: 'Sync works',
        result: 'fail',
      }),
    ])
    expect(marks().at(-1)).toHaveAccessibleName(
      'Step 2 of 2: Sync works, rethinking'
    )
    expect(counts()).toBe('1 of 2 done, 1 being rethought')
  })

  it('keeps the steps a list for screen readers despite no bullets', () => {
    show(six())
    expect(card().querySelector('.journey__steps')).toHaveAttribute(
      'role',
      'list'
    )
  })

  it('names a rethought group only when a step is being rethought, and skips empty groups', () => {
    show([
      publicEntry({ id: 'a', subject: 'a' }),
      publicEntry({ id: 'b', subject: 'b', result: 'fail' }),
    ])
    expect(counts()).toBe('1 of 2 done, 1 being rethought')
    expect(card()).not.toHaveTextContent('in progress')
    expect(card()).not.toHaveTextContent('planned')
  })

  it('names the first Planned step as Next up', () => {
    show(six())
    expect(card()).toHaveTextContent('Next up: Reviewers cannot write')
  })

  it('falls back to the first In progress step', () => {
    show([
      publicEntry({
        id: 'a',
        subject: 'a',
        title: 'Speed holds',
        result: 'partial',
        summary: 'Mostly.',
      }),
      publicEntry({ id: 'b', subject: 'b' }),
    ])
    expect(card()).toHaveTextContent('Next up: Speed holds')
  })

  it('leaves Next up out when every step is done', () => {
    show([publicEntry()])
    expect(card()).not.toHaveTextContent('Next up')
  })

  it('says it was updated on the build day', () => {
    show(six())
    expect(card()).toHaveTextContent('Updated 21 Oct 2026')
  })

  it('says No updates since when the newest entry is over 30 days old', () => {
    show([publicEntry({ date: '2026-09-20' })])
    expect(card()).toHaveTextContent(
      'Updated 21 Oct 2026 · No updates since 20 Sep 2026'
    )
  })

  it('says nothing about updates stopping within 30 days', () => {
    show([publicEntry({ date: '2026-09-21' })])
    expect(card()).not.toHaveTextContent('No updates since')
  })

  it('says so when no step is recorded yet', () => {
    show([])
    expect(card()).toHaveTextContent('Nothing logged yet.')
    expect(screen.queryAllByRole('img')).toEqual([])
  })
})
