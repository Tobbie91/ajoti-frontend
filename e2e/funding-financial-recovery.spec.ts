import { expect, test } from '@playwright/test'
import { circle, mockRoscaReads } from './rosca-read-fixtures'

test('BVN provisioning failures offer verification and support instead of only retry', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/kyc/status', route => route.fulfill({ json: { status: 'APPROVED', kycLevel: 1, step: 'SUBMITTED' } }))
  let failed = true
  await page.route('**/api/wallet/virtual-account', route => failed
    ? route.fulfill({ status: 400, json: { message: 'BVN must be verified before creating a live virtual account.' } })
    : route.fulfill({ json: { data: { id: 'va', bankName: 'Indulge MFB', accountNumber: '9900000001', accountName: 'Ajoti Wallet - Test Member', currency: 'NGN', isActive: true } } }))
  await page.goto('/fund-wallet')
  await expect(page.getByRole('button', { name: 'Review verification' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Contact support', exact: true })).toBeVisible()
  await expect(page.getByText(/Complete any missing details on your KYC page/)).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByText('9900000001')).toBeVisible()
  await expect(page.getByText("Can't find Indulge MFB in your bank app?")).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy bank name' })).toBeVisible()
  await page.getByRole('button', { name: 'Get funding help' }).click()
  await expect(page).toHaveURL(/\/support$/)
  await page.goto('/fund-wallet')
  await page.getByRole('button', { name: 'Back to wallet' }).click()
  await expect(page).toHaveURL(/\/my-wallet$/)
})

test('a transient funding error does not tell the customer to redo BVN verification', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/kyc/status', route => route.fulfill({ json: { status: 'APPROVED', kycLevel: 1 } }))
  await page.route('**/api/wallet/virtual-account', route => route.fulfill({ status: 503, json: { message: 'Provider temporarily unavailable' } }))
  await page.goto('/fund-wallet')
  await expect(page.getByText('Provider temporarily unavailable')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Review verification' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
})

test('failed financial reads show unavailable and retry reveals collected contributions', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  const user = { id: 'member', role: 'CIRCLE_ADMIN', status: 'ACTIVE', firstName: 'Test', lastName: 'Owner' }
  await page.route('**/api/users/me', route => route.fulfill({ json: user }))
  await page.route('**/api/admin/rosca/family', route => route.fulfill({ json: { data: circle } }))
  let failed = true
  await page.route('**/api/admin/rosca/family/financial-health', route => failed
    ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    : route.fulfill({ json: { data: { cycles: [{ cycleNumber: 1, contributionDeadline: '2026-10-10', expectedPot: '25000000', collected: '5000000', outstanding: '20000000', expectedCount: 5, collectedCount: 1 }] } } }))
  await page.route('**/api/admin/rosca/family/contributions**', route => failed
    ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    : route.fulfill({ json: { data: { contributions: [{ contributionId: 'payment', memberName: 'Test Member', amount: '5000000', paidAt: '2026-10-08T12:00:00Z' }], totalCollected: '5000000' } } }))
  await page.route('**/api/admin/rosca/family/disbursements', route => route.fulfill({ json: { data: [] } }))
  await page.goto('/rosca/groups/family')
  const collectedCard = page.getByText('Total contributions collected').locator('..')
  await expect(collectedCard).toContainText('Unavailable')
  await expect(collectedCard).not.toContainText('₦0.00')
  await page.getByRole('tab', { name: 'Payment Oversight' }).click()
  await expect(page.getByText(/Could not load contributions\./)).toBeVisible()
  await expect(page.getByText('No contributions found').filter({ visible: true })).toHaveCount(0)
  failed = false
  await page.getByRole('button', { name: 'Refresh group' }).click()
  await expect(collectedCard).toContainText('50,000.00')
  await expect(page.getByRole('tabpanel', { name: 'Payment Oversight' }).getByText('Test Member', { exact: true })).toBeVisible()
  await expect(page.getByText(/Could not load contributions\./)).toHaveCount(0)
})

test('failed group details never display a fabricated example group', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/users/me', route => route.fulfill({ json: { id: 'member', role: 'CIRCLE_ADMIN', status: 'ACTIVE' } }))
  await page.route('**/api/admin/rosca/family', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.goto('/rosca/groups/family')
  await expect(page.getByText(/Could not load this group/)).toBeVisible()
  await expect(page.getByText('Monthly 50k Squad')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
})
