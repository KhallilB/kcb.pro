type BaseEvent =
  | {
      type: 'encounter_started'
      encounterId: string
      characterId: string
    }
  | {
      type: 'encounter_progress'
      encounterId: string
      completed: number
      total: number
    }
  | {
      type: 'encounter_completed'
      encounterId: string
      revealId?: string
    }
  | {
      type: 'reveal_opened'
      revealId: string
    }
  | {
      type: 'setting_updated'
      key: 'mute' | 'reducedMotion' | 'highContrast'
      value: boolean
    }
  | {
      type: 'runtime_warning'
      code: string
      detail: string
    }
  | {
      type: 'gesture_outcome'
      status: 'accepted' | 'cancelled' | 'mismatch' | 'scroll_conflict'
      action?: string
      expectedAction?: string
      durationMs: number
      deltaX: number
      deltaY: number
    }
  | {
      type: 'perf_sample'
      fps: number
      frameTimeMs: number
      sampleMs: number
    }
  | {
      type: 'keyboard_outcome'
      key: string
      context: 'intro' | 'hub' | 'encounter' | 'reveal'
      intent?:
        | 'move_left'
        | 'move_right'
        | 'attack'
        | 'gesture_swipe_left'
        | 'gesture_swipe_right'
        | 'gesture_tap'
        | 'gesture_hold'
        | 'gesture_swipe_up'
      handled: boolean
      reason?: string
    }
  | {
      type: 'intro_event'
      name:
        | 'stage_entered'
        | 'stage_completed'
        | 'transition_triggered'
        | 'sequence_completed'
      stageId?: string
      toStageId?: string
      index?: number
      method?: 'auto' | 'manual'
      preset?: 'glitch_gate'
      skipped?: boolean
    }

export interface TelemetryEnvelope<TEvent extends BaseEvent = BaseEvent> {
  version: '1'
  sessionId: string
  sequence: number
  ts: number
  event: TEvent
}

export interface TelemetrySink {
  publish: (envelope: TelemetryEnvelope) => void | Promise<void>
}

const sessionId = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

let sequence = 0
const sinks: TelemetrySink[] = [
  {
    publish(envelope) {
      console.info('[combocv:event]', envelope)
    },
  },
]

let remoteSinkConfigured = false

function configureRemoteSinkIfNeeded(): void {
  if (remoteSinkConfigured) {
    return
  }

  remoteSinkConfigured = true

  const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT

  if (!endpoint) {
    return
  }

  sinks.push({
    async publish(envelope) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(envelope),
        })
      } catch {
        // Keep telemetry non-blocking.
      }
    },
  })
}

export function setTelemetrySinks(nextSinks: TelemetrySink[]): void {
  sinks.splice(0, sinks.length, ...nextSinks)
}

export type TelemetryEvent = BaseEvent

export function publishTelemetry(event: TelemetryEvent): void {
  configureRemoteSinkIfNeeded()

  sequence += 1

  const envelope: TelemetryEnvelope = {
    version: '1',
    sessionId,
    sequence,
    ts: Date.now(),
    event,
  }

  for (const sink of sinks) {
    Promise.resolve(sink.publish(envelope)).catch(() => {
      // Keep telemetry non-blocking.
    })
  }
}
