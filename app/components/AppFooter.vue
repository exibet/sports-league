<script setup lang="ts">
import { API_DOCS_URL, LEAGUES_MAX_AGE, REPOSITORY_URL } from '#shared/constants'

const leagues = useLeaguesStore()
const reducedMotion = usePreferredReducedMotion()
const { y: scrollTop } = useWindowScroll({ behavior: () => reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })

const STACK = ['Nuxt 4', 'Nuxt UI', 'Pinia', 'Nitro cache', 'Vercel']
const PROJECT_LINKS = [
  { label: 'Source code', to: REPOSITORY_URL },
  { label: 'API documentation', to: API_DOCS_URL },
]

// One rhythm for every column: a 28 px heading row, then 20 px lines 8 px apart. Links keep a
// 44 px touch target through a pseudo-element, without breaking that rhythm.
const HEADING = 'flex h-7 items-center text-xs font-semibold tracking-wide text-muted uppercase'
const LINK_TARGET = 'relative after:absolute after:inset-x-0 after:-inset-y-3'
</script>

<template>
  <footer class="mt-12 border-t border-default bg-muted text-sm">
    <UContainer class="grid gap-x-8 gap-y-10 py-10 sm:grid-cols-[3fr_2fr_2fr]">
      <section class="space-y-3">
        <div class="flex h-7 items-center">
          <AppWordmark size="sm" />
        </div>
        <p class="max-w-xs text-muted">
          Leagues and season badges from TheSportsDB in one fast, server-cached list.
        </p>
        <ul
          class="flex flex-wrap gap-1.5"
          aria-label="Built with"
        >
          <li
            v-for="item in STACK"
            :key="item"
          >
            <UBadge
              color="neutral"
              variant="subtle"
              :label="item"
            />
          </li>
        </ul>
      </section>

      <section
        class="space-y-3"
        aria-labelledby="footer-project"
      >
        <h2
          id="footer-project"
          :class="HEADING"
        >
          Project
        </h2>
        <ul class="space-y-2">
          <li
            v-for="link in PROJECT_LINKS"
            :key="link.label"
          >
            <ULink
              :to="link.to"
              target="_blank"
              class="inline-flex items-center gap-1 text-muted hover:text-highlighted"
              :class="LINK_TARGET"
            >
              {{ link.label }}
              <UIcon
                name="i-lucide-arrow-up-right"
                class="size-4"
                aria-hidden="true"
              />
              <span class="sr-only">(opens in a new tab)</span>
            </ULink>
          </li>
        </ul>
      </section>

      <section
        class="space-y-3"
        aria-labelledby="footer-data"
      >
        <h2
          id="footer-data"
          :class="HEADING"
        >
          Data
        </h2>
        <ul class="space-y-2 text-default">
          <li class="flex items-center gap-2 text-highlighted">
            <span
              class="size-2 rounded-full bg-primary motion-safe:animate-pulse"
              aria-hidden="true"
            />
            TheSportsDB free API
          </li>
          <!-- Time-dependent, so client-only; absent until the list is loaded. -->
          <ClientOnly>
            <li v-if="leagues.fetchedAt">
              <DataFreshness :fetched-at="leagues.fetchedAt" />
            </li>
          </ClientOnly>
          <li>Cached on the server for {{ LEAGUES_MAX_AGE / 60 }} minutes</li>
        </ul>
      </section>
    </UContainer>

    <div class="border-t border-default">
      <UContainer class="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 text-muted">
        <p>© 2026 Sports Leagues · Not affiliated with TheSportsDB</p>
        <UButton
          variant="link"
          color="primary"
          label="Back to top"
          trailing-icon="i-lucide-arrow-up"
          class="-mx-2.5 min-h-11"
          @click="scrollTop = 0"
        />
      </UContainer>
    </div>
  </footer>
</template>
