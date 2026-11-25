import type { LeagueDetails, LeagueDetailsResponse } from '#shared/types/league'
import { apiErrorMessage, apiErrorStatus } from '~/utils/api-error'

type DetailsEntry
  = | { status: 'pending' }
    | { status: 'success', details: LeagueDetails }
    | { status: 'not-found' }
    | { status: 'error', message: string }

/** League page data. Its seasons go into the badge cache, so the list reuses them. */
export const useLeagueDetailsStore = defineStore('leagueDetails', () => {
  const badges = useSeasonBadgesStore()

  /** By league id; plain, serialisable data. */
  const entries = ref<Record<string, DetailsEntry>>({})
  // Per store instance, never in module scope or in state.
  const inFlight = new Map<string, Promise<void>>()

  /** Loads once; a known 404 is final, a failure is retried by the next call. Never throws. */
  function load(id: string): Promise<void> {
    const running = inFlight.get(id)
    if (running) return running
    const status = entries.value[id]?.status
    if (status === 'success' || status === 'not-found') return Promise.resolve()

    entries.value[id] = { status: 'pending' }
    const request = $fetch<LeagueDetailsResponse>(`/api/leagues/${id}`, { retry: 0 })
      .then(({ details, seasons }) => {
        entries.value[id] = { status: 'success', details }
        badges.seed(id, seasons)
      })
      .catch((reason: unknown) => {
        entries.value[id] = apiErrorStatus(reason) === 404
          ? { status: 'not-found' }
          : { status: 'error', message: apiErrorMessage(reason, 'TheSportsDB did not answer. Try again.') }
      })
      .finally(() => inFlight.delete(id))
    inFlight.set(id, request)
    return request
  }

  return { entries, load }
})
