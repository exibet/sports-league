import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLeaguesStore } from '~/stores/leagues'
import { LEAGUES } from '../helpers/leagues'

const FETCHED_AT = 1_764_000_000_000
const MESSAGE = 'TheSportsDB could not be reached. Try again.'

/** A JSON body or a status to fail with; failures carry Nitro's error body shape. */
const answer = vi.fn<() => unknown>()

registerEndpoint('/api/leagues', defineEventHandler((event) => {
  const result = answer()
  if (typeof result === 'number') {
    setResponseStatus(event, result)
    return { statusCode: result, message: MESSAGE }
  }
  return result
}))

describe('leagues store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    answer.mockReset()
    answer.mockImplementation(() => ({ leagues: LEAGUES, fetchedAt: FETCHED_AT }))
  })

  it('load() fills leagues, fetchedAt and status', async () => {
    const store = useLeaguesStore()

    await store.load()

    expect(store.leagues).toEqual(LEAGUES)
    expect(store.fetchedAt).toBe(FETCHED_AT)
    expect(store.status).toBe('success')
    expect(store.error).toBeNull()
  })

  it('a second load() makes no request', async () => {
    const store = useLeaguesStore()

    await store.load()
    await store.load()

    expect(answer).toHaveBeenCalledTimes(1)
  })

  it('parallel load() calls share one request', async () => {
    const store = useLeaguesStore()

    await Promise.all([store.load(), store.load(), store.load()])

    expect(answer).toHaveBeenCalledTimes(1)
  })

  it('a failure sets status error with a message and does not throw', async () => {
    answer.mockImplementation(() => 502)
    const store = useLeaguesStore()

    await expect(store.load()).resolves.toBeUndefined()

    expect(store.status).toBe('error')
    expect(store.error).toBe(MESSAGE)
    expect(store.leagues).toEqual([])
  })

  it('a load() after a failure retries', async () => {
    answer.mockImplementationOnce(() => 502)
    const store = useLeaguesStore()
    await store.load()
    expect(store.status).toBe('error')

    await store.load()

    expect(answer).toHaveBeenCalledTimes(2)
    expect(store.status).toBe('success')
    expect(store.error).toBeNull()
  })

  it('derives sportOptions from the leagues', async () => {
    const store = useLeaguesStore()

    await store.load()

    expect(store.sportOptions).toEqual([
      { sport: 'Basketball', count: 1 },
      { sport: 'Motorsport', count: 1 },
      { sport: 'Soccer', count: 10 },
    ])
  })

  it('keeps only serialisable state', async () => {
    const store = useLeaguesStore()
    await store.load()

    expect(JSON.parse(JSON.stringify(store.$state))).toEqual(store.$state)
  })
})
