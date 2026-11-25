// The only place upstream field names (`idLeague`, `strBadge`, …) appear. Payloads arrive as
// `unknown` from the client; every field is checked before it is used.
import type { League, LeagueDetails, SeasonBadge } from '#shared/types/league'
import { UpstreamError } from './errors'

const SMALL_SUFFIX = '/small'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** TheSportsDB serves a ~20 KB variant of every image at `<url>/small` (docs/api.md). */
export function smallImage(url: string): string {
  return url.endsWith(SMALL_SUFFIX) ? url : `${url}${SMALL_SUFFIX}`
}

/**
 * `all_leagues.php` → `League[]`. A missing or non-array `leagues`, or a list in which no entry
 * is a league, is an upstream failure, not an empty list: caching `[]` would hide every league
 * for the cache's lifetime.
 */
export function normaliseLeagues(payload: unknown): League[] {
  const leagues = isRecord(payload) ? payload.leagues : undefined
  if (!Array.isArray(leagues)) {
    throw new UpstreamError('invalid-response', 'all_leagues.php')
  }
  const mapped = leagues.flatMap((entry: unknown) => {
    if (!isRecord(entry)) return []
    const { idLeague, strLeague, strSport } = entry
    if (typeof idLeague !== 'string' || typeof strLeague !== 'string' || typeof strSport !== 'string') {
      return []
    }
    return [{ id: idLeague, name: strLeague, sport: strSport }]
  })
  if (leagues.length > 0 && mapped.length === 0) {
    throw new UpstreamError('invalid-response', 'all_leagues.php')
  }
  return mapped
}

/**
 * `search_all_seasons.php?badge=1` → `SeasonBadge[]`, in upstream order (oldest first). Seasons
 * without a badge are dropped; `seasons: null` (unknown id) and the error string (invalid id)
 * mean "no badges". A payload without a `seasons` key is an upstream failure, not "no badges".
 */
export function normaliseSeasons(payload: unknown): SeasonBadge[] {
  if (!isRecord(payload) || !('seasons' in payload)) {
    throw new UpstreamError('invalid-response', 'search_all_seasons.php')
  }
  const { seasons } = payload
  if (!Array.isArray(seasons)) {
    return []
  }
  return seasons.flatMap((entry: unknown) => {
    if (!isRecord(entry)) return []
    const { strSeason, strBadge } = entry
    if (typeof strSeason !== 'string' || typeof strBadge !== 'string' || strBadge === '') {
      return []
    }
    return [{ season: strSeason, badgeUrl: smallImage(strBadge) }]
  })
}

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''

/** `www.example.com` → `https://www.example.com`; empty or not a URL → `null`. */
function website(value: unknown): string | null {
  const url = text(value)
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`
  return url && URL.canParse(withScheme) ? withScheme : null
}

// Upstream stripped the IPA from descriptions and left fragments such as `(Italian pronunciation: )`
// or `(Dutch pronunciation: ; "Honour Division")`. Drop the fragment, then any parentheses left empty.
// Only a fragment right after the opening parenthesis is dropped; other text there is kept.
const PRONUNCIATION = /\([\p{L} ]*pronunciation:\s*[;,]?\s*/gu
const EMPTY_PARENTHESES = /\s*\(\s*\)/g

/** The first paragraph of an upstream description, without the leftover pronunciation fragments. */
export function cleanDescription(value: unknown): string {
  const [firstParagraph = ''] = text(value).split(/\r?\n\s*\r?\n/)
  return firstParagraph.replace(PRONUNCIATION, '(').replace(EMPTY_PARENTHESES, '').trim()
}

/**
 * `lookupleague.php` → `LeagueDetails`. The route asks only for ids from the league list, so a
 * payload without that league (`leagues: null`, no name) is an upstream failure: never cached,
 * retried by the next request, rather than a 404 kept for a day.
 */
export function normaliseDetails(payload: unknown): LeagueDetails {
  const [league] = isRecord(payload) && Array.isArray(payload.leagues) ? payload.leagues : []
  if (!isRecord(league) || typeof league.idLeague !== 'string' || !text(league.strLeague)) {
    throw new UpstreamError('invalid-response', 'lookupleague.php')
  }
  const logo = text(league.strBadge)
  return {
    id: league.idLeague,
    name: text(league.strLeague),
    sport: text(league.strSport),
    country: text(league.strCountry),
    formedYear: text(league.intFormedYear),
    currentSeason: text(league.strCurrentSeason),
    website: website(league.strWebsite),
    logoUrl: logo ? smallImage(logo) : null,
    description: cleanDescription(league.strDescriptionEN),
  }
}
