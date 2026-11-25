import { defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import type { LeagueDetailsResponse } from '#shared/types/league'
import { cacheControl, DETAILS_MAX_AGE, getDetails, getLeagues, getSeasons } from '#server/utils/cached'
import { mapUpstreamError } from '#server/utils/http-errors'
import { assertKnownLeague, parseLeagueId } from '#server/utils/league-id'

export default defineEventHandler(async (event): Promise<LeagueDetailsResponse> => {
  const id = parseLeagueId(getRouterParam(event, 'id'))
  try {
    const { leagues } = await getLeagues(event)
    assertKnownLeague(id, leagues)
    // Seasons share the cache of the seasons route.
    const [details, seasons] = await Promise.all([getDetails(event, id), getSeasons(event, id)])
    setResponseHeader(event, 'Cache-Control', cacheControl(DETAILS_MAX_AGE))
    return { details, seasons }
  }
  catch (error) {
    throw mapUpstreamError(error)
  }
})
