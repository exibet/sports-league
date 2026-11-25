import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import App from '~/app.vue'
import { LEAGUES } from './helpers/leagues'

registerEndpoint('/api/leagues', () => ({ leagues: LEAGUES, fetchedAt: 1_764_000_000_000 }))

describe('app', () => {
  it('renders the list page with one row per league, each with name and sport', async () => {
    const wrapper = await mountSuspended(App, { route: '/' })

    expect(wrapper.get('h1').text()).toBe('Leagues')
    const rows = wrapper.findAll('li').map(row => row.text())
    expect(rows).toHaveLength(LEAGUES.length)
    LEAGUES.forEach((league, index) => {
      expect(rows[index]).toContain(league.name)
      expect(rows[index]).toContain(league.sport)
    })
  })
})
