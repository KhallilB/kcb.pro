import type { CharacterId } from '@app/content/types'
import type { AnimationState } from '@app/game/types'
import { Assets } from 'pixi.js'

interface FrameModule {
  default: string
}

export type ClipVariant = 'nofx' | 'fx' | 'full' | 'other'

interface ClipManifest {
  id: string
  rawPath: string
  variant: ClipVariant
  framePaths: string[]
}

interface CharacterManifest {
  id: CharacterId
  clips: ClipManifest[]
}

const CHARACTER_DIRECTORY_MAP: Record<string, CharacterId> = {
  Goblin: 'goblin',
  JoannaDarc: 'joanna_darc',
  NightHarpy: 'night_harpy',
  NightLord: 'night_lord',
  Phantom: 'phantom',
  SkeletonKinight: 'skeleton_kinight',
}

const FRAME_GLOB = import.meta.glob<FrameModule>([
  '/app/assets/chars/**/*.png',
  '!/app/assets/chars/**/*Sheet*.png',
  '!/app/assets/chars/**/*sheet*.png',
  '!/app/assets/chars/**/*#*.png',
])

const NATURAL_SORT = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

const DEFAULT_STATE_PATTERNS: Record<AnimationState, string[]> = {
  idle: ['idle', 'rest/resting', '/rest', '/walk/walking', '/walk'],
  engage: ['run', 'dash', 'to', 'walk', 'jump'],
  signature: ['attacks', 'casts', 'spells', 'combo', 'heavy', 'lightatk'],
  react: ['hurt', 'hited', 'stun', 'block'],
  resolve: ['death', 'rise', 'land', 'out', 'break'],
}

const STATE_OVERRIDES: Partial<
  Record<CharacterId, Partial<Record<AnimationState, string[]>>>
> = {
  goblin: {
    idle: ['idle'],
    engage: ['run/full', 'run/loop', 'run'],
    signature: ['attacks/combo', 'attacks/lightatk', 'attacks/dashatk'],
    react: ['hurt'],
    resolve: ['death'],
  },
  joanna_darc: {
    idle: ['sprites/idle', 'sprites/rest/resting'],
    engage: ['sprites/run/runright/running', 'sprites/run/running', 'sprites/dash'],
    signature: ['sprites/attacks/comboatk', 'sprites/casts'],
    react: ['sprites/hurt', 'sprites/block'],
    resolve: ['sprites/death', 'sprites/knockback'],
  },
  night_harpy: {
    idle: ['sprites/idle', 'sprites/rest/resting'],
    engage: ['sprites/sprint/sprint', 'sprites/sprint'],
    signature: ['sprites/attacks/frontheavyatk', 'sprites/attacks/lightatk'],
    react: ['sprites/hited'],
    resolve: ['sprites/death'],
  },
  night_lord: {
    idle: ['sprites/idle'],
    engage: ['sprites/run/running', 'sprites/walk/walking', 'sprites/dash&grab/dashing'],
    signature: ['sprites/attacks/lightatkcombo', 'sprites/spells/casts', 'sprites/spells'],
    react: ['sprites/hitandstn/hited', 'sprites/hitandstn/stun'],
    resolve: ['sprites/death', 'sprites/submerge', 'sprites/emerge'],
  },
  phantom: {
    idle: ['sprites/idle', 'sprites/ringbell/ringing'],
    engage: ['sprites/charge&cast/charging', 'sprites/turn'],
    signature: ['sprites/attacks/lightatk', 'sprites/charge&cast/cast', 'sprites/ringbell/full'],
    react: ['sprites/hited'],
    resolve: ['sprites/death'],
  },
  skeleton_kinight: {
    idle: ['sprites/idle'],
    engage: ['sprites/walk/walking', 'sprites/jump&fall'],
    signature: ['sprites/attacks/lightatk', 'sprites/attacks/frontheavyatk'],
    react: ['sprites/hited', 'sprites/block/blocking'],
    resolve: ['sprites/death', 'sprites/rise'],
  },
}

const frameUrlCache = new Map<string, string>()
const loadedCharacterUrls = new Map<CharacterId, Set<string>>()
const loadedBundleUrls = new Map<string, Set<string>>()

export interface LoadedAssetBundle {
  id: string
  characterId: CharacterId
  state: AnimationState
  clipId: string
  frameUrls: string[]
}

interface ParsedFramePath {
  characterId: CharacterId | null
  clipPath: string
  frameName: string
}

