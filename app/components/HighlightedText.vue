<script setup lang="ts">
import { highlightRanges } from '~/utils/search'

const props = defineProps<{ text: string, query: string }>()

/**
 * The text cut at the range boundaries: pieces alternate plain / matched, starting with plain.
 * Rendered as text nodes, never as HTML.
 */
const segments = computed(() => {
  const cuts = [0, ...highlightRanges(props.text, props.query).flat(), props.text.length]
  return cuts
    .slice(0, -1)
    .map((start, i) => ({ text: props.text.slice(start, cuts[i + 1]), match: i % 2 === 1 }))
    .filter(segment => segment.text)
})
</script>

<template>
  <!-- Whitespace between these tags is dropped by the compiler, so no stray spaces appear. -->
  <span>
    <template
      v-for="(segment, index) in segments"
      :key="index"
    >
      <mark
        v-if="segment.match"
        class="rounded-sm bg-primary/20 text-inherit"
      >{{ segment.text }}</mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
