<template>
  <div class="flex min-h-dvh flex-col">
    <!-- A full-height column: `main` takes the free space, so on a short page the footer sits at
         the bottom of the screen. Nuxt UI's `UMain` is a full screen tall and would push it below. -->
    <AppHeader />
    <UContainer
      as="main"
      class="flex-1 py-8"
    >
      <slot />
    </UContainer>
    <AppFooter />
  </div>
</template>
