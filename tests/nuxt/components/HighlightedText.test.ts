import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HighlightedText from '~/components/HighlightedText.vue'

const mountText = (text: string, query: string) => mountSuspended(HighlightedText, { props: { text, query } })

describe('HighlightedText', () => {
  it('wraps the matched ranges in <mark> and leaves the rest as text', async () => {
    const wrapper = await mountText('English Premier League', 'premier')

    expect(wrapper.text()).toBe('English Premier League')
    expect(wrapper.findAll('mark').map(mark => mark.text())).toEqual(['Premier'])
  })

  it('marks every occurrence and keeps original accents', async () => {
    const wrapper = await mountText('Liga Jupilér Liga', 'liga')

    expect(wrapper.findAll('mark').map(mark => mark.text())).toEqual(['Liga', 'Liga'])
    expect(wrapper.text()).toBe('Liga Jupilér Liga')
  })

  it.each(['bundesliga', ''])('renders plain text without marks for the query %j', async (query) => {
    const wrapper = await mountText('Serie A', query)

    expect(wrapper.find('mark').exists()).toBe(false)
    expect(wrapper.text()).toBe('Serie A')
  })

  it('renders markup in the text as text', async () => {
    const wrapper = await mountText('<b>Bold</b> <img src=x> League', 'bold')

    expect(wrapper.find('b').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('<b>Bold</b> <img src=x> League')
    expect(wrapper.get('mark').text()).toBe('Bold')
  })
})
