<script setup lang="ts">
import type { League } from '#shared/types/league'
import { shortSeason } from '~/utils/season'

const props = defineProps<{ league: League }>()

const badges = useSeasonBadgesStore()
const list = useLeagueListStore()

/** Two columns: the badge, then the info over the picker; narrow screens put the picker below. */
const GRID = [
  'grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-3',
  '@[520px]:max-w-154 @[520px]:grid-cols-[120px_minmax(0,1fr)_auto]',
]
const BADGE = 'size-24 @[520px]:row-span-2 @[520px]:size-30'
const PICKER = 'col-span-2 @[520px]:col-start-2 @[520px]:self-end'
/** "League details": wide, top right next to the info; narrow and in the other states, below. */
const LINK_IN_GRID = [
  'col-span-2 row-start-3 justify-self-start',
  '@[520px]:col-span-1 @[520px]:col-start-3 @[520px]:row-start-1 @[520px]:self-start',
]

const entry = computed(() => badges.entries[props.league.id])
const loaded = computed(() => badges.badgesOf(props.league.id))
const seasons = computed(() => loaded.value.map(badge => badge.season))
// `?season=` when this league has it, otherwise its first season.
const position = computed(() => Math.max(0, seasons.value.findIndex(season => season === list.season)))
const selected = computed(() => loaded.value[position.value])

// The panel owns its data: SSR waits for it (`?open=` URLs render complete) and the client reuses
// it from the payload; an open on the client loads it here. Only when nothing is known yet: a
// failure (also one from SSR) waits for "Try again", and a cached or running load needs nothing.
onServerPrefetch(() => badges.load(props.league.id))
onMounted(() => {
  if (!entry.value) badges.load(props.league.id)
})
</script>

<template>
  <div class="@container">
    <RetryAlert
      v-if="entry?.status === 'error'"
      title="Couldn’t load the badge."
      :description="entry.message"
      @retry="badges.load(league.id)"
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
      <LeagueDetailsLink
        :id="league.id"
        :class="LINK_IN_GRID"
      />
      <SeasonPicker
        :class="PICKER"
        :seasons="seasons"
        :model-value="selected.season"
        @update:model-value="list.setSeason"
      />
    </div>

    <SeasonBadgesEmpty v-else-if="entry?.status === 'success'" />

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
    <LeagueDetailsLink
      v-if="!selected"
      :id="league.id"
      class="mt-3"
    />
  </div>
</template>
