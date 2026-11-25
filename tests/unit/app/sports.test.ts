import { describe, expect, it } from 'vitest'
import { GENERIC_SPORT_ICON, sportIcon, toSportOptions } from '~/utils/sports'

const league = (id: string, sport: string) => ({ id, name: `League ${id}`, sport })

describe('toSportOptions', () => {
  it('derives sorted options with counts from the leagues', () => {
    const leagues = [league('1', 'Soccer'), league('2', 'Motorsport'), league('3', 'Soccer'), league('4', 'Basketball')]

    expect(toSportOptions(leagues)).toEqual([
      { sport: 'Basketball', count: 1 },
      { sport: 'Motorsport', count: 1 },
      { sport: 'Soccer', count: 2 },
    ])
  })

  it('yields one option for a single sport', () => {
    expect(toSportOptions([league('1', 'Soccer'), league('2', 'Soccer')])).toEqual([{ sport: 'Soccer', count: 2 }])
  })

  it('yields none for no leagues', () => {
    expect(toSportOptions([])).toEqual([])
  })
})

describe('sportIcon', () => {
  it('has an icon for each known sport', () => {
    expect(sportIcon('Soccer')).toBe('tabler:ball-football')
    expect(sportIcon('Basketball')).toBe('tabler:ball-basketball')
    expect(sportIcon('Motorsport')).toBe('tabler:flag')
  })

  it('falls back to a generic icon', () => {
    expect(sportIcon('Curling')).toBe(GENERIC_SPORT_ICON)
  })
})
