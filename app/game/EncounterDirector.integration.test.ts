import { describe, expect, it } from 'vitest'

import { EncounterDirector } from '@app/game/EncounterDirector'
import type { BridgeEvent } from '@app/game/types'

describe('EncounterDirector integration', () => {
  it('runs encounter -> reveal flow and emits expected events', () => {
    const events: BridgeEvent[] = []
    const director = new EncounterDirector(
      [
        {
          id: 'enc-1',
          characterId: 'goblin',
          title: 'Goblin Trial',
          actions: ['tap', 'hold'],
          revealId: 'reveal-1',
        },
      ],
      (event) => {
        events.push(event)
      }
    )

    expect(director.startForCharacter('goblin')).toBe(true)
    expect(director.submitAction('tap')).toBe(true)
    expect(director.submitAction('hold')).toBe(true)

    const snapshot = director.getSnapshot()
    expect(snapshot.phase).toBe('reveal')
    expect(snapshot.activeEncounterId).toBe('enc-1')

    expect(events.some((event) => event.type === 'ENCOUNTER_STARTED')).toBe(true)
    expect(events.some((event) => event.type === 'ENCOUNTER_COMPLETED')).toBe(true)
    expect(events.some((event) => event.type === 'REVEAL_OPEN')).toBe(true)
  })
})
