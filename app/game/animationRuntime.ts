import type { CharacterId } from '@app/content/types'
import type { AnimationState } from '@app/game/types'
import { loadCharacterState } from '@app/game/assets'
import { AnimatedSprite, Container, Graphics, Text, TextStyle, Texture } from 'pixi.js'

interface PlayOptions {
  loop?: boolean
  speed?: number
}

interface VisualBounds {
  width: number
  height: number
  centerOffsetX: number
  padBottom: number
}

const LABEL_STYLE = new TextStyle({
  fill: '#f4e3bf',
  fontFamily: 'monospace',
  fontSize: 12,
  align: 'center',
})

const visualBoundsCache = new Map<string, Promise<VisualBounds>>()

async function loadImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image for bounds: ${url}`))
    image.src = url
  })
}

async function measureVisualBoundsForUrl(url: string): Promise<VisualBounds> {
  const cached = visualBoundsCache.get(url)

  if (cached) {
    return await cached
  }

  const pending = (async () => {
    try {
      const image = await loadImage(url)
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height

      if (width <= 0 || height <= 0) {
        return {
          width: 1,
          height: 1,
          centerOffsetX: 0,
          padBottom: 0,
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (!context) {
        return {
          width,
          height,
          centerOffsetX: 0,
          padBottom: 0,
        }
      }

      try {
        context.clearRect(0, 0, width, height)
        context.drawImage(image, 0, 0)
        const pixelData = context.getImageData(0, 0, width, height).data

        let left = width
        let right = -1
        let top = height
        let bottom = -1

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const alpha = pixelData[(y * width + x) * 4 + 3]

            if (alpha <= 8) {
              continue
            }

            if (x < left) {
              left = x
            }

            if (x > right) {
              right = x
            }

            if (y < top) {
              top = y
            }

            if (y > bottom) {
              bottom = y
            }
          }
        }

        if (right < left || bottom < top) {
          return {
            width,
            height,
            centerOffsetX: 0,
            padBottom: 0,
          }
        }

        const visualWidth = right - left + 1
        const visualHeight = bottom - top + 1
        const visualCenterX = (left + right + 1) / 2
        const sourceCenterX = width / 2
        const centerOffsetX = visualCenterX - sourceCenterX
        const padBottom = Math.max(0, height - 1 - bottom)

        return {
          width: visualWidth,
          height: visualHeight,
          centerOffsetX,
          padBottom,
        }
      } catch {
        return {
          width,
          height,
          centerOffsetX: 0,
          padBottom: 0,
        }
      }
    } catch {
      return {
        width: 1,
        height: 1,
        centerOffsetX: 0,
        padBottom: 0,
      }
    }
  })()

  visualBoundsCache.set(url, pending)
  return await pending
}

async function measureClipVisualBounds(frameUrls: string[]): Promise<VisualBounds> {
  if (frameUrls.length === 0) {
    return {
      width: 1,
      height: 1,
      centerOffsetX: 0,
      padBottom: 0,
    }
  }

  const sampleIndices = new Set<number>([
    0,
    Math.floor(frameUrls.length / 2),
    Math.max(0, frameUrls.length - 1),
  ])

  const sampledBounds = await Promise.all(
    [...sampleIndices].map((index) => measureVisualBoundsForUrl(frameUrls[index]))
  )

  return sampledBounds.reduce<VisualBounds>(
    (largest, current) => {
      if (current.height > largest.height) {
        return current
      }

      return largest
    },
    sampledBounds[0]
  )
}

export class CharacterActor {
  readonly id: CharacterId
  readonly container: Container = new Container()

  private sprite: AnimatedSprite | null = null
  private currentState: AnimationState = 'idle'
  private transitionToken = 0
  private readonly marker = new Graphics()
  private readonly labelText: Text
  private currentVisualBounds: VisualBounds | null = null

  constructor(id: CharacterId, label: string) {
    this.id = id

    this.container.sortableChildren = true
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'

    this.marker.rect(-48, -120, 96, 120)
    this.marker.fill({ color: 0x111827, alpha: 0.25 })
    this.marker.zIndex = 0
    this.marker.name = 'hit-marker'

    this.labelText = new Text({
      text: label,
      style: LABEL_STYLE,
    })
    this.labelText.anchor.set(0.5, 0)
    this.labelText.y = 10
    this.labelText.zIndex = 2

    this.container.addChild(this.marker)
    this.container.addChild(this.labelText)
  }

  async initialize(): Promise<void> {
    await this.playState('idle', { loop: true, speed: 0.18 })
  }

  async playState(state: AnimationState, options: PlayOptions = {}): Promise<void> {
    const token = ++this.transitionToken
    const loop = options.loop ?? (state === 'idle' || state === 'engage')
    const speed = options.speed ?? this.speedForState(state)

    const loaded = await loadCharacterState(this.id, state)

    if (token !== this.transitionToken) {
      return
    }

    const textures = loaded.frameUrls.map((url) => {
      const texture = Texture.from(url)
      texture.source.scaleMode = 'nearest'
      return texture
    })

    if (!textures.length) {
      return
    }

    const fallbackBounds: VisualBounds = {
      width: Math.max(1, textures[0].width || 1),
      height: Math.max(1, textures[0].height || 1),
      centerOffsetX: 0,
      padBottom: 0,
    }

    let visualBounds = fallbackBounds

    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      try {
        visualBounds = await measureClipVisualBounds(loaded.frameUrls)

        if (visualBounds.width <= 0 || visualBounds.height <= 0) {
          visualBounds = fallbackBounds
        }
      } catch {
        visualBounds = fallbackBounds
      }
    }

    if (token !== this.transitionToken) {
      return
    }

    if (this.sprite) {
      this.container.removeChild(this.sprite)
      this.sprite.destroy()
    }

    const sprite = new AnimatedSprite(textures)
    sprite.anchor.set(0.5, 1)
    sprite.y = 0
    sprite.loop = loop
    sprite.animationSpeed = speed
    sprite.zIndex = 1
    sprite.roundPixels = true
    sprite.x = -visualBounds.centerOffsetX
    sprite.y = visualBounds.padBottom
    sprite.play()

    this.sprite = sprite
    this.currentState = state
    this.currentVisualBounds = visualBounds

    this.container.addChildAt(sprite, 1)
  }

  getState(): AnimationState {
    return this.currentState
  }

  getSpriteSize(): { width: number; height: number } | null {
    if (this.currentVisualBounds) {
      return {
        width: this.currentVisualBounds.width,
        height: this.currentVisualBounds.height,
      }
    }

    if (!this.sprite) {
      return null
    }

    return {
      width: this.sprite.width,
      height: this.sprite.height,
    }
  }

  setPresentationMode(mode: 'default' | 'focused'): void {
    const focused = mode === 'focused'
    this.marker.visible = !focused
    this.labelText.visible = !focused
  }

  setFocused(focused: boolean): void {
    void focused
  }

  destroy(): void {
    this.transitionToken += 1

    if (this.sprite) {
      this.sprite.destroy()
      this.sprite = null
    }

    this.currentVisualBounds = null

    this.container.destroy({ children: true })
  }

  private speedForState(state: AnimationState): number {
    switch (state) {
      case 'idle':
        return 0.16
      case 'engage':
        return 0.2
      case 'signature':
        return 0.28
      case 'react':
        return 0.24
      case 'resolve':
        return 0.18
      default:
        return 0.2
    }
  }
}
