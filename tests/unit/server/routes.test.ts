import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { fetchUpstream } from '#server/utils/sportsdb/client'
import { installNitroStubs, loadApiRoutes, type NitroStubs } from '../helpers/nitro'
import { readJsonFixture } from './fixtures'

vi.mock('#server/utils/sportsdb/client', () => ({ fetchUpstream: vi.fn() }))

const LEAGUES_CACHE = 'public, max-age=60, s-maxage=1800, stale-while-revalidate=1800'
const SEASONS_CACHE = 'public, max-age=60, s-maxage=604800, stale-while-revalidate=604800'
const DETAILS_CACHE = 'public, max-age=60, s-maxage=86400, stale-while-revalidate=86400'

let stubs: NitroStubs
let get: (path: string) => Promise<Response>
let upstream: Mock<typeof fetchUpstream>

/** Upstream answers from the fixtures, like the real API with the free key. */
async function setup(memoise: boolean) {
  vi.resetModules()
  stubs = installNitroStubs({ memoise })
  const client = await import('#server/utils/sportsdb/client')
  upstream = vi.mocked(client.fetchUpstream)
  const fixtures: Record<string, (id: unknown) => string> = {
    'all_leagues.php': () => 'all_leagues.live.json',
    'search_all_seasons.php': id => `seasons/${id}.json`,
    'lookupleague.php': id => `details/${id}.json`,
  }
  upstream.mockImplementation(async (_options, endpoint, query) => readJsonFixture(fixtures[endpoint]!(query?.id)))
  get = await loadApiRoutes()
}

async function failUpstream(endpoint: string) {
  // Imported after `vi.resetModules()`, so it is the same class the freshly loaded handlers check
  // with `instanceof`; a top-level import would be a different copy of the module.
  const { UpstreamError } = await import('#server/utils/sportsdb/errors')
  const answer = upstream.getMockImplementation()
  upstream.mockImplementation(async (options, called, query) => {
    if (called === endpoint) throw new UpstreamError('rate-limited', endpoint, 429)
    return answer?.(options, called, query)
  })
}

function upstreamCalls(endpoint: string): number {
  return upstream.mock.calls.filter(call => call[1] === endpoint).length
}

