import type { CharacterId, GestureAction, RevealCard } from '@app/content/types'
import { submitContact } from '@app/lib/contact'
import {
  INTRO_STAGES,
  getIntroPlayback,
  type IntroBridgeEvent,
} from '@app/ui/introDirector'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

interface OverlayRootProps {
  ready: boolean
  completedCount: number
  totalCount: number
  worldState: 'intro' | 'hub' | 'encounter' | 'reveal'
  focusedCharacter: CharacterId | null
  activeEncounterTitle: string | null
  nextAction: GestureAction | null
  reveal: RevealCard | null
  settings: {
    mute: boolean
    reducedMotion: boolean
    highContrast: boolean
  }
  onToggleSetting: (key: 'mute' | 'reducedMotion' | 'highContrast') => void
  onStartEncounter: (characterId: CharacterId) => void
  onOpenInteractionLab: () => void
  onCloseReveal: () => void
  onIntroEvent: (event: IntroBridgeEvent) => void
}

type Panel = 'none' | 'about' | 'process' | 'contact'

const CHARACTER_OPTIONS: Array<{ id: CharacterId; label: string }> = [
  { id: 'goblin', label: 'Goblin' },
  { id: 'joanna_darc', label: 'Joanna' },
  { id: 'night_harpy', label: 'Night Harpy' },
  { id: 'night_lord', label: 'Night Lord' },
  { id: 'phantom', label: 'Phantom' },
  { id: 'skeleton_kinight', label: 'Skeleton' },
]

function actionLabel(action: GestureAction | null): string {
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
      return 'Select a character to begin'
  }
}

function renderControlRows(worldState: OverlayRootProps['worldState']): Array<{
  keys: string[]
  description: string
}> {
  if (worldState === 'encounter') {
    return [
      { keys: ['J'], description: 'Attack (tap)' },
      { keys: ['←', '→'], description: 'Swipe actions' },
      { keys: ['A', 'D'], description: 'Movement nudge' },
      { keys: ['Space', 'Enter'], description: 'Tap shortcut' },
      { keys: ['Shift'], description: 'Hold shortcut' },
      { keys: ['↑'], description: 'Swipe up shortcut' },
    ]
  }

  return [
    { keys: ['←', '→', 'A', 'D'], description: 'Move fighter focus' },
    { keys: ['J'], description: 'Start attack / enter trial' },
  ]
}

