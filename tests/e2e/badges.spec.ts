import type { Page } from '@playwright/test'
import { badgePanel, expect, leagueButton, recordSeasonRequests, searchBox, test, visit } from './helpers'
import { FIXTURE_ORIGIN } from './ports'

const badge = (page: Page) => badgePanel(page).getByRole('img', { name: /badge, season/ })

async function openLeague(page: Page, name: string) {
  await leagueButton(page, name).click()
  await expect(leagueButton(page, name)).toHaveAttribute('aria-expanded', 'true')
}

test('opening a league shows its badge and sets ?open=', async ({ page }) => {
  await visit(page, '/')

  await openLeague(page, 'Scottish Premier League')

  await expect(badge(page)).toBeVisible()
  await expect(page).toHaveURL('/?open=4330')
})

test('opening another league closes the first', async ({ page }) => {
  await visit(page, '/')

  await openLeague(page, 'German Bundesliga')
  await openLeague(page, 'Italian Serie A')

  await expect(leagueButton(page, 'German Bundesliga')).toHaveAttribute('aria-expanded', 'false')
  await expect(badgePanel(page)).toHaveCount(1)
})

test('switching the season changes the image and ?season=', async ({ page }) => {
  await visit(page, '/')
  await openLeague(page, 'French Ligue 1')
  const firstSrc = await badge(page).getAttribute('src')

  await page.getByRole('radiogroup', { name: 'Season' }).getByText('2013/14').click()

  await expect(page.getByRole('radio', { name: '2013/14' })).toBeChecked()
  await expect(badge(page)).toHaveAccessibleName('French Ligue 1 badge, season 2013/14')
  await expect(badge(page)).not.toHaveAttribute('src', firstSrc ?? '')
  await expect(page).toHaveURL('/?open=4334&season=2013-2014')
})

test('closing and reopening a league makes no new seasons request', async ({ page }) => {
  await visit(page, '/')
  const requests = recordSeasonRequests(page)

  await openLeague(page, 'Spanish La Liga')
  await expect(badge(page)).toBeVisible()
  await leagueButton(page, 'Spanish La Liga').click()
  await expect(leagueButton(page, 'Spanish La Liga')).toHaveAttribute('aria-expanded', 'false')
  await openLeague(page, 'Spanish La Liga')

  await expect(badge(page)).toBeVisible()
  // One request for the first open (so the listener does see them), none for the reopen.
  expect(requests).toHaveLength(1)
})

test('a league without badges explains it', async ({ page }) => {
  await visit(page, '/')

  await openLeague(page, 'English League Championship')

  await expect(page.getByText('No season badges yet')).toBeVisible()
  await expect(page.getByRole('link', { name: 'League details' })).toBeVisible()
})

test('more than five seasons switch the picker to the stepper', async ({ page }) => {
  const seasons = Array.from({ length: 10 }, (_, i) => ({
    season: `${2000 + i}-${2001 + i}`,
    badgeUrl: `${FIXTURE_ORIGIN}/images/media/league/badgearchive/stepper-${i}.png/small`,
  }))
  await page.route('**/api/leagues/4336/seasons', route => route.fulfill({ json: seasons }))
  await visit(page, '/')

  await openLeague(page, 'Greek Super League 1')
  await expect(page.getByRole('radiogroup')).toHaveCount(0)
  await page.getByRole('button', { name: 'Next season' }).click()

  await expect(badge(page)).toHaveAccessibleName('Greek Super League 1 badge, season 2001/02')
  await expect(page.getByText('Badge 2 of 10')).toBeVisible()
})

test.describe('a failed seasons request', () => {
  test.use({ expectedConsole: [/status of 502/] })

  test('shows the error, and "Try again" loads the badge (the failure was not cached)', async ({ page }) => {
    await page.route('**/api/leagues/4337/seasons', route => route.fulfill({
      status: 502,
      json: { statusCode: 502, message: 'TheSportsDB is limiting requests right now. Try again in a minute.' },
    }))
    await visit(page, '/')

    await openLeague(page, 'Dutch Eredivisie')
    await expect(page.getByText('Couldn’t load the badge.')).toBeVisible()
    await expect(page.getByText('TheSportsDB is limiting requests right now. Try again in a minute.')).toBeVisible()

    await page.unroute('**/api/leagues/4337/seasons')
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(badge(page)).toBeVisible()
  })
})

test('filtering away the open league drops ?open= and ?season=', async ({ page }) => {
  await visit(page, '/?open=4328&season=1993-1994')
  await expect(badge(page)).toBeVisible()

  await searchBox(page).fill('bundesliga')

  await expect(badgePanel(page)).toHaveCount(0)
  await expect(page).toHaveURL('/?q=bundesliga')
})
