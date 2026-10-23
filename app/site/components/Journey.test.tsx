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

const card = () => screen.getByRole('region', { name: 'Where it stands' })
const marks = () => screen.getAllByRole('img')

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
  it('is the progress anchor, headed Where it stands', () => {
    show(six())
    expect(
      screen.getByRole('heading', { level: 2, name: 'Where it stands' })
    ).toHaveAttribute('id', 'progress')
  })

  it('states the goal', () => {
    show(six(), 'One window for every assistant.')
    expect(card()).toHaveTextContent('One window for every assistant.')
  })

  it('draws one mark per step, Done to Up next, each named in words', () => {
    show(six())
    expect(marks().map((m) => m.getAttribute('aria-label'))).toEqual([
      'Step 1 of 6: Snapshots match, done',
      'Step 2 of 6: App scaffolded, done',
      'Step 3 of 6: Docs ship, done',
      'Step 4 of 6: Terminal output keeps up, in progress',
      'Step 5 of 6: Reviewers cannot write, up next',
      'Step 6 of 6: Memory limits hold, up next',
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

  it('counts the steps in plain words', () => {
    show(six())
    expect(card()).toHaveTextContent('3 done · 1 in progress · 2 up next')
  })

  it('names rethinking only when a step is being rethought, and skips empty groups', () => {
    show([
      publicEntry({ id: 'a', subject: 'a' }),
      publicEntry({ id: 'b', subject: 'b', result: 'fail' }),
    ])
    expect(card()).toHaveTextContent('1 done · 1 rethinking')
    expect(card()).not.toHaveTextContent('in progress')
    expect(card()).not.toHaveTextContent('up next')
  })

  it('names the first Up next step as Next', () => {
    show(six())
    expect(card()).toHaveTextContent('Next: Reviewers cannot write')
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
    expect(card()).toHaveTextContent('Next: Speed holds')
  })

  it('leaves Next out when every step is done', () => {
    show([publicEntry()])
    expect(card()).not.toHaveTextContent('Next:')
  })

  it('dates itself as of the build day', () => {
    show(six())
    expect(card()).toHaveTextContent('As of 21 Oct 2026')
  })

  it('says Quiet since when the newest entry is over 30 days old', () => {
    show([publicEntry({ date: '2026-09-20' })])
    expect(card()).toHaveTextContent('Quiet since 20 Sep 2026')
  })

  it('says nothing about quiet within 30 days', () => {
    show([publicEntry({ date: '2026-09-21' })])
    expect(card()).not.toHaveTextContent('Quiet since')
  })

  it('says so when no step is recorded yet', () => {
    show([])
    expect(card()).toHaveTextContent('No steps recorded yet.')
    expect(screen.queryAllByRole('img')).toEqual([])
  })
})
