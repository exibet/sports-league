import { FetchError, ofetch } from 'ofetch'
import { UpstreamError } from './errors'

export interface UpstreamClientOptions {
  /** Without the key, e.g. `https://www.thesportsdb.com/api/v1/json`. */
  baseUrl: string
  apiKey: string
  timeoutMs: number
}

type UpstreamQuery = Record<string, string | number>

/** Cloudflare's rate-limit page (plain text, docs/api.md): recognised by its body, whatever the status. */
const RATE_LIMIT_BODY = /^error code: 1015\b/

/**
 * One GET to TheSportsDB. Resolves with the parsed JSON body; throws `UpstreamError` on every
 * failure mode (429, the 1015 body, timeout, network, other error statuses, non-JSON) before the
 * caller normalises anything, so an error can never be mistaken for an empty result.
 */
export async function fetchUpstream(
  options: UpstreamClientOptions,
  endpoint: string,
  query?: UpstreamQuery,
): Promise<unknown> {
  const response = await ofetch.raw<string, 'text'>(`/${encodeURIComponent(options.apiKey)}/${endpoint}`, {
    baseURL: options.baseUrl,
    query,
    timeout: options.timeoutMs,
    // ofetch retries GETs on 429 and 5xx by default, which doubles the pressure on the limit.
    retry: 0,
    responseType: 'text',
    // Statuses are classified below, together with the body.
    ignoreResponseError: true,
  }).catch((error: unknown) => {
    // Only the network can fail here; ofetch aborts a timed-out request with a `TimeoutError`.
    const timedOut = error instanceof FetchError && error.cause instanceof Error && error.cause.name === 'TimeoutError'
    throw new UpstreamError(timedOut ? 'timeout' : 'unreachable', endpoint)
  })

  const body = (response._data ?? '').trim()
  if (response.status === 429 || RATE_LIMIT_BODY.test(body)) {
    throw new UpstreamError('rate-limited', endpoint, response.status)
  }
  if (!response.ok) {
    throw new UpstreamError('bad-status', endpoint, response.status)
  }
  try {
    return JSON.parse(body)
  }
  catch {
    throw new UpstreamError('invalid-response', endpoint, response.status)
  }
}
