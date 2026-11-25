import type { League, LeagueList } from '#shared/types/league'
import { apiErrorMessage } from '~/utils/api-error'
import { toSportOptions } from '~/utils/sports'

type LoadStatus = 'idle' | 'pending' | 'success' | 'error'

/** The league list from `/api/leagues`: data, freshness and request status. */
export const useLeaguesStore = defineStore('leagues', () => {
  const leagues = ref<League[]>([])
  const fetchedAt = ref<number>()
  const status = ref<LoadStatus>('idle')
  const error = ref<string>()

  // Per store instance (one per SSR request), never in module scope or in serialised state.
  let inFlight: Promise<void> | null = null

  const sportOptions = computed(() => toSportOptions(leagues.value))

  /**
   * Loads until it succeeds once: a repeat call after a success makes no request, a call after a
   * failure retries, parallel calls share one request. Never throws: failures land in `error`.
   */
  function load(): Promise<void> {
    if (inFlight) return inFlight
    if (status.value === 'success') return Promise.resolve()
    status.value = 'pending'
    error.value = undefined
    // No automatic retry: ofetch repeats a failed GET once, which on a rate limit doubles the
    // pressure; the user retries explicitly ("Try again").
    inFlight = $fetch<LeagueList>('/api/leagues', { retry: 0 })
      .then((list) => {
        leagues.value = list.leagues
        fetchedAt.value = list.fetchedAt
        status.value = 'success'
      })
      .catch((reason: unknown) => {
        error.value = apiErrorMessage(reason, 'TheSportsDB is not responding right now. Try again in a moment.')
        status.value = 'error'
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }

  return { leagues, fetchedAt, status, error, sportOptions, load }
})
