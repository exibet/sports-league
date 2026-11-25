import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import type { Router } from 'vue-router'
import { useLeagueListStore } from '~/stores/leagueList'
import { useLeaguesStore } from '~/stores/leagues'
import { LEAGUES } from '../helpers/leagues'

const OTHER_ROUTE = '/elsewhere'

function setup() {
  setActivePinia(createPinia())
  const leagues = useLeaguesStore()
  leagues.$patch({ leagues: LEAGUES, status: 'success' })
  return useLeagueListStore()
}

describe('league list store: search and sport', () => {
  let router: Router

  beforeEach(async () => {
    router = useRouter()
    if (!router.hasRoute('elsewhere')) {
      router.addRoute({ name: 'elsewhere', path: OTHER_ROUTE, component: defineComponent({ render: () => null }) })
    }
    await router.replace('/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('derives query and sport from the current route', async () => {
    await router.replace({ path: '/', query: { q: 'liga', sport: 'Soccer' } })
    const store = setup()

    expect(store.query).toBe('liga')
    expect(store.sport).toBe('Soccer')
  })

  it.each([
    ['an unknown sport', { sport: 'Curling' }],
    ['an array', { sport: ['Soccer', 'NBA'], q: ['a', 'b'] }],
    ['empty values', { sport: '', q: '' }],
  ])('falls back for %s without throwing and without any replace', async (_case, query) => {
    await router.replace({ path: '/', query })
    const replace = vi.spyOn(router, 'replace')

    const store = setup()

    expect(store.query).toBe('')
    expect(store.sport).toBeUndefined()
    expect(store.filtered).toHaveLength(LEAGUES.length)
    expect(replace).not.toHaveBeenCalled()
  })

  it('makes no replace during store setup', async () => {
    await router.replace({ path: '/', query: { q: 'premier' } })
    const replace = vi.spyOn(router, 'replace')

    setup()

    expect(replace).not.toHaveBeenCalled()
  })

  it('filtered applies the search and the sport', async () => {
    await router.replace({ path: '/', query: { q: 'premier' } })
    const store = setup()
    expect(store.filtered.map(league => league.id)).toEqual(['4328', '4330'])

    await router.replace({ path: '/', query: { q: 'league', sport: 'Soccer' } })
    expect(store.filtered.map(league => league.id)).toEqual(['4328', '4329', '4330', '4336', '4338'])

    await router.replace({ path: '/', query: { sport: 'Basketball' } })
    expect(store.filtered.map(league => league.name)).toEqual(['NBA'])
  })

  it('setQuery and setSport call replace once with the merged query, empty values removed', async () => {
    await router.replace({ path: '/', query: { ref: 'mail', sport: 'Soccer' } })
    const store = setup()
    const replace = vi.spyOn(router, 'replace')

    await store.setQuery('liga')
    expect(replace).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query).toEqual({ ref: 'mail', sport: 'Soccer', q: 'liga' })

    await store.setSport(undefined)
    expect(replace).toHaveBeenCalledTimes(2)
    expect(router.currentRoute.value.query).toEqual({ ref: 'mail', q: 'liga' })
  })

  it('writes the text as typed; only blank values are dropped', async () => {
    const store = setup()

    await store.setQuery('english ')
    expect(router.currentRoute.value.query).toEqual({ q: 'english ' })

    await store.setQuery('   ')
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('reset clears q and sport in one replace', async () => {
    await router.replace({ path: '/', query: { q: 'liga', sport: 'Soccer', ref: 'mail' } })
    const store = setup()
    const replace = vi.spyOn(router, 'replace')

    await store.reset()

    expect(replace).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query).toEqual({ ref: 'mail' })
  })

  it('two writes in a row both end up in the URL', async () => {
    const store = setup()

    await Promise.all([store.setQuery('liga'), store.setSport('Soccer')])

    expect(router.currentRoute.value.query).toEqual({ q: 'liga', sport: 'Soccer' })
  })

  it('keeps the param order, so an unchanged query stays the same URL', async () => {
    await router.replace({ path: '/', query: { sport: 'Soccer', q: 'liga' } })
    const store = setup()

    await store.setSport('Soccer')
    expect(router.currentRoute.value.fullPath).toBe('/?sport=Soccer&q=liga')

    await store.setQuery('league')
    expect(router.currentRoute.value.fullPath).toBe('/?sport=Soccer&q=league')
  })

  it('keeps the last list values on another route, where writes are no-ops', async () => {
    await router.replace({ path: '/', query: { q: 'liga', sport: 'Soccer' } })
    const store = setup()
    expect(store.query).toBe('liga')

    await router.push(OTHER_ROUTE)
    const replace = vi.spyOn(router, 'replace')

    expect(store.query).toBe('liga')
    expect(store.sport).toBe('Soccer')
    await store.setQuery('premier')
    await store.reset()
    expect(replace).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe(OTHER_ROUTE)
  })

  it('hasActiveFilters', async () => {
    const store = setup()
    expect(store.hasActiveFilters).toBe(false)

    await store.setQuery('  ')
    expect(store.hasActiveFilters).toBe(false)

    await store.setQuery('liga')
    expect(store.hasActiveFilters).toBe(true)

    await store.reset()
    await store.setSport('Motorsport')
    expect(store.hasActiveFilters).toBe(true)

    await router.replace({ path: '/', query: { sport: 'Curling' } })
    expect(store.hasActiveFilters).toBe(false)
  })
})
