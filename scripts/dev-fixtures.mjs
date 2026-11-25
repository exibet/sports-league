// `npm run dev:fixtures`: the fixture server plus `nuxt dev` pointed at it, so the sport filter can
// be tried on mixed sports (live data has only Soccer). Ctrl+C stops both. Extra arguments go to
// `nuxt dev`, e.g. `npm run dev:fixtures -- --port 3001`.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { DEFAULT_PORT } from '../tests/fixtures/server.mjs'

const PORT = Number(process.env.FIXTURE_PORT ?? DEFAULT_PORT)
const fromRoot = path => fileURLToPath(new URL(`../${path}`, import.meta.url))

const children = [
  spawn(process.execPath, [fromRoot('tests/fixtures/server.mjs'), String(PORT)], { stdio: 'inherit' }),
  spawn(process.execPath, [fromRoot('node_modules/nuxt/bin/nuxt.mjs'), 'dev', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, NUXT_SPORTSDB_BASE_URL: `http://localhost:${PORT}/api/v1/json` },
  }),
]

let stopping = false
function stop(code) {
  if (stopping) return
  stopping = true
  children.forEach(child => child.kill())
  process.exitCode = code
}

children.forEach(child => child.on('exit', code => stop(code ?? 0)))
const SIGNALS = ['SIGINT', 'SIGTERM']
SIGNALS.forEach(signal => process.on(signal, () => stop(0)))