describe('API routes', () => {
  beforeEach(() => setup(false))

  it('GET /api/leagues returns the leagues with fetchedAt and cache headers', async () => {
    const response = await get('/api/leagues')
    const body: unknown = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(LEAGUES_CACHE)
    expect(body).toMatchObject({ fetchedAt: expect.any(Number) })
    expect(body).toHaveProperty('leagues.0', { id: '4328', name: 'English Premier League', sport: 'Soccer' })
    expect(body).toHaveProperty('leagues.length', 10)
  })

  it.each(['abc', '12a'])('GET /api/leagues/%s/seasons answers 400 without any upstream call', async (id) => {
    const response = await get(`/api/leagues/${id}/seasons`)

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toBeNull()
    expect(upstream).not.toHaveBeenCalled()
  })

  it('a malformed id is a 400 even when upstream is down', async () => {
    await failUpstream('all_leagues.php')

    expect((await get('/api/leagues/abc/seasons')).status).toBe(400)
  })

  it('GET /api/leagues/999999/seasons answers 404 without a seasons upstream call', async () => {
    const response = await get('/api/leagues/999999/seasons')

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBeNull()
    expect(upstreamCalls('search_all_seasons.php')).toBe(0)
  })

  it('GET /api/leagues/4328/seasons returns badges with cache headers', async () => {
    const response = await get('/api/leagues/4328/seasons')
    const badges: unknown = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(SEASONS_CACHE)
    expect(badges).toHaveLength(5)
    expect(badges).toHaveProperty('0', {
      season: '1992-1993',
      badgeUrl: '{{FIXTURE_ORIGIN}}/images/media/league/badgearchive/02egea1661959225.png/small',
    })
  })

  it('a league without badges returns []', async () => {
    const response = await get('/api/leagues/4329/seasons')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('an upstream failure is a 502 with its reason and no Cache-Control', async () => {
    await failUpstream('search_all_seasons.php')

    const response = await get('/api/leagues/4328/seasons')

    expect(response.status).toBe(502)
    expect(response.headers.get('cache-control')).toBeNull()
    // Plain h3 omits `message` from the body; Nitro adds it (checked against the build in P3.5).
    expect(await response.json()).toMatchObject({ statusCode: 502, data: { reason: 'rate-limited' } })
  })

  it('a leagues failure during id validation is a 502, never a 404', async () => {
    await failUpstream('all_leagues.php')

    const responses = await Promise.all(['/api/leagues', '/api/leagues/4328/seasons'].map(get))

    responses.forEach((response) => {
      expect(response.status).toBe(502)
      expect(response.headers.get('cache-control')).toBeNull()
    })
  })

  it('declares all three cached functions with a name, swr and the documented maxAge', () => {
    expect(stubs.declarations).toEqual([
      { name: 'leagues', maxAge: 1800, swr: true, hasGetKey: true },
      { name: 'seasons', maxAge: 604800, swr: true, hasGetKey: true },
      { name: 'details', maxAge: 86400, swr: true, hasGetKey: true },
    ])
  })

  it('keys seasons by league id and leagues by a constant', async () => {
    await get('/api/leagues/4328/seasons')
    await get('/api/leagues/4330/seasons')

    expect(stubs.keys).toEqual([
      { name: 'leagues', key: 'all' },
      { name: 'seasons', key: '4328' },
      { name: 'leagues', key: 'all' },
      { name: 'seasons', key: '4330' },
    ])
  })
})

describe('GET /api/leagues/:id', () => {
  beforeEach(() => setup(false))

  it('returns the details and the seasons with cache headers', async () => {
    const response = await get('/api/leagues/4328')
    const body: unknown = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(DETAILS_CACHE)
    expect(body).toHaveProperty('details.name', 'English Premier League')
    expect(body).toHaveProperty('details.website', expect.stringMatching(/^https:\/\//))
    expect(body).toHaveProperty('seasons.length', 5)
  })

  it.each([['abc', 400], ['999999', 404]])('answers %s with %i, no per-league upstream call', async (id, status) => {
    const response = await get(`/api/leagues/${id}`)

    expect(response.status).toBe(status)
    expect(response.headers.get('cache-control')).toBeNull()
    expect(upstreamCalls('lookupleague.php') + upstreamCalls('search_all_seasons.php')).toBe(0)
  })

  it('a listed league without details upstream is a 502, not a cached 404', async () => {
    const answer = upstream.getMockImplementation()
    upstream.mockImplementation(async (options, endpoint, query) =>
      endpoint === 'lookupleague.php' ? { leagues: null } : answer?.(options, endpoint, query))

    const response = await get('/api/leagues/4328')

    expect(response.status).toBe(502)
    expect(response.headers.get('cache-control')).toBeNull()
  })

  it('a failure is a 502 without Cache-Control', async () => {
    await failUpstream('lookupleague.php')

    const response = await get('/api/leagues/4328')

    expect(response.status).toBe(502)
    expect(response.headers.get('cache-control')).toBeNull()
  })

  it('reads the seasons from the same cached function as the seasons route', async () => {
    await get('/api/leagues/4328')

    expect(stubs.keys).toContainEqual({ name: 'seasons', key: '4328' })
  })
})

// The memoising stub stands in for Nitro's cache, which never stores a thrown error (nitropack's
// `runtime/internal/cache.mjs`). These tests prove what our routes do with it: a failure is thrown
// rather than returned as a value, so the next request reaches upstream again.
describe('API routes behind a cache that never stores errors', () => {
  beforeEach(() => setup(true))

  it('the league page reuses the seasons cached by the list', async () => {
    await get('/api/leagues/4328/seasons')
    await get('/api/leagues/4328')

    expect(upstreamCalls('search_all_seasons.php')).toBe(1)
  })

  it('a repeat request makes no upstream call', async () => {
    await get('/api/leagues/4328/seasons')
    await get('/api/leagues/4328/seasons')
    await get('/api/leagues')

    expect(upstreamCalls('all_leagues.php')).toBe(1)
    expect(upstreamCalls('search_all_seasons.php')).toBe(1)
  })

  it('a request after a failure reaches upstream again', async () => {
    const answer = upstream.getMockImplementation()
    await failUpstream('search_all_seasons.php')
    expect((await get('/api/leagues/4328/seasons')).status).toBe(502)

    upstream.mockImplementation(answer ?? (async () => undefined))
    const retry = await get('/api/leagues/4328/seasons')

    expect(retry.status).toBe(200)
    expect(upstreamCalls('search_all_seasons.php')).toBe(2)
  })
})
