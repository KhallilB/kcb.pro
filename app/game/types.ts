import type { CharacterId } from '@app/content/types'

export type WorldState = 'intro' | 'hub' | 'encounter' | 'reveal'

export type AnimationState = 'idle' | 'engage' | 'signature' | 'react' | 'resolve'

export type KeyboardIntent =
  | 'move_left'
  | 'move_right'
  | 'attack'
  | 'gesture_swipe_left'
  | 'gesture_swipe_right'
  | 'gesture_tap'
  | 'gesture_hold'
  | 'gesture_swipe_up'

export type KeyboardContext = WorldState

export type KeyboardOutcomeReason =
  | 'typing_target'
  | 'unmapped'
  | 'unsupported_context'
  | 'ignored_phase'
  | 'missing_focus'

export interface KeyboardCommandOutcome {
  key: string
  context: KeyboardContext
  intent: KeyboardIntent | null
  handled: boolean
  reason?: KeyboardOutcomeReason
}

export type RuntimeWarningCode =
  | 'ENCOUNTER_MISSING'
  | 'ENCOUNTER_NOT_ACTIVE'
  | 'ACTION_MISMATCH'
  | 'NEXT_ACTION_HINT'
  | 'GESTURE_CANCELLED'
  | 'GESTURE_MISMATCH'
  | 'GESTURE_SCROLL_CONFLICT'
  | 'CONTENT_DUPLICATE_PACK'
  | 'CONTENT_DUPLICATE_ENCOUNTER_ID'
  | 'CONTENT_DUPLICATE_CHARACTER_ENCOUNTER'
  | 'CONTENT_UNSUPPORTED_SCHEMA'
  | 'CONTENT_MISSING_REVEAL'
  | 'ASSET_CLIP_MISSING'
  | 'ASSET_CLIP_COLLISION'

export type WorldFatalCode = 'WORLD_INIT_FAILED' | 'WORLD_RUNTIME_FAILED'

export interface PerfSample {
  fps: number
  frameTimeMs: number
  sampleMs: number
}

export interface WorldSettings {
  mute: boolean
  reducedMotion: boolean
  highContrast: boolean
}

export type BridgeEvent =
  | { type: 'WORLD_READY' }
  | { type: 'CHARACTER_FOCUSED'; characterId: CharacterId }
  | { type: 'ENCOUNTER_STARTED'; encounterId: string }
  | {
      type: 'ACTION_PROGRESS'
      encounterId: string
      completed: number
      total: number
    }
  | {
      type: 'ENCOUNTER_COMPLETED'
      encounterId: string
      revealId?: string
    }
  | { type: 'REVEAL_OPEN'; revealId: string }
  | {
      type: 'SETTINGS_SYNC'
      mute: boolean
      reducedMotion: boolean
      highContrast: boolean
    }
  | { type: 'RUNTIME_WARNING'; code: RuntimeWarningCode; detail: string }
  | { type: 'WORLD_FATAL'; code: WorldFatalCode; detail: string }
  | { type: 'PERF_SAMPLE'; sample: PerfSample }
  | { type: 'KEYBOARD_COMMAND'; outcome: KeyboardCommandOutcome }

export interface CharacterLayout {
  id: CharacterId
  label: string
  x: number
  y: number
}
