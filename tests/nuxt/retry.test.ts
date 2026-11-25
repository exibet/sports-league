import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import type { LeagueDetailsResponse } from '#shared/types/league'
import App from '~/app.vue'
import { LEAGUES } from './helpers/leagues'

const MESSAGE = 'TheSportsDB is limiting requests right now. Try again in a minute.'
const LEAGUE_PAGE: LeagueDetailsResponse = {
  details: {
    id: '4328',
    name: 'English Premier League',
    sport: 'Soccer',
    country: 'England',
    formedYear: '1992',
    currentSeason: '2026-2027',
    website: null,
    logoUrl: null,
    description: 'The Premier League is the top level.',
  },
  seasons: [],
}

/** Serves `url`: the first request fails with a 502, the next ones get `data`. Removed after the test. */
function failOnce(url: string, data: unknown) {
  let failed = false
  onTestFinished(registerEndpoint(url, defineEventHandler((event) => {
    if (failed) return data
    failed = true
    setResponseStatus(event, 502)
    return { statusCode: 502, message: MESSAGE }
  })))
}

describe('a failed load shows the error, and "Try again" loads the data', () => {
  it('on the list page', async () => {
    failOnce('/api/leagues', { leagues: LEAGUES, fetchedAt: 1_764_000_000_000 })
    const wrapper = await mountSuspended(App, { route: '/' })

    expect(wrapper.text()).toContain('Couldn’t load leagues')
    expect(wrapper.text()).toContain(MESSAGE)
    await wrapper.findAll('button').find(button => button.text() === 'Try again')!.trigger('click')

    await vi.waitFor(() => expect(wrapper.get('main').findAll('li')).toHaveLength(LEAGUES.length))
    expect(wrapper.text()).not.toContain('Couldn’t load leagues')
  })

  it('on the league page', async () => {
    failOnce('/api/leagues/4328', LEAGUE_PAGE)
    const wrapper = await mountSuspended(App, { route: '/leagues/4328' })

    expect(wrapper.text()).toContain('Couldn’t load the league')
    expect(wrapper.text()).toContain(MESSAGE)
    await wrapper.findAll('button').find(button => button.text() === 'Try again')!.trigger('click')

    await vi.waitFor(() => expect(wrapper.text()).toContain(LEAGUE_PAGE.details.description))
    expect(wrapper.text()).not.toContain('Couldn’t load the league')
  })
})
