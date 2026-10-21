import { expect, test, type Page } from '@playwright/test'

// Most checks read the plain list; the tome has its own test below.
async function preferList(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('kcb:home-view', 'list'))
}

// Headless software WebGL cannot run the real book in time, so the lazy engine chunk is
// swapped for a stub; loading, mounting and the list switch are still the real code.
async function stubEngine(page: Page) {
  await page.addInitScript(() => {
    const real = HTMLCanvasElement.prototype.getContext
    // @ts-expect-error report WebGL support so the stage loads the engine
    window.WebGLRenderingContext ??= function WebGLRenderingContext() {}
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
      return kind === 'webgl' ? ({} as RenderingContext) : real.call(this, kind as '2d', ...(rest as []))
    } as typeof real
  })
  await page.route('**/assets/engine-*.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `export function mountTome(host, opts) {
        const c = document.createElement('canvas'); c.dataset.chapters = Object.keys(opts.data.chapters).join(',');
        host.append(c); return () => host.replaceChildren();
      }`,
    })
  )
}

test('the tome opens over the home page and steps aside for the list', async ({ page }) => {
  await stubEngine(page)
  await page.goto('/')
  const listButton = page.getByRole('button', { name: 'List view' })
  await expect(listButton).toBeVisible()
  await expect(page.locator('.tome[data-ready] canvas')).toHaveAttribute(
    'data-chapters',
    'deckWorkshop,mugenArena,wander'
  )

  await listButton.click()
  await expect(listButton).toHaveCount(0)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Frontend engineer building deep, useful web apps.' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open the tome' })).toBeVisible()
})

test('without WebGL the home page is the plain list', async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error simulating a browser with no WebGL
    delete window.WebGLRenderingContext
  })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Frontend engineer building deep, useful web apps.' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'List view' })).toHaveCount(0)
})

test('home names the work and what is being built now', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await preferList(page)
  await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Frontend engineer building deep, useful web apps.' })
  ).toBeVisible()
  await expect(page.getByTestId('now-building')).toContainText('Now building Deck Workshop')
  await expect(
    page.getByRole('region', { name: 'Selected work' }).getByRole('article')
  ).toHaveCount(3)
  expect(errors, 'hydration must not log errors').toEqual([])
})

test('a keyboard user reaches a project page and back to the index', async ({ page }) => {
  await preferList(page)
  await page.goto('/')
  // The stored choice applies after hydration; wait for it before tabbing.
  await expect(page.getByRole('button', { name: 'Open the tome' })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()

  await page.getByRole('link', { name: 'Mugen Arena' }).first().focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work\/mugen-arena$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Mugen Arena' })).toBeVisible()
  await expect(page).toHaveTitle('Mugen Arena · Khallil Bailey')

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Work' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Work' })).toBeVisible()
})

test('every project page is served as prerendered HTML', async ({ request }) => {
  for (const slug of ['deck-workshop', 'mugen-arena', 'wander', 'gallery']) {
    const response = await request.get(`/work/${slug}`)
    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain('<h1 class="h1">')
  }
})

test('an unknown path gets the 404 page with a 404 status', async ({ page }) => {
  const response = await page.goto('/work/ghost')
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { level: 1, name: 'This page moved or never existed.' })
  ).toBeVisible()
})

test('the phone layout has no horizontal scroll at 320 px', async ({ page }) => {
  await preferList(page)
  await page.setViewportSize({ width: 320, height: 700 })
  for (const path of ['/', '/work', '/work/deck-workshop', '/studies/map-labels']) {
    await page.goto(path)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
