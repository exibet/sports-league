import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'
import type { League } from '#shared/types/league'
import LeagueFilters from '~/components/LeagueFilters.vue'
import { useLeagueListStore } from '~/stores/leagueList'
import { useLeaguesStore } from '~/stores/leagues'
import { LEAGUES, SOCCER_ONLY } from '../helpers/leagues'

let router: Router

async function mountFilters({ leagues = LEAGUES, attachTo }: { leagues?: League[], attachTo?: HTMLElement } = {}) {
  useLeaguesStore().$patch({ leagues, status: 'success' })
  // Mount on the current URL; by default `mountSuspended` navigates to a bare `/`.
  const wrapper = await mountSuspended(LeagueFilters, { route: router.currentRoute.value.fullPath, attachTo })
  const input = () => wrapper.get<HTMLInputElement>('input')
  return { wrapper, input, list: useLeagueListStore() }
}

/**
 * Lets pending `router.replace` calls and their serialised follow-ups settle. Nuxt's navigation
 * uses timers too, so with fake timers a few milliseconds are advanced as well (less than the
 * debounce, so no pending write fires early). Three rounds cover the longest chain in these tests:
 * a debounced write queued behind another write, each resolving a navigation.
 */
async function settle() {
  const tick = async () => {
    await flushPromises()
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(5)
  }
  await tick()
  await tick()
  await tick()
}

const urlQuery = () => router.currentRoute.value.query

enableAutoUnmount(afterEach)

describe('LeagueFilters', () => {
  beforeEach(async () => {
    router = useRouter()
    await router.replace('/')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows typing at once and writes the URL once, 250 ms after the last key', async () => {
    const { input, list } = await mountFilters()
    vi.useFakeTimers()
    const setQuery = vi.spyOn(list, 'setQuery')

    await input().setValue('e')
    await input().setValue('en')
    await input().setValue('eng')
    expect(input().element.value).toBe('eng')

    await vi.advanceTimersByTimeAsync(249)
    expect(setQuery).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(setQuery).toHaveBeenCalledTimes(1)
    expect(setQuery).toHaveBeenCalledWith('eng')
    await settle()
    expect(urlQuery()).toEqual({ q: 'eng' })
  })

  it('re-syncs the draft when q changes from outside and drops the pending write', async () => {
    const { input } = await mountFilters()
    vi.useFakeTimers()

    await input().setValue('eng')
    void router.replace({ query: { q: 'premier' } })
    await settle()
    await vi.advanceTimersByTimeAsync(300)
    await settle()

    expect(input().element.value).toBe('premier')
    expect(urlQuery()).toEqual({ q: 'premier' })
  })

  it('keeps the draft and the pending write when another param changes', async () => {
    const { input } = await mountFilters()
    vi.useFakeTimers()

    await input().setValue('eng')
    void router.replace({ query: { ref: 'mail' } })
    await vi.advanceTimersByTimeAsync(250)
    await settle()

    expect(input().element.value).toBe('eng')
    expect(urlQuery()).toEqual({ ref: 'mail', q: 'eng' })
  })

  it('loses no characters when typing goes on while the write is resolving', async () => {
    const { input } = await mountFilters()
    vi.useFakeTimers()

    await input().setValue('eng')
    await vi.advanceTimersByTimeAsync(250)
    await input().setValue('engl')
    await settle()
    expect(input().element.value).toBe('engl')

    await vi.advanceTimersByTimeAsync(250)
    await settle()
    expect(input().element.value).toBe('engl')
    expect(urlQuery()).toEqual({ q: 'engl' })
  })

  it('keeps a trailing space through the debounced write', async () => {
    const { input } = await mountFilters()
    vi.useFakeTimers()

    await input().setValue('english ')
    await vi.advanceTimersByTimeAsync(250)
    await settle()

    expect(urlQuery()).toEqual({ q: 'english ' })
    expect(input().element.value).toBe('english ')
  })

  it('reset with a pending write leaves q empty', async () => {
    const { input, list } = await mountFilters()
    vi.useFakeTimers()

    await input().setValue('eng')
    void list.reset()
    await vi.advanceTimersByTimeAsync(300)
    await settle()

    expect(urlQuery()).toEqual({})
    expect(input().element.value).toBe('')
  })

  it('typing, then opening a matching league within 250 ms, keeps both q and open', async () => {
    const { input, list } = await mountFilters()
    vi.useFakeTimers()

    await input().setValue('premier')
    void list.open('4328')
    await settle()
    await vi.advanceTimersByTimeAsync(250)
    await settle()

    expect(input().element.value).toBe('premier')
    expect(urlQuery()).toEqual({ open: '4328', q: 'premier' })
  })

  it('the clear button empties the search at once and keeps focus in the field', async () => {
    await router.replace({ query: { q: 'liga' } })
    const { wrapper, input } = await mountFilters({ attachTo: document.body })

    await wrapper.get('button[aria-label="Clear search"]').trigger('click')

    expect(input().element.value).toBe('')
    await vi.waitFor(() => expect(urlQuery()).toEqual({}))
    expect(document.activeElement).toBe(input().element)
  })

  it('moves focus to the search field after a reset (the reset button disappears)', async () => {
    await router.replace({ query: { q: 'liga', sport: 'Soccer' } })
    const { input, list } = await mountFilters({ attachTo: document.body })

    await list.reset()
    await flushPromises()

    expect(document.activeElement).toBe(input().element)
  })

  it('shows the sport select disabled, with its data and a note, when there is one sport', async () => {
    const { wrapper } = await mountFilters({ leagues: SOCCER_ONLY })

    const select = wrapper.findComponent({ name: 'USelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('disabled')).toBe(true)
    expect(select.props('items')).toEqual([
      { label: 'All sports (10)', value: '__all__' },
      { label: 'Soccer (10)', value: 'Soccer' },
    ])
    expect(wrapper.get('#sport-note').text()).toBe('Only Soccer leagues in the data')
  })

  it('shows the sport select enabled with counts when there are several sports', async () => {
    const { wrapper } = await mountFilters()

    const select = wrapper.findComponent({ name: 'USelect' })
    expect(select.props('disabled')).toBe(false)
    expect(wrapper.find('#sport-note').exists()).toBe(false)
    expect(select.props('items')).toEqual([
      { label: 'All sports (12)', value: '__all__' },
      { label: 'Basketball (1)', value: 'Basketball' },
      { label: 'Motorsport (1)', value: 'Motorsport' },
      { label: 'Soccer (10)', value: 'Soccer' },
    ])
  })

  it('choosing a sport writes it, "All sports" removes it', async () => {
    const { wrapper } = await mountFilters()
    const select = wrapper.findComponent({ name: 'USelect' })

    select.vm.$emit('update:modelValue', 'Motorsport')
    await vi.waitFor(() => expect(urlQuery()).toEqual({ sport: 'Motorsport' }))

    select.vm.$emit('update:modelValue', '__all__')
    await vi.waitFor(() => expect(urlQuery()).toEqual({}))
  })
})
