import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { cleanDescription, normaliseDetails } from '~~/server/utils/sportsdb/normalise'
import { readJsonFixture } from './fixtures'

const DETAIL_FILES = readdirSync(new URL('../../fixtures/upstream/details/', import.meta.url))

const EPL = {
  idLeague: '4328',
  strLeague: 'English Premier League',
  strSport: 'Soccer',
  strCountry: 'England',
  intFormedYear: '1992',
  strCurrentSeason: '2026-2027',
  strWebsite: 'www.premierleague.com',
  strBadge: 'https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png',
  strDescriptionEN: 'The Premier League is the top level.\r\n\r\nIt was founded in 1992.',
}

describe('normaliseDetails', () => {
  it('maps a league to LeagueDetails', () => {
    expect(normaliseDetails({ leagues: [EPL] })).toEqual({
      id: '4328',
      name: 'English Premier League',
      sport: 'Soccer',
      country: 'England',
      formedYear: '1992',
      currentSeason: '2026-2027',
      website: 'https://www.premierleague.com',
      logoUrl: 'https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png/small',
      description: 'The Premier League is the top level.',
    })
  })

  it.each([
    ['www.uefa.com/champions', 'https://www.uefa.com/champions'],
    ['http://example.test', 'http://example.test'],
    ['https://example.test/path', 'https://example.test/path'],
    ['', null],
    [null, null],
    ['www.a.com, www.b.com', null],
  ])('website %j → %j', (strWebsite, website) => {
    expect(normaliseDetails({ leagues: [{ ...EPL, strWebsite }] }).website).toBe(website)
  })

  it.each([['', null], [null, null]])('a missing logo (%j) is null', (strBadge, logoUrl) => {
    expect(normaliseDetails({ leagues: [{ ...EPL, strBadge }] }).logoUrl).toBe(logoUrl)
  })

  it.each([
    ['leagues: null', { leagues: null }],
    ['an empty list', { leagues: [] }],
    ['no leagues key', {}],
    ['a string', 'error'],
    ['a league without a name', { leagues: [{ ...EPL, strLeague: ' ' }] }],
  ])('throws invalid-response for %s (an id from the list must have details)', (_case, payload) => {
    expect(() => normaliseDetails(payload)).toThrow(expect.objectContaining({ code: 'invalid-response' }))
  })
})

describe('cleanDescription', () => {
  it.each([
    ['Serie A (Italian pronunciation: ) is the top league.', 'Serie A is the top league.'],
    [
      'The Eredivisie (Dutch pronunciation: ; "Honour Division") is the top league.',
      'The Eredivisie ("Honour Division") is the top league.',
    ],
    ['No fragments here.', 'No fragments here.'],
    // A fragment that does not open the parentheses is left alone rather than eating the text.
    ['La (officially LaLiga, Spanish pronunciation: ) Liga.', 'La (officially LaLiga, Spanish pronunciation: ) Liga.'],
  ])('%j → %j', (description, cleaned) => {
    expect(cleanDescription(description)).toBe(cleaned)
  })

  it('keeps the first paragraph only', () => {
    expect(cleanDescription('First paragraph.\n\nSecond paragraph.\r\n\r\nThird.')).toBe('First paragraph.')
  })

  it('is empty without a description', () => {
    expect(cleanDescription(null)).toBe('')
  })
})

describe('real lookupleague captures', () => {
  it.each(DETAIL_FILES)('normalises %s into readable details', (file) => {
    const details = normaliseDetails(readJsonFixture(`details/${file}`))

    expect(details.name).not.toBe('')
    expect(details.website ?? 'https://').toMatch(/^https?:\/\//)
    expect(details.description).not.toMatch(/pronunciation:|\(\s*\)|\n/)
  })

  it.each([
    ['4332.json', /^The Serie A, officially known as/],
    ['4337.json', /^The Eredivisie \("Honour Division" or "Premier Division"\), also known as/],
  ])('cleans the pronunciation fragment in %s', (file, start) => {
    expect(normaliseDetails(readJsonFixture(`details/${file}`)).description).toMatch(start)
  })
})
