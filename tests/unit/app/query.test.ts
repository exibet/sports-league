import { describe, expect, it } from 'vitest'
import { queryValue } from '~/utils/query'

describe('queryValue', () => {
  it('returns a non-empty string', () => {
    expect(queryValue('soccer')).toBe('soccer')
    expect(queryValue(' padded ')).toBe(' padded ')
  })

  it.each([[['a', 'b']], [''], ['   '], [null], [undefined]])('is undefined for %j', (value) => {
    expect(queryValue(value)).toBeUndefined()
  })
})
