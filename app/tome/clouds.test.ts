import { CLOUDS, cloudSvg } from './clouds'

const parse = (markup: string) => new DOMParser().parseFromString(markup, 'image/svg+xml')

describe('cloud images', () => {
  it('draws the drifting mist as one stitched tile repeated, so a one-tile drift loops without a seam', () => {
    for (const spec of [CLOUDS.far, CLOUDS.near]) {
      expect(spec.tiles).toBe(2)
      const svg = parse(cloudSvg(spec, '#ffffff')).documentElement
      expect(svg.getAttribute('width')).toBe(String(spec.tile * 2))
      expect(svg.getAttribute('height')).toBe(String(spec.height))
      const noise = svg.querySelector('feTurbulence')
      expect(noise?.getAttribute('stitchTiles')).toBe('stitch')
      expect(noise?.getAttribute('width')).toBe(String(spec.tile))
      expect(svg.querySelector('feTile')).not.toBeNull()
    }
  })

  it('draws each veil bank once, fading toward the book, so no CSS mask is needed', () => {
    expect(CLOUDS.veilLeft).toMatchObject({ tiles: 1, fade: 'right' })
    expect(CLOUDS.veilRight).toMatchObject({ tiles: 1, fade: 'left' })
    const svg = parse(cloudSvg(CLOUDS.veilLeft, '#ffffff')).documentElement
    expect(svg.getAttribute('width')).toBe(String(CLOUDS.veilLeft.tile))
  })

  it('points the layer at a filter that exists, by an id url() can reach', () => {
    const svg = parse(cloudSvg(CLOUDS.near, '#ffffff')).documentElement
    const id = /^url\(#(.+)\)$/.exec(svg.querySelector('rect')?.getAttribute('filter') ?? '')?.[1] ?? ''
    expect(id).toMatch(/^[\w-]+$/)
    expect(svg.querySelector(`filter#${id}`)).not.toBeNull()
  })

  it('paints the cloud in the colour it is given', () => {
    expect(cloudSvg(CLOUDS.far, '#a9b6b2')).toContain('flood-color="#a9b6b2"')
  })

  it('renders small: every layer together under 1.5 megapixels, against ~40 drawn live at 2x', () => {
    const pixels = Object.values(CLOUDS).reduce((sum, s) => sum + s.tile * s.tiles * s.height, 0)
    expect(pixels).toBeLessThan(1_500_000)
  })
})
