import { validateCatalog } from './validate'
import { catalog, image, project, study } from './fixtures'
import type { Media } from './types'

describe('validateCatalog', () => {
  it('accepts a complete catalog', () => {
    expect(validateCatalog(catalog([project()], [study()]))).toEqual([])
  })

  it('refuses two entries with one slug', () => {
    const errors = validateCatalog(
      catalog([project(), project({ title: 'Beta' })])
    )
    expect(errors).toContain('Duplicate slug "alpha"')
  })

  it.each([
    'TBD',
    'Lorem ipsum dolor',
    'Your Name',
    'Coming soon',
    'placeholder copy',
  ])('refuses placeholder text: %s', (text) => {
    const errors = validateCatalog(catalog([project({ summary: text })]))
    expect(errors.join('\n')).toMatch(/placeholder/i)
  })

  it('finds placeholder text inside a brief section', () => {
    const errors = validateCatalog(
      catalog([project({ brief: [{ heading: 'Plan', body: ['TODO later'] }] })])
    )
    expect(errors.join('\n')).toMatch(/placeholder/i)
  })

  it('refuses shipped work with no ship date', () => {
    const errors = validateCatalog(catalog([project({ status: 'shipped' })]))
    expect(errors).toContain('"alpha" is shipped but has no shippedOn date')
  })

  it('refuses a project with no paragraph saying what it is', () => {
    const errors = validateCatalog(catalog([project({ about: '  ' })]))
    expect(errors).toContain('"alpha" needs an about paragraph')
  })

  it('refuses a study with no paragraph saying what it is', () => {
    const errors = validateCatalog(catalog([project()], [study({ about: '' })]))
    expect(errors).toContain('Study "study-one" needs an about paragraph')
  })

  it('refuses links that go nowhere', () => {
    const errors = validateCatalog(
      catalog([project({ links: [{ label: 'Source', href: '#' }] })])
    )
    expect(errors).toContain('"alpha" has a link with no destination: Source')
  })

  it('accepts a project with complete media', () => {
    const errors = validateCatalog(catalog([project({ media: [image()] })]))
    expect(errors).toEqual([])
  })

  it.each(['', '   '])('refuses media with no alt text: "%s"', (alt) => {
    const errors = validateCatalog(
      catalog([project({ media: [image({ alt })] })])
    )
    expect(errors).toContain('"alpha" shot 1 needs alt text')
  })

  it('refuses media with no alt field at all', () => {
    const noAlt = { ...image(), alt: undefined } as unknown as Media
    const errors = validateCatalog(catalog([project({ media: [noAlt] })]))
    expect(errors).toContain('"alpha" shot 1 needs alt text')
  })

  it('names the shot that is wrong, so a long list stays findable', () => {
    const errors = validateCatalog(
      catalog([
        project({
          media: [image(), image({ src: '/media/two.png', alt: '' })],
        }),
      ])
    )
    expect(errors).toContain('"alpha" shot 2 needs alt text')
  })

  it('finds placeholder text in media alt text', () => {
    const errors = validateCatalog(
      catalog([project({ media: [image({ alt: 'TODO describe' })] })])
    )
    expect(errors.join('\n')).toMatch(/placeholder/i)
  })

  it('finds placeholder text in a caption', () => {
    const errors = validateCatalog(
      catalog([project({ media: [image({ caption: 'Coming soon' })] })])
    )
    expect(errors.join('\n')).toMatch(/placeholder/i)
  })

  it.each([
    { width: 0, height: 900 },
    { width: 1600, height: -1 },
    { width: 1600.5, height: 900 },
  ])('refuses media without a whole width and height: %o', (size) => {
    const errors = validateCatalog(catalog([project({ media: [image(size)] })]))
    expect(errors).toContain('"alpha" shot 1 needs a width and height')
  })

  it('refuses media with no source', () => {
    const errors = validateCatalog(
      catalog([project({ media: [image({ src: '' })] })])
    )
    expect(errors).toContain('"alpha" shot 1 has no source')
  })

  it('refuses a study that feeds a project that does not exist', () => {
    const errors = validateCatalog(
      catalog([project()], [study({ feeds: ['ghost'] })])
    )
    expect(errors).toContain('Study "study-one" feeds unknown project "ghost"')
  })

  it('refuses a study that feeds a hidden project', () => {
    const errors = validateCatalog(
      catalog([project({ listed: false })], [study({ feeds: ['alpha'] })])
    )
    expect(errors).toContain('Study "study-one" feeds hidden project "alpha"')
  })

  it('accepts a repo named owner/name with a goal', () => {
    expect(
      validateCatalog(
        catalog([project({ repo: 'KhallilB/bezl', goal: 'One clear aim.' })])
      )
    ).toEqual([])
  })

  it('refuses a repo with no goal sentence', () => {
    const errors = validateCatalog(
      catalog([project({ repo: 'KhallilB/bezl' })])
    )
    expect(errors).toContain('"alpha" has a repo, so it needs a goal sentence')
  })

  it.each(['  ', 'x'.repeat(141), 'One aim.\nAnother.'])(
    'refuses the goal %j',
    (goal) => {
      const errors = validateCatalog(
        catalog([project({ repo: 'KhallilB/bezl', goal })])
      )
      expect(errors).toEqual([
        '"alpha" needs a goal of one line, 1 to 140 characters',
      ])
    }
  )

  it('finds placeholder text in the goal', () => {
    const errors = validateCatalog(
      catalog([project({ repo: 'KhallilB/bezl', goal: 'TBD' })])
    )
    expect(errors.join('\n')).toMatch(/placeholder/i)
  })

  it('lets a project with no repo go without a goal', () => {
    expect(validateCatalog(catalog([project()]))).toEqual([])
  })

  it('refuses a repo that is not owner/name', () => {
    const errors = validateCatalog(
      catalog([project({ repo: 'https://github.com/KhallilB/bezl' })])
    )
    expect(errors).toContain(
      '"alpha" has a repo that is not owner/name: https://github.com/KhallilB/bezl'
    )
  })

  it('accepts one project per rank', () => {
    const errors = validateCatalog(
      catalog([project({ rank: 1 }), project({ slug: 'beta', rank: 2 })])
    )
    expect(errors).toEqual([])
  })

  it('refuses two projects with one rank', () => {
    const errors = validateCatalog(
      catalog([project({ rank: 1 }), project({ slug: 'beta', rank: 1 })])
    )
    expect(errors).toContain('Rank 1 is used by "alpha" and "beta"')
  })

  it.each([
    ['the site', { kind: 'site' as const }],
    ['a hidden project', { listed: false }],
  ])('refuses a rank on %s', (_, overrides) => {
    const errors = validateCatalog(
      catalog([project({ rank: 1, ...overrides })])
    )
    expect(errors).toContain('"alpha" has a rank but is not a listed endeavor')
  })
})
