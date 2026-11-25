import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import SeasonPicker from '~/components/SeasonPicker.vue'

const seasons = (count: number, from = 1990) =>
  Array.from({ length: count }, (_, offset) => `${from + offset}-${from + offset + 1}`)

const mountPicker = (list: string[], modelValue: string) =>
  mountSuspended(SeasonPicker, { props: { seasons: list, modelValue } })

describe('SeasonPicker', () => {
  it('renders up to 5 seasons as a radio group with short labels and the model checked', async () => {
    const wrapper = await mountPicker(seasons(5), '1992-1993')

    const radios = wrapper.findAll<HTMLInputElement>('input[type="radio"]')
    expect(radios).toHaveLength(5)
    expect(wrapper.findAll('label').map(label => label.text()))
      .toEqual(['1990/91', '1991/92', '1992/93', '1993/94', '1994/95'])
    expect(radios.map(radio => radio.element.checked)).toEqual([false, false, true, false, false])
    expect(new Set(radios.map(radio => radio.attributes('name'))).size).toBe(1)
    expect(wrapper.get('[role="radiogroup"]').attributes('aria-label')).toBe('Season')
  })

  it('choosing a radio emits the season', async () => {
    const wrapper = await mountPicker(seasons(5), '1990-1991')

    await wrapper.findAll('input[type="radio"]')[3]?.setValue(true)

    expect(wrapper.emitted('update:modelValue')).toEqual([['1993-1994']])
  })

  it.each([6, 30])('renders %i seasons as previous / select / next', async (count) => {
    const list = seasons(count)
    const wrapper = await mountPicker(list, list[2] ?? '')

    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Previous season"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Next season"]').exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'USelect' })).toHaveLength(1)
    expect(wrapper.findAll('button[aria-label$="season"]')).toHaveLength(2)
  })

  it('disables previous on the first season and next on the last', async () => {
    const list = seasons(6)
    const first = await mountPicker(list, list[0] ?? '')
    const last = await mountPicker(list, list[5] ?? '')

    expect(first.get('button[aria-label="Previous season"]').attributes('disabled')).toBeDefined()
    expect(first.get('button[aria-label="Next season"]').attributes('disabled')).toBeUndefined()
    expect(last.get('button[aria-label="Next season"]').attributes('disabled')).toBeDefined()
  })

  it.each([['Next', 3], ['Previous', 1]])('%s emits the neighbour', async (direction, neighbour) => {
    const list = seasons(6)
    const wrapper = await mountPicker(list, list[2] ?? '')

    await wrapper.get(`button[aria-label="${direction} season"]`).trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[list[neighbour]]])
  })

  it('renders no controls for a single season', async () => {
    const wrapper = await mountPicker(['1950'], '1950')

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
