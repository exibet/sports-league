import { describe, expect, it } from 'vitest'
import { apiErrorMessage } from '~/utils/api-error'

describe('apiErrorMessage', () => {
  it('reads the message from the response body', () => {
    const error = { data: { statusCode: 502, message: 'TheSportsDB could not be reached. Try again.' } }

    expect(apiErrorMessage(error, 'fallback')).toBe('TheSportsDB could not be reached. Try again.')
  })

  it.each([
    ['a network error', new TypeError('fetch failed')],
    ['an empty message', { data: { message: '' } }],
    ['a non-JSON body', { data: '<html>' }],
    ['a non-object', 'boom'],
  ])('falls back for %s', (_case, error) => {
    expect(apiErrorMessage(error, 'fallback')).toBe('fallback')
  })
})
