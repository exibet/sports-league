import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import App from '~/app.vue'

describe('app', () => {
  it('renders the placeholder heading in the Nuxt environment', async () => {
    const wrapper = await mountSuspended(App)

    expect(wrapper.get('h1').text()).toBe('Sports Leagues')
  })
})
