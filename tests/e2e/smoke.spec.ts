import { expect, pageOverflow, test } from './helpers'

const FIXTURE_LEAGUES = 12

test('the list page renders from the production build with a clean console', async ({ page }) => {
  const foreign: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol !== 'data:' && url.hostname !== 'localhost') foreign.push(request.url())
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'Leagues' })).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(FIXTURE_LEAGUES)
  await expect(page.getByText('Formula 1')).toBeVisible()
  // No upstream API, icon or font host: everything is served by the app (or the fixture images).
  expect(foreign, 'requests to a non-local host').toEqual([])
})

test('the list page has no horizontal scroll at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(FIXTURE_LEAGUES)

  expect(await pageOverflow(page)).toBeLessThanOrEqual(0)
})

test('a URL with ?open= and ?season= renders the badge on the server', async ({ page }) => {
  const seasonsRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/seasons')) seasonsRequests.push(request.url())
  })

  await page.goto('/?open=4328&season=1993-1994')

  const badge = page.getByRole('img', { name: 'English Premier League badge, season 1993/94' })
  await expect(badge).toBeVisible()
  await expect(page.getByRole('button', { name: /English Premier League/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('radio', { name: '1993/94' })).toBeChecked()
  expect(await badge.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  // Server-rendered: the browser does not ask for the seasons again.
  expect(seasonsRequests).toEqual([])
})

test('an open league fits a 320 px screen, season picker included', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/?open=4328')
  await expect(page.getByRole('radiogroup', { name: 'Season' })).toBeVisible()

  const picker = await page.getByRole('radiogroup', { name: 'Season' }).boundingBox()
  const panel = await page.getByRole('region', { name: /English Premier League/ }).boundingBox()
  expect(await pageOverflow(page)).toBeLessThanOrEqual(0)
  expect(picker!.x + picker!.width).toBeLessThanOrEqual(panel!.x + panel!.width)
})