interface ClipCollision {
  normalizedId: string
  rawPaths: string[]
}

interface ScoredClip {
  clip: ClipManifest
  patternIndex: number
  matchQuality: number
  pathDepth: number
}

const VARIANT_PREFERENCE_ORDER: ClipVariant[] = ['nofx', 'fx', 'full', 'other']

export function normalizeClipToken(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'clip'
}

function toClipVariant(path: string): ClipVariant {
  const lower = path.toLowerCase()

  if (lower.includes('nofx')) {
    return 'nofx'
  }

  if (lower.includes('fx')) {
    return 'fx'
  }

  if (lower.includes('full')) {
    return 'full'
  }

  return 'other'
}

function variantRank(variant: ClipVariant): number {
  const index = VARIANT_PREFERENCE_ORDER.indexOf(variant)
  return index < 0 ? VARIANT_PREFERENCE_ORDER.length : index
}

function isSheetFrame(path: string): boolean {
  const basename = path.split('/').pop() ?? path
  return basename.toLowerCase().includes('sheet')
}

function splitAssetPath(path: string): ParsedFramePath {
  const segments = path.split('/').filter(Boolean)
  const charsIndex = segments.findIndex((segment) => segment === 'chars')

  if (charsIndex < 0 || charsIndex + 2 >= segments.length) {
    return { characterId: null, clipPath: '', frameName: '' }
  }

  const characterDir = segments[charsIndex + 1]
  const characterId = CHARACTER_DIRECTORY_MAP[characterDir] ?? null
  const frameName = segments[segments.length - 1]
  const clipPath = segments.slice(charsIndex + 2, -1).join('/')

  return { characterId, clipPath, frameName }
}

function discoverFramePaths(): string[] {
  return Object.keys(FRAME_GLOB)
    .filter((path) => !isSheetFrame(path))
    .sort((a, b) => a.localeCompare(b))
}

function groupFramesByCharacter(
  framePaths: string[]
): Map<CharacterId, Map<string, string[]>> {
  const grouped = new Map<CharacterId, Map<string, string[]>>()

  for (const path of framePaths) {
    const parsed = splitAssetPath(path)

    if (!parsed.characterId || !parsed.clipPath || !parsed.frameName) {
      continue
    }

    const byClip = grouped.get(parsed.characterId) ?? new Map<string, string[]>()
    const clipFrames = byClip.get(parsed.clipPath) ?? []

    clipFrames.push(path)
    byClip.set(parsed.clipPath, clipFrames)
    grouped.set(parsed.characterId, byClip)
  }

  return grouped
}

export function createStableClipIds(rawPaths: string[]): Map<string, string> {
  const sortedPaths = [...rawPaths].sort((a, b) => a.localeCompare(b))
  const grouped = new Map<string, string[]>()

  for (const rawPath of sortedPaths) {
    const normalized = normalizeClipToken(rawPath)
    const collisions = grouped.get(normalized) ?? []
    collisions.push(rawPath)
    grouped.set(normalized, collisions)
  }

  const ids = new Map<string, string>()

  for (const [normalized, collisions] of grouped) {
    collisions.sort((a, b) => a.localeCompare(b))

    if (collisions.length === 1) {
      ids.set(collisions[0], normalized)
      continue
    }

    collisions.forEach((rawPath, index) => {
      ids.set(rawPath, `${normalized}--${index + 1}`)
    })
  }

  return ids
}

function collectClipCollisions(rawPaths: string[]): ClipCollision[] {
  const grouped = new Map<string, string[]>()

  for (const rawPath of rawPaths) {
    const normalized = normalizeClipToken(rawPath)
    const collisions = grouped.get(normalized) ?? []
    collisions.push(rawPath)
    grouped.set(normalized, collisions)
  }

  return [...grouped.entries()]
    .filter(([, collisions]) => collisions.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([normalizedId, collisions]) => ({
      normalizedId,
      rawPaths: [...collisions].sort((a, b) => a.localeCompare(b)),
    }))
}

function assertNoClipCollisions(
  characterId: CharacterId,
  collisions: ClipCollision[]
): void {
  if (collisions.length === 0) {
    return
  }

  const detail = collisions
    .map(
      (entry) =>
        `${entry.normalizedId} => ${entry.rawPaths.join(' | ')}`
    )
    .join('; ')

  const message = `Clip token collision for ${characterId}: ${detail}`

  if (import.meta.env.DEV) {
    throw new Error(message)
  }

  console.warn('[combocv assets]', message)
}

