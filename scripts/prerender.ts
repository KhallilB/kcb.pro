// Writes one static HTML file per route into build/, then fails on any catalog error.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const BUILD = 'build'
const SSR = 'build-ssr'

const server = await import(join(process.cwd(), SSR, 'entry-server.js'))
const { renderPage, sitePaths, catalog, content, validateCatalog, buildDay } =
  server

// Hidden entries stay valid so they can come back by deleting one line.
const errors: string[] = validateCatalog(catalog)
if (errors.length > 0) {
  console.error(`Catalog failed validation:\n${errors.join('\n')}`)
  process.exit(1)
}

const template = await readFile(join(BUILD, 'index.html'), 'utf8')
if (!template.includes('<!--app-->')) {
  throw new Error('build/index.html lost its <!--app--> marker')
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

function page(path: string): string {
  const { html, title, description } = renderPage(path, buildDay)
  return template
    .replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content=".*?"\s*\/>/s,
      `<meta name="description" content="${escape(description)}" />`
    )
    .replace('<!--app-->', html)
}

const paths: string[] = sitePaths(content)
for (const path of paths) {
  // <path>.html, not <path>/index.html: Pages 308s a folder index to a trailing-slash URL.
  const file = path === '/' ? join(BUILD, 'index.html') : join(BUILD, `${path}.html`)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, page(path))
}
// Cloudflare Pages serves 404.html for any unknown path.
await writeFile(join(BUILD, '404.html'), page('/404'))
await rm(SSR, { recursive: true, force: true })

console.log(`Prerendered ${paths.length + 1} pages as of ${buildDay}`)
