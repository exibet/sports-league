import type { SeasonBadge } from '#shared/types/league'
import { apiErrorMessage } from '~/utils/api-error'

export type BadgeEntry
  = | { status: 'pending' }
    | { status: 'success', badges: SeasonBadge[] }
    | { status: 'error', message: string }

/** The client cache of season badges (R8): one request per league for the session. */
export const useSeasonBadgesStore = defineStore('seasonBadges', () => {
  /** By league id. Plain, serialisable data: SSR hands it to the client in the payload. */
  const entries = ref<Record<string, BadgeEntry>>({})

  // Running requests by league id: per store instance (one per SSR request), never in module
  // scope and never in state, which must serialise.
  const inFlight = new Map<string, Promise<void>>()

  /**
   * Loads the badges of one league once. A repeat call makes no request, parallel calls share
   * one, and a failure is kept only as an error state, so the next call asks again. Never throws.
   */
  function load(id: string): Promise<void> {
    const running = inFlight.get(id)
    if (running) return running
    if (entries.value[id]?.status === 'success') return Promise.resolve()

    entries.value[id] = { status: 'pending' }
    // No automatic retry (see the leagues store); "Try again" calls `load` again.
    const request = $fetch<SeasonBadge[]>(`/api/leagues/${id}/seasons`, { retry: 0 })
      .then((badges) => {
        entries.value[id] = { status: 'success', badges }
      })
      .catch((reason: unknown) => {
        entries.value[id] = {
          status: 'error',
          message: apiErrorMessage(reason, 'TheSportsDB did not answer. Nothing was cached, so a retry asks again.'),
        }
      })
      .finally(() => {
        inFlight.delete(id)
      })
    inFlight.set(id, request)
    return request
  }

  /** Badges that arrived with another response (the league page): cached as if loaded. */
  function seed(id: string, badges: SeasonBadge[]) {
    entries.value[id] = { status: 'success', badges }
  }

  /** The cached badges of a league, or none yet. */
  function badgesOf(id: string): SeasonBadge[] {
    const entry = entries.value[id]
    return entry?.status === 'success' ? entry.badges : []
  }

  return { entries, load, seed, badgesOf }
})