function buildClipManifests(byClip: Map<string, string[]>): ClipManifest[] {
  const rawPaths = [...byClip.keys()].sort((a, b) => a.localeCompare(b))
  const ids = createStableClipIds(rawPaths)

  return rawPaths.map((rawPath) => {
    const framePaths = byClip.get(rawPath) ?? []
    const ordered = [...framePaths].sort((a, b) => NATURAL_SORT.compare(a, b))

    return {
      id: ids.get(rawPath) ?? normalizeClipToken(rawPath),
      rawPath,
      framePaths: ordered,
      variant: toClipVariant(rawPath),
    }
  })
}

function compileManifest(): Record<CharacterId, CharacterManifest> {
  const grouped = groupFramesByCharacter(discoverFramePaths())

  const manifest = {} as Record<CharacterId, CharacterManifest>

  for (const characterId of Object.values(CHARACTER_DIRECTORY_MAP)) {
    const byClip = grouped.get(characterId) ?? new Map<string, string[]>()
    const collisions = collectClipCollisions([...byClip.keys()])
    assertNoClipCollisions(characterId, collisions)
    const clips = buildClipManifests(byClip)

    manifest[characterId] = {
      id: characterId,
      clips,
    }
  }

  return manifest
}

const manifest = compileManifest()

function scoreClipForState(
  characterId: CharacterId,
  state: AnimationState,
  clip: ClipManifest
): ScoredClip | null {
  const patterns = STATE_OVERRIDES[characterId]?.[state] ?? DEFAULT_STATE_PATTERNS[state]
  const lowerPath = clip.rawPath.toLowerCase()

  for (let index = 0; index < patterns.length; index += 1) {
    const pattern = patterns[index]

    const lowerPattern = pattern.toLowerCase()

    if (lowerPath.includes(lowerPattern)) {
      let matchQuality = 3

      if (lowerPath === lowerPattern) {
        matchQuality = 0
      } else if (lowerPath.endsWith(`/${lowerPattern}`)) {
        matchQuality = 1
      } else if (lowerPath.startsWith(`${lowerPattern}/`)) {
        matchQuality = 2
      }

      return {
        clip,
        patternIndex: index,
        matchQuality,
        pathDepth: lowerPath.split('/').length,
      }
    }
  }

  return null
}

function pickClip(characterId: CharacterId, state: AnimationState): ClipManifest | null {
  const entry = manifest[characterId]

  if (!entry || entry.clips.length === 0) {
    return null
  }

  const scored = entry.clips
    .map((clip) => scoreClipForState(characterId, state, clip))
    .filter((value): value is ScoredClip => value !== null)
    .sort((a, b) => {
      if (a.patternIndex !== b.patternIndex) {
        return a.patternIndex - b.patternIndex
      }

      if (a.matchQuality !== b.matchQuality) {
        return a.matchQuality - b.matchQuality
      }

      if (a.pathDepth !== b.pathDepth) {
        return a.pathDepth - b.pathDepth
      }

      const variantDelta = variantRank(a.clip.variant) - variantRank(b.clip.variant)

      if (variantDelta !== 0) {
        return variantDelta
      }

      return a.clip.rawPath.localeCompare(b.clip.rawPath)
    })

  if (scored.length > 0) {
    return scored[0].clip
  }

  const byVariant = [...entry.clips].sort((a, b) => {
    const variantDelta = variantRank(a.variant) - variantRank(b.variant)

    if (variantDelta !== 0) {
      return variantDelta
    }

    return a.rawPath.localeCompare(b.rawPath)
  })

  return byVariant[0] ?? null
}

async function resolveFrameUrl(framePath: string): Promise<string> {
  const cached = frameUrlCache.get(framePath)

  if (cached) {
    return cached
  }

  const loader = FRAME_GLOB[framePath]

  if (!loader) {
    throw new Error(`Missing frame loader for path: ${framePath}`)
  }

  const module = await loader()
  const url = module.default

  frameUrlCache.set(framePath, url)

  return url
}

export function listCharacterIds(): CharacterId[] {
  return Object.values(CHARACTER_DIRECTORY_MAP)
}

export function getResolvedClipForState(
  characterId: CharacterId,
  state: AnimationState
): { clipId: string; rawPath: string; frameCount: number } | null {
  const clip = pickClip(characterId, state)

  if (!clip) {
    return null
  }

  return {
    clipId: clip.id,
    rawPath: clip.rawPath,
    frameCount: clip.framePaths.length,
  }
}

