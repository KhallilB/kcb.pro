import { formatDay, formatMonth } from './dates'
import type { Dated, IsoDay, ProjectStatus, StudyFormat } from './types'

export const formatLabel = (format: StudyFormat) =>
  format === 'teardown' ? 'Teardown' : 'Reimagining'

const LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  shipped: 'Shipped',
}

export function statusLabel(status: ProjectStatus): string {
  return LABELS[status]
}

// Live work is dated by the build; plans by their start; shipped work by its ship day.
export function statusLine(item: Dated, asOf: IsoDay): string {
  const label = statusLabel(item.status)
  switch (item.status) {
    case 'in-progress':
      return `${label} · as of ${formatDay(asOf)}`
    case 'planned':
      return `${label} · ${formatMonth(item.startsOn)}`
    case 'shipped':
      return `${label} · ${item.shippedOn ? formatDay(item.shippedOn) : 'date unknown'}`
  }
}
