import { defineConfig, devices } from '@playwright/test'

// Fixed ports, different from `dev:fixtures` (3000 / 3901), so a running dev session does not clash.
const APP_PORT = 3920
const FIXTURE_PORT = 3921

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Runs the existing production build (`npm run build` first) against the fixture server.
  webServer: [
    {
      command: `node tests/fixtures/server.mjs ${FIXTURE_PORT}`,
      url: `http://localhost:${FIXTURE_PORT}/api/v1/json/123/all_leagues.php`,
      reuseExistingServer: false,
    },
    {
      command: 'node .output/server/index.mjs',
      url: `http://localhost:${APP_PORT}/api/leagues`,
      reuseExistingServer: false,
      env: {
        PORT: String(APP_PORT),
        NUXT_SPORTSDB_BASE_URL: `http://localhost:${FIXTURE_PORT}/api/v1/json`,
      },
    },
  ],
})
