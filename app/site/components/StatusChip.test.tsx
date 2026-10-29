import { render, screen } from '@testing-library/react'
import type { Dated } from '@app/portfolio/domain/types'
import { SiteProvider } from '../site-context'
import { StatusChip } from './StatusChip'

it.each<[Dated, string, string]>([
  [
    { status: 'planned', startsOn: '2027-01-04' },
    'Planned · Jan 2027',
    'neutral',
  ],
  [
    { status: 'in-progress', startsOn: '2026-09-20' },
    'In progress · as of 21 Oct 2026',
    'running',
  ],
  [
    { status: 'shipped', startsOn: '2026-01-01', shippedOn: '2026-03-02' },
    'Shipped · 2 Mar 2026',
    'success',
  ],
])('renders domain dates through shared Status: %s', (item, text, tone) => {
  const { container } = render(
    <SiteProvider asOf="2026-10-21">
      <StatusChip item={item} />
    </SiteProvider>
  )
  expect(screen.getByText(text)).toBeVisible()
  const status = container.querySelector('.kb-status')
  expect(status).toHaveAttribute('data-tone', tone)
  expect(status).toHaveAttribute('data-status', item.status)
  expect(status).not.toHaveAttribute('role')
  expect(status?.querySelector('.kb-status-icon')).toHaveAttribute(
    'aria-hidden',
    'true'
  )
})
