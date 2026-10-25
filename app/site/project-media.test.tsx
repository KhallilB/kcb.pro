import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { profile } from '@app/portfolio/content'
import { catalog, image, project } from '@app/portfolio/domain/fixtures'
import type { Media } from '@app/portfolio/domain/types'
import { ProjectPage } from './pages/ProjectPage'
import { SiteContext, type TomeHooks } from './site'

const noTome: TomeHooks = {
  supportsWebGL: () => false,
  load: () => Promise.reject(new Error('no tome in tests')),
}

function visitAlpha(media?: Media) {
  return render(
    <SiteContext.Provider
      value={{
        asOf: '2026-10-21',
        catalog: catalog([project({ media })]),
        profile,
        tome: noTome,
      }}
    >
      <MemoryRouter initialEntries={['/work/alpha']}>
        <Routes>
          <Route path="/work/:slug" element={<ProjectPage />} />
        </Routes>
      </MemoryRouter>
    </SiteContext.Provider>
  )
}

describe('project media', () => {
  it('shows an image lazily, at its own size, described by its alt text', () => {
    visitAlpha(image())
    const img = screen.getByRole('img', {
      name: 'The Alpha window with one task open.',
    })
    expect(img).toHaveAttribute('src', '/media/alpha.png')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('width', '1600')
    expect(img).toHaveAttribute('height', '900')
  })

  it('shows a video that downloads nothing until played', () => {
    const { container } = visitAlpha(
      image({
        kind: 'video',
        src: '/media/alpha.mp4',
        alt: 'Two assistants reading while one writes.',
      })
    )
    const video = container.querySelector('video')
    expect(video).toHaveAttribute('src', '/media/alpha.mp4')
    expect(video).toHaveAttribute('preload', 'none')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('width', '1600')
    expect(video).toHaveAttribute('height', '900')
    expect(video).toHaveAccessibleName(
      'Two assistants reading while one writes.'
    )
  })

  it('shows no media slot when a project has none', () => {
    const { container } = visitAlpha()
    expect(container.querySelector('.project-media, img, video')).toBeNull()
  })
})
