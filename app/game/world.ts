import type { ContentRegistry } from '@app/content/registry'
import type { CharacterId, GestureAction } from '@app/content/types'
import { EncounterDirector } from '@app/game/EncounterDirector'
import { CharacterActor } from '@app/game/animationRuntime'
import {
  backgroundLoadBundle,
  listCharacterIds,
  unloadCharacter,
} from '@app/game/assets'
import { ComboAudio } from '@app/game/audio'
import { GestureTracker } from '@app/game/gestures'
import {
  nextWrappedFocusIndex,
  parseKeyboardIntent,
  shouldIgnoreKeyboardTarget,
} from '@app/game/keyboard'
import type {
  BridgeEvent,
  CharacterLayout,
  KeyboardContext,
  KeyboardIntent,
  KeyboardOutcomeReason,
  RuntimeWarningCode,
  WorldSettings,
} from '@app/game/types'
import { publishTelemetry } from '@app/telemetry/events'
import { Application, Container, Graphics, Rectangle } from 'pixi.js'

export interface ComboWorldOptions {
  mountNode: HTMLElement
  registry: ContentRegistry
  settings: WorldSettings
  onEvent: (event: BridgeEvent) => void
}

export interface ComboWorld {
  setSettings(settings: WorldSettings): void
  startEncounter(characterId: CharacterId): void
  submitGesture(action: GestureAction): void
  previewCharacterState(characterId: CharacterId, state: 'idle' | 'engage' | 'signature' | 'react' | 'resolve'): void
  setCharacterIsolation(characterId: CharacterId | null): void
  closeReveal(): void
  destroy(options?: { unloadAssets?: boolean }): Promise<void>
}

const CHARACTER_LABELS: Record<CharacterId, string> = {
  goblin: 'Goblin',
  joanna_darc: 'Joanna',
  night_harpy: 'Night Harpy',
  night_lord: 'Night Lord',
  phantom: 'Phantom',
  skeleton_kinight: 'Skeleton',
}

function layoutCharacters(width: number, height: number): CharacterLayout[] {
  const ids = listCharacterIds()
  const cols = 3
  const rows = Math.ceil(ids.length / cols)
  const horizontalStep = width / (cols + 1)
  const verticalStep = height / (rows + 1)

  return ids.map((id, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols

    return {
      id,
      label: CHARACTER_LABELS[id],
      x: horizontalStep * (col + 1),
      y: verticalStep * (row + 1) + 40,
    }
  })
}

function interactionHint(action: GestureAction): string {
  switch (action) {
    case 'tap':
      return 'Tap'
    case 'hold':
      return 'Hold'
    case 'swipe_left':
      return 'Swipe Left'
    case 'swipe_right':
      return 'Swipe Right'
    case 'swipe_up':
      return 'Swipe Up'
    default:
      return action
  }
}

function emitRuntimeWarning(
  onEvent: (event: BridgeEvent) => void,
  code: RuntimeWarningCode,
  detail: string
): void {
  onEvent({ type: 'RUNTIME_WARNING', code, detail })
  publishTelemetry({
    type: 'runtime_warning',
    code,
    detail,
  })
}

