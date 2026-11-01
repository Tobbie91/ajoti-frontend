import { expect, test } from '@playwright/test'
import { mockRoscaReads } from './rosca-read-fixtures'

test('a small-wallet debt-only payment refreshes balances without marking the cycle paid', async ({ page }, testInfo) => {
  await mockRoscaReads(page, { duration: 5 })
  let walletReads = 0
  let circleReads = 0
  let repaid = false
  await page.route('**/api/wallet/balance', route => {
    walletReads++
    return route.fulfill({ json: { data: { total: repaid ? '0' : '50000', reserved: '0', available: repaid ? '0' : '50000' } } })
  })
  await page.route('**/api/rosca/my-participations', async route => {
    circleReads++
    return route.fallback()
  })
  await page.route('**/api/rosca/family/contributions', route => {
    if (route.request().method() !== 'POST') return route.fallback()
    repaid = true
    return route.fulfill({ json: { data: { status: 'DEBT_REPAYMENT', amount: '0', cycleNumber: 2, debtRecovery: { repaidAmount: '50000', remainingDebt: '123456', repayments: [] } } } })
  })
  await page.goto('/rosca?tab=joined', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /^Pay contribution$/i }).first().click()
  const modal = page.getByRole('dialog')
  await expect(modal).toContainText(/debts across all.*circles.*first/i)
  const beforeWallet = walletReads
  const beforeCircles = circleReads
  await modal.getByRole('button', { name: 'Confirm & Pay' }).click()
  await expect(modal).toContainText('Debt repayment recorded')
  await expect(modal).toContainText('₦500.00')
  await expect(modal).toContainText('₦1,234.56')
  await expect(modal).toContainText(/No contribution was recorded for Cycle/)
  await expect(modal).not.toContainText('Payment not confirmed yet')
  await expect.poll(() => walletReads).toBeGreaterThan(beforeWallet)
  await expect.poll(() => circleReads).toBeGreaterThan(beforeCircles)
  await page.screenshot({ path: testInfo.outputPath('debt-only-payment.png'), fullPage: true })
  await modal.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('button', { name: /^Pay contribution$/i }).first()).toBeVisible()
})

test('blocked repayment with no debit does not claim money was applied', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/rosca/family/contributions', route => route.request().method() === 'POST'
    ? route.fulfill({ json: { data: { status: 'DEBT_REPAYMENT', amount: '0', cycleNumber: 2, debtRecovery: { repaidAmount: '0', remainingDebt: '5000000', repayments: [], blockedReason: 'PENDING_WITHDRAWAL' } } } })
    : route.fallback())
  await page.goto('/rosca?tab=joined', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /^Pay contribution$/i }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm & Pay' }).click()
  const modal = page.getByRole('dialog')
  await expect(modal).toContainText('Debt repayment needs attention')
  await expect(modal).toContainText('Automatic debt repayment could not proceed')
  await expect(modal).not.toContainText('Debt repayment recorded')
  await expect(modal).not.toContainText('Your available money was applied')
})

for (const status of ['COMPLETED', 'PENDING']) {
  test(`a ${status.toLowerCase()} contribution shows the debt recovery already committed`, async ({ page }) => {
    await mockRoscaReads(page, { duration: 5 })
    await page.route('**/api/rosca/family/contributions', route => route.request().method() === 'POST'
      ? route.fulfill({ json: { data: { id: 'receipt', status, amount: '5000000', penaltyAmount: '0', paidAt: '2026-11-01T00:00:00Z', cycleNumber: 1, debtRecovery: { repaidAmount: '12345', remainingDebt: '0', repayments: [] } } } })
      : route.fallback())
    await page.goto('/rosca?tab=joined', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /^Pay contribution$/i }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm & Pay' }).click()
    // The joined-card completion callback may close the modal for a completed contribution.
    if (status === 'PENDING') {
      await expect(page.getByRole('dialog')).toContainText('₦123.45')
      await expect(page.getByRole('dialog')).toContainText('Payment not confirmed yet')
    } else {
      await expect(page.getByText(/Debt repaid: ₦123.45/).first()).toBeVisible()
    }
  })
}

for (const role of ['MEMBER', 'CIRCLE_ADMIN']) {
  test(`the ${role} dashboard shows only the authenticated member's outstanding debt`, async ({ page }, testInfo) => {
    await mockRoscaReads(page, { duration: 5 })
    const user = { id: 'member', firstName: 'Test', role, status: 'ACTIVE' }
    await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), user)
    await page.route('**/api/users/me', route => route.fulfill({ json: user }))
    await page.route('**/api/admin/rosca/dashboard', route => route.fulfill({ json: { data: { totalGroups: 1, memberGroupCount: 1, nextDeadline: null, pendingJoinRequests: { total: 0, breakdown: [] } } } }))
    await page.route('**/api/debts/mine', route => route.fulfill({ json: { data: [
      { id: 'a', outstandingTotal: '12345', status: 'OUTSTANDING' },
      { id: 'b', outstandingTotal: '20000', status: 'PARTIALLY_REPAID' },
    ] } }))
    await page.goto(role === 'MEMBER' ? '/home' : '/dashboard', { waitUntil: 'domcontentloaded' })
    const notice = page.getByRole('region', { name: 'Your outstanding debt' })
    await expect(notice).toContainText('₦323.45')
    await expect(notice).toContainText(/before.*cycle contributions/i)
    await page.screenshot({ path: testInfo.outputPath('own-debt-dashboard.png'), fullPage: true })
    await notice.getByRole('link', { name: 'View your debts' }).click()
    await expect(page).toHaveURL(/\/debts$/)
  })
}

test('a failed debt read remains unavailable until retry confirms no outstanding debt', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  let fail = true
  await page.route('**/api/debts/mine', route => fail
    ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    : route.fulfill({ json: { data: [] } }))
  await page.goto('/home', { waitUntil: 'domcontentloaded' })
  const notice = page.getByRole('region', { name: 'Your outstanding debt' })
  await expect(notice).toContainText('Debt balance unavailable')
  await expect(notice).not.toContainText('₦0')
  fail = false
  await notice.getByRole('button', { name: 'Retry debt balance' }).click()
  await expect(notice).toHaveCount(0)
})

