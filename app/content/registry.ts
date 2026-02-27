import type {
  CharacterId,
  ContentPackV1,
  EncounterBlueprint,
  RevealCard,
} from '@app/content/types'

function normalizePack(pack: ContentPackV1): ContentPackV1 {
  return {
    ...pack,
    encounters: [...pack.encounters],
    reveals: [...pack.reveals],
  }
}

export class ContentRegistry {
  private packs: ContentPackV1[] = []
  private readonly encounterIds = new Set<string>()
  private readonly encounterCharacters = new Set<CharacterId>()

  register(pack: ContentPackV1): void {
    if (pack.schemaVersion !== '1') {
      console.warn(
        `[combocv content] CONTENT_UNSUPPORTED_SCHEMA: ignoring pack ${pack.id}, schema=${pack.schemaVersion}`
      )
      return
    }

    if (this.packs.some((candidate) => candidate.id === pack.id)) {
      console.warn(
        `[combocv content] CONTENT_DUPLICATE_PACK: ignoring duplicate pack id ${pack.id}`
      )
      return
    }

    const seenIdsInPack = new Set<string>()
    const seenCharactersInPack = new Set<CharacterId>()
    const encounters: EncounterBlueprint[] = []

    for (const encounter of pack.encounters) {
      if (seenIdsInPack.has(encounter.id) || this.encounterIds.has(encounter.id)) {
        console.warn(
          `[combocv content] CONTENT_DUPLICATE_ENCOUNTER_ID: ignoring encounter ${encounter.id} from pack ${pack.id}`
        )
        continue
      }

      if (
        seenCharactersInPack.has(encounter.characterId) ||
        this.encounterCharacters.has(encounter.characterId)
      ) {
        console.warn(
          `[combocv content] CONTENT_DUPLICATE_CHARACTER_ENCOUNTER: ignoring encounter ${encounter.id} for character ${encounter.characterId}`
        )
        continue
      }

      seenIdsInPack.add(encounter.id)
      seenCharactersInPack.add(encounter.characterId)
      this.encounterIds.add(encounter.id)
      this.encounterCharacters.add(encounter.characterId)
      encounters.push(encounter)
    }

    this.packs.push(
      normalizePack({
        ...pack,
        encounters,
      })
    )
  }

  listPacks(): ContentPackV1[] {
    return [...this.packs]
  }

  listEncounters(): EncounterBlueprint[] {
    return this.packs.flatMap((pack) => pack.encounters)
  }

  getReveal(id: string): RevealCard | null {
    for (const pack of this.packs) {
      const reveal = pack.reveals.find((entry) => entry.id === id)
      if (reveal) {
        return reveal
      }
    }

    return null
  }
}
