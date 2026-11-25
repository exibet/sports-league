<script setup lang="ts">
import type { NuxtError } from '#app'

// Replaces `app.vue` when a page fails, so it brings its own `UApp` and layout.
const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: () => `${notFound.value ? 'League not found' : 'Something went wrong'} · Sports Leagues` })
</script>

<template>
  <UApp>
    <NuxtLayout>
      <UEmpty
        variant="naked"
        class="border border-dashed border-default"
        :icon="notFound ? 'i-lucide-search-x' : 'i-lucide-triangle-alert'"
        :title="notFound ? 'League not found' : 'Something went wrong'"
        :description="notFound
          ? 'There is no league at this address: the link may be mistyped or out of date.'
          : 'The page could not be shown. Try again in a moment.'"
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
