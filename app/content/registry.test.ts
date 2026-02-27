import { describe, expect, it, vi } from 'vitest'

import { ContentRegistry } from '@app/content/registry'
import type { ContentPackV1 } from '@app/content/types'

function pack(overrides: Partial<ContentPackV1> = {}): ContentPackV1 {
  return {
    schemaVersion: '1',
    id: 'pack-a',
    name: 'Pack A',
    encounters: [
      {
        id: 'encounter-a',
        characterId: 'goblin',
        title: 'Encounter A',
        actions: ['tap'],
      },
    ],
    reveals: [],
    ...overrides,
  }
}

describe('ContentRegistry', () => {
  it('ignores duplicate encounter ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const registry = new ContentRegistry()

    registry.register(pack())
    registry.register(
      pack({
        id: 'pack-b',
        encounters: [
          {
            id: 'encounter-a',
            characterId: 'phantom',
            title: 'Duplicate Encounter Id',
            actions: ['tap'],
          },
        ],
      })
    )

    expect(registry.listEncounters()).toHaveLength(1)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('enforces one encounter per character across packs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const registry = new ContentRegistry()

    registry.register(pack())
    registry.register(
      pack({
        id: 'pack-b',
        encounters: [
          {
            id: 'encounter-b',
            characterId: 'goblin',
            title: 'Duplicate Character',
            actions: ['hold'],
          },
        ],
      })
    )

    expect(registry.listEncounters()).toHaveLength(1)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
