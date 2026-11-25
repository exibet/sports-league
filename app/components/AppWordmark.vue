<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: 'md' | 'sm' }>(), { size: 'md' })

const SIZES = {
  md: { mark: 'size-9', icon: 'size-6', text: 'text-xl' },
  sm: { mark: 'size-7', icon: 'size-5', text: 'text-base' },
}
const classes = computed(() => SIZES[props.size])
</script>

<template>
  <NuxtLink
    to="/"
    :class="[
      'relative flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-primary',
      // A 44 px touch target around the smaller visible logo.
      'after:absolute after:inset-x-0 after:-inset-y-2',
    ]"
    aria-label="Sports Leagues, home"
  >
    <span
      class="flex -skew-x-8 items-center justify-center rounded-lg bg-primary text-inverted"
      :class="classes.mark"
      aria-hidden="true"
    >
      <UIcon
        name="tabler:ball-football"
        :class="classes.icon"
      />
    </span>
    <span
      class="font-extrabold tracking-tight text-highlighted uppercase italic"
      :class="classes.text"
      aria-hidden="true"
    >Sports <span class="text-primary">Leagues</span></span>
  </NuxtLink>
</template>
