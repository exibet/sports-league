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

/** How far the page is wider than the viewport, in pixels (0 or less: no horizontal scroll). */
export function pageOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement
    return scrollWidth - clientWidth
  })
}

export { expect }
