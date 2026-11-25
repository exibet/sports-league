import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchUpstream, type UpstreamClientOptions } from '~~/server/utils/sportsdb/client'
import { UpstreamError } from '~~/server/utils/sportsdb/errors'
import { readFixture } from './fixtures'

const API_KEY = 'secret-key-42'
const BASE_URL = 'https://upstream.test/api/v1/json'
const RATE_LIMITED = readFixture('rate-limited.txt')

type FetchImpl = typeof globalThis.fetch

/** Replaces the global `fetch` that ofetch calls; returns the stub to assert on. */
function stubFetch(fetch: FetchImpl): FetchImpl {
  vi.stubGlobal('fetch', fetch)
  return fetch
}

function respond(body: string, init: ResponseInit = {}): FetchImpl {
  return stubFetch(vi.fn<FetchImpl>(async () => new Response(body, init)))
}

function client(timeoutMs = 1000): UpstreamClientOptions {
  return { baseUrl: BASE_URL, apiKey: API_KEY, timeoutMs }
}

async function failure(promise: Promise<unknown>): Promise<UpstreamError> {
  const error = await promise.then(() => null, (reason: unknown) => reason)
  if (!(error instanceof UpstreamError)) {
    throw new Error(`expected an UpstreamError, got ${String(error)}`)
  }
  return error
}

describe('fetchUpstream', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed JSON body', async () => {
    respond('{"leagues":[{"idLeague":"4328"}]}', {
      headers: { 'content-type': 'application/json' },
    })

    await expect(fetchUpstream(client(), 'all_leagues.php')).resolves.toEqual({
      leagues: [{ idLeague: '4328' }],
    })
  })

  it('requests <baseUrl>/<key>/<endpoint> with the query', async () => {
    const fetch = respond('{}')

    await fetchUpstream(client(), 'search_all_seasons.php', { badge: 1, id: '4328' })

    const request = vi.mocked(fetch).mock.calls[0]?.[0]
    expect(String(request instanceof Request ? request.url : request)).toBe(
      `${BASE_URL}/${API_KEY}/search_all_seasons.php?badge=1&id=4328`,
    )
  })

  it('throws rate-limited on HTTP 429', async () => {
    respond(RATE_LIMITED, { status: 429 })
    const error = await failure(fetchUpstream(client(), 'all_leagues.php'))

    expect(error.code).toBe('rate-limited')
  })

  it('throws rate-limited on a 200 body "error code: 1015"', async () => {
    respond(RATE_LIMITED)
    const error = await failure(fetchUpstream(client(), 'all_leagues.php'))

    expect(error.code).toBe('rate-limited')
  })

  it('throws invalid-response on an HTML body', async () => {
    respond('<!doctype html><title>Maintenance</title>', { headers: { 'content-type': 'text/html' } })

    const error = await failure(fetchUpstream(client(), 'all_leagues.php'))

    expect(error.code).toBe('invalid-response')
  })

  it('throws invalid-response on an empty body', async () => {
    respond('')
    const error = await failure(fetchUpstream(client(), 'all_leagues.php'))

    expect(error.code).toBe('invalid-response')
  })

  it('throws bad-status on another error status', async () => {
    respond('{}', { status: 503 })
    const error = await failure(fetchUpstream(client(), 'all_leagues.php'))

    expect(error.code).toBe('bad-status')
    expect(error.status).toBe(503)
  })

  it('throws timeout when the upstream does not answer in time', async () => {
    // Fake timers do not drive AbortSignal, so a small real timeout and a fetch that only
    // settles when it is aborted.
    stubFetch(vi.fn<FetchImpl>((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    })))

    const error = await failure(fetchUpstream(client(20), 'all_leagues.php'))

    expect(error.code).toBe('timeout')
  })

  it('throws unreachable on a network failure', async () => {
    stubFetch(vi.fn<FetchImpl>(async () => {
      throw new TypeError('fetch failed')
    }))

    const error = await failure(fetchUpstream(client(), 'all_leagues.php'))

    expect(error.code).toBe('unreachable')
  })

  it.each([429, 500, 503])('attempts the request exactly once on HTTP %i', async (status) => {
    const fetch = respond('{}', { status })

    await failure(fetchUpstream(client(), 'all_leagues.php'))

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['a rate limit', () => respond(RATE_LIMITED, { status: 429 })],
    ['an HTML body', () => respond('<html>', { status: 200 })],
    ['a server error', () => respond('{}', { status: 500 })],
    ['a network error naming the URL', () => stubFetch(vi.fn<FetchImpl>(async () => {
      throw new TypeError(`fetch failed for ${BASE_URL}/${API_KEY}/all_leagues.php`)
    }))],
  ])('never exposes the API key or the upstream URL (%s)', async (_case, makeFetch) => {
    makeFetch()
    const error = await failure(fetchUpstream(client(), 'all_leagues.php'))
    const exposed = [error.message, String(error), JSON.stringify(error), String(error.cause ?? '')].join(' ')

    expect(exposed).not.toContain(API_KEY)
    expect(exposed).not.toContain('upstream.test')
  })
})
