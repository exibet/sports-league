import { expect, leagueButton, recordSeasonRequests, searchBox, test, visit } from './helpers'

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
}

Object.entries(VIEWPORTS).forEach(([device, viewport]) => test.describe(device, () => {
  test.use({ viewport })

  test('from a filtered list to the league page and back, with the list restored', async ({ page }) => {
    await visit(page, '/?q=premier&open=4328')

    await page.getByRole('link', { name: 'League details' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'English Premier League' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
    await expect(page.getByRole('img', { name: /English Premier League badge, season/ })).toHaveCount(5)

    await page.getByRole('link', { name: 'All leagues' }).click()

    await expect(page).toHaveURL('/?q=premier&open=4328')
    await expect(leagueButton(page, 'English Premier League')).toHaveAttribute('aria-expanded', 'true')
    await expect(searchBox(page)).toHaveValue('premier')
  })

  test('a direct visit, then "All leagues", lands on a clean list', async ({ page }) => {
    await visit(page, '/leagues/4387')

    await page.getByRole('link', { name: 'All leagues' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Leagues' })).toBeVisible()
    await expect(page).toHaveURL('/')
  })

  test('a league seen on its page opens in the list without a seasons request', async ({ page }) => {
    await visit(page, '/leagues/4331')
    await page.getByRole('link', { name: 'All leagues' }).click()
    await expect(page).toHaveURL('/')
    const requests = recordSeasonRequests(page)

    await leagueButton(page, 'German Bundesliga').click()

    await expect(page.getByRole('img', { name: /German Bundesliga badge, season/ })).toBeVisible()
    expect(requests).toEqual([])
  })

  test('while the league page loads, the list keeps its state and the new URL has no ?q=', async ({ page }) => {
    const gate = Promise.withResolvers<undefined>()
    await page.route('**/api/leagues/4330', async (route) => {
      await gate.promise
      await route.continue()
    })
    await visit(page, '/?q=premier&open=4330')

    await page.getByRole('link', { name: 'League details' }).click()
    // The navigation is committed while the details request is held: the list is still shown.
    await expect(page).toHaveURL('/leagues/4330')
    await expect(searchBox(page)).toHaveValue('premier')
    await expect(leagueButton(page, 'Scottish Premier League')).toHaveAttribute('aria-expanded', 'true')
    gate.resolve(undefined)

    await expect(page.getByRole('heading', { level: 1, name: 'Scottish Premier League' })).toBeVisible()
    await expect(page).toHaveURL('/leagues/4330')
  })
}))
