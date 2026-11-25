import { test as base, expect, type Page } from '@playwright/test'

interface GuardOptions {
  /** Console messages a test provokes on purpose, e.g. `Failed to load resource … 502`. */
  expectedConsole: RegExp[]
}

/**
 * Every spec imports `test` from here: it fails the test on any console error or warning and on
 * any uncaught page error, except the messages listed in `expectedConsole` for that test.
 */
export const test = base.extend<GuardOptions & { consoleGuard: undefined }>({
  expectedConsole: [[], { option: true }],
  consoleGuard: [
    async ({ page, expectedConsole }, use) => {
      const problems: string[] = []
      page.on('console', (message) => {
        const type = message.type()
        if (type !== 'error' && type !== 'warning') return
        const text = message.text()
        if (!expectedConsole.some(pattern => pattern.test(text))) problems.push(`${type}: ${text}`)
      })
      page.on('pageerror', error => problems.push(`page error: ${error.message}`))
      await use(undefined)
      expect(problems, 'console errors, warnings and page errors').toEqual([])
    },
    { auto: true },
  ],
})

/** `page.goto`, then wait until Nuxt has hydrated, so the first click or keystroke is not lost. */
export async function visit(page: Page, url: string) {
  const response = await page.goto(url)
  await page.waitForFunction(() => window.useNuxtApp?.().isHydrating === false)
  return response
}

export const searchBox = (page: Page) => page.getByRole('textbox', { name: 'Search leagues' })
export const sportSelect = (page: Page) => page.getByRole('combobox', { name: 'Sport' })
export const leagueRows = (page: Page) => page.getByRole('main').getByRole('listitem')
export const leagueButton = (page: Page, name: string) => page.getByRole('button', { name })
/** The open row's badge panel (footer sections are regions too, hence the `main` scope). */
export const badgePanel = (page: Page) => page.getByRole('main').getByRole('region')

/** Records the browser's requests for season badges from now on. */
export function recordSeasonRequests(page: Page): string[] {
  const urls: string[] = []
  page.on('request', (request) => {
    if (/\/api\/leagues\/\d+\/seasons$/.test(new URL(request.url()).pathname)) urls.push(request.url())
  })
  return urls
}

/** How far the page is wider than the viewport, in pixels (0 or less: no horizontal scroll). */
export function pageOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement
    return scrollWidth - clientWidth
  })
}

export { expect }
