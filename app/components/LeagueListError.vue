<script setup lang="ts">
const leagues = useLeaguesStore()
</script>

<template>
  <UAlert
    color="error"
    variant="subtle"
    icon="i-lucide-triangle-alert"
    title="Couldn’t load leagues"
    :description="leagues.error ?? undefined"
    :actions="[{
      label: 'Try again',
      icon: 'i-lucide-refresh-cw',
      color: 'neutral',
      variant: 'outline',
      class: 'min-h-11',
      onClick: () => leagues.load(),
    }]"
  />
</template>
