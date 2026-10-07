import { expect, test } from '@playwright/test'
import { mockCustomer } from './review-fix-fixtures'

test('activity in one tab protects the shared session until all tabs become idle', async ({ context, page }) => {
  let logouts = 0
  await mockCustomer(context, async (route, path) => {
    if (path !== '/api/auth/logout') return false
    logouts++
    await route.fulfill({ json: { message: 'Logged out' } })
    return true
  })
  const sibling = await context.newPage()
  const start = new Date('2030-01-01T00:00:00Z')
  // Playwright's clock is shared by every page in a browser context.
  await page.clock.install({ time: start })
  await page.clock.pauseAt(start)
  for (const tab of [page, sibling]) {
    await tab.goto('/withdraw')
    await expect(tab.getByText('Select Recipient Account', { exact: true })).toBeVisible()
  }
  await page.clock.runFor(170000)
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')))
  await expect.poll(() => sibling.evaluate(() => Number(localStorage.getItem('ajoti:customer-last-activity:review-member')))).toBe(start.getTime() + 170000)
  await page.clock.runFor(500)
  await page.evaluate(() => window.dispatchEvent(new Event('pointermove')))
  await sibling.clock.runFor(9500)
  await expect.poll(() => sibling.evaluate(() => Number(localStorage.getItem('ajoti:customer-last-activity:review-member')))).toBe(start.getTime() + 170500)
  expect(logouts).toBe(0)
  await expect(sibling.getByText('Select Recipient Account', { exact: true })).toBeVisible()
  await sibling.clock.runFor(170499)
  expect(logouts).toBe(0)
  await sibling.clock.runFor(1)
  await expect.poll(() => logouts).toBeGreaterThanOrEqual(1)
  await expect(sibling).toHaveURL(/\/login$/)
})
