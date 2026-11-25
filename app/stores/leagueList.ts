import type { LocationQuery, RouteLocationNormalizedLoaded } from 'vue-router'
import type { League } from '#shared/types/league'
import { patchedQuery, queryValue } from '~/utils/query'
import { matchesQuery } from '~/utils/search'

type QueryPatch = Record<string, string | undefined>

const LIST_PATH = '/'

function isListRoute(route: RouteLocationNormalizedLoaded): boolean {
  return route.path === LIST_PATH
}

/**
 * The list page's state lives in the URL (`?q=`, `?sport=`, `?open=`, `?season=`); this store is
 * its interface. Getters derive from the route and fall back on invalid values; actions write with
 * `router.replace`. Nothing is copied into state, and nothing rewrites the URL on load.
 */
export const useLeagueListStore = defineStore('leagueList', () => {
  // `useRouter().currentRoute`, never `useRoute()`: a store outlives the page it was created on.
  const router = useRouter()
  const leagues = useLeaguesStore()

  // The last query seen on the list route. While another route is current (the league page is
  // loading), it keeps its previous value, so the list neither flashes empty nor jumps.
  const listQuery = computed<LocationQuery>((previous) => {
    const route = router.currentRoute.value
    return isListRoute(route) ? route.query : previous ?? {}
  })

  /** The search text as typed (only folded at match time). */
  const query = computed(() => queryValue(listQuery.value.q) ?? '')

  function knownSport(value: string | undefined): string | undefined {
    return leagues.sportOptions.find(option => option.sport === value)?.sport
  }

  function isShown(league: League, text: string, sportFilter: string | undefined): boolean {
    return (sportFilter === undefined || league.sport === sportFilter) && matchesQuery(league.name, text)
  }

  /** The selected sport, or `undefined` for "all sports" and for any unknown value. */
  const sport = computed(() => knownSport(queryValue(listQuery.value.sport)))

  const hasActiveFilters = computed(() => query.value !== '' || sport.value !== undefined)

  const filtered = computed(() => leagues.leagues.filter(league => isShown(league, query.value, sport.value)))

  /** The expanded league: only an id that is in the filtered list, otherwise `null`. */
  const openId = computed(() => {
    const id = queryValue(listQuery.value.open)
    return filtered.value.find(league => league.id === id)?.id ?? null
  })

  /** `?season=` as written; the open row's panel falls back to the first season it has. */
  const season = computed(() => queryValue(listQuery.value.season))

  // Writes run one after another: each reads `currentRoute` only after the previous `replace`
  // has resolved, so two quick writes both land. Per store instance, never in module scope.
  let pending: Promise<void> = Promise.resolve()

  /**
   * The single writer. `build` receives the current list query and returns the params to change;
   * it runs inside the serialised section, so checks against the current URL see every earlier
   * write. A no-op on another route (the league page is loading). Actions run from user input
   * only, never during SSR.
   */
  function patchQuery(build: (current: LocationQuery) => QueryPatch): Promise<void> {
    const write = pending.then(async () => {
      const route = router.currentRoute.value
      if (!isListRoute(route)) return
      await router.replace({ query: patchedQuery(route.query, build(route.query)) })
    })
    pending = write.catch(() => undefined)
    return write
  }

  /**
   * A filter patch, plus `open` and `season` dropped in the same write when the new filters would
   * hide the open league. Decided on the current URL, inside the serialised section.
   */
  function filterPatch(current: LocationQuery, patch: QueryPatch): QueryPatch {
    const next = patchedQuery(current, patch)
    const openLeague = leagues.leagues.find(league => league.id === queryValue(next.open))
    const visible = !openLeague || isShown(openLeague, queryValue(next.q) ?? '', knownSport(queryValue(next.sport)))
    return visible ? patch : { ...patch, open: undefined, season: undefined }
  }

  function setQuery(text: string): Promise<void> {
    return patchQuery(current => filterPatch(current, { q: text }))
  }

  function setSport(value: string | undefined): Promise<void> {
    return patchQuery(current => filterPatch(current, { sport: value }))
  }

  /** Expands one league (any other closes) on its first season; its panel loads the badges. */
  function open(id: string): Promise<void> {
    return patchQuery(() => ({ open: id, season: undefined }))
  }

  function close(): Promise<void> {
    return patchQuery(() => ({ open: undefined, season: undefined }))
  }

  function toggle(id: string): Promise<void> {
    return openId.value === id ? close() : open(id)
  }

  function setSeason(season: string): Promise<void> {
    return patchQuery(() => ({ season }))
  }

  function reset(): Promise<void> {
    return patchQuery(() => ({ q: undefined, sport: undefined }))
  }

  return {
    query,
    sport,
    hasActiveFilters,
    filtered,
    openId,
    season,
    setQuery,
    setSport,
    reset,
    open,
    close,
    toggle,
    setSeason,
  }
})
