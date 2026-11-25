import { createError, isError } from 'h3'
import { describe, expect, it } from 'vitest'
import { mapUpstreamError } from '~~/server/utils/http-errors'
import { UpstreamError, type UpstreamErrorCode } from '~~/server/utils/sportsdb/errors'

const CODES: UpstreamErrorCode[] = ['rate-limited', 'timeout', 'unreachable', 'bad-status', 'invalid-response']

function mapped(code: UpstreamErrorCode) {
  const error = mapUpstreamError(new UpstreamError(code, 'search_all_seasons.php', 500))
  if (!isError(error)) throw new Error('expected an HTTP error')
  return error
}

describe('mapUpstreamError', () => {
  it.each(CODES)('maps %s to a 502 with its reason', (code) => {
    const error = mapped(code)

    expect(error.statusCode).toBe(502)
    expect(error.statusMessage).toBe('Bad Gateway')
    expect(error.data).toEqual({ reason: code })
  })

  it('gives every upstream failure its own message', () => {
    expect(new Set(CODES.map(code => mapped(code).message)).size).toBe(CODES.length)
  })

  it('passes an HTTP error through unchanged', () => {
    const notFound = createError({ statusCode: 404, statusMessage: 'Not Found' })

    expect(mapUpstreamError(notFound)).toBe(notFound)
  })

  it('passes any other error through, so Nitro answers 500 and logs it', () => {
    const bug = new TypeError('Cannot read properties of undefined')

    expect(mapUpstreamError(bug)).toBe(bug)
  })

  it.each(CODES)('never exposes the API key, the upstream host or the endpoint (%s)', (code) => {
    expect(JSON.stringify(mapped(code).toJSON())).not.toMatch(/thesportsdb\.com|\/123\/|\.php/)
  })
})