export default function OverlayRoot(props: OverlayRootProps) {
  const {
    settings,
    onCloseReveal,
    onIntroEvent,
    onOpenInteractionLab,
    onStartEncounter,
    onToggleSetting,
  } = props

  const [panel, setPanel] = useState<Panel>('none')
  const [contactStatus, setContactStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [introStep, setIntroStep] = useState(0)
  const [introProgress, setIntroProgress] = useState(0)
  const [introTransitioning, setIntroTransitioning] = useState(false)
  const [introLanding, setIntroLanding] = useState<'start' | 'map'>('start')

  const introRafRef = useRef<number | null>(null)
  const transitionTimerRef = useRef<number | null>(null)

  const playback = useMemo(() => getIntroPlayback(settings.reducedMotion), [settings.reducedMotion])
  const controls = useMemo(() => renderControlRows(props.worldState), [props.worldState])
  const progressRatio = useMemo(() => {
    if (props.totalCount === 0) {
      return 0
    }

    return Math.round((props.completedCount / props.totalCount) * 100)
  }, [props.completedCount, props.totalCount])

  const isIntroState = props.ready && props.worldState === 'intro'
  const showIntroSequence = isIntroState && introStep < INTRO_STAGES.length
  const showStartScreen = isIntroState && !showIntroSequence && introLanding === 'start'
  const showWorldMap = isIntroState && !showIntroSequence && introLanding === 'map'
  const showRuntimeHud = !isIntroState
  const activeIntroStage = showIntroSequence ? INTRO_STAGES[introStep] : null
  const introStageClass = activeIntroStage ? `intro-stage-${activeIntroStage.id.replace('_', '-')}` : ''
  const stageProgressPercent = Math.round(introProgress * 100)
  const overallProgressPercent = Math.round(
    ((introStep + introProgress) / INTRO_STAGES.length) * 100
  )

  const clearIntroRaf = useCallback(() => {
    if (introRafRef.current === null) {
      return
    }

    window.cancelAnimationFrame(introRafRef.current)
    introRafRef.current = null
  }, [])

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current === null) {
      return
    }

    window.clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = null
  }, [])

  const completeIntroSequence = useCallback(
    (skipped: boolean) => {
      clearIntroRaf()
      clearTransitionTimer()
      setIntroTransitioning(false)
      setIntroProgress(0)
      setIntroStep(INTRO_STAGES.length)
      onIntroEvent({ type: 'INTRO_SEQUENCE_COMPLETED', skipped })
    },
    [clearIntroRaf, clearTransitionTimer, onIntroEvent]
  )

  useEffect(() => {
    if (!showIntroSequence) {
      return
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      completeIntroSequence(true)
    }

    window.addEventListener('keydown', onKeyDown, true)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [completeIntroSequence, showIntroSequence])

  useEffect(() => {
    if (!showIntroSequence || !activeIntroStage) {
      return
    }

    clearIntroRaf()
    clearTransitionTimer()
    setIntroProgress(0)

    onIntroEvent({
      type: 'INTRO_STAGE_ENTERED',
      stageId: activeIntroStage.id,
      index: introStep,
    })

    const startedAt = performance.now()

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / playback.stageDurationMs)
      setIntroProgress(progress)

      if (progress < 1) {
        introRafRef.current = window.requestAnimationFrame(tick)
        return
      }

      introRafRef.current = null

      onIntroEvent({
        type: 'INTRO_STAGE_COMPLETED',
        stageId: activeIntroStage.id,
        index: introStep,
        method: 'auto',
      })

      const nextStep = introStep + 1

      if (nextStep >= INTRO_STAGES.length) {
        completeIntroSequence(false)
        return
      }

      const nextStage = INTRO_STAGES[nextStep]
      setIntroTransitioning(true)
      onIntroEvent({
        type: 'INTRO_TRANSITION_TRIGGERED',
        preset: 'glitch_gate',
        fromStageId: activeIntroStage.id,
        toStageId: nextStage.id,
      })

      clearTransitionTimer()
      transitionTimerRef.current = window.setTimeout(() => {
        transitionTimerRef.current = null
        setIntroTransitioning(false)
        setIntroStep(nextStep)
      }, playback.transitionMs)
    }

    introRafRef.current = window.requestAnimationFrame(tick)

    return () => {
      clearIntroRaf()
      clearTransitionTimer()
    }
  }, [
    activeIntroStage,
    clearIntroRaf,
    clearTransitionTimer,
    completeIntroSequence,
    introStep,
    onIntroEvent,
    playback.stageDurationMs,
    playback.transitionMs,
    showIntroSequence,
  ])

  useEffect(() => {
    if (showIntroSequence || !isIntroState) {
      setIntroLanding('start')
    }
  }, [isIntroState, showIntroSequence])

  useEffect(() => {
    return () => {
      clearIntroRaf()
      clearTransitionTimer()
    }
  }, [clearIntroRaf, clearTransitionTimer])

  async function onSubmitContact(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    if (submitting) {
      return
    }

    setSubmitting(true)

    const form = new FormData(event.currentTarget)

    const result = await submitContact({
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      message: String(form.get('message') ?? ''),
      company: String(form.get('company') ?? ''),
    })

    setContactStatus(result.message)
    setSubmitting(false)

    if (result.ok) {
      event.currentTarget.reset()
    }
  }

  return (
    <div className={`overlay-root pointer-events-none ${isIntroState ? 'overlay-intro' : ''}`}>
      {showRuntimeHud && (
        <header className="hud-panel pointer-events-auto">
          <div>
            <p className="hud-kicker">ComboCV</p>
            <h1 className="hud-title">Fightfolio Runtime</h1>
          </div>

          <div className="hud-progress-wrap">
            <div className="hud-progress-text">
              <span>
                Completion {props.completedCount}/{props.totalCount}
              </span>
              <span>{progressRatio}%</span>
            </div>
            <div className="hud-progress-track">
              <div className="hud-progress-fill" style={{ width: `${progressRatio}%` }} />
            </div>
          </div>
        </header>
      )}

      {showRuntimeHud && (
        <aside className="control-panel pointer-events-auto">
          <section>
            <h2>Run State</h2>
            <p>{props.ready ? 'World online' : 'Loading world...'}</p>
            <p>
              {props.activeEncounterTitle
                ? `Encounter: ${props.activeEncounterTitle}`
                : 'Pick any character to start'}
            </p>
            <p>Next input: {actionLabel(props.nextAction)}</p>
          </section>

          <section>
            <h2>Quick Actions</h2>
            <div className="button-grid">
              {CHARACTER_OPTIONS.map((entry) => (
                <button
                  key={entry.id}
                  className={props.focusedCharacter === entry.id ? 'active' : ''}
                  onClick={() => onStartEncounter(entry.id)}
                  type="button"
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>Accessibility</h2>
            <div className="toggle-list">
              <button type="button" onClick={() => onToggleSetting('mute')}>
                {settings.mute ? 'Unmute' : 'Mute'}
              </button>
              <button type="button" onClick={() => onToggleSetting('reducedMotion')}>
                {settings.reducedMotion ? 'Disable Reduced Motion' : 'Enable Reduced Motion'}
              </button>
              <button type="button" onClick={() => onToggleSetting('highContrast')}>
                {settings.highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
              </button>
            </div>
          </section>

          <section>
            <h2>Controls</h2>
            <ul className="controls-legend">
              {controls.map((entry) => (
                <li key={`${entry.keys.join('-')}-${entry.description}`}>
                  <span className="legend-keys">
                    {entry.keys.map((keyLabel) => (
                      <kbd key={keyLabel}>{keyLabel}</kbd>
                    ))}
                  </span>
                  <span>{entry.description}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Panels</h2>
            <div className="toggle-list">
              <button type="button" onClick={() => setPanel(panel === 'about' ? 'none' : 'about')}>
                About
              </button>
              <button
                type="button"
                onClick={() => setPanel(panel === 'process' ? 'none' : 'process')}
              >
                Process
              </button>
              <button
                type="button"
                onClick={() => setPanel(panel === 'contact' ? 'none' : 'contact')}
              >
                Contact
              </button>
            </div>
          </section>
        </aside>
      )}

      {showIntroSequence && activeIntroStage && (
        <section
          className={[
            'intro-sequence',
            'pointer-events-auto',
            introStageClass,
            introTransitioning ? 'is-transitioning' : '',
            settings.reducedMotion ? 'reduce-motion' : '',
          ]
            .join(' ')
            .trim()}
          aria-label="Intro sequence"
        >
          <div className="intro-sequence-grid-glow" aria-hidden="true" />
          <div className="intro-sequence-frame">
            <p className="hud-kicker">{activeIntroStage.kicker}</p>
            <h2 key={activeIntroStage.id} className="intro-sequence-title">
              {activeIntroStage.title}
            </h2>
            <p key={`${activeIntroStage.id}-body`} className="intro-sequence-body">
              {activeIntroStage.body}
            </p>
            <p className="intro-sequence-instruction">
              Initializing scene systems and choreography timeline...
            </p>

            <div className="intro-sequence-track" aria-label="Intro stage progress">
              {INTRO_STAGES.map((stage, index) => (
                <span
                  key={stage.id}
                  className={[
                    'intro-sequence-dot',
                    index === introStep ? 'active' : '',
                    index < introStep ? 'done' : '',
                  ]
                    .join(' ')
                    .trim()}
                />
              ))}
            </div>

            <div className="intro-loading-stack">
              <div className="intro-loading-track">
                <span className="intro-loading-fill" style={{ width: `${stageProgressPercent}%` }} />
              </div>
              <div className="intro-loading-meta">
                <span>Stage Load {stageProgressPercent}%</span>
                <span>Total {overallProgressPercent}%</span>
              </div>
            </div>

            <p className="intro-sequence-hint">Auto-loading cinematic sequence...</p>
          </div>
          <div className="intro-sequence-transition-veil" aria-hidden="true" />
        </section>
      )}

      {showStartScreen && (
        <section className="start-screen pointer-events-auto" aria-label="Start screen">
          <div className="start-screen-content">
            <p className="hud-kicker">ComboCV</p>
            <h2 className="start-screen-title">Start Screen</h2>
            <p className="start-screen-subtitle">
              Runtime synchronized. Launch the world map to begin your portfolio run.
            </p>
            <div className="start-screen-actions">
              <button type="button" onClick={() => setIntroLanding('map')}>
                Trigger World Map
              </button>
              <button type="button" onClick={onOpenInteractionLab}>
                Open Interaction Lab
              </button>
            </div>
            <div className="start-screen-toggles">
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
          </div>
        </section>
      )}

      {showWorldMap && (
        <section className="world-map-screen pointer-events-auto" aria-label="World map">
          <div className="world-map-shell">
            <p className="hud-kicker">ComboCV</p>
            <h2 className="fighter-select-title">World Map</h2>
            <p className="fighter-select-subtitle">
              Choose a fighter node to enter portfolio navigation trials.
            </p>
            <div className="world-map-actions">
              <button type="button" onClick={() => setIntroLanding('start')}>
                Back to Start Screen
              </button>
              <button type="button" onClick={onOpenInteractionLab}>
                Open Interaction Lab
              </button>
            </div>
            <div className="fighter-keyboard-callout" role="note" aria-label="Keyboard controls">
              <p>Keyboard ready from load.</p>
              <ul className="controls-legend">
                {controls.map((entry) => (
                  <li key={`intro-${entry.keys.join('-')}-${entry.description}`}>
                    <span className="legend-keys">
                      {entry.keys.map((keyLabel) => (
                        <kbd key={keyLabel}>{keyLabel}</kbd>
                      ))}
                    </span>
                    <span>{entry.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fighter-grid">
              {CHARACTER_OPTIONS.map((entry) => (
                <button
                  key={entry.id}
                  className={`fighter-card ${props.focusedCharacter === entry.id ? 'active' : ''}`}
                  onClick={() => onStartEncounter(entry.id)}
                  type="button"
                >
                  <span>{entry.label}</span>
                  <small>Enter Trial</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {showRuntimeHud && panel !== 'none' && (
        <section className="sheet pointer-events-auto">
          {panel === 'about' && (
            <>
              <h2>About ComboCV</h2>
              <p>
                This portfolio is designed as a playable interface. Each character encounter is a
                reusable content slot that can later be bound to real project narratives.
              </p>
            </>
          )}

          {panel === 'process' && (
            <>
              <h2>Process Journal</h2>
              <p>
                Iteration driven build: assets normalized, interactions structured, encounter loop
                validated, then content plugged in.
              </p>
            </>
          )}

          {panel === 'contact' && (
            <>
              <h2>Contact</h2>
              <form onSubmit={onSubmitContact}>
                <input name="name" placeholder="Name" required />
                <input name="email" type="email" placeholder="Email" required />
                <input name="company" placeholder="Company (optional)" />
                <textarea name="message" placeholder="Message" rows={4} required />
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </form>
              {contactStatus && <p>{contactStatus}</p>}
            </>
          )}
        </section>
      )}

      {props.reveal && (
        <div className="reveal-modal pointer-events-auto" role="dialog" aria-modal="true">
          <h2>{props.reveal.title}</h2>
          <p>{props.reveal.body}</p>

          {props.reveal.cta && (
            <a href={props.reveal.cta.href} target="_blank" rel="noreferrer">
              {props.reveal.cta.label}
            </a>
          )}

          <button type="button" onClick={onCloseReveal}>
            Continue
          </button>
        </div>
      )}

      {!props.ready && (
        <div className="loading-overlay pointer-events-auto">
          <p>Booting ComboCV world...</p>
        </div>
      )}
    </div>
  )
}
