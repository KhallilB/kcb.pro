import { Status, type StatusTone } from '@kb.ui/react'
import { statusLine } from '@app/portfolio/domain/status'
import type { Dated } from '@app/portfolio/domain/types'
import { useSite } from '../site'

const tones: Record<Dated['status'], StatusTone> = {
  planned: 'neutral',
  'in-progress': 'running',
  shipped: 'success',
}
export function StatusChip({ item }: { item: Dated }) {
  const { asOf } = useSite()
  return (
    <Status
      className="status"
      data-status={item.status}
      tone={tones[item.status]}
      icon={<span className="status__mark" />}
    >
      {statusLine(item, asOf)}
    </Status>
  )
}
