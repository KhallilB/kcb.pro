// Rules a project's own check adds on top of the contract: history is append-only, evidence is real.

type Fields = Record<string, unknown>

const isRecord = (v: unknown): v is Fields =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function entriesOf(file: unknown): Fields[] {
  return isRecord(file) && Array.isArray(file.entries)
    ? file.entries.filter(isRecord)
    : []
}

// Key order is formatting, not content.
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  if (isRecord(v)) {
    const keys = Object.keys(v).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`
  }
  return JSON.stringify(v)
}

export function appendOnlyErrors(
  before: unknown,
  after: unknown,
  slug: string
): string[] {
  const now = new Map(entriesOf(after).map((e) => [e.id, e]))
  return entriesOf(before).flatMap((published) => {
    const where = `"${slug}" progress.json entry "${String(published.id)}"`
    const later = now.get(published.id)
    if (later === undefined) {
      return [
        `${where} was removed; published entries are never removed. Add a new entry with the same subject.`,
      ]
    }
    return canonical(later) === canonical(published)
      ? []
      : [
          `${where} was changed; published entries are never edited. Add a new entry with the same subject.`,
        ]
  })
}

export function missingEvidence(
  file: unknown,
  exists: (commit: string, path: string) => boolean,
  slug: string
): string[] {
  return entriesOf(file).flatMap((e) => {
    if (typeof e.commit !== 'string' || !Array.isArray(e.evidence)) return []
    const commit = e.commit
    return e.evidence
      .filter(
        (item): item is { path: string } =>
          isRecord(item) && typeof item.path === 'string'
      )
      .filter((item) => !exists(commit, item.path))
      .map(
        (item) =>
          `"${slug}" progress.json entry "${String(e.id)}" links ${item.path}, which is not in ${commit}`
      )
  })
}
