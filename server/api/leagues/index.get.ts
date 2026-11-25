import { defineEventHandler, setResponseHeader } from 'h3'
import type { LeagueList } from '#shared/types/league'
import { cacheControl, getLeagues, LEAGUES_MAX_AGE } from '#server/utils/cached'
import { mapUpstreamError } from '#server/utils/http-errors'

export default defineEventHandler(async (event): Promise<LeagueList> => {
  try {
    const list = await getLeagues(event)
    // On success only: an error response must never be cached by the browser or the CDN.
    setResponseHeader(event, 'Cache-Control', cacheControl(LEAGUES_MAX_AGE))
    return list
  }
  catch (error) {
    throw mapUpstreamError(error)
  }
})
