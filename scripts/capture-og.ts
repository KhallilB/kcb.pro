// Captures public/og.png, the social preview, from the built site: bun run build && bun run preview, then
// bun scripts/capture-og.ts [url]. Needs a real GPU; headless software WebGL draws the book too slowly.
import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://127.0.0.1:4173/'
const out = process.argv[3] ?? 'public/og.png'

const browser = await chromium.launch({
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(url)
await page.waitForSelector('.tome[data-ready]', { timeout: 30_000 })
// Open the cover, then let the turn and the parting clouds settle.
await page.keyboard.press('ArrowRight')
await page.waitForSelector('.tome[data-open]', { timeout: 10_000 })
await page.waitForTimeout(3_500)
// The toggle and the ribbon hint are chrome, not the picture.
await page.addStyleTag({
  content: '[role="group"][aria-label="View"], .tome__hint { visibility: hidden }',
})
await page.screenshot({ path: out })
await browser.close()
console.log(`Wrote ${out}`)
