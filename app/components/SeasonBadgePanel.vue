<script setup lang="ts">
import type { League } from '#shared/types/league'
import { shortSeason } from '~/utils/season'

const props = defineProps<{ league: League }>()

const badges = useSeasonBadgesStore()
const list = useLeagueListStore()

/** Two columns: the badge, then the info over the picker; narrow screens put the picker below. */
const GRID = [
  'grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-3',
  '@[520px]:max-w-154 @[520px]:grid-cols-[120px_minmax(0,1fr)]',
]
const BADGE = 'size-24 @[520px]:row-span-2 @[520px]:size-30'
const PICKER = 'col-span-2 @[520px]:col-span-1 @[520px]:col-start-2 @[520px]:self-end'

const entry = computed(() => badges.entries[props.league.id])
const loaded = computed(() => entry.value?.status === 'success' ? entry.value.badges : [])
const seasons = computed(() => loaded.value.map(badge => badge.season))
// `?season=` when this league has it, otherwise its first season.
const position = computed(() => Math.max(0, seasons.value.findIndex(season => season === list.season)))
const selected = computed(() => loaded.value[position.value])

// The panel owns its data: SSR waits for it (`?open=` URLs render complete) and the client reuses
// it from the payload; an open on the client loads it here. Cached or in flight: no new request.
onServerPrefetch(() => badges.load(props.league.id))
onMounted(() => badges.load(props.league.id))
</script>

<template>
  <div class="@container">
    <UAlert
      v-if="entry?.status === 'error'"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Couldn’t load the badge."
      :description="entry.message"
      :actions="[{
        label: 'Try again',
        color: 'neutral',
        variant: 'outline',
        class: 'min-h-11',
        onClick: () => badges.load(league.id),
      }]"
    />

    <div
      v-else-if="selected"
      :class="GRID"
    >
      <div
        :class="BADGE"
        class="flex items-center justify-center rounded-xl bg-badge-plate p-2"
      >
        <img
          :src="selected.badgeUrl"
          :alt="`${league.name} badge, season ${shortSeason(selected.season)}`"
          width="120"
          height="120"
          class="size-full object-contain"
        >
      </div>
      <div class="self-start">
        <p class="text-xs font-semibold tracking-wide text-muted uppercase">
          Season badge
        </p>
        <p class="text-2xl font-bold text-highlighted">
          {{ shortSeason(selected.season) }}
        </p>
        <p class="text-sm text-muted">
          Badge {{ position + 1 }} of {{ loaded.length }}
        </p>
      </div>
      <SeasonPicker
        :class="PICKER"
        :seasons="seasons"
        :model-value="selected.season"
        @update:model-value="list.setSeason"
      />
    </div>

    <UEmpty
      v-else-if="entry?.status === 'success'"
      variant="naked"
      size="sm"
      class="border border-dashed border-default"
      icon="i-lucide-image-off"
      title="No season badges yet"
      description="TheSportsDB has no badge for any season of this league."
    />

    <div
      v-else
      role="status"
      :class="GRID"
    >
      <span class="sr-only">Loading season badges…</span>
      <USkeleton
        :class="BADGE"
        class="rounded-xl"
      />
      <div class="space-y-2 self-start">
        <USkeleton class="h-3 w-24" />
        <USkeleton class="h-6 w-20" />
        <USkeleton class="h-3 w-16" />
      </div>
      <USkeleton
        :class="PICKER"
        class="h-11 w-full rounded-lg"
      />
    </div>
  </div>
</template>
