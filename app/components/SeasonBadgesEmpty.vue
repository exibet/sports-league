<script setup lang="ts">
// Shown inside a row or a section that has its own heading, so the title is plain text, not an h2.
</script>

<template>
  <UEmpty
    :as="{ title: 'p' }"
    variant="naked"
    size="sm"
    class="border border-dashed border-default"
    icon="i-lucide-image-off"
    title="No season badges yet"
    description="TheSportsDB has no badge for any season of this league."
  />
</template>
