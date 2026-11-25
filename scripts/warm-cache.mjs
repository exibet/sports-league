// `npm run warm -- <base-url>`: after a deploy, ask the app for every league once, so the first
// visitors are served from the cache. The league list comes first, then each league's seasons and
// details, one request at a time with a pause: TheSportsDB's free key blocks about ten quick
// requests in a row (requests 9 s apart stayed under the limit). Stops at the first failure.
// `WARM_PAUSE_MS` overrides the pause, e.g. `WARM_PAUSE_MS=0` against the local fixture server.
import { setTimeout as sleep } from 'node:timers/promises'

const [base] = process.argv.slice(2)
const PAUSE_MS = Number(process.env.WARM_PAUSE_MS ?? 9_000)

if (!base) {
  console.error('Usage: npm run warm -- <base-url>   (e.g. https://sports-league-sooty.vercel.app)')
  process.exit(1)
}

async function get(path) {
  const response = await fetch(new URL(path, base))
  if (!response.ok) throw new Error(`${path} answered HTTP ${response.status}; stopping (nothing after it was warmed).`)
  return response.json()
}

const started = Date.now()
try {
  const { leagues } = await get('/api/leagues')
  console.log(`${leagues.length} leagues, ${PAUSE_MS / 1000} s between requests`)
  // Sequential on purpose: the pause between upstream-bound requests is the point.
  for (const { id, name } of leagues) {
    await sleep(PAUSE_MS)
    const seasons = await get(`/api/leagues/${id}/seasons`)
    await sleep(PAUSE_MS)
    await get(`/api/leagues/${id}`)
    console.log(`${id}  ${name}: ${seasons.length} season badges, details`)
  }
  console.log(`Warmed ${leagues.length} leagues in ${Math.round((Date.now() - started) / 1000)} s.`)
}
catch (error) {
  console.error(`${base}: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
}
