<script setup lang="ts">
import type { NuxtError } from '#app'

// Replaces `app.vue` when a page fails, so it brings its own `UApp` and layout.
const props = defineProps<{ error: NuxtError }>()

const COPY = {
  notFound: {
    icon: 'i-lucide-search-x',
    title: 'League not found',
    description: 'There is no league at this address: the link may be mistyped or out of date.',
  },
  failed: {
    icon: 'i-lucide-triangle-alert',
    title: 'Something went wrong',
    description: 'The page could not be shown. Try again in a moment.',
  },
}
const copy = computed(() => props.error.statusCode === 404 ? COPY.notFound : COPY.failed)

useSeoMeta({ title: () => copy.value.title })
</script>

<template>
  <UApp>
    <NuxtLayout>
      <UEmpty
        v-bind="copy"
        :as="{ title: 'h1' }"
        variant="naked"
        class="border border-dashed border-default"
        :actions="[{
          label: 'All leagues',
          icon: 'i-lucide-chevron-left',
          color: 'neutral',
          variant: 'outline',
          class: 'min-h-11',
          onClick: () => clearError({ redirect: '/' }),
        }]"
      />
    </NuxtLayout>
  </UApp>
</template>
