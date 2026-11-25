<script setup lang="ts">
import type { LeagueDetails } from '#shared/types/league'
import { shortSeason } from '~/utils/season'

const props = defineProps<{ details: LeagueDetails }>()

const chips = computed(() => [
  props.details.sport,
  props.details.country,
  props.details.formedYear && `Founded ${props.details.formedYear}`,
  props.details.currentSeason && `Season ${shortSeason(props.details.currentSeason)}`,
].filter(Boolean))

/** `https://www.premierleague.com/` → `premierleague.com` */
const websiteLabel = computed(() =>
  props.details.website && new URL(props.details.website).hostname.replace(/^www\./, ''))
</script>

<template>
  <div class="flex items-start gap-5">
    <div class="flex size-24 shrink-0 items-center justify-center rounded-xl bg-badge-plate p-2.5 sm:size-28">
      <img
        v-if="details.logoUrl"
        :src="details.logoUrl"
        :alt="`${details.name} logo`"
        width="112"
        height="112"
        class="size-full object-contain"
      >
      <UIcon
        v-else
        name="i-lucide-image-off"
        class="size-8 text-dimmed"
        aria-hidden="true"
      />
    </div>
    <div class="min-w-0 space-y-2.5">
      <h1 class="text-[clamp(22px,5vw,30px)] leading-tight font-bold text-highlighted">
        {{ details.name }}
      </h1>
      <ul class="flex flex-wrap gap-1.5">
        <li
          v-for="chip in chips"
          :key="chip"
        >
          <UBadge
            color="neutral"
            variant="subtle"
            size="lg"
            :label="chip"
          />
        </li>
      </ul>
      <ULink
        v-if="details.website"
        :to="details.website"
        target="_blank"
        class="touch-target inline-flex items-center gap-1 font-medium text-primary"
      >
        {{ websiteLabel }}
        <UIcon
          name="i-lucide-external-link"
          class="size-4"
          aria-hidden="true"
        />
        <span class="sr-only">(opens in a new tab)</span>
      </ULink>
    </div>
  </div>
</template>
