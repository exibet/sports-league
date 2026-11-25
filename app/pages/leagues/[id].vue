<script setup lang="ts">
// A non-numeric id matches no route, so Nuxt answers 404 without a request.
definePageMeta({ path: '/leagues/:id(\\d+)' })

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)
const details = useLeagueDetailsStore()
const badges = useSeasonBadgesStore()

// SSR waits and the client reuses the payload; a repeat visit is a no-op in the store.
await callOnce(`league-${id}`, () => details.load(id), { mode: 'navigation' })

const entry = computed(() => details.entries[id])
if (entry.value?.status === 'not-found') {
  // Fatal only in the browser (to replace the page on a client navigation); on the server any
  // error renders the 404 page anyway, and a fatal one would be logged as a server error.
  throw createError({ statusCode: 404, statusMessage: 'League not found', fatal: import.meta.client })
}

const league = computed(() => entry.value?.status === 'success' ? entry.value.details : undefined)
const seasons = computed(() => badges.badgesOf(id))

/**
 * "All leagues" goes back in history when the list is the previous entry, so its filters and open
 * row come back with it; otherwise (a direct visit) it is a plain link to `/`.
 */
function backToList(event: MouseEvent) {
  const { back } = router.options.history.state
  if (typeof back !== 'string' || router.resolve(back).name !== 'index') return
  event.preventDefault()
  router.back()
}

useSeoMeta({
  title: () => league.value?.name ?? 'League',
  description: () => league.value?.description.slice(0, 160),
  ogImage: () => league.value?.logoUrl,
})
</script>

<template>
  <div class="space-y-8">
    <UButton
      to="/"
      variant="link"
      color="primary"
      icon="i-lucide-chevron-left"
      label="All leagues"
      class="-ms-2.5 min-h-11"
      @click="backToList"
    />

    <RetryAlert
      v-if="entry?.status === 'error'"
      title="Couldn’t load the league"
      :description="entry.message"
      @retry="details.load(id)"
    />

    <template v-else-if="league">
      <LeagueHero :details="league" />

      <section
        v-if="league.description"
        class="space-y-2"
        aria-labelledby="about"
      >
        <h2
          id="about"
          class="text-xs font-semibold tracking-wide text-muted uppercase"
        >
          About
        </h2>
        <p class="max-w-[72ch] leading-relaxed text-default">
          {{ league.description }}
        </p>
      </section>

      <section
        class="space-y-3"
        aria-labelledby="season-badges"
      >
        <div class="flex items-baseline justify-between gap-3">
          <h2
            id="season-badges"
            class="text-xs font-semibold tracking-wide text-muted uppercase"
          >
            Season badges
          </h2>
          <p class="text-sm text-muted">
            {{ seasons.length }} {{ seasons.length === 1 ? 'season' : 'seasons' }}
          </p>
        </div>
        <SeasonBadgeGrid
          :badges="seasons"
          :league-name="league.name"
        />
      </section>
    </template>

    <div
      v-else
      role="status"
      class="flex items-start gap-5"
    >
      <span class="sr-only">Loading the league…</span>
      <USkeleton class="size-24 rounded-xl sm:size-28" />
      <div class="flex-1 space-y-3">
        <USkeleton class="h-7 w-2/3" />
        <USkeleton class="h-5 w-1/2" />
      </div>
    </div>
  </div>
</template>
