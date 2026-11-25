import { describe, expect, it } from 'vitest'
import { foldText, highlightRanges, matchesQuery } from '~/utils/search'

/** The highlighted fragments, read back from the original string. */
function fragments(text: string, query: string): string[] {
  return highlightRanges(text, query).map(([start, end]) => text.slice(start, end))
}

describe('foldText', () => {
  it('lowercases, trims and collapses inner whitespace', () => {
    expect(foldText('  English   Premier\tLeague ')).toBe('english premier league')
  })

  it('strips diacritics per character', () => {
    expect(foldText('Atlético Ñandú Ligue Élite')).toBe('atletico nandu ligue elite')
  })
})

describe('matchesQuery', () => {
  it.each(['', '   ', '\t'])('an empty or whitespace-only query (%j) matches everything', (query) => {
    expect(matchesQuery('English Premier League', query)).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchesQuery('English Premier League', 'premier')).toBe(true)
    expect(matchesQuery('English Premier League', 'PREMIER league')).toBe(true)
  })

  it('matches across accents in either direction', () => {
    expect(matchesQuery('Belgian Jupilér League', 'jupiler')).toBe(true)
    expect(matchesQuery('Belgian Jupiler League', 'Jupilér')).toBe(true)
  })

  it('ignores extra whitespace in the query and the name', () => {
    expect(matchesQuery('English  Premier League', '  english   premier ')).toBe(true)
  })

  it('does not match a missing word', () => {
    expect(matchesQuery('English Premier League', 'bundesliga')).toBe(false)
  })

  it('treats regex characters literally', () => {
    expect(matchesQuery('Serie A', '.*')).toBe(false)
    expect(matchesQuery('A (B) League', '(b)')).toBe(true)
  })
})

describe('highlightRanges', () => {
  it('returns [start, end) ranges in the original string', () => {
    expect(highlightRanges('English Premier League', 'premier')).toEqual([[8, 15]])
  })

  it('keeps original indices when a diacritic precedes the match', () => {
    expect(fragments('Ligué Jupiler League', 'jupiler')).toEqual(['Jupiler'])
  })

  it('covers a matched accented character whole', () => {
    expect(fragments('Belgian Jupilér League', 'jupiler')).toEqual(['Jupilér'])
  })

  it('works with decomposed accents in the original', () => {
    const decomposed = 'Jupilér League'
    expect(fragments(decomposed, 'jupiler')).toEqual(['Jupilér'])
  })

  it('stays aligned when several spaces precede the match', () => {
    expect(fragments('English    Premier League', 'premier')).toEqual(['Premier'])
  })

  it('stays aligned when several spaces sit inside the match', () => {
    expect(fragments('English    Premier League', 'english premier')).toEqual(['English    Premier'])
  })

  it('returns every occurrence', () => {
    expect(fragments('Liga Liga', 'liga')).toEqual(['Liga', 'Liga'])
  })

  it('returns no ranges without a match or for an empty query', () => {
    expect(highlightRanges('English Premier League', 'bundesliga')).toEqual([])
    expect(highlightRanges('English Premier League', '  ')).toEqual([])
  })
})
