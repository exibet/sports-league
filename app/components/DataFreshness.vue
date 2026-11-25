<script setup lang="ts">
// Used inside `ClientOnly`: the text depends on the client's clock. VueUse refreshes it every 30 s
// (only in the browser) and stops on unmount.
const props = defineProps<{ fetchedAt: number }>()

const timeAgo = useTimeAgo(() => props.fetchedAt)
</script>

<template>
  <span>Updated {{ timeAgo }}</span>
</template>
