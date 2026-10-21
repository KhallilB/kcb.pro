import { pageMeta } from './meta'

describe('pageMeta', () => {
  it('titles the home page with the name alone', () => {
    expect(pageMeta('/')).toMatchObject({ title: 'Khallil Bailey', status: 200 })
  })

  it('titles a project page with its name and summary', () => {
    expect(pageMeta('/work/wander')).toEqual({
      title: 'Wander · Khallil Bailey',
      description: 'The city as layers: then and now on the street you stand on.',
      status: 200,
    })
  })

  it('titles a study page with the study', () => {
    expect(pageMeta('/studies/figma-canvas').title).toBe(
      'Figma’s canvas pan, zoom and multiplayer cursors · Khallil Bailey'
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
