import { pageMeta } from './meta'

describe('pageMeta', () => {
  it('titles the home page with the name alone', () => {
    expect(pageMeta('/')).toMatchObject({ title: 'Khallil Bailey', status: 200 })
  })

  it('describes the site by who I am, not by how it is dated', () => {
    expect(pageMeta('/').description).toBe(
      'Frontend engineer in Los Angeles with more than five years of building product interfaces.'
    )
  })

  it('titles a project page with its name and summary', () => {
    expect(pageMeta('/work/kbui')).toEqual({
      title: 'kbui · Khallil Bailey',
      description: 'One design system for all my projects: tokens, CSS and React.',
      status: 200,
    })
  })

  it('titles a study page with the study', () => {
    expect(pageMeta('/studies/figma-canvas').title).toBe(
      'How Figma’s canvas stays smooth with everyone on it · Khallil Bailey'
    )
  })

  it('reports a missing page as 404', () => {
    expect(pageMeta('/work/ghost')).toMatchObject({
      title: 'Not found · Khallil Bailey',
      status: 404,
    })
    expect(pageMeta('/nowhere').status).toBe(404)
  })

  it('ignores a trailing slash', () => {
    expect(pageMeta('/work/').title).toBe('Work · Khallil Bailey')
  })
})
