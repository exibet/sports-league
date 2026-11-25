import { expect, sportSelect, test, visit } from './helpers'

// The README image of the sport filter, on mixed fixtures (live data has one sport), in the default
// dark theme. Not part of `test:e2e`: run it with `npm run screenshot`.
test.use({ viewport: { width: 1100, height: 720 } })

test('README: the sport filter', { tag: '@screenshot' }, async ({ page }) => {
  await visit(page, '/?q=league&open=4328')
  await expect(page.getByRole('img', { name: /badge, season/ })).toBeVisible()

  await sportSelect(page).click()
  await expect(page.getByRole('option', { name: 'Soccer (10)' })).toBeVisible()

  await page.screenshot({
    path: 'docs/readme/sport-filter.png',
    clip: { x: 0, y: 64, width: 1100, height: 600 },
    animations: 'disabled',
  })
})
