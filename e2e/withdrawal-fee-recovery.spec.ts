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

test('withdrawal data failures are shown explicitly and can be retried', async ({ page, context }) => {
  let walletCalls = 0
  let accountCalls = 0
  await mockCustomer(context, async (route, path) => {
    if (path === '/api/wallet/withdrawal/quote') {
      await route.fulfill({ json: { feeBearer: 'PLATFORM', amountKobo: '100000', feeKobo: '0', totalDebitKobo: '100000', currency: 'NGN', expiresAt: new Date(Date.now() + 300000).toISOString() } })
      return true
    }
    if (path === '/api/wallet') {
      walletCalls++
      await route.fulfill(walletCalls === 1
        ? { status: 503, json: { message: 'Wallet unavailable' } }
        : { json: { data: { balance: { available: '500000' }, pendingWithdrawal: null } } })
      return true
    }
    if (path === '/api/users/me/bank-accounts') {
      accountCalls++
      await route.fulfill(accountCalls === 1
        ? { status: 503, json: { message: 'Accounts unavailable' } }
        : { json: { data: [{ id: 'bank-1', bankName: 'Test Bank', bankCode: '044', accountName: 'Review Member', accountNumber: '1234567890', isDefault: true }] } })
      return true
    }
    return false
  })
  await page.goto('/withdraw')
  await expect(page.getByText('Available balance unavailable')).toBeVisible()
  await expect(page.getByText("We couldn't load your saved accounts. Please try again.")).toBeVisible()
  await page.getByRole('button', { name: 'Retry balance' }).click()
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByText(/Available: ₦5,000/)).toBeVisible()
  await expect(page.getByText('Review Member')).toBeVisible()
})

test('Forgot PIN opens the existing support flow', async ({ page, context }) => {
  await mockCustomer(context, async (route, path) => {
    if (path === '/api/wallet/withdrawal/quote') {
      await route.fulfill({ json: { feeBearer: 'PLATFORM', amountKobo: '100000', feeKobo: '0', totalDebitKobo: '100000', currency: 'NGN', expiresAt: new Date(Date.now() + 300000).toISOString() } })
      return true
    }
    return false
  })
  await page.goto('/withdraw')
  await page.getByRole('button', { name: /Review Member/ }).click()
  await page.getByPlaceholder('0', { exact: true }).fill('1000')
  await page.getByRole('button', { name: 'Review withdrawal', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm and enter PIN' }).click()
  await page.getByRole('button', { name: 'Forgot PIN?' }).click()
  await expect(page).toHaveURL(/\/support\?category=ACCOUNT/)
})

test('withdrawal initiation shows pending confirmation and its reference', async ({ page, context }) => {
  await mockCustomer(context, async (route, path) => {
    if (path === '/api/wallet/withdrawal/quote') {
      await route.fulfill({ json: { feeBearer: 'PLATFORM', amountKobo: '100000', feeKobo: '0', totalDebitKobo: '100000', currency: 'NGN', expiresAt: new Date(Date.now() + 300000).toISOString() } })
      return true
    }
    if (path === '/api/wallet/withdrawal/initialize') {
      await route.fulfill({ json: { reference: 'withdrawal-ref-1', amount: 100000, feeKobo: '0', totalDebitKobo: '100000', status: 'PENDING', message: 'Withdrawal submitted' } })
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
  await expect(page.getByText('Withdrawal Initiated')).toBeVisible()
  await expect(page.getByText('awaiting confirmation')).toBeVisible()
  await expect(page.getByText('withdrawal-ref-1')).toBeVisible()
})
