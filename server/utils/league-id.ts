import { createError } from 'h3'
import type { League } from '#shared/types/league'

const DIGITS = /^\d+$/

/**
 * The league id from the URL must be digits (400). Checked first, before anything is loaded, so a
 * malformed id never costs an upstream call and never turns into a 502.
 */
export function parseLeagueId(raw: string | undefined): string {
  if (raw === undefined || !DIGITS.test(raw)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'The league id must be a number.' })
  }
  return raw
}

/**
 * The id must belong to the cached league list (404), before any per-league upstream call:
 * crawlers cannot burn the rate limit or grow the cache with made-up ids.
 */
export function assertKnownLeague(id: string, leagues: readonly League[]): void {
  if (!leagues.some(league => league.id === id)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'There is no league with this id.' })
  }
}
