import { expect, leagueRows, searchBox, sportSelect, test, visit } from './helpers'

const count = (page: Parameters<typeof searchBox>[0], text: string) => page.getByText(text, { exact: true })

test('typing filters the list, counts, highlights and writes ?q= after the debounce', async ({ page }) => {
  await visit(page, '/')

  await searchBox(page).fill('premier')

  await expect(leagueRows(page)).toHaveCount(2)
  await expect(count(page, '2 of 12 leagues')).toBeVisible()
  // `mark` has no role in Playwright's types, so a CSS locator.
  await expect(page.getByRole('main').locator('mark')).toHaveText(['Premier', 'Premier'])
  await expect(page).toHaveURL('/?q=premier')
})

test('matches regardless of case and accents', async ({ page }) => {
  await visit(page, '/')

  await searchBox(page).fill('PRÉMIER')

  await expect(leagueRows(page)).toHaveCount(2)
})

test('the sport dropdown has counts; choosing a sport filters and sets ?sport=', async ({ page }) => {
  await visit(page, '/')

  await sportSelect(page).click()
  await expect(page.getByRole('option'))
    .toHaveText(['All sports (12)', 'Basketball (1)', 'Motorsport (1)', 'Soccer (10)'])
  await page.getByRole('option', { name: 'Basketball (1)' }).click()

  await expect(leagueRows(page)).toHaveText([/NBA/])
  await expect(page).toHaveURL('/?sport=Basketball')
})

test('"All sports" removes ?sport=', async ({ page }) => {
  await visit(page, '/?sport=Motorsport')
  await expect(leagueRows(page)).toHaveCount(1)

  await sportSelect(page).click()
  await page.getByRole('option', { name: 'All sports (12)' }).click()

  await expect(leagueRows(page)).toHaveCount(12)
  await expect(page).toHaveURL('/')
})

test('"Reset filters" clears the search and the sport', async ({ page }) => {
  await visit(page, '/?q=liga&sport=Soccer')

  await page.getByRole('button', { name: 'Reset filters' }).click()

  await expect(leagueRows(page)).toHaveCount(12)
  await expect(searchBox(page)).toHaveValue('')
  await expect(page).toHaveURL('/')
})

test('no results shows the empty state naming the query', async ({ page }) => {
  await visit(page, '/')

  await searchBox(page).fill('bundes liga')

  await expect(page.getByText('No leagues match “bundes liga”')).toBeVisible()
  await expect(count(page, '0 of 12 leagues')).toBeVisible()
})

test('reloading with params reproduces the screen', async ({ page }) => {
  await visit(page, '/?q=liga&sport=Soccer')

  await expect(searchBox(page)).toHaveValue('liga')
  await expect(sportSelect(page)).toHaveText(/Soccer \(10\)/)
  await expect(leagueRows(page)).toHaveText([/German Bundesliga/, /Spanish La Liga/])
})

test('an unknown ?sport= shows the full list without an error', async ({ page }) => {
  await visit(page, '/?sport=Nope')

  await expect(leagueRows(page)).toHaveCount(12)
  await expect(sportSelect(page)).toHaveText(/All sports/)
})
