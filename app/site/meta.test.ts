import { escapeAttr, pageMeta, socialTags } from './meta'

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

describe('socialTags', () => {
  const tag = (html: string, key: string) =>
    html.match(new RegExp(`<meta property="${key}" content="([^"]*)" />`))?.[1]

  it('previews a project page as the book, under its own title', () => {
    const html = socialTags('/work/kbui')
    expect(tag(html, 'og:title')).toBe('kbui · Khallil Bailey')
    expect(tag(html, 'og:description')).toBe(
      'One design system for all my projects: tokens, CSS and React.'
    )
    expect(tag(html, 'og:url')).toBe('https://kcb.pro/work/kbui')
    expect(tag(html, 'og:image')).toBe('https://kcb.pro/og.png')
    expect(tag(html, 'og:image:width')).toBe('1200')
    expect(tag(html, 'og:image:height')).toBe('630')
    expect(tag(html, 'og:image:alt')).toBeTruthy()
  })

  it('carries Open Graph only, since no site is posted to', () => {
    expect(socialTags('/work/kbui')).not.toContain('twitter:')
  })

  it('points home at the bare domain and drops a trailing slash', () => {
    expect(tag(socialTags('/'), 'og:url')).toBe('https://kcb.pro/')
    expect(tag(socialTags('/work/'), 'og:url')).toBe('https://kcb.pro/work')
  })

  it('gives a missing page nothing to share', () => {
    expect(socialTags('/work/ghost')).toBe('')
  })
})

describe('escapeAttr', () => {
  it('keeps text from ending an attribute or opening a tag', () => {
    expect(escapeAttr('Tom & "Jerry" <b>')).toBe('Tom &amp; &quot;Jerry&quot; &lt;b>')
  })
})
