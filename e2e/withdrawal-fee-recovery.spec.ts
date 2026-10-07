import { expect, test } from '@playwright/test'
import { mockCustomer } from './review-fix-fixtures'

test('a failed replacement fee quote returns to a retryable withdrawal form', async ({ page, context }) => {
  let quotes = 0
  let submissions = 0
  await mockCustomer(context, async (route, path) => {
    if (path === '/api/wallet/withdrawal/quote') {
      quotes++
      await route.fulfill(quotes === 2
        ? { status: 503, json: { message: 'Transfer fee is temporarily unavailable' } }
        : { json: { feeBearer: 'CUSTOMER', amountKobo: '100000', feeKobo: '5375', totalDebitKobo: '105375', currency: 'NGN', expiresAt: new Date(Date.now() + 300000).toISOString() } })
      return true
    }
    if (path === '/api/wallet/withdrawal/initialize') {
      submissions++
      await route.fulfill({ status: 409, json: { message: 'Transfer fee changed. Please review the updated fee before confirming this withdrawal.' } })
      return true
    }
    return false
  })
  await page.goto('/withdraw')
  await page.getByRole('button', { name: /Review Member/ }).click()
  await page.getByPlaceholder('0', { exact: true }).fill('1000')
  await page.getByRole('button', { name: 'Review withdrawal', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm and enter PIN' }).click()
  for (const digit of ['1', '2', '3', '4']) await page.getByRole('button', { name: digit, exact: true }).click()
  await expect(page.getByText('Transfer fee is temporarily unavailable', { exact: true })).toBeVisible()
  await expect(page.getByText('Processing your withdrawal...', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Review withdrawal', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirm and enter PIN' })).toBeVisible()
  expect(quotes).toBe(3)
  expect(submissions).toBe(1)
})
