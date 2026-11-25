<script setup lang="ts">
import { shortSeason } from '~/utils/season'

/** Up to this many seasons show as segments; more switch to the stepper (a paid key, D11). */
const MAX_SEGMENTS = 5

const props = defineProps<{ seasons: string[] }>()
const model = defineModel<string>({ required: true })

const name = useId()
const index = computed(() => props.seasons.indexOf(model.value))
const items = computed(() => props.seasons.map(season => ({ label: `Season ${shortSeason(season)}`, value: season })))

/** The stepper buttons are disabled at both ends, so the neighbour always exists. */
function step(offset: number) {
  model.value = props.seasons[index.value + offset] ?? model.value
}
</script>

<template>
  <div class="@container">
    <!-- Segments: a native radio group, so it is one tab stop and the arrow keys move the choice. -->
    <div
      v-if="seasons.length > 1 && seasons.length <= MAX_SEGMENTS"
      role="radiogroup"
      aria-label="Season"
      class="flex min-w-0 rounded-lg bg-default/60 p-1"
    >
      <label
        v-for="season in seasons"
        :key="season"
        :class="[
          'flex min-h-11 min-w-0 flex-1 basis-0 cursor-pointer items-center justify-center rounded-md px-0.5',
          'text-xs font-medium whitespace-nowrap text-muted transition-colors @[340px]:text-sm',
          'has-checked:bg-primary has-checked:text-inverted',
          'has-focus-visible:outline-2 has-focus-visible:outline-primary',
        ]"
      >
        <input
          v-model="model"
          type="radio"
          class="sr-only"
          :name="name"
          :value="season"
        >
        {{ shortSeason(season) }}
      </label>
    </div>

    <!-- Stepper: the layout does not grow with the number of seasons. -->
    <div
      v-else-if="seasons.length > MAX_SEGMENTS"
      class="flex items-center gap-2"
    >
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-chevron-left"
        aria-label="Previous season"
        class="size-11 justify-center"
        :disabled="index <= 0"
        @click="step(-1)"
      />
      <USelect
        v-model="model"
        :items="items"
        aria-label="Season"
        class="min-h-11 min-w-0 flex-1"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-chevron-right"
        aria-label="Next season"
        class="size-11 justify-center"
        :disabled="index >= seasons.length - 1"
        @click="step(1)"
      />
    </div>
  </div>
</template>
