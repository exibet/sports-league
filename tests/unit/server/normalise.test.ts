import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { UpstreamError } from '~~/server/utils/sportsdb/errors'
import { normaliseLeagues, normaliseSeasons, smallImage } from '~~/server/utils/sportsdb/normalise'
import { readJsonFixture } from './fixtures'

const SEASON_FILES = readdirSync(new URL('../../fixtures/upstream/seasons/', import.meta.url))

describe('normaliseLeagues', () => {
  it('maps the live list to League, in upstream order', () => {
    const leagues = normaliseLeagues(readJsonFixture('all_leagues.live.json'))

    expect(leagues).toHaveLength(10)
    expect(leagues[0]).toEqual({ id: '4328', name: 'English Premier League', sport: 'Soccer' })
    expect(new Set(leagues.map(league => league.sport))).toEqual(new Set(['Soccer']))
  })

  it('keeps every sport of the mixed list', () => {
    const leagues = normaliseLeagues(readJsonFixture('all_leagues.mixed.json'))

    expect(leagues).toHaveLength(12)
    expect(leagues.slice(-2)).toEqual([
      { id: '4387', name: 'NBA', sport: 'Basketball' },
      { id: '4370', name: 'Formula 1', sport: 'Motorsport' },
    ])
  })

  it.each([
    ['leagues: null', { leagues: null }],
    ['leagues as a string', { leagues: 'Invalid' }],
    ['no leagues key', {}],
    ['a non-object payload', 'error'],
  ])('throws invalid-response for %s, never an empty list', (_case, payload) => {
    expect(() => normaliseLeagues(payload)).toThrow(UpstreamError)
    expect(() => normaliseLeagues(payload)).toThrow(expect.objectContaining({ code: 'invalid-response' }))
  })

  it('throws invalid-response when no entry of a non-empty list is a league', () => {
    const payload = { leagues: [{ idLeague: 1 }, null, 'x'] }

    expect(() => normaliseLeagues(payload)).toThrow(expect.objectContaining({ code: 'invalid-response' }))
  })

  it('returns [] for an empty list', () => {
    expect(normaliseLeagues({ leagues: [] })).toEqual([])
  })

  it('skips entries without the three string fields', () => {
    const payload = { leagues: [
      { idLeague: '1', strLeague: 'Kept', strSport: 'Soccer' },
      { idLeague: 2, strLeague: 'Numeric id', strSport: 'Soccer' },
      { idLeague: '3', strLeague: null, strSport: 'Soccer' },
      null,
    ] }

    expect(normaliseLeagues(payload)).toEqual([{ id: '1', name: 'Kept', sport: 'Soccer' }])
  })
})

describe('normaliseSeasons', () => {
  it('maps seasons with badges in upstream order', () => {
    const seasons = normaliseSeasons(readJsonFixture('seasons/4328.json'))

    expect(seasons.map(badge => badge.season))
      .toEqual(['1992-1993', '1993-1994', '1994-1995', '1995-1996', '1996-1997'])
    expect(seasons[0]).toEqual({
      season: '1992-1993',
      badgeUrl: '{{FIXTURE_ORIGIN}}/images/media/league/badgearchive/02egea1661959225.png/small',
    })
  })

  it('keeps single-year seasons as they are', () => {
    expect(normaliseSeasons(readJsonFixture('seasons/4370.json')).map(badge => badge.season))
      .toEqual(['1950', '1951', '1952', '1953', '1954'])
  })

  it('drops seasons whose badge is null', () => {
    const payload = { seasons: [
      { strSeason: '2000-2001', strBadge: null },
      { strSeason: '2001-2002', strBadge: 'https://img.test/b.png' },
      { strSeason: '2002-2003', strBadge: '' },
    ] }

    expect(normaliseSeasons(payload)).toEqual([{ season: '2001-2002', badgeUrl: 'https://img.test/b.png/small' }])
  })

  it.each(['seasons/4329.json', 'seasons/4338.json'])('returns [] when every badge is null (%s)', (file) => {
    expect(normaliseSeasons(readJsonFixture(file))).toEqual([])
  })

  it('returns [] for {"seasons":null} (unknown id)', () => {
    expect(normaliseSeasons(readJsonFixture('seasons-unknown-id.json'))).toEqual([])
  })

  it('returns [] for the error string (invalid id)', () => {
    expect(normaliseSeasons(readJsonFixture('seasons-invalid-id.json'))).toEqual([])
  })

  it.each([
    ['no seasons key', {}],
    ['a non-object payload', 'error'],
    ['null', null],
  ])('throws invalid-response for %s', (_case, payload) => {
    expect(() => normaliseSeasons(payload)).toThrow(expect.objectContaining({ code: 'invalid-response' }))
  })

  it.each(SEASON_FILES)('normalises fixture %s into well-formed badges', (file) => {
    for (const badge of normaliseSeasons(readJsonFixture(`seasons/${file}`))) {
      expect(badge.season).toMatch(/^\d{4}(-\d{4})?$/)
      expect(badge.badgeUrl).toMatch(/\.png\/small$/)
    }
  })
})

describe('smallImage', () => {
  it('appends /small exactly once', () => {
    expect(smallImage('https://img.test/a.png')).toBe('https://img.test/a.png/small')
    expect(smallImage('https://img.test/a.png/small')).toBe('https://img.test/a.png/small')
  })
})