export function getManifestSnapshot(): Record<
  CharacterId,
  { clipCount: number; totalFrames: number }
> {
  const snapshot = {} as Record<CharacterId, { clipCount: number; totalFrames: number }>

  for (const [characterId, entry] of Object.entries(manifest) as Array<
    [CharacterId, CharacterManifest]
  >) {
    snapshot[characterId] = {
      clipCount: entry.clips.length,
      totalFrames: entry.clips.reduce((sum, clip) => sum + clip.framePaths.length, 0),
    }
  }

  return snapshot
}

function rememberLoadedUrls(
  characterId: CharacterId,
  bundleId: string,
  frameUrls: string[]
): void {
  const characterUrls = loadedCharacterUrls.get(characterId) ?? new Set<string>()
  frameUrls.forEach((url) => characterUrls.add(url))
  loadedCharacterUrls.set(characterId, characterUrls)

  const bundleUrls = loadedBundleUrls.get(bundleId) ?? new Set<string>()
  frameUrls.forEach((url) => bundleUrls.add(url))
  loadedBundleUrls.set(bundleId, bundleUrls)
}

function detachUrlsFromCharacters(urls: string[]): void {
  for (const [characterId, loaded] of loadedCharacterUrls) {
    urls.forEach((url) => loaded.delete(url))

    if (loaded.size === 0) {
      loadedCharacterUrls.delete(characterId)
    }
  }
}

function detachUrlsFromBundles(urls: string[]): void {
  for (const [bundleId, loaded] of loadedBundleUrls) {
    urls.forEach((url) => loaded.delete(url))

    if (loaded.size === 0) {
      loadedBundleUrls.delete(bundleId)
    }
  }
}

function toBundleId(characterId: CharacterId, state: AnimationState, clipId: string): string {
  return `${characterId}:${state}:${clipId}`
}

export async function loadBundle(
  characterId: CharacterId,
  state: AnimationState
): Promise<LoadedAssetBundle> {
  const clip = pickClip(characterId, state)

  if (!clip) {
    throw new Error(`No clip found for ${characterId} and state ${state}`)
  }

  const frameUrls = await Promise.all(clip.framePaths.map((framePath) => resolveFrameUrl(framePath)))
  await Assets.load(frameUrls)

  const bundleId = toBundleId(characterId, state, clip.id)
  rememberLoadedUrls(characterId, bundleId, frameUrls)

  return {
    id: bundleId,
    characterId,
    state,
    clipId: clip.id,
    frameUrls,
  }
}

export async function backgroundLoadBundle(
  characterId: CharacterId,
  state: AnimationState
): Promise<LoadedAssetBundle | null> {
  const clip = pickClip(characterId, state)

  if (!clip) {
    return null
  }

  const frameUrls = await Promise.all(clip.framePaths.map((framePath) => resolveFrameUrl(framePath)))
  await Assets.backgroundLoad(frameUrls)

  const bundleId = toBundleId(characterId, state, clip.id)
  rememberLoadedUrls(characterId, bundleId, frameUrls)

  return {
    id: bundleId,
    characterId,
    state,
    clipId: clip.id,
    frameUrls,
  }
}

export async function unloadBundle(bundleId: string): Promise<void> {
  const loaded = loadedBundleUrls.get(bundleId)

  if (!loaded || loaded.size === 0) {
    return
  }

  const urls = [...loaded]
  await Assets.unload(urls)
  loadedBundleUrls.delete(bundleId)
  detachUrlsFromCharacters(urls)
}

export async function loadCharacterState(
  characterId: CharacterId,
  state: AnimationState
): Promise<{ clipId: string; frameUrls: string[] }> {
  const bundle = await loadBundle(characterId, state)

  return {
    clipId: bundle.clipId,
    frameUrls: bundle.frameUrls,
  }
}

export async function backgroundLoadCharacterState(
  characterId: CharacterId,
  state: AnimationState
): Promise<void> {
  await backgroundLoadBundle(characterId, state)
}

export async function unloadCharacter(characterId: CharacterId): Promise<void> {
  const loaded = loadedCharacterUrls.get(characterId)

  if (!loaded || loaded.size === 0) {
    return
  }

  const urls = [...loaded]
  await Assets.unload(urls)
  loadedCharacterUrls.delete(characterId)
  detachUrlsFromBundles(urls)
}