export async function createComboWorld(options: ComboWorldOptions): Promise<ComboWorld> {
  const characterOrder = listCharacterIds()
  const app = new Application()
  await app.init({
    resizeTo: options.mountNode,
    antialias: false,
    autoDensity: true,
    backgroundAlpha: 0,
  })

  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.display = 'block'

  options.mountNode.appendChild(app.canvas)

  const root = new Container()
  root.sortableChildren = true
  app.stage.addChild(root)

  const bg = new Graphics()
  bg.zIndex = 0
  root.addChild(bg)

  const arenaGlow = new Graphics()
  arenaGlow.zIndex = 0
  root.addChild(arenaGlow)

  const actorLayer = new Container()
  actorLayer.zIndex = 2
  actorLayer.sortableChildren = true
  root.addChild(actorLayer)

  const actors = new Map<CharacterId, CharacterActor>()
  const basePositions = new Map<CharacterId, { x: number; y: number }>()
  const nudgeOffsets = new Map<CharacterId, number>()
  const nudgeTimers = new Map<CharacterId, number>()
  const gestureTracker = new GestureTracker()
  const audio = new ComboAudio()
  let settings: WorldSettings = options.settings
  let focusedCharacterId: CharacterId | null = null
  let isolatedCharacterId: CharacterId | null = null
  let hasStartedEncounter = false
  let perfWindowStart = performance.now()
  let perfFrames = 0

  const director = new EncounterDirector(options.registry.listEncounters(), (event) => {
    options.onEvent(event)

    if (event.type === 'ENCOUNTER_STARTED') {
      void audio.playStart()
    }

    if (event.type === 'ACTION_PROGRESS' && event.completed > 0) {
      void audio.playProgress()
    }

    if (event.type === 'ENCOUNTER_COMPLETED') {
      void audio.playSuccess()
    }
  })

  function drawBackground(width: number, height: number): void {
    bg.clear()
    bg.rect(0, 0, width, height)
    bg.fill({ color: 0x0b1020, alpha: 1 })

    arenaGlow.clear()
    arenaGlow.circle(width / 2, height / 2, Math.min(width, height) * 0.42)
    arenaGlow.fill({ color: 0x823c18, alpha: 0.18 })
  }

  function applyLayout(width: number, height: number): void {
    const layouts = layoutCharacters(width, height)

    for (const layout of layouts) {
      const actor = actors.get(layout.id)

      if (!actor) {
        continue
      }

      basePositions.set(layout.id, { x: layout.x, y: layout.y })

      const offset = nudgeOffsets.get(layout.id) ?? 0
      actor.container.x = layout.x + offset
      actor.container.y = layout.y
      actor.container.hitArea = new Rectangle(-70, -140, 140, 180)
    }

    applyCharacterIsolation(width, height)
  }

  function applyCharacterIsolation(width: number, height: number): void {
    if (!isolatedCharacterId) {
      for (const actor of actors.values()) {
        actor.container.visible = true
        actor.container.eventMode = 'static'
        actor.container.scale.set(1)
        actor.setPresentationMode('default')
      }

      return
    }

    const centerX = width / 2
    const centerY = height * 0.5

    for (const [id, actor] of actors) {
      const isSelected = id === isolatedCharacterId
      actor.container.visible = isSelected
      actor.container.eventMode = isSelected ? 'static' : 'none'
      actor.setPresentationMode(isSelected ? 'focused' : 'default')

      if (!isSelected) {
        continue
      }

      const offset = nudgeOffsets.get(id) ?? 0
      const spriteSize = actor.getSpriteSize()

      let scale = 1
      let y = centerY
      let hitWidth = 168
      let hitHeight = 220

      if (spriteSize && spriteSize.width > 0 && spriteSize.height > 0) {
        const maxWidth = width * 0.52
        const maxHeight = height * 0.72
        const targetHeight = Math.min(height * 0.56, 420)
        const uniformScale = targetHeight / spriteSize.height
        const fitScale = Math.min(maxWidth / spriteSize.width, maxHeight / spriteSize.height)
        const tunedScale = Math.min(uniformScale, fitScale)
        const rawScale = tunedScale

        if (rawScale >= 1) {
          scale = Math.max(1, Math.floor(rawScale))
        } else {
          scale = Math.max(0.05, rawScale)
        }

        const scaledHeight = spriteSize.height * scale
        y = Math.min(height - 16, Math.max(scaledHeight + 8, centerY + scaledHeight / 2))
        hitWidth = Math.max(120, spriteSize.width * 0.78)
        hitHeight = Math.max(170, spriteSize.height * 1.08)
      }

      actor.container.scale.set(scale)
      basePositions.set(id, { x: centerX, y })
      actor.container.x = centerX + offset
      actor.container.y = y
      actor.container.hitArea = new Rectangle(-hitWidth / 2, -hitHeight, hitWidth, hitHeight)
    }
  }

  async function playCharacterState(characterId: CharacterId, state: 'idle' | 'engage' | 'signature' | 'react' | 'resolve'): Promise<void> {
    const actor = actors.get(characterId)

    if (!actor) {
      return
    }

    await actor.playState(state)

    if (isolatedCharacterId === characterId) {
      applyCharacterIsolation(app.screen.width, app.screen.height)
    }
  }

  function focusCharacter(characterId: CharacterId): void {
    focusedCharacterId = characterId

    for (const [id, actor] of actors) {
      actor.setFocused(id === characterId)
    }

    options.onEvent({ type: 'CHARACTER_FOCUSED', characterId })
  }

  function ensureFocus(): CharacterId | null {
    if (focusedCharacterId && actors.has(focusedCharacterId)) {
      return focusedCharacterId
    }

    const fallbackId = characterOrder[0] ?? null

    if (!fallbackId) {
      return null
    }

    focusCharacter(fallbackId)
    return fallbackId
  }

  function clearNudgeTimer(characterId: CharacterId): void {
    const timer = nudgeTimers.get(characterId)

    if (timer === undefined) {
      return
    }

    window.clearTimeout(timer)
    nudgeTimers.delete(characterId)
  }

  function playFocusNudge(direction: 'left' | 'right'): void {
    const targetId = ensureFocus()

    if (!targetId) {
      return
    }

    const actor = actors.get(targetId)
    const base = basePositions.get(targetId)

    if (!actor || !base) {
      return
    }

    clearNudgeTimer(targetId)

    const offset = direction === 'left' ? -18 : 18
    nudgeOffsets.set(targetId, offset)
    actor.container.x = base.x + offset

    const settleMs = settings.reducedMotion ? 40 : 120

    const timer = window.setTimeout(() => {
      const latestActor = actors.get(targetId)
      const latestBase = basePositions.get(targetId)

      if (!latestActor || !latestBase) {
        return
      }

      nudgeOffsets.set(targetId, 0)
      latestActor.container.x = latestBase.x
      nudgeTimers.delete(targetId)
    }, settleMs)

    nudgeTimers.set(targetId, timer)
  }

  function moveFocus(delta: -1 | 1): void {
    if (!characterOrder.length) {
      return
    }

    const hadValidFocus = focusedCharacterId !== null && actors.has(focusedCharacterId)
    const currentId = ensureFocus()

    if (!currentId) {
      return
    }

    if (!hadValidFocus) {
      return
    }

    const currentIndex = characterOrder.indexOf(currentId)

    if (currentIndex === -1) {
      focusCharacter(characterOrder[0])
      return
    }

    const nextIndex = nextWrappedFocusIndex(currentIndex, characterOrder.length, delta)
    focusCharacter(characterOrder[nextIndex])
    playFocusNudge(delta < 0 ? 'left' : 'right')
  }

  function syncSettings(nextSettings: WorldSettings): void {
    settings = nextSettings
    audio.setMuted(nextSettings.mute)

    app.canvas.style.filter = nextSettings.highContrast
      ? 'contrast(1.2) saturate(0.8)'
      : 'none'

    options.onEvent({
      type: 'SETTINGS_SYNC',
      mute: nextSettings.mute,
      reducedMotion: nextSettings.reducedMotion,
      highContrast: nextSettings.highContrast,
    })
  }

  function handleGesture(action: GestureAction): void {
    const snapshot = director.getSnapshot()

    if (snapshot.phase !== 'encounter') {
      return
    }

    const accepted = director.submitAction(action)

    if (!accepted || !snapshot.activeCharacterId) {
      return
    }

    const activeActor = snapshot.activeCharacterId

    void playCharacterState(activeActor, 'signature').then(async () => {
      if (director.getSnapshot().phase === 'encounter') {
        await playCharacterState(activeActor, 'engage')
      }
    })

    const afterSubmit = director.getSnapshot()

    if (afterSubmit.phase === 'reveal' && afterSubmit.activeCharacterId) {
      void playCharacterState(afterSubmit.activeCharacterId, 'resolve').then(async () => {
        if (!settings.reducedMotion) {
          await new Promise((resolve) => window.setTimeout(resolve, 280))
        }

        await playCharacterState(afterSubmit.activeCharacterId as CharacterId, 'idle')
      })
    }
  }

  function startEncounter(characterId: CharacterId): void {
    focusCharacter(characterId)

    const started = director.startForCharacter(characterId)

    if (!started) {
      return
    }

    hasStartedEncounter = true

    void playCharacterState(characterId, 'engage')
    void backgroundLoadBundle(characterId, 'signature')

    const snapshot = director.getSnapshot()

    if (snapshot.nextAction) {
      emitRuntimeWarning(
        options.onEvent,
        'NEXT_ACTION_HINT',
        `Expected interaction: ${interactionHint(snapshot.nextAction)}`
      )
    }
  }

  function keyboardContext(): KeyboardContext {
    const phase = director.getSnapshot().phase

    if (phase === 'encounter') {
      return 'encounter'
    }

    if (phase === 'reveal') {
      return 'reveal'
    }

    return hasStartedEncounter ? 'hub' : 'intro'
  }

  function emitKeyboardOutcome(
    event: KeyboardEvent,
    context: KeyboardContext,
    intent: KeyboardIntent | null,
    handled: boolean,
    reason?: KeyboardOutcomeReason
  ): void {
    const outcome = {
      key: event.key,
      context,
      intent,
      handled,
      reason,
    }

    options.onEvent({ type: 'KEYBOARD_COMMAND', outcome })
    publishTelemetry({
      type: 'keyboard_outcome',
      key: event.key,
      context,
      intent: intent ?? undefined,
      handled,
      reason,
    })
  }

  function dispatchKeyboardIntent(
    intent: KeyboardIntent,
    context: KeyboardContext
  ): { handled: boolean; reason?: KeyboardOutcomeReason } {
    if (intent === 'move_left') {
      if (context === 'encounter') {
        playFocusNudge('left')
        return { handled: true }
      }

      if (context === 'intro' || context === 'hub') {
        moveFocus(-1)
        return { handled: true }
      }

      return { handled: false, reason: 'unsupported_context' }
    }

    if (intent === 'move_right') {
      if (context === 'encounter') {
        playFocusNudge('right')
        return { handled: true }
      }

      if (context === 'intro' || context === 'hub') {
        moveFocus(1)
        return { handled: true }
      }

      return { handled: false, reason: 'unsupported_context' }
    }

    if (intent === 'attack') {
      if (context !== 'intro' && context !== 'hub') {
        return { handled: false, reason: 'unsupported_context' }
      }

      const targetId = ensureFocus()

      if (!targetId) {
        return { handled: false, reason: 'missing_focus' }
      }

      startEncounter(targetId)
      return { handled: true }
    }

    if (context !== 'encounter') {
      return { handled: false, reason: 'ignored_phase' }
    }

    if (intent === 'gesture_tap') {
      handleGesture('tap')
      return { handled: true }
    }

    if (intent === 'gesture_hold') {
      handleGesture('hold')
      return { handled: true }
    }

    if (intent === 'gesture_swipe_left') {
      handleGesture('swipe_left')
      return { handled: true }
    }

    if (intent === 'gesture_swipe_right') {
      handleGesture('swipe_right')
      return { handled: true }
    }

    if (intent === 'gesture_swipe_up') {
      handleGesture('swipe_up')
      return { handled: true }
    }

    return { handled: false, reason: 'unsupported_context' }
  }

  const onPointerDown = (event: PointerEvent): void => {
    void audio.ensureReady()
    gestureTracker.begin({ x: event.clientX, y: event.clientY }, event.timeStamp)
  }

  const onPointerMove = (event: PointerEvent): void => {
    gestureTracker.move({ x: event.clientX, y: event.clientY })
  }

  const onPointerUp = (event: PointerEvent): void => {
    const snapshot = director.getSnapshot()
    const expectedAction = snapshot.phase === 'encounter' ? snapshot.nextAction : null

    const gesture = gestureTracker.end(
      { x: event.clientX, y: event.clientY },
      event.timeStamp,
      expectedAction
    )

    publishTelemetry({
      type: 'gesture_outcome',
      status: gesture.status,
      action: gesture.action ?? undefined,
      expectedAction: gesture.expectedAction ?? undefined,
      durationMs: gesture.meta.durationMs,
      deltaX: gesture.meta.deltaX,
      deltaY: gesture.meta.deltaY,
    })

    if (gesture.status === 'accepted' && gesture.action) {
      handleGesture(gesture.action)
      return
    }

    if (gesture.status === 'mismatch') {
      emitRuntimeWarning(
        options.onEvent,
        'GESTURE_MISMATCH',
        `Gesture mismatch. expected=${gesture.expectedAction} received=${gesture.action}`
      )
      return
    }

    if (gesture.status === 'scroll_conflict') {
      emitRuntimeWarning(
        options.onEvent,
        'GESTURE_SCROLL_CONFLICT',
        'Gesture cancelled due to likely scroll conflict.'
      )
      return
    }

    if (gesture.status === 'cancelled') {
      emitRuntimeWarning(
        options.onEvent,
        'GESTURE_CANCELLED',
        'Gesture cancelled before completion.'
      )
    }
  }

  const onPointerCancel = (): void => {
    const gesture = gestureTracker.cancel()

    publishTelemetry({
      type: 'gesture_outcome',
      status: gesture.status,
      durationMs: gesture.meta.durationMs,
      deltaX: gesture.meta.deltaX,
      deltaY: gesture.meta.deltaY,
    })
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    const context = keyboardContext()

    if (shouldIgnoreKeyboardTarget(event.target)) {
      emitKeyboardOutcome(event, context, null, false, 'typing_target')
      return
    }

    const intent = parseKeyboardIntent(event.key, context, event.target)

    if (!intent) {
      emitKeyboardOutcome(event, context, null, false, 'unmapped')
      return
    }

    event.preventDefault()

    const result = dispatchKeyboardIntent(intent, context)
    emitKeyboardOutcome(event, context, intent, result.handled, result.reason)
  }

  app.canvas.addEventListener('pointerdown', onPointerDown)
  app.canvas.addEventListener('pointermove', onPointerMove)
  app.canvas.addEventListener('pointerup', onPointerUp)
  app.canvas.addEventListener('pointercancel', onPointerCancel)
  window.addEventListener('keydown', onKeyDown)

  const onTick = (): void => {
    perfFrames += 1
    const now = performance.now()
    const sampleMs = now - perfWindowStart

    if (sampleMs < 1000) {
      return
    }

    const fps = (perfFrames * 1000) / sampleMs
    const frameTimeMs = fps > 0 ? 1000 / fps : 0
    const sample = {
      fps,
      frameTimeMs,
      sampleMs,
    }

    options.onEvent({ type: 'PERF_SAMPLE', sample })
    publishTelemetry({
      type: 'perf_sample',
      fps,
      frameTimeMs,
      sampleMs,
    })

    perfWindowStart = now
    perfFrames = 0
  }

  app.ticker.add(onTick)

  const layouts = layoutCharacters(app.screen.width, app.screen.height)

  for (const layout of layouts) {
    const actor = new CharacterActor(layout.id, layout.label)
    actor.container.x = layout.x
    actor.container.y = layout.y
    actor.container.hitArea = new Rectangle(-70, -140, 140, 180)
    actor.container.on('pointertap', () => {
      focusCharacter(layout.id)

      const snapshot = director.getSnapshot()

      if (snapshot.phase === 'hub') {
        startEncounter(layout.id)
      }
    })

    actorLayer.addChild(actor.container)
    actors.set(layout.id, actor)
  }

  await Promise.all(
    [...actors.entries()].map(async ([characterId, actor]) => {
      try {
        await actor.initialize()
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Unknown actor initialization error'
        emitRuntimeWarning(
          options.onEvent,
          'ASSET_CLIP_MISSING',
          `Failed to initialize ${characterId}: ${detail}`
        )
      }
    })
  )

  drawBackground(app.screen.width, app.screen.height)
  applyLayout(app.screen.width, app.screen.height)

  const onResize = (width: number, height: number): void => {
    drawBackground(width, height)
    applyLayout(width, height)
  }

  app.renderer.on('resize', onResize)

  syncSettings(settings)
  options.onEvent({ type: 'WORLD_READY' })
  ensureFocus()

  return {
    setSettings(nextSettings: WorldSettings): void {
      syncSettings(nextSettings)
    },

    startEncounter,

    submitGesture(action: GestureAction): void {
      handleGesture(action)
    },

    previewCharacterState(characterId: CharacterId, state: 'idle' | 'engage' | 'signature' | 'react' | 'resolve'): void {
      focusCharacter(characterId)
      void playCharacterState(characterId, state)
    },

    setCharacterIsolation(characterId: CharacterId | null): void {
      isolatedCharacterId = characterId

      if (characterId) {
        focusCharacter(characterId)
      }

      applyLayout(app.screen.width, app.screen.height)
    },

    closeReveal(): void {
      director.closeReveal()

      if (focusedCharacterId) {
        void playCharacterState(focusedCharacterId, 'idle')
      }
    },

    async destroy({ unloadAssets = true }: { unloadAssets?: boolean } = {}): Promise<void> {
      app.canvas.removeEventListener('pointerdown', onPointerDown)
      app.canvas.removeEventListener('pointermove', onPointerMove)
      app.canvas.removeEventListener('pointerup', onPointerUp)
      app.canvas.removeEventListener('pointercancel', onPointerCancel)
      window.removeEventListener('keydown', onKeyDown)
      app.renderer.off('resize', onResize)
      app.ticker.remove(onTick)

      for (const timer of nudgeTimers.values()) {
        window.clearTimeout(timer)
      }

      nudgeTimers.clear()
      nudgeOffsets.clear()
      basePositions.clear()

      for (const actor of actors.values()) {
        actor.destroy()
      }

      if (unloadAssets) {
        await Promise.all(listCharacterIds().map((characterId) => unloadCharacter(characterId)))
      }

      actors.clear()
      audio.destroy()

      app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false })
    },
  }
}
