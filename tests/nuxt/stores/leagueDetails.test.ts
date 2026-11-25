import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LeagueDetails, SeasonBadge } from '#shared/types/league'
import { useLeagueDetailsStore } from '~/stores/leagueDetails'
import { useSeasonBadgesStore } from '~/stores/seasonBadges'

const DETAILS: LeagueDetails = {
  id: '4328',
  name: 'English Premier League',
  sport: 'Soccer',
  country: 'England',
  formedYear: '1992',
  currentSeason: '2026-2027',
  website: 'https://www.premierleague.com',
  logoUrl: 'http://img.test/logo.png/small',
  description: 'The Premier League is the top level.',
}
const SEASONS: SeasonBadge[] = [{ season: '1992-1993', badgeUrl: 'http://img.test/a.png/small' }]

/** Returns the response for a league, or a status to fail with. */
const answer = vi.fn<(id: string) => unknown>()
const seasonsRequests = vi.fn()

const respondFor = (id: string) => defineEventHandler((event) => {
  const result = answer(id)
  if (typeof result !== 'number') return result
  setResponseStatus(event, result)
  return { statusCode: result, message: result === 404 ? 'There is no league with this id.' : 'TheSportsDB failed.' }
})

const IDS = ['4328', '4329', '999999']
IDS.forEach(id => registerEndpoint(`/api/leagues/${id}`, respondFor(id)))
registerEndpoint('/api/leagues/4328/seasons', () => {
  seasonsRequests()
  return SEASONS
})

describe('league details store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    answer.mockReset()
    seasonsRequests.mockClear()
    answer.mockImplementation(id => id === '999999' ? 404 : { details: DETAILS, seasons: SEASONS })
  })

  it('load(id) stores the details and seeds the badge cache with the seasons', async () => {
    const store = useLeagueDetailsStore()

    await store.load('4328')

    expect(store.entries['4328']).toEqual({ status: 'success', details: DETAILS })
    expect(useSeasonBadgesStore().entries['4328']).toEqual({ status: 'success', badges: SEASONS })
  })

  it('a repeat load makes no request, parallel loads share one', async () => {
    const store = useLeagueDetailsStore()

    await Promise.all([store.load('4328'), store.load('4328')])
    await store.load('4328')

    expect(answer).toHaveBeenCalledTimes(1)
  })

  it('records a 404 as not-found and does not ask again', async () => {
    const store = useLeagueDetailsStore()

    await store.load('999999')
    await store.load('999999')

    expect(store.entries['999999']).toEqual({ status: 'not-found' })
    expect(answer).toHaveBeenCalledTimes(1)
  })

  it('records another failure as an error and retries on the next load', async () => {
    answer.mockImplementationOnce(() => 502)
    const store = useLeagueDetailsStore()

    await store.load('4329')
    expect(store.entries['4329']).toEqual({ status: 'error', message: 'TheSportsDB failed.' })

    await store.load('4329')
    expect(answer).toHaveBeenCalledTimes(2)
    expect(store.entries['4329']?.status).toBe('success')
  })

  it('opening the same league in the list afterwards makes no seasons request', async () => {
    await useLeagueDetailsStore().load('4328')

    await useSeasonBadgesStore().load('4328')

    expect(seasonsRequests).not.toHaveBeenCalled()
  })

  it('keeps only serialisable state', async () => {
    const store = useLeagueDetailsStore()
    await store.load('4328')

    expect(JSON.parse(JSON.stringify(store.$state))).toEqual(store.$state)
  })
})
