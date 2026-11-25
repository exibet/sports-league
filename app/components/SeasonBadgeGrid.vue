<script setup lang="ts">
import type { SeasonBadge } from '#shared/types/league'
import { shortSeason } from '~/utils/season'

defineProps<{ badges: SeasonBadge[], leagueName: string }>()
</script>

<template>
  <ul
    v-if="badges.length"
    class="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3"
  >
    <li
      v-for="badge in badges"
      :key="badge.season"
    >
      <figure class="space-y-2 rounded-lg bg-elevated p-2 text-center">
        <div class="flex aspect-square items-center justify-center rounded-md bg-badge-plate p-2">
          <img
            :src="badge.badgeUrl"
            :alt="`${leagueName} badge, season ${shortSeason(badge.season)}`"
            width="96"
            height="96"
            loading="lazy"
            class="size-full object-contain"
          >
        </div>
        <figcaption class="text-sm font-semibold text-highlighted">
          {{ shortSeason(badge.season) }}
        </figcaption>
      </figure>
    </li>
  </ul>
  <UEmpty
    v-else
    variant="naked"
    size="sm"
    class="border border-dashed border-default"
    icon="i-lucide-image-off"
    title="No season badges yet"
    description="TheSportsDB has no badge for any season of this league."
  />
</template>
