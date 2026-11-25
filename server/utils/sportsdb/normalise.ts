// The only place upstream field names (`idLeague`, `strBadge`, …) appear. Payloads arrive as
// `unknown` from the client; every field is checked before it is used.
import type { League, SeasonBadge } from '#shared/types/league'
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
