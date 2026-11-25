import { describe, expect, it } from 'vitest'
import { patchedQuery, queryValue } from '~/utils/query'

describe('queryValue', () => {
  it('returns a non-empty string', () => {
    expect(queryValue('soccer')).toBe('soccer')
    expect(queryValue(' padded ')).toBe(' padded ')
  })

  it.each([[['a', 'b']], [''], [null], [undefined]])('is undefined for %j', (value) => {
    expect(queryValue(value)).toBeUndefined()
  })
})

describe('patchedQuery', () => {
  it('sets values and keeps unrelated params', () => {
    expect(patchedQuery({ q: 'liga', ref: 'mail' }, { sport: 'Soccer' }))
      .toEqual({ q: 'liga', ref: 'mail', sport: 'Soccer' })
  })

  it('drops keys patched to undefined, empty or blank', () => {
    const current = { q: 'liga', sport: 'Soccer', open: '4328' }

    expect(patchedQuery(current, { q: '', sport: undefined, open: '  ' })).toEqual({})
  })

  it('keeps a value as typed, trailing space included', () => {
    expect(patchedQuery({}, { q: 'english ' })).toEqual({ q: 'english ' })
  })

  it('does not change the current query', () => {
    const current = { q: 'liga' }
    patchedQuery(current, { q: undefined })
    expect(current).toEqual({ q: 'liga' })
  })
})
