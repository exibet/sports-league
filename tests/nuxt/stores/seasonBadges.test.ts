import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SeasonBadge } from '#shared/types/league'
import { useSeasonBadgesStore } from '~/stores/seasonBadges'

const BADGES: Record<string, SeasonBadge[]> = {
  4328: [
    { season: '1992-1993', badgeUrl: 'http://img.test/a.png/small' },
    { season: '1993-1994', badgeUrl: 'http://img.test/b.png/small' },
  ],
  4330: [{ season: '2012-2013', badgeUrl: 'http://img.test/c.png/small' }],
  4329: [],
}
const MESSAGE = 'TheSportsDB is limiting requests right now. Try again in a minute.'

/** Called with the league id; returns the badges, or a status to fail with. */
const answer = vi.fn<(id: string) => unknown>()

/** Answers for one league: its badges, or Nitro's error body for a status. */
const respondFor = (id: string) => defineEventHandler((event) => {
  const result = answer(id)
  if (typeof result !== 'number') return result
  setResponseStatus(event, result)
  return { statusCode: result, message: MESSAGE }
})

const IDS = [...Object.keys(BADGES), '4331']
IDS.forEach(id => registerEndpoint(`/api/leagues/${id}/seasons`, respondFor(id)))

const calls = (id: string) => answer.mock.calls.filter(([called]) => called === id).length

describe('season badges store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    answer.mockReset()
    answer.mockImplementation(id => BADGES[id])
  })

  it('the first load requests the league and stores the entry', async () => {
    const store = useSeasonBadgesStore()

    await store.load('4328')

    expect(calls('4328')).toBe(1)
    expect(store.entries['4328']).toEqual({ status: 'success', badges: BADGES['4328'] })
  })

  it('a repeat load makes no request', async () => {
    const store = useSeasonBadgesStore()

    await store.load('4328')
    await store.load('4328')

    expect(calls('4328')).toBe(1)
  })

  it('parallel loads share one request and show pending meanwhile', async () => {
    const store = useSeasonBadgesStore()

    const first = store.load('4328')
    expect(store.entries['4328']).toEqual({ status: 'pending' })
    await Promise.all([first, store.load('4328')])

    expect(calls('4328')).toBe(1)
  })

  it('a failure is an error entry, and the next load requests again', async () => {
    answer.mockImplementationOnce(() => 502)
    const store = useSeasonBadgesStore()

    await store.load('4328')
    expect(store.entries['4328']).toEqual({ status: 'error', message: MESSAGE })

    await store.load('4328')
    expect(calls('4328')).toBe(2)
    expect(store.entries['4328']).toEqual({ status: 'success', badges: BADGES['4328'] })
  })

  it('caches different ids independently', async () => {
    const store = useSeasonBadgesStore()

    await Promise.all([store.load('4328'), store.load('4330')])
    await store.load('4330')

    expect(calls('4328')).toBe(1)
    expect(calls('4330')).toBe(1)
    expect(store.entries['4330']).toEqual({ status: 'success', badges: BADGES['4330'] })
  })

  it('[] is a cached success', async () => {
    const store = useSeasonBadgesStore()

    await store.load('4329')
    await store.load('4329')

    expect(store.entries['4329']).toEqual({ status: 'success', badges: [] })
    expect(calls('4329')).toBe(1)
  })

  it('load never throws', async () => {
    answer.mockImplementation(() => 500)
    const store = useSeasonBadgesStore()

    await expect(store.load('4331')).resolves.toBeUndefined()
    expect(store.entries['4331']?.status).toBe('error')
  })

  it('keeps only serialisable state', async () => {
    const store = useSeasonBadgesStore()
    await store.load('4328')

    expect(JSON.parse(JSON.stringify(store.$state))).toEqual(store.$state)
  })
})
