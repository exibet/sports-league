<script setup lang="ts">
/** A failed load: what failed, why, and "Try again" (the only retry; requests never repeat on their own). */
defineProps<{ title: string, description?: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <UAlert
    color="error"
    variant="subtle"
    icon="i-lucide-triangle-alert"
    :title="title"
    :description="description"
    :actions="[{
      label: 'Try again',
      icon: 'i-lucide-refresh-cw',
      color: 'neutral',
      variant: 'outline',
      class: 'min-h-11',
      onClick: () => emit('retry'),
    }]"
  />
</template>
