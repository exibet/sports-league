import { describe, expect, it, vi } from 'vitest'
import { fetchUpstream, type UpstreamClientOptions } from '~~/server/utils/sportsdb/client'
import { UpstreamError } from '~~/server/utils/sportsdb/errors'
import { readFixture } from './fixtures'

const API_KEY = 'secret-key-42'
const BASE_URL = 'https://upstream.test/api/v1/json'
const RATE_LIMITED = readFixture('rate-limited.txt')

type FetchImpl = NonNullable<UpstreamClientOptions['fetch']>

function respond(body: string, init: ResponseInit = {}): FetchImpl {
  return vi.fn<FetchImpl>(async () => new Response(body, init))
}

function client(fetch: FetchImpl, timeoutMs = 1000): UpstreamClientOptions {
  return { baseUrl: BASE_URL, apiKey: API_KEY, timeoutMs, fetch }
}

async function failure(promise: Promise<unknown>): Promise<UpstreamError> {
  const error = await promise.then(() => null, (reason: unknown) => reason)
  if (!(error instanceof UpstreamError)) {
    throw new Error(`expected an UpstreamError, got ${String(error)}`)
  }
  return error
}

describe('fetchUpstream', () => {
  it('returns the parsed JSON body', async () => {
    const fetch = respond('{"leagues":[{"idLeague":"4328"}]}', {
      headers: { 'content-type': 'application/json' },
    })

    await expect(fetchUpstream(client(fetch), 'all_leagues.php')).resolves.toEqual({
      leagues: [{ idLeague: '4328' }],
    })
  })

  it('requests <baseUrl>/<key>/<endpoint> with the query', async () => {
    const fetch = respond('{}')

    await fetchUpstream(client(fetch), 'search_all_seasons.php', { badge: 1, id: '4328' })

    const request = vi.mocked(fetch).mock.calls[0]?.[0]
    expect(String(request instanceof Request ? request.url : request)).toBe(
      `${BASE_URL}/${API_KEY}/search_all_seasons.php?badge=1&id=4328`,
    )
  })

  it('throws rate-limited on HTTP 429', async () => {
    const error = await failure(fetchUpstream(client(respond(RATE_LIMITED, { status: 429 })), 'all_leagues.php'))

    expect(error.code).toBe('rate-limited')
  })

  it('throws rate-limited on a 200 body "error code: 1015"', async () => {
    const error = await failure(fetchUpstream(client(respond(RATE_LIMITED)), 'all_leagues.php'))

    expect(error.code).toBe('rate-limited')
  })

  it('throws invalid-response on an HTML body', async () => {
    const fetch = respond('<!doctype html><title>Maintenance</title>', { headers: { 'content-type': 'text/html' } })

    const error = await failure(fetchUpstream(client(fetch), 'all_leagues.php'))

    expect(error.code).toBe('invalid-response')
  })

  it('throws invalid-response on an empty body', async () => {
    const error = await failure(fetchUpstream(client(respond('')), 'all_leagues.php'))

    expect(error.code).toBe('invalid-response')
  })

  it('throws bad-status on another error status', async () => {
    const error = await failure(fetchUpstream(client(respond('{}', { status: 503 })), 'all_leagues.php'))

    expect(error.code).toBe('bad-status')
    expect(error.status).toBe(503)
  })

  it('throws timeout when the upstream does not answer in time', async () => {
    // Fake timers do not drive AbortSignal, so a small real timeout and a fetch that only
    // settles when it is aborted.
    const fetch = vi.fn<FetchImpl>((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    }))

    const error = await failure(fetchUpstream(client(fetch, 20), 'all_leagues.php'))

    expect(error.code).toBe('timeout')
  })

  it('throws unreachable on a network failure', async () => {
    const fetch = vi.fn<FetchImpl>(async () => {
      throw new TypeError('fetch failed')
    })

    const error = await failure(fetchUpstream(client(fetch), 'all_leagues.php'))

    expect(error.code).toBe('unreachable')
  })

  it('attempts the request exactly once, even on 429 and 5xx', async () => {
    for (const status of [429, 500, 503]) {
      const fetch = respond('{}', { status })

      await failure(fetchUpstream(client(fetch), 'all_leagues.php'))

      expect(fetch).toHaveBeenCalledTimes(1)
    }
  })

  it('never exposes the API key or the upstream URL in the error', async () => {
    const fetches: FetchImpl[] = [
      respond(RATE_LIMITED, { status: 429 }),
      respond('<html>', { status: 200 }),
      respond('{}', { status: 500 }),
      vi.fn<FetchImpl>(async () => {
        throw new TypeError(`fetch failed for ${BASE_URL}/${API_KEY}/all_leagues.php`)
      }),
    ]

    for (const fetch of fetches) {
      const error = await failure(fetchUpstream(client(fetch), 'all_leagues.php'))
      const exposed = [error.message, String(error), JSON.stringify(error), String(error.cause ?? '')].join(' ')

      expect(exposed).not.toContain(API_KEY)
      expect(exposed).not.toContain('upstream.test')
    }
  })
})
