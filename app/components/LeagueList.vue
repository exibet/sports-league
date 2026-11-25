<script setup lang="ts">
import type { League } from '#shared/types/league'

defineProps<{ leagues: League[] }>()
</script>

<template>
  <ul class="overflow-hidden rounded-lg border border-default bg-muted/40 divide-y divide-default">
    <li
      v-for="league in leagues"
      :key="league.id"
    >
      <LeagueRow :league="league" />
    </li>
  </ul>
</template>
