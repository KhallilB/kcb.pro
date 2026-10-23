// Cloud layers as small images: noise drawn once into a canvas, scaled up by CSS, drifted by
// the compositor. Live full-size SVG filters cost ~44 MB a layer on Retina and redraw when invalidated.

export interface CloudSpec {
  // Rendered tile width in px.
  tile: number
  // 2 for drifting layers, so a one-tile drift loops; 1 for a bank that only sways.
  tiles: 1 | 2
  // Edge that fades out, baked in so the layer needs no CSS mask (masks stall the GPU every frame).
  fade?: 'left' | 'right'
  height: number
  frequency: string
  seed: number
  // Alpha row of the colour matrix: keeps only the dense noise, as cloud.
  cover: string
}

// A third of display size (a tile spans a ~1440 px viewport); frequencies scaled to match.
export const CLOUDS = {
  far: { tile: 480, tiles: 2, height: 360, frequency: '0.0078 0.0195', seed: 11, cover: '3.2 0 0 0 -1.3' },
  near: { tile: 480, tiles: 2, height: 360, frequency: '0.0126 0.033', seed: 4, cover: '3 0 0 0 -1.35' },
  // Veil banks fade toward the book's centre, where the two meet.
  veilLeft: { tile: 360, tiles: 1, fade: 'right', height: 360, frequency: '0.0096 0.027', seed: 23, cover: '3 0 0 0 -1.45' },
  veilRight: { tile: 360, tiles: 1, fade: 'left', height: 360, frequency: '0.0096 0.027', seed: 31, cover: '3 0 0 0 -1.45' },
} satisfies Record<string, CloudSpec>

// One stitched tile of noise, repeated by feTile across the image, painted in color.
export function cloudSvg(spec: CloudSpec, color: string): string {
  const { tile, height } = spec
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile * spec.tiles}" height="${height}">` +
    `<filter id="cloud" x="0" y="0" width="100%" height="100%" primitiveUnits="userSpaceOnUse">` +
    `<feTurbulence x="0" y="0" width="${tile}" height="${height}" type="fractalNoise" ` +
    `baseFrequency="${spec.frequency}" numOctaves="4" seed="${spec.seed}" stitchTiles="stitch"/>` +
    `<feTile result="noise"/>` +
    `<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${spec.cover}" result="cloud"/>` +
    `<feFlood flood-color="${color}"/>` +
    `<feComposite in2="cloud" operator="in"/>` +
    `</filter>` +
    `<rect width="100%" height="100%" filter="url(#cloud)"/>` +
    `</svg>`
  )
}

const drawn = new Map<string, Promise<string>>()

// Object URL of the cloud drawn once per spec and colour; shared by every mount.
export function cloudImage(spec: CloudSpec, color: string): Promise<string> {
  const key = `${spec.seed}:${spec.tile}:${spec.tiles}:${spec.fade}:${color}`
  let url = drawn.get(key)
  if (!url) {
    url = draw(spec, color)
    drawn.set(key, url)
  }
  return url
}

async function draw(spec: CloudSpec, color: string): Promise<string> {
  const svg = new Image()
  svg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cloudSvg(spec, color))}`
  await svg.decode()
  const canvas = document.createElement('canvas')
  canvas.width = spec.tile * spec.tiles
  canvas.height = spec.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2D canvas for clouds')
  ctx.drawImage(svg, 0, 0)
  if (spec.fade) {
    const w = canvas.width
    const edge = spec.fade === 'right' ? ctx.createLinearGradient(0, 0, w, 0) : ctx.createLinearGradient(w, 0, 0, 0)
    edge.addColorStop(0.55, 'black')
    edge.addColorStop(1, 'transparent')
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = edge
    ctx.fillRect(0, 0, w, canvas.height)
  }
  const png = await new Promise<Blob | null>((done) => canvas.toBlob(done))
  if (!png) throw new Error('Cloud image could not be encoded')
  return URL.createObjectURL(png)
}
