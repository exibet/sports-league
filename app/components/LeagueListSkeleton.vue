<template>
  <div role="status">
    <span class="sr-only">Loading leagues…</span>
    <USkeleton class="h-11 w-full" />
    <USkeleton class="mt-4 h-4 w-24" />
    <div class="mt-4 rounded-lg border border-default divide-y divide-default">
      <div
        v-for="row in 6"
        :key="row"
        class="flex items-center gap-3 px-3 py-2.5"
      >
        <USkeleton class="size-8 rounded-md" />
        <div class="flex-1 space-y-1.5">
          <USkeleton class="h-3.5 w-2/5" />
          <USkeleton class="h-3 w-16" />
        </div>
      </div>
    </div>
  </div>
</template>
