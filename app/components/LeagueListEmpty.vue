<script setup lang="ts">
const list = useLeagueListStore()
</script>

<template>
  <UEmpty
    v-if="list.hasActiveFilters"
    variant="naked"
    class="border border-dashed border-default"
    icon="i-lucide-search-x"
    :title="`No leagues match “${list.query.trim()}”`"
    description="Check the spelling or clear the filters."
    :actions="[{
      label: 'Clear filters',
      color: 'neutral',
      variant: 'outline',
      class: 'min-h-11',
      onClick: list.reset,
    }]"
  />
  <UEmpty
    v-else
    variant="naked"
    class="border border-dashed border-default"
    icon="i-lucide-search-x"
    title="TheSportsDB returned no leagues."
  />
</template>
