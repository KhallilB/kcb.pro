// Serves build/ the way Cloudflare Pages does: directory index.html, else 404.html with 404.
import { join, normalize } from 'node:path'

const root = join(process.cwd(), 'build')
const port = Number(process.env.PORT ?? 4173)

async function file(path: string) {
  const f = Bun.file(path)
  return (await f.exists()) ? f : null
}

Bun.serve({
  hostname: '127.0.0.1',
  port,
  async fetch(request) {
    const { pathname } = new URL(request.url)
    const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
    const found =
      (await file(join(root, safe))) ??
      (await file(join(root, safe, 'index.html')))
    if (found && !safe.endsWith('/404.html')) return new Response(found)
    return new Response(Bun.file(join(root, '404.html')), {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  },
})

console.log(`Serving build/ on http://127.0.0.1:${port}`)
