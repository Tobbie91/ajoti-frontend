import { expect, test } from '@playwright/test'
import { mockCustomer } from './review-fix-fixtures'

test('transaction category and direction filters apply to ledger rows', async ({ page, context }) => {
  await mockCustomer(context, async (route, path) => {
    if (path === '/api/wallet/transaction-exports/active') {
      await route.fulfill({ json: { data: null } })
      return true
    }
    if (path === '/api/wallet/transactions') {
      await route.fulfill({ json: { success: true, data: [
        { id: 'target-reserve', entryType: 'RESERVE', movementType: '', bucketType: 'TARGET', sourceType: 'TARGET_SAVINGS', amount: '10000', balanceBefore: '100000', balanceAfter: '100000', createdAt: '2026-10-18T10:00:00Z', description: 'Target savings reserve' },
        { id: 'rosca-debit', entryType: 'DEBIT', movementType: '', bucketType: 'ROSCA', sourceType: 'CONTRIBUTION', amount: '20000', balanceBefore: '100000', balanceAfter: '80000', createdAt: '2026-10-18T09:00:00Z', description: 'ROSCA contribution' },
        { id: 'bank-withdrawal', entryType: 'DEBIT', movementType: 'WITHDRAWAL', bucketType: 'MAIN', sourceType: 'TRANSACTION', amount: '5000', balanceBefore: '80000', balanceAfter: '75000', createdAt: '2026-10-18T08:00:00Z', description: 'Bank withdrawal' },
      ] } })
      return true
    }
    return false
  })
  await page.goto('/transactions')
  await page.getByPlaceholder('Category').click()
  await page.getByRole('option', { name: 'ROSCA', exact: true }).click()
  await expect(page.getByText('ROSCA contribution')).toBeVisible()
  await expect(page.getByText('Bank withdrawal')).toHaveCount(0)
  await page.getByPlaceholder('Category').click()
  await page.getByRole('option', { name: 'All', exact: true }).click()
  await page.getByPlaceholder('Type').click()
  await page.getByRole('option', { name: 'Debit', exact: true }).click()
  await expect(page.getByText('Bank withdrawal')).toBeVisible()
  await expect(page.getByText('Target savings reserve')).toHaveCount(0)
})
