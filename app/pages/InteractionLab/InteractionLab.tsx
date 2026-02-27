import type { CharacterId, GestureAction } from '@app/content/types'
import { loadContentRegistry } from '@app/content/loadPacks'
import { usePixiWorld } from '@app/game/usePixiWorld'
import type { AnimationState, BridgeEvent, WorldSettings, WorldState } from '@app/game/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'

const SETTINGS_KEY = 'combocv:v1:settings'
const EVENTS_PAGE_SIZE = 8

interface LabEventRecord {
  id: number
  ts: number
  label: string
  detail: string
}

const CHARACTER_OPTIONS: Array<{ id: CharacterId; label: string }> = [
  { id: 'goblin', label: 'Goblin' },
  { id: 'joanna_darc', label: 'Joanna' },
  { id: 'night_harpy', label: 'Night Harpy' },
  { id: 'night_lord', label: 'Night Lord' },
  { id: 'phantom', label: 'Phantom' },
  { id: 'skeleton_kinight', label: 'Skeleton' },
]

const STATE_OPTIONS: Array<{ id: AnimationState; label: string }> = [
  { id: 'idle', label: 'Idle' },
  { id: 'engage', label: 'Engage' },
  { id: 'signature', label: 'Signature' },
  { id: 'react', label: 'React' },
  { id: 'resolve', label: 'Resolve' },
]

const GESTURE_OPTIONS: Array<{ id: GestureAction; label: string }> = [
  { id: 'tap', label: 'Tap' },
  { id: 'hold', label: 'Hold' },
  { id: 'swipe_left', label: 'Swipe Left' },
  { id: 'swipe_right', label: 'Swipe Right' },
  { id: 'swipe_up', label: 'Swipe Up' },
]

