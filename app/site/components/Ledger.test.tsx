import { render, screen } from '@testing-library/react'
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

describe('Ledger', () => {
  it('says when the newest entry is more than 30 days old', () => {
    show([entry({ date: '2026-09-20' })])
    expect(region()).toHaveTextContent('Quiet since 20 Sep 2026')
  })

  it('says nothing about quiet within 30 days', () => {
    show([entry({ date: '2026-09-21' })])
    expect(region()).not.toHaveTextContent('Quiet since')
  })
})
