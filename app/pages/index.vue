<script setup lang="ts">
const leagues = useLeaguesStore()
const list = useLeagueListStore()

// SSR waits for the list and the client reuses it from the Pinia payload; coming back to the page
// runs it again (a no-op once loaded, a retry after a failure). An open row's badges are loaded by
// its own panel.
await callOnce('leagues', () => leagues.load(), { mode: 'navigation' })

useSeoMeta({
  title: 'Leagues',
  description: 'Sports leagues from TheSportsDB with search, a sport filter and season badges.',
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-highlighted">
      Leagues
    </h1>
    <p class="mt-1 text-sm text-muted">
      Open a league to see its season badge, or go to its page for the details.
    </p>
    <RetryAlert
      v-if="leagues.status === 'error'"
      class="mt-6"
      title="Couldn’t load leagues"
      :description="leagues.error"
      @retry="leagues.load()"
    />
    <LeagueListSkeleton
      v-else-if="leagues.status !== 'success'"
      class="mt-6"
    />
    <template v-else>
      <LeagueFilters class="mt-6" />
      <LeagueCount class="mt-2" />
      <LeagueList
        v-if="list.filtered.length > 0"
        class="mt-2"
        :leagues="list.filtered"
      />
      <LeagueListEmpty
        v-else
        class="mt-2"
      />
    </template>
  </div>
</template>
