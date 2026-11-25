import { defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import type { SeasonBadge } from '#shared/types/league'
import { cacheControl, getLeagues, getSeasons, SEASONS_MAX_AGE } from '#server/utils/cached'
import { mapUpstreamError } from '#server/utils/http-errors'
import { assertKnownLeague, parseLeagueId } from '#server/utils/league-id'

export default defineEventHandler(async (event): Promise<SeasonBadge[]> => {
  const id = parseLeagueId(getRouterParam(event, 'id'))
  try {
    // Only ids from the cached league list reach the per-league upstream call.
    const { leagues } = await getLeagues(event)
    assertKnownLeague(id, leagues)
    const seasons = await getSeasons(event, id)
    setResponseHeader(event, 'Cache-Control', cacheControl(SEASONS_MAX_AGE))
    return seasons
  }
  catch (error) {
    throw mapUpstreamError(error)
  }
})
