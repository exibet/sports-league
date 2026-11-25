<template>
  <UApp>
    <!-- Tells screen readers about client-side navigation (it reads the new page title). -->
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="var(--ui-primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
