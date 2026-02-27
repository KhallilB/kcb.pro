import type {
  CharacterId,
  EncounterBlueprint,
  GestureAction,
} from '@app/content/types'
import type { BridgeEvent, RuntimeWarningCode } from '@app/game/types'
import { publishTelemetry } from '@app/telemetry/events'

export type EncounterPhase = 'hub' | 'encounter' | 'reveal'

export interface EncounterSnapshot {
  phase: EncounterPhase
  activeEncounterId: string | null
  activeCharacterId: CharacterId | null
  nextAction: GestureAction | null
  completedCount: number
  totalCount: number
}

interface ActiveEncounter {
  encounter: EncounterBlueprint
  actionIndex: number
}

type EventHandler = (event: BridgeEvent) => void

export class EncounterDirector {
  private readonly byId = new Map<string, EncounterBlueprint>()
  private readonly byCharacter = new Map<CharacterId, EncounterBlueprint>()
  private readonly completedEncounterIds = new Set<string>()
  private active: ActiveEncounter | null = null
  private phase: EncounterPhase = 'hub'
  private readonly onEvent: EventHandler

  constructor(encounters: EncounterBlueprint[], onEvent: EventHandler) {
    for (const encounter of encounters) {
      this.byId.set(encounter.id, encounter)

      if (!this.byCharacter.has(encounter.characterId)) {
        this.byCharacter.set(encounter.characterId, encounter)
      }
    }

    this.onEvent = onEvent
  }

  startForCharacter(characterId: CharacterId): boolean {
    const encounter = this.byCharacter.get(characterId)

    if (!encounter) {
      this.emitWarning('ENCOUNTER_MISSING', `No encounter found for character ${characterId}`)
      return false
    }

    this.active = {
      encounter,
      actionIndex: 0,
    }

    this.phase = 'encounter'

    this.onEvent({ type: 'ENCOUNTER_STARTED', encounterId: encounter.id })
    publishTelemetry({
      type: 'encounter_started',
      encounterId: encounter.id,
      characterId,
    })

    this.emitProgress()

    return true
  }

  submitAction(action: GestureAction): boolean {
    if (!this.active) {
      this.emitWarning('ENCOUNTER_NOT_ACTIVE', `Received action ${action} with no active encounter`)
      return false
    }

    const expectedAction = this.active.encounter.actions[this.active.actionIndex]

    if (action !== expectedAction) {
      this.emitWarning(
        'ACTION_MISMATCH',
        `Expected ${expectedAction} but received ${action} for encounter ${this.active.encounter.id}`
      )
      return false
    }

    this.active.actionIndex += 1

    this.emitProgress()

    if (this.active.actionIndex >= this.active.encounter.actions.length) {
      this.completeActiveEncounter()
    }

    return true
  }

  closeReveal(): void {
    if (this.phase === 'reveal') {
      this.phase = 'hub'
      this.active = null
    }
  }

  getSnapshot(): EncounterSnapshot {
    const activeEncounter = this.active?.encounter
    const nextAction =
      activeEncounter && this.phase === 'encounter'
        ? activeEncounter.actions[this.active?.actionIndex ?? 0] ?? null
        : null

    return {
      phase: this.phase,
      activeEncounterId: activeEncounter?.id ?? null,
      activeCharacterId: activeEncounter?.characterId ?? null,
      nextAction,
      completedCount: this.completedEncounterIds.size,
      totalCount: this.byId.size,
    }
  }

  isEncounterCompleted(encounterId: string): boolean {
    return this.completedEncounterIds.has(encounterId)
  }

  private completeActiveEncounter(): void {
    if (!this.active) {
      return
    }

    const { encounter } = this.active

    this.completedEncounterIds.add(encounter.id)
    this.phase = 'reveal'

    this.onEvent({
      type: 'ENCOUNTER_COMPLETED',
      encounterId: encounter.id,
      revealId: encounter.revealId,
    })

    publishTelemetry({
      type: 'encounter_completed',
      encounterId: encounter.id,
      revealId: encounter.revealId,
    })

    if (encounter.revealId) {
      this.onEvent({ type: 'REVEAL_OPEN', revealId: encounter.revealId })
      publishTelemetry({
        type: 'reveal_opened',
        revealId: encounter.revealId,
      })
    }
  }

  private emitProgress(): void {
    if (!this.active) {
      return
    }

    const completed = this.active.actionIndex
    const total = this.active.encounter.actions.length

    this.onEvent({
      type: 'ACTION_PROGRESS',
      encounterId: this.active.encounter.id,
      completed,
      total,
    })

    publishTelemetry({
      type: 'encounter_progress',
      encounterId: this.active.encounter.id,
      completed,
      total,
    })
  }

  private emitWarning(code: RuntimeWarningCode, detail: string): void {
    this.onEvent({ type: 'RUNTIME_WARNING', code, detail })
    publishTelemetry({
      type: 'runtime_warning',
      code,
      detail,
    })
  }
}
