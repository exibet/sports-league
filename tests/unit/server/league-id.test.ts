import { isError } from 'h3'
import { describe, expect, it } from 'vitest'
import { assertKnownLeague, parseLeagueId } from '~~/server/utils/league-id'

function statusOf(run: () => unknown): number | undefined {
  try {
    run()
    return undefined
  }
  catch (error) {
    return isError(error) ? error.statusCode : undefined
  }
}

describe('parseLeagueId', () => {
  it.each(['abc', '', '12a', ' 4328', '-1', '4.5', undefined])('rejects %j with 400', (raw) => {
    expect(statusOf(() => parseLeagueId(raw))).toBe(400)
  })

  it.each(['4328', '0', '123456789012345678901234567890'])('accepts digits (%s)', (raw) => {
    expect(parseLeagueId(raw)).toBe(raw)
  })
})

describe('assertKnownLeague', () => {
  const known = new Set(['4328', '4329'])

  it.each(['999999', '0', '123456789012345678901234567890'])('answers 404 for unknown id %s', (id) => {
    expect(statusOf(() => assertKnownLeague(id, known))).toBe(404)
  })

  it('accepts a known id', () => {
    expect(statusOf(() => assertKnownLeague('4328', known))).toBeUndefined()
  })
})
