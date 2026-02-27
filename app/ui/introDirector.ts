export type IntroStageId = 'signal_link' | 'combat_brief' | 'entry_protocol'
export type IntroTransitionPreset = 'glitch_gate'
export type IntroInputMethod = 'auto' | 'manual'

export interface IntroStage {
  id: IntroStageId
  kicker: string
  title: string
  body: string
}

export interface IntroPlayback {
  stageDurationMs: number
  transitionMs: number
}

export type IntroBridgeEvent =
  | { type: 'INTRO_STAGE_ENTERED'; stageId: IntroStageId; index: number }
  | {
      type: 'INTRO_STAGE_COMPLETED'
      stageId: IntroStageId
      index: number
      method: IntroInputMethod
    }
  | {
      type: 'INTRO_TRANSITION_TRIGGERED'
      preset: IntroTransitionPreset
      fromStageId: IntroStageId
      toStageId?: IntroStageId
    }
  | { type: 'INTRO_SEQUENCE_COMPLETED'; skipped: boolean }

export const INTRO_STAGES: readonly IntroStage[] = [
  {
    id: 'signal_link',
    kicker: 'Phase 01',
    title: 'Signal Link Established',
    body: 'Booting world renderer, stage graph, and runtime choreography systems.',
  },
  {
    id: 'combat_brief',
    kicker: 'Phase 02',
    title: 'Combat Briefing',
    body: 'Loading encounter director, interaction grammar, and content routing layers.',
  },
  {
    id: 'entry_protocol',
    kicker: 'Phase 03',
    title: 'Entry Protocol',
    body: 'Finalizing cast assets and preparing entry to title protocol and world map.',
  },
] as const

export function getIntroPlayback(reducedMotion: boolean): IntroPlayback {
  if (reducedMotion) {
    return {
      stageDurationMs: 850,
      transitionMs: 180,
    }
  }

  return {
    stageDurationMs: 1700,
    transitionMs: 650,
  }
}
