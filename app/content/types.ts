export type CharacterId =
  | 'goblin'
  | 'joanna_darc'
  | 'night_harpy'
  | 'night_lord'
  | 'phantom'
  | 'skeleton_kinight'

export type GestureAction =
  | 'tap'
  | 'hold'
  | 'swipe_left'
  | 'swipe_right'
  | 'swipe_up'

export interface EncounterBlueprint {
  id: string
  characterId: CharacterId
  title: string
  actions: GestureAction[]
  revealId?: string
}

export interface RevealCard {
  id: string
  title: string
  body: string
  cta?: { label: string; href: string }
}

export interface ContentPackV1 {
  schemaVersion: '1'
  id: string
  name: string
  encounters: EncounterBlueprint[]
  reveals: RevealCard[]
}
