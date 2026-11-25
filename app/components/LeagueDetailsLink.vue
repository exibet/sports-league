<script setup lang="ts">
defineProps<{ id: string }>()
</script>

<template>
  <NuxtLink
    :to="`/leagues/${id}`"
    class="touch-target inline-flex items-center gap-1 text-sm font-medium text-primary"
  >
    League details
    <UIcon
      name="i-lucide-arrow-right"
      class="size-4"
      aria-hidden="true"
    />
  </NuxtLink>
</template>
