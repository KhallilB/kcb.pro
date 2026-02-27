import { publishTelemetry } from '@app/telemetry/events'

interface ToneOptions {
  frequency: number
  durationMs: number
  type?: OscillatorType
  gain?: number
}

export class ComboAudio {
  private context: AudioContext | null = null
  private muted = false

  setMuted(value: boolean): void {
    this.muted = value
    publishTelemetry({
      type: 'setting_updated',
      key: 'mute',
      value,
    })
  }

  get isMuted(): boolean {
    return this.muted
  }

  async ensureReady(): Promise<void> {
    if (this.muted) {
      return
    }

    if (!this.context) {
      this.context = new AudioContext()
    }

    if (this.context.state === 'suspended') {
      try {
        await this.context.resume()
      } catch {
        // Ignore resume failures; browsers can deny until explicit user gestures.
      }
    }
  }

  async playStart(): Promise<void> {
    await this.playTone({ frequency: 220, durationMs: 80, type: 'triangle', gain: 0.04 })
  }

  async playProgress(): Promise<void> {
    await this.playTone({ frequency: 320, durationMs: 65, type: 'square', gain: 0.03 })
  }

  async playSuccess(): Promise<void> {
    await this.playTone({ frequency: 520, durationMs: 120, type: 'sine', gain: 0.05 })
  }

  private async playTone(options: ToneOptions): Promise<void> {
    if (this.muted) {
      return
    }

    await this.ensureReady()

    if (!this.context) {
      return
    }

    const context = this.context
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = options.type ?? 'triangle'
    oscillator.frequency.value = options.frequency

    gain.gain.value = options.gain ?? 0.05
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + options.durationMs / 1000
    )

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start()
    oscillator.stop(context.currentTime + options.durationMs / 1000)
  }

  destroy(): void {
    if (this.context) {
      this.context.close().catch(() => {
        // noop
      })
      this.context = null
    }
  }
}
