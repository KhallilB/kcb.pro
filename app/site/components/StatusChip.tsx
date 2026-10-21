import { statusLine } from '@app/portfolio/domain/status'
import type { Dated } from '@app/portfolio/domain/types'
import { useSite } from '../site'

// Shape carries status too, so colour never does it alone.
export function StatusChip({ item }: { item: Dated }) {
  const { asOf } = useSite()
  return (
    <span className="status" data-status={item.status}>
      <span className="status__mark" aria-hidden="true" />
      <span className="status__text">{statusLine(item, asOf)}</span>
    </span>
  )
}