function loadInitialSettings(): WorldSettings {
  const fallback: WorldSettings = {
    mute: false,
    reducedMotion: false,
    highContrast: false,
  }

  const stored = window.localStorage.getItem(SETTINGS_KEY)

  if (!stored) {
    return fallback
  }

  try {
    const parsed = JSON.parse(stored) as Partial<WorldSettings>

    return {
      mute: Boolean(parsed.mute),
      reducedMotion: Boolean(parsed.reducedMotion),
      highContrast: Boolean(parsed.highContrast),
    }
  } catch {
    return fallback
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString()
}

function describeBridgeEvent(event: BridgeEvent): { label: string; detail: string } {
  switch (event.type) {
    case 'WORLD_READY':
      return { label: 'WORLD_READY', detail: 'Pixi runtime initialized and mount complete.' }
    case 'CHARACTER_FOCUSED':
      return { label: 'CHARACTER_FOCUSED', detail: `Focused ${event.characterId}.` }
    case 'ENCOUNTER_STARTED':
      return { label: 'ENCOUNTER_STARTED', detail: `Encounter ${event.encounterId} started.` }
    case 'ACTION_PROGRESS':
      return {
        label: 'ACTION_PROGRESS',
        detail: `${event.encounterId}: ${event.completed}/${event.total} actions complete.`,
      }
    case 'ENCOUNTER_COMPLETED':
      return {
        label: 'ENCOUNTER_COMPLETED',
        detail: `${event.encounterId} complete${event.revealId ? ` -> ${event.revealId}` : ''}.`,
      }
    case 'REVEAL_OPEN':
      return { label: 'REVEAL_OPEN', detail: `Reveal ${event.revealId} opened.` }
    case 'SETTINGS_SYNC':
      return {
        label: 'SETTINGS_SYNC',
        detail: `mute=${event.mute} reducedMotion=${event.reducedMotion} highContrast=${event.highContrast}`,
      }
    case 'RUNTIME_WARNING':
      return { label: `WARNING:${event.code}`, detail: event.detail }
    case 'WORLD_FATAL':
      return { label: `FATAL:${event.code}`, detail: event.detail }
    case 'PERF_SAMPLE':
      return {
        label: 'PERF_SAMPLE',
        detail: `fps=${event.sample.fps.toFixed(1)} frame=${event.sample.frameTimeMs.toFixed(2)}ms`,
      }
    case 'KEYBOARD_COMMAND':
      return {
        label: 'KEYBOARD_COMMAND',
        detail: `${event.outcome.key} -> ${event.outcome.intent ?? 'null'} (${event.outcome.handled ? 'handled' : 'ignored'})`,
      }
    default:
      return { label: 'EVENT', detail: 'Unhandled event type' }
  }
}

function shouldLogEvent(event: BridgeEvent): boolean {
  if (event.type === 'PERF_SAMPLE') {
    return false
  }

  if (event.type === 'SETTINGS_SYNC') {
    return false
  }

  return true
}

function sameSettings(a: WorldSettings, b: WorldSettings): boolean {
  return (
    a.mute === b.mute &&
    a.reducedMotion === b.reducedMotion &&
    a.highContrast === b.highContrast
  )
}

export default function InteractionLab() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const registry = useMemo(() => loadContentRegistry(), [])
  const encounterById = useMemo(
    () => new Map(registry.listEncounters().map((encounter) => [encounter.id, encounter])),
    [registry]
  )

  const [settings, setSettings] = useState<WorldSettings>(() => loadInitialSettings())
  const [worldState, setWorldState] = useState<WorldState>('intro')
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('goblin')
  const [selectedState, setSelectedState] = useState<AnimationState>('idle')
  const [focusedCharacter, setFocusedCharacter] = useState<CharacterId | null>(null)
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null)
  const [nextAction, setNextAction] = useState<GestureAction | null>(null)
  const [events, setEvents] = useState<LabEventRecord[]>([])
  const [eventPage, setEventPage] = useState(1)
  const didInitialPreviewRef = useRef(false)

  const eventIdRef = useRef(1)

  const appendEvent = useCallback((label: string, detail: string) => {
    const nextId = eventIdRef.current
    eventIdRef.current += 1

    setEvents((prev) => [{ id: nextId, ts: Date.now(), label, detail }, ...prev].slice(0, 60))
  }, [])

  const onBridgeEvent = useCallback(
    (event: BridgeEvent) => {
      if (shouldLogEvent(event)) {
        const log = describeBridgeEvent(event)
        appendEvent(log.label, log.detail)
      }

      switch (event.type) {
        case 'WORLD_READY':
          setWorldState('hub')
          break
        case 'CHARACTER_FOCUSED':
          setFocusedCharacter(event.characterId)
          break
        case 'ENCOUNTER_STARTED':
          setWorldState('encounter')
          setActiveEncounterId(event.encounterId)
          break
        case 'ACTION_PROGRESS': {
          setWorldState('encounter')
          const encounter = encounterById.get(event.encounterId)
          const action = encounter?.actions[event.completed] ?? null
          setNextAction(action)
          break
        }
        case 'ENCOUNTER_COMPLETED':
          setWorldState('reveal')
          setNextAction(null)
          break
        case 'SETTINGS_SYNC':
          setSettings((previous) => {
            const next = {
              mute: event.mute,
              reducedMotion: event.reducedMotion,
              highContrast: event.highContrast,
            }

            return sameSettings(previous, next) ? previous : next
          })
          break
        default:
          break
      }
    },
    [appendEvent, encounterById]
  )

  const { ready, startEncounter, submitGesture, previewCharacterState, setCharacterIsolation, closeReveal } =
    usePixiWorld({
      containerRef: mountRef,
      registry,
      settings,
      onEvent: onBridgeEvent,
    })

  useEffect(() => {
    if (!ready || didInitialPreviewRef.current) {
      return
    }

    setCharacterIsolation(selectedCharacter)
    previewCharacterState(selectedCharacter, 'idle')
    didInitialPreviewRef.current = true
  }, [previewCharacterState, ready, selectedCharacter, setCharacterIsolation])

  useEffect(() => {
    if (ready) {
      return
    }

    didInitialPreviewRef.current = false
  }, [ready])

  const onToggleSetting = useCallback((key: 'mute' | 'reducedMotion' | 'highContrast') => {
    setSettings((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      }

      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const onSelectCharacter = useCallback((characterId: CharacterId) => {
    setSelectedCharacter(characterId)
    setSelectedState('idle')

    if (ready) {
      setCharacterIsolation(characterId)
      previewCharacterState(characterId, 'idle')
    }
  }, [previewCharacterState, ready, setCharacterIsolation])

  const onPlayState = useCallback((state: AnimationState) => {
    setSelectedState(state)

    if (ready) {
      previewCharacterState(selectedCharacter, state)
    }
  }, [previewCharacterState, ready, selectedCharacter])

  const totalEventPages = useMemo(
    () => Math.max(1, Math.ceil(events.length / EVENTS_PAGE_SIZE)),
    [events.length]
  )

  useEffect(() => {
    setEventPage((previous) => Math.min(previous, totalEventPages))
  }, [totalEventPages])

  const visibleEvents = useMemo(() => {
    const start = (eventPage - 1) * EVENTS_PAGE_SIZE
    return events.slice(start, start + EVENTS_PAGE_SIZE)
  }, [eventPage, events])

  const exportPayload = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      worldState,
      ready,
      selectedCharacter,
      selectedState,
      focusedCharacter,
      activeEncounterId,
      nextAction,
      settings,
      events,
    }),
    [
      activeEncounterId,
      events,
      focusedCharacter,
      nextAction,
      ready,
      selectedCharacter,
      selectedState,
      settings,
      worldState,
    ]
  )

  const onExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `fightfolio-lab-${selectedCharacter}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [exportPayload, selectedCharacter])

  return (
    <main className="interaction-lab">
      <header className="interaction-lab-header">
        <div>
          <p className="hud-kicker">ComboCV</p>
          <h1>Fightfolio Interaction Lab</h1>
          <p>Select any character and directly test animation states and encounter interactions.</p>
        </div>
        <div className="interaction-lab-actions">
          <Link to="/">Back to Start World</Link>
          <button type="button" onClick={onExportJson}>
            Export JSON
          </button>
        </div>
      </header>

      <section className="fightfolio-workspace">
        <section className="fightfolio-runtime">
          <div className="fightfolio-canvas-shell">
            <div className="fightfolio-canvas" ref={mountRef} />
            {!ready && <p className="fightfolio-canvas-status">Booting Fightfolio runtime...</p>}
          </div>

          <aside className="fightfolio-panel">
            <section>
              <h2>Runtime</h2>
              <p>State: {worldState}</p>
              <p>Focused: {focusedCharacter ?? 'none'}</p>
              <p>Encounter: {activeEncounterId ?? 'none'}</p>
              <p>Next Action: {nextAction ?? 'none'}</p>
            </section>

            <section>
              <h2>Character Select</h2>
              <div className="fightfolio-grid">
                {CHARACTER_OPTIONS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={selectedCharacter === entry.id ? 'active' : ''}
                    onClick={() => onSelectCharacter(entry.id)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2>Animation States</h2>
              <div className="fightfolio-grid">
                {STATE_OPTIONS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={selectedState === entry.id ? 'active' : ''}
                    onClick={() => onPlayState(entry.id)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2>Encounter Controls</h2>
              <div className="fightfolio-grid">
                <button type="button" onClick={() => startEncounter(selectedCharacter)}>
                  Start Encounter
                </button>
                <button type="button" onClick={closeReveal}>
                  Close Reveal / Reset
                </button>
              </div>
            </section>

            <section>
              <h2>Gesture Actions</h2>
              <div className="fightfolio-grid">
                {GESTURE_OPTIONS.map((entry) => (
                  <button key={entry.id} type="button" onClick={() => submitGesture(entry.id)}>
                    {entry.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2>Settings</h2>
              <div className="fightfolio-grid">
                <button type="button" onClick={() => onToggleSetting('mute')}>
                  {settings.mute ? 'Unmute' : 'Mute'}
                </button>
                <button type="button" onClick={() => onToggleSetting('reducedMotion')}>
                  {settings.reducedMotion ? 'Motion: Reduced' : 'Motion: Full'}
                </button>
                <button type="button" onClick={() => onToggleSetting('highContrast')}>
                  {settings.highContrast ? 'Contrast: High' : 'Contrast: Standard'}
                </button>
              </div>
            </section>
          </aside>
        </section>

        <section className="interaction-event-log">
          <h2>Event Console</h2>
          <p>World and interaction events with timestamps.</p>

          <div className="interaction-log-pagination" aria-label="Event log pagination">
            <button
              type="button"
              onClick={() => setEventPage((page) => Math.max(1, page - 1))}
              disabled={eventPage <= 1}
            >
              Previous
            </button>
            <span>
              Page {eventPage} / {totalEventPages}
            </span>
            <button
              type="button"
              onClick={() => setEventPage((page) => Math.min(totalEventPages, page + 1))}
              disabled={eventPage >= totalEventPages}
            >
              Next
            </button>
          </div>

          {events.length === 0 && <p>No events yet.</p>}

          {events.length > 0 && (
            <ul>
              {visibleEvents.map((entry) => (
                <li key={entry.id}>
                  <span>{formatTime(entry.ts)}</span>
                  <span>{entry.label}</span>
                  <span>{entry.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}
