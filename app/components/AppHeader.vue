<script setup lang="ts">
import { REPOSITORY_URL } from '#shared/constants'
</script>

<template>
  <!-- Nuxt UI's sticky, translucent header; no mobile menu, so no toggle. Blur 12 px per design. -->
  <UHeader
    :toggle="false"
    :ui="{ root: 'backdrop-blur-md' }"
  >
    <template #left>
      <AppWordmark />
    </template>
    <template #right>
      <UButton
        :to="REPOSITORY_URL"
        target="_blank"
        color="neutral"
        variant="ghost"
        icon="i-lucide-github"
        aria-label="Source code on GitHub (opens in a new tab)"
        class="size-11 justify-center"
      />
      <!-- Both icons are rendered and the `dark` class picks one, so the icon never flashes. -->
      <UColorModeButton class="size-11 justify-center" />
    </template>
  </UHeader>
</template>
