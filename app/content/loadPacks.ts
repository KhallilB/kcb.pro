import type { ContentPackV1 } from '@app/content/types'
import { ContentRegistry } from '@app/content/registry'

const packModules = import.meta.glob<{ default: ContentPackV1 }>('./packs/*.ts', {
  eager: true,
})

function sortedPackEntries(): Array<[string, { default: ContentPackV1 }]> {
  return Object.entries(packModules).sort(([a], [b]) => a.localeCompare(b))
}

export function loadContentRegistry(): ContentRegistry {
  const registry = new ContentRegistry()

  for (const [, module] of sortedPackEntries()) {
    registry.register(module.default)
  }

  return registry
}
