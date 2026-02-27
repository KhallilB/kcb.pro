import { INTRO_STAGES, getIntroPlayback } from '@app/ui/introDirector'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'

export default function Home() {
  const [introStep, setIntroStep] = useState(0)
  const [introTransitioning, setIntroTransitioning] = useState(false)
  const [introExiting, setIntroExiting] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const stageTimerRef = useRef<number | null>(null)
  const transitionTimerRef = useRef<number | null>(null)
  const exitTimerRef = useRef<number | null>(null)

  const playback = useMemo(() => getIntroPlayback(reducedMotion), [reducedMotion])
  const activeStage = INTRO_STAGES[introStep]
  const showIntro = !introComplete && Boolean(activeStage)
  const showStartWorld = introComplete || introExiting

  const clearStageTimer = useCallback(() => {
    if (stageTimerRef.current === null) {
      return
    }

    window.clearTimeout(stageTimerRef.current)
    stageTimerRef.current = null
  }, [])

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current === null) {
      return
    }

    window.clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = null
  }, [])

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current === null) {
      return
    }

    window.clearTimeout(exitTimerRef.current)
    exitTimerRef.current = null
  }, [])

  const completeIntro = useCallback(() => {
    clearStageTimer()
    clearTransitionTimer()
    clearExitTimer()
    setIntroTransitioning(false)
    setIntroExiting(true)

    const exitDurationMs = reducedMotion ? 180 : 560
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null
      setIntroExiting(false)
      setIntroComplete(true)
    }, exitDurationMs)
  }, [clearExitTimer, clearStageTimer, clearTransitionTimer, reducedMotion])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    setReducedMotion(media.matches)

    const onChange = (event: MediaQueryListEvent): void => {
      setReducedMotion(event.matches)
    }

    media.addEventListener('change', onChange)

    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [])

  useEffect(() => {
    if (introComplete || introExiting || !activeStage) {
      return
    }

    clearStageTimer()
    clearTransitionTimer()

    stageTimerRef.current = window.setTimeout(() => {
      stageTimerRef.current = null
      const nextStep = introStep + 1

      if (nextStep >= INTRO_STAGES.length) {
        completeIntro()
        return
      }

      setIntroTransitioning(true)
      transitionTimerRef.current = window.setTimeout(() => {
        transitionTimerRef.current = null
        setIntroTransitioning(false)
        setIntroStep(nextStep)
      }, playback.transitionMs)
    }, playback.stageDurationMs)

    return () => {
      clearStageTimer()
      clearTransitionTimer()
    }
  }, [
    activeStage,
    clearStageTimer,
    clearTransitionTimer,
    completeIntro,
    introComplete,
    introExiting,
    introStep,
    playback.stageDurationMs,
    playback.transitionMs,
  ])

  useEffect(() => {
    if (introComplete || introExiting) {
      return
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      completeIntro()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [completeIntro, introComplete, introExiting])

  useEffect(() => {
    return () => {
      clearStageTimer()
      clearTransitionTimer()
      clearExitTimer()
    }
  }, [clearExitTimer, clearStageTimer, clearTransitionTimer])

  return (
    <main className="home-flow-shell">
      <section
        className={['start-world-shell', showStartWorld ? 'is-visible' : ''].join(' ').trim()}
        aria-hidden={!showStartWorld}
      >
        <div className="start-world-content">
          <p className="hud-kicker">ComboCV</p>
          <h1>Portfolio World (Blank Foundation)</h1>
          <p>
            The portfolio world map is intentionally blank for now while the interaction systems are
            tuned in Fightfolio.
          </p>
          <div className="start-world-actions">
            <Link to="/interaction-lab">Open Fightfolio Interaction Lab</Link>
          </div>
        </div>
      </section>

      {showIntro && activeStage ? (
        <section
          className={[
            'game-intro',
            `game-intro-${activeStage.id.replace('_', '-')}`,
            introTransitioning ? 'is-transitioning' : '',
            introExiting ? 'is-exiting' : '',
            reducedMotion ? 'reduce-motion' : '',
          ]
            .join(' ')
            .trim()}
          aria-label="Game intro loading sequence"
        >
          <div className="game-intro-orb" aria-hidden="true" />
          <div className="game-intro-scanline" aria-hidden="true" />
          <div className="game-intro-content">
            <p className="hud-kicker">ComboCV Runtime Boot</p>
            <div key={activeStage.id} className="game-intro-copy">
              <p className="game-intro-kicker">{activeStage.kicker}</p>
              <h1>{activeStage.title}</h1>
              <p>{activeStage.body}</p>
            </div>
          </div>
          <div className="game-intro-transition-flash" aria-hidden="true" />
        </section>
      ) : null}
    </main>
  )
}
