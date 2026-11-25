// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Sports Leagues',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dark',
  },
  // Server-only (no `public` key): the browser never sees the key or the upstream URL. Overridden
  // by NUXT_SPORTSDB_API_KEY and NUXT_SPORTSDB_BASE_URL (the fixture server in tests).
  runtimeConfig: {
    sportsdbApiKey: '123',
    sportsdbBaseUrl: 'https://www.thesportsdb.com/api/v1/json',
  },
  compatibilityDate: '2026-11-01',
  nitro: {
    // In-memory in development too, so live data (`dev`) and fixture data (`dev:fixtures`) never
    // mix in a cache persisted on disk.
    devStorage: {
      cache: { driver: 'memory' },
    },
    typescript: {
      tsConfig: {
        include: ['../tests/unit/server/**/*', '../tests/unit/helpers/**/*'],
      },
    },
  },
  typescript: {
    strict: true,
    // Tests are type-checked by `nuxt typecheck` under the tsconfig of the code they exercise.
    // Paths are relative to `.nuxt/`.
    tsConfig: {
      include: ['../tests/unit/app/**/*'],
    },
    nodeTsConfig: {
      include: ['../tests/e2e/**/*', '../*.config.*'],
    },
  },
  eslint: {
    config: {
      stylistic: {
        semi: false,
        quotes: 'single',
      },
    },
  },
  fonts: {
    // Downloaded at build time and served from our own origin. One entry: entries sharing a name
    // are merged option by option, so a second entry's weights would be ignored. 800 italic is
    // the wordmark, declared so the browser does not synthesise it. Public Sans is a variable
    // font, so the extra faces share files, and browsers fetch only the faces in use.
    families: [
      {
        name: 'Public Sans',
        provider: 'google',
        weights: [400, 500, 600, 700, 800],
        styles: ['normal', 'italic'],
      },
    ],
    defaults: {
      subsets: ['latin', 'latin-ext'],
    },
  },
  icon: {
    // Icons come only from the locally installed collections; never from the Iconify API.
    serverBundle: { collections: ['lucide', 'tabler'] },
    fallbackToApi: false,
  },
})
