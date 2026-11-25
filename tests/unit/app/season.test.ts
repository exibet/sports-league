import { describe, expect, it } from 'vitest'
import { shortSeason } from '~/utils/season'

describe('shortSeason', () => {
  it.each([
    ['1992-1993', '1992/93'],
    ['1999-2000', '1999/00'],
    ['1950', '1950'],
    ['2020-21', '2020-21'],
    ['Season 1', 'Season 1'],
    ['', ''],
  ])('%j → %j', (season, label) => {
    expect(shortSeason(season)).toBe(label)
  })
})
