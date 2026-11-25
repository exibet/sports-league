import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'
import { useLeagueListStore } from '~/stores/leagueList'
import { useLeaguesStore } from '~/stores/leagues'
import { LEAGUES } from '../helpers/leagues'

let router: Router
const urlQuery = () => router.currentRoute.value.query

function setup() {
  setActivePinia(createPinia())
  useLeaguesStore().$patch({ leagues: LEAGUES, status: 'success' })
  return useLeagueListStore()
}

describe('league list store: accordion', () => {
  beforeEach(async () => {
    router = useRouter()
    await router.replace('/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('openId derives from the route', async () => {
    await router.replace({ query: { open: '4328' } })

    expect(setup().openId).toBe('4328')
  })

  it.each([
    ['an unknown id', { open: '999999' }],
    ['an id filtered out by the search', { open: '4387', q: 'premier' }],
    ['an id filtered out by the sport', { open: '4387', sport: 'Soccer' }],
    ['an array', { open: ['4328', '4330'] }],
  ])('openId is undefined for %s', async (_case, query) => {
    await router.replace({ query })

    expect(setup().openId).toBeUndefined()
  })

  it('open(id) sets open and clears season in the same replace', async () => {
    await router.replace({ query: { q: 'league', open: '4330', season: '2012-2013' } })
    const store = setup()
    const replace = vi.spyOn(router, 'replace')

    await store.open('4328')

    expect(replace).toHaveBeenCalledTimes(1)
    expect(urlQuery()).toEqual({ q: 'league', open: '4328' })
  })

  it('opening another league replaces the first; toggling the open one closes it', async () => {
    const store = setup()

    await store.open('4328')
    await store.toggle('4330')
    expect(store.openId).toBe('4330')

    await store.toggle('4330')
    expect(store.openId).toBeUndefined()
  })

  it('close() drops open and season', async () => {
    await router.replace({ query: { q: 'league', open: '4328', season: '1993-1994' } })
    const store = setup()

    await store.close()

    expect(urlQuery()).toEqual({ q: 'league' })
  })

  it('a search that hides the open league drops open and season in the same replace', async () => {
    await router.replace({ query: { open: '4328', season: '1993-1994' } })
    const store = setup()
    const replace = vi.spyOn(router, 'replace')

    await store.setQuery('bundesliga')

    expect(replace).toHaveBeenCalledTimes(1)
    expect(urlQuery()).toEqual({ q: 'bundesliga' })
  })

  it('a sport that hides the open league drops open and season', async () => {
    await router.replace({ query: { open: '4387', season: '1960-1961' } })
    const store = setup()

    await store.setSport('Soccer')

    expect(urlQuery()).toEqual({ sport: 'Soccer' })
  })

  it('a filter that keeps the open league visible keeps open and season', async () => {
    await router.replace({ query: { open: '4328', season: '1993-1994' } })
    const store = setup()

    await store.setQuery('premier')
    await store.setSport('Soccer')

    expect(urlQuery()).toEqual({ open: '4328', season: '1993-1994', q: 'premier', sport: 'Soccer' })
  })

  it('open(id) then setQuery in the same tick: the hide-check sees the new open', async () => {
    const store = setup()

    await Promise.all([store.open('4387'), store.setQuery('premier')])

    expect(urlQuery()).toEqual({ q: 'premier' })
  })

  it('season derives from the route as written', async () => {
    await router.replace({ query: { open: '4328', season: '1993-1994' } })
    const store = setup()
    expect(store.season).toBe('1993-1994')

    await store.setSeason('1994-1995')
    expect(urlQuery()).toEqual({ open: '4328', season: '1994-1995' })
    expect(store.season).toBe('1994-1995')
  })
})
