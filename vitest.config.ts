import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  test: {
    projects: [
      {
        // Plain Node: server code, shared code and app utils. Aliases match Nuxt's own, so server
        // imports work unchanged in tests.
        resolve: {
          alias: {
            '#shared': fromRoot('./shared'),
            '~~': fromRoot('.'),
            '~': fromRoot('./app'),
          },
        },
        test: {
          name: 'node',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      // The Nuxt runtime (auto-imports, Pinia, router): stores and components.
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.test.ts'],
          environment: 'nuxt',
        },
      }),
    ],
    coverage: {
      // Only the `node` project is measured: @nuxt/test-utils does not support coverage.
      provider: 'v8',
      include: ['server/**', 'shared/**', 'app/utils/**'],
      // Enabled in P3.2, with the first server tests.
      // thresholds: {
      //   lines: 70,
      //   functions: 70,
      //   branches: 65,
      // },
    },
  },
})
