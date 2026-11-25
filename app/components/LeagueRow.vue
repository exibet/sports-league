<script setup lang="ts">
import type { League } from '#shared/types/league'
import { sportIcon } from '~/utils/sports'

const props = defineProps<{ league: League }>()

const list = useLeagueListStore()
const isOpen = computed(() => list.openId === props.league.id)
const buttonId = computed(() => `league-${props.league.id}`)
const panelId = computed(() => `league-${props.league.id}-panel`)
</script>

<template>
  <div :class="{ 'bg-elevated/60': isOpen }">
    <h2>
      <button
        :id="buttonId"
        type="button"
        :class="[
          'flex min-h-13 w-full items-center gap-3 px-3 py-2 text-start transition-colors hover:bg-elevated/60',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
        ]"
        :aria-expanded="isOpen"
        :aria-controls="isOpen ? panelId : undefined"
        @click="list.toggle(league.id)"
      >
        <span class="flex size-8 shrink-0 items-center justify-center rounded-md bg-accented/60 text-muted">
          <UIcon
            :name="sportIcon(league.sport)"
            class="size-5"
            aria-hidden="true"
          />
        </span>
        <span class="min-w-0 flex-1">
          <HighlightedText
            class="block truncate text-sm font-semibold text-highlighted"
            :text="league.name"
            :query="list.query"
          />
          <span class="block text-xs text-muted">{{ league.sport }}</span>
        </span>
        <UIcon
          name="i-lucide-chevron-down"
          class="size-5 shrink-0 text-muted transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
          aria-hidden="true"
        />
      </button>
    </h2>
    <div
      v-if="isOpen"
      :id="panelId"
      role="region"
      :aria-labelledby="buttonId"
      class="px-3 pt-1 pb-4"
    >
      <SeasonBadgePanel :league="league" />
    </div>
  </div>
</template>
