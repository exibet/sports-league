import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'
import SeasonBadgePanel from '~/components/SeasonBadgePanel.vue'
import { useLeagueListStore } from '~/stores/leagueList'
import { useLeaguesStore } from '~/stores/leagues'
import { useSeasonBadgesStore, type BadgeEntry } from '~/stores/seasonBadges'
import { LEAGUES } from '../helpers/leagues'

const EPL = LEAGUES[0]!
const BADGES = [
  { season: '1992-1993', badgeUrl: 'http://img.test/a.png/small' },
  { season: '1993-1994', badgeUrl: 'http://img.test/b.png/small' },
]

let router: Router

async function mountPanel(entry: BadgeEntry | undefined, season?: string) {
  await router.replace({ query: { open: EPL.id, ...(season ? { season } : {}) } })
  useLeaguesStore().$patch({ leagues: LEAGUES, status: 'success' })
  const badges = useSeasonBadgesStore()
  badges.entries = entry ? { [EPL.id]: entry } : {}
  const load = vi.spyOn(badges, 'load').mockResolvedValue()
  // Spied before mounting: the template binds the action when it renders.
  const setSeason = vi.spyOn(useLeagueListStore(), 'setSeason').mockResolvedValue()
  const wrapper = await mountSuspended(SeasonBadgePanel, {
    props: { league: EPL },
    route: router.currentRoute.value.fullPath,
  })
  return { wrapper, load, setSeason }
}

describe('SeasonBadgePanel', () => {
  beforeEach(async () => {
    router = useRouter()
    await router.replace('/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the badge of the selected season with alt text and size', async () => {
    const { wrapper } = await mountPanel({ status: 'success', badges: BADGES }, '1993-1994')

    const img = wrapper.get('img')
    expect(img.attributes('src')).toBe('http://img.test/b.png/small')
    expect(img.attributes('alt')).toBe('English Premier League badge, season 1993/94')
    expect(img.attributes('width')).toBe('120')
    expect(img.attributes('height')).toBe('120')
    expect(wrapper.text()).toContain('Badge 2 of 2')
  })

  it.each([['none', undefined], ['an unknown one', '2050-2051']])(
    'shows the first season when %s is chosen',
    async (_case, season) => {
      const { wrapper } = await mountPanel({ status: 'success', badges: BADGES }, season)

      expect(wrapper.get('img').attributes('src')).toBe('http://img.test/a.png/small')
      expect(wrapper.text()).toContain('Badge 1 of 2')
    },
  )

  it('picking a season calls setSeason', async () => {
    const { wrapper, setSeason } = await mountPanel({ status: 'success', badges: BADGES })

    wrapper.findComponent({ name: 'SeasonPicker' }).vm.$emit('update:modelValue', '1993-1994')

    expect(setSeason).toHaveBeenCalledWith('1993-1994')
  })

  it('shows a skeleton while pending', async () => {
    const { wrapper } = await mountPanel({ status: 'pending' })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toContain('Loading season badges')
  })

  it('explains an empty badge list', async () => {
    const { wrapper } = await mountPanel({ status: 'success', badges: [] })

    expect(wrapper.text()).toContain('No season badges yet')
    expect(wrapper.text()).toContain('TheSportsDB has no badge for any season of this league.')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('shows the error with "Try again", which loads again', async () => {
    const { wrapper, load } = await mountPanel({ status: 'error', message: 'TheSportsDB is limiting requests.' })

    expect(wrapper.text()).toContain('Couldn’t load the badge.')
    expect(wrapper.text()).toContain('TheSportsDB is limiting requests.')
    load.mockClear()
    await wrapper.get('button:not([aria-label])').trigger('click')
    expect(load).toHaveBeenCalledWith(EPL.id)
  })

  it('loads the badges itself when mounted without a cache entry', async () => {
    const { load } = await mountPanel(undefined)

    expect(load).toHaveBeenCalledWith(EPL.id)
  })
})

describe('SeasonBadgePanel: league details link', () => {
  beforeEach(async () => {
    router = useRouter()
    await router.replace('/')
  })

  it.each<[string, BadgeEntry | undefined]>([
    ['with badges', { status: 'success', badges: BADGES }],
    ['without badges', { status: 'success', badges: [] }],
    ['after a failure', { status: 'error', message: 'TheSportsDB failed.' }],
    ['while loading', { status: 'pending' }],
  ])('links to the league page %s', async (_case, entry) => {
    const { wrapper } = await mountPanel(entry)

    expect(wrapper.findAll('a[href="/leagues/4328"]').map(link => link.text())).toEqual(['League details'])
  })
})
