import { validateCatalog } from './validate'
import { catalog, project, study } from './fixtures'

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
})
