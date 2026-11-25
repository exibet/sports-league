<script setup lang="ts">
const leagues = useLeaguesStore()
const list = useLeagueListStore()

function leaguesLabel(count: number): string {
  return `${count} ${count === 1 ? 'league' : 'leagues'}`
}

const label = computed(() => {
  const total = leagues.leagues.length
  return list.hasActiveFilters ? `${list.filtered.length} of ${leaguesLabel(total)}` : leaguesLabel(total)
})
</script>

<template>
  <div class="flex min-h-11 items-center justify-between gap-3">
    <p
      class="text-sm text-muted"
      aria-live="polite"
    >
      {{ label }}
    </p>
    <UButton
      v-if="list.hasActiveFilters"
      variant="link"
      color="primary"
      label="Reset filters"
      class="min-h-11"
      @click="list.reset()"
    />
  </div>
</template>
