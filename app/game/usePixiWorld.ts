import type { ContentRegistry } from '@app/content/registry'
import { createComboWorld, type ComboWorld } from '@app/game/world'
import type { CharacterId, GestureAction } from '@app/content/types'
import type { AnimationState, BridgeEvent, WorldSettings } from '@app/game/types'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

interface UsePixiWorldOptions {
  containerRef: RefObject<HTMLDivElement | null>
  registry: ContentRegistry
  settings: WorldSettings
  onEvent: (event: BridgeEvent) => void
}

interface UsePixiWorldResult {
  ready: boolean
  startEncounter: (characterId: CharacterId) => void
  submitGesture: (action: GestureAction) => void
  previewCharacterState: (characterId: CharacterId, state: AnimationState) => void
  setCharacterIsolation: (characterId: CharacterId | null) => void
  closeReveal: () => void
}

export function usePixiWorld({
  containerRef,
  registry,
  settings,
  onEvent,
}: UsePixiWorldOptions): UsePixiWorldResult {
  const worldRef = useRef<ComboWorld | null>(null)
  const onEventRef = useRef(onEvent)
  const settingsRef = useRef(settings)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    const mountNode = containerRef.current

    if (!mountNode) {
      return
    }

    let cancelled = false

    void createComboWorld({
      mountNode,
      registry,
      settings: settingsRef.current,
      onEvent: (event) => onEventRef.current(event),
    })
      .then((world) => {
        if (cancelled) {
          // StrictMode can create a stale world instance while a newer one is mounting.
          // Avoid unloading shared textures from the active instance.
          void world.destroy({ unloadAssets: false })
          return
        }

        worldRef.current = world
        setReady(true)
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        const detail =
          error instanceof Error ? error.message : 'Unknown world initialization error'

        onEventRef.current({
          type: 'WORLD_FATAL',
          code: 'WORLD_INIT_FAILED',
          detail,
        })
      })

    return () => {
      cancelled = true
      setReady(false)

      if (worldRef.current) {
        void worldRef.current.destroy()
        worldRef.current = null
      }
    }
  }, [containerRef, registry])

  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.setSettings(settings)
    }
  }, [settings])

  const startEncounter = useCallback((characterId: CharacterId) => {
    worldRef.current?.startEncounter(characterId)
  }, [])

  const submitGesture = useCallback((action: GestureAction) => {
    worldRef.current?.submitGesture(action)
  }, [])

  const previewCharacterState = useCallback((characterId: CharacterId, state: AnimationState) => {
    worldRef.current?.previewCharacterState(characterId, state)
  }, [])

  const setCharacterIsolation = useCallback((characterId: CharacterId | null) => {
    worldRef.current?.setCharacterIsolation(characterId)
  }, [])

  const closeReveal = useCallback(() => {
    worldRef.current?.closeReveal()
  }, [])

  return {
    ready,
    startEncounter,
    submitGesture,
    previewCharacterState,
    setCharacterIsolation,
    closeReveal,
  }
}
