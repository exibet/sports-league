// A zero-dependency stand-in for TheSportsDB, serving the fixtures in `upstream/` and the images in
// `images/`. Used by `npm run dev:fixtures` and by the e2e suite.
//
//   node tests/fixtures/server.mjs [port]      (default 3901)
//
// Point the app at it with NUXT_SPORTSDB_BASE_URL=http://localhost:<port>/api/v1/json.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const DEFAULT_PORT = 3901

const root = new URL('./', import.meta.url)
const read = path => readFileSync(fileURLToPath(new URL(path, root)), 'utf8')
const IMAGES = readdirSync(fileURLToPath(new URL('images/', root))).filter(name => name.endsWith('.png')).sort()

/** Any badge path maps to one of the placeholder images, the same one every time. */
function imageFor(path) {
  const digest = createHash('sha256').update(path.replace(/\/(small|tiny)$/, '')).digest()
  return IMAGES[digest[0] % IMAGES.length]
}

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  response.end(body)
}

function handle(request, response) {
  const url = new URL(request.url ?? '/', 'http://fixtures')
  const origin = `http://${request.headers.host}`
  const fixture = path => read(`upstream/${path}`).replaceAll('{{FIXTURE_ORIGIN}}', origin)

  if (url.pathname.endsWith('/all_leagues.php')) {
    return json(response, 200, fixture('all_leagues.mixed.json'))
  }
  if (url.pathname.endsWith('/search_all_seasons.php')) {
    const id = url.searchParams.get('id') ?? ''
    if (!/^\d+$/.test(id)) return json(response, 200, fixture('seasons-invalid-id.json'))
    const file = `seasons/${id}.json`
    const known = existsSync(new URL(`upstream/${file}`, root))
    return json(response, 200, fixture(known ? file : 'seasons-unknown-id.json'))
  }
  if (url.pathname.startsWith('/images/')) {
    response.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' })
    return response.end(readFileSync(fileURLToPath(new URL(`images/${imageFor(url.pathname)}`, root))))
  }
  response.writeHead(404, { 'content-type': 'text/plain' })
  response.end('not a fixture route')
}

export function startFixtureServer(port = DEFAULT_PORT) {
  const server = createServer((request, response) => {
    response.on('finish', () => console.log(`[fixtures] ${request.method} ${request.url} ${response.statusCode}`))
    handle(request, response)
  })
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[fixtures] listening on http://localhost:${port}`)
      resolve(server)
    })
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startFixtureServer(Number(process.argv[2] ?? process.env.FIXTURE_PORT ?? DEFAULT_PORT))
}
