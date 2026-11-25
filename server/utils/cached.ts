// Upstream calls behind Nitro's cache (docs/decisions.md §3.2). `defineCachedFunction` and
// `useRuntimeConfig` are Nitro auto-imports; everything of our own is imported explicitly.
import type { H3Event } from 'h3'
import type { LeagueList, SeasonBadge } from '#shared/types/league'
import { fetchUpstream, type UpstreamClientOptions } from './sportsdb/client'
import { normaliseLeagues, normaliseSeasons } from './sportsdb/normalise'

const UPSTREAM_TIMEOUT_MS = 8_000

/** Seconds. Leagues match the upstream `max-age`; archive seasons never change. */
export const LEAGUES_MAX_AGE = 60 * 60 * 4
export const SEASONS_MAX_AGE = 60 * 60 * 24 * 7

/** Browser 60 s; the CDN keeps it for `ttl` and may serve it stale while revalidating. */
export function cacheControl(ttl: number): string {
  return `public, max-age=60, s-maxage=${ttl}, stale-while-revalidate=${ttl}`
}

function upstream(event: H3Event): UpstreamClientOptions {
  const config = useRuntimeConfig(event)
  return { baseUrl: config.sportsdbBaseUrl, apiKey: config.sportsdbApiKey, timeoutMs: UPSTREAM_TIMEOUT_MS }
}

// `event` comes first so stale-while-revalidate refreshes survive on serverless (`waitUntil`).
// A thrown error is never stored, so a failure is retried by the next request.
export const getLeagues = defineCachedFunction(
  async (event: H3Event): Promise<LeagueList> => {
    const leagues = normaliseLeagues(await fetchUpstream(upstream(event), 'all_leagues.php'))
    return { leagues, fetchedAt: Date.now() }
  },
  { name: 'leagues', getKey: () => 'all', maxAge: LEAGUES_MAX_AGE, swr: true },
)

export const getSeasons = defineCachedFunction(
  async (event: H3Event, id: string): Promise<SeasonBadge[]> =>
    normaliseSeasons(await fetchUpstream(upstream(event), 'search_all_seasons.php', { badge: 1, id })),
  { name: 'seasons', getKey: (_event: H3Event, id: string) => id, maxAge: SEASONS_MAX_AGE, swr: true },
)
