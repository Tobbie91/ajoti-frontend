import { expect, test, type Page } from '@playwright/test'
import { mockRoscaReads } from './rosca-read-fixtures'

async function dashboard(page: Page, state: 'soon' | 'overdue' | 'debt' | 'paid' | 'partial' | 'failed', role = 'MEMBER') {
  await mockRoscaReads(page, { duration: 5 })
  await page.clock.setFixedTime(new Date('2026-11-03T10:00:00Z'))
  const user = { id: 'member', firstName: 'Test', role, status: 'ACTIVE' }
  await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), user)
  await page.route('**/api/users/me', r => r.fulfill({ json: user }))
  await page.route('**/api/admin/rosca/dashboard', r => r.fulfill({ json: { data: { pendingJoinRequests: { total: 0, breakdown: [] } } } }))
  await page.route('**/api/debts/mine', r => r.fulfill({ json: { data: state === 'debt' ? [{
    id: 'debt', circleId: 'family', circleName: 'Family Ajo', cycleNumber: 1, status: 'OUTSTANDING',
    outstandingTotal: '1040000', outstandingPrincipal: '1000000', outstandingPenalty: '40000', createdAt: '2026-11-01T00:00:00Z',
  }] : [] } }))
  await page.route('**/api/rosca/family/schedules', r => r.fulfill({ json: { data: [{
    cycleNumber: 2, status: 'UPCOMING', contributionDeadline: state === 'overdue' ? '2026-11-02T17:00:00Z' : '2026-11-04T17:00:00Z',
  }] } }))
  await page.route('**/api/rosca/family/contributions?*', r => state === 'failed'
    ? r.fulfill({ status: 503, json: { message: 'Unavailable' } })
    : r.fulfill({ json: { data: state === 'paid' || state === 'partial' ? [{ id: 'receipt', cycleNumber: 2,
      amount: state === 'paid' ? '5000000' : '2000000', penaltyAmount: '0', paidAt: '2026-11-01T10:00:00Z' }] : [] } }))
  await page.goto(role === 'MEMBER' ? '/home' : '/dashboard', { waitUntil: 'domcontentloaded' })
}

for (const role of ['MEMBER', 'CIRCLE_ADMIN']) {
  for (const state of ['soon', 'overdue', 'debt'] as const) {
    test(`${role} ${state} notice precedes the welcome banner and gives the right action`, async ({ page }, info) => {
      await dashboard(page, state, role)
      const panel = page.getByRole('region', { name: state === 'debt' ? 'Your outstanding debt' : 'Your contribution status' })
      await expect(panel).toContainText(state === 'soon' ? 'Your contribution is due tomorrow' : state === 'overdue' ? 'Your contribution is overdue' : 'You have an unpaid contribution debt')
      await expect(panel).toContainText('Family Ajo')
      await expect(panel).toContainText(state === 'debt' ? 'Cycle 1' : 'Cycle 2 of 5')
      if (state === 'debt') {
        await expect(panel).toContainText('₦10,000.00')
        await expect(panel).toContainText('₦400.00')
        await expect(panel).toContainText('₦10,400.00')
        await expect(panel).toContainText(/oldest first/)
        await expect(panel).toContainText(/does not pay.*current cycle/i)
        await expect(panel.getByRole('link', { name: 'View and repay debt' })).toHaveAttribute('href', '/debts')
      } else {
        await expect(panel).toContainText('WAT')
        await expect(panel.getByRole('link', { name: state === 'soon' ? 'Pay contribution' : 'Pay overdue contribution', exact: true })).toHaveAttribute('href', '/rosca/family')
      }
      const top = await panel.boundingBox()
      const hero = await page.getByRole('heading', { name: 'Everything grows together.' }).boundingBox()
      expect(top!.y).toBeLessThan(hero!.y)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: info.outputPath(`${state}.png`), fullPage: true })
    })
  }
}

test('a paid current cycle does not produce a due or overdue warning', async ({ page }) => {
  await dashboard(page, 'paid')
  const next = page.getByRole('region', { name: 'Next deadline' })
  await expect(next).toContainText('Paid for this cycle')
  await expect(page.getByRole('region', { name: 'Your contribution status' })).toHaveCount(0)
})

test('partial payments reduce the remaining amount in both panels', async ({ page }) => {
  await dashboard(page, 'partial')
  await expect(page.getByRole('region', { name: 'Your contribution status' })).toContainText('₦30,000.00 remaining')
  await expect(page.getByRole('region', { name: 'Next deadline' })).toContainText('₦30,000.00 remaining')
})

test('unavailable personal history never becomes a false unpaid warning', async ({ page }) => {
  await dashboard(page, 'failed')
  const notice = page.getByRole('region', { name: 'Your contribution status' })
  await expect(notice).toContainText('Contribution status unavailable')
  await expect(notice).not.toContainText('overdue')
  await expect(notice).not.toContainText('₦0')
  await expect(notice.getByRole('button', { name: 'Retry contribution status' })).toBeVisible()
})

test('hiding wallet amounts also hides the debt breakdown and total', async ({ page }) => {
  await dashboard(page, 'debt')
  await page.getByRole('region', { name: 'Wallet balances' }).getByRole('button').first().click()
  const panel = page.getByRole('region', { name: 'Your outstanding debt' })
  await expect(panel).toContainText('••••••')
  await expect(panel).not.toContainText('₦')
})

test('a schedule refresh follows the next cycle after payout advances it', async ({ page }) => {
  await dashboard(page, 'soon')
  const panel = page.getByRole('region', { name: 'Your contribution status' })
  await expect(panel).toContainText('Cycle 2 of 5')
  await page.route('**/api/rosca/family/schedules', r => r.fulfill({ json: { data: [
    { cycleNumber: 2, status: 'COMPLETED', contributionDeadline: '2026-11-02T17:00:00Z' },
    { cycleNumber: 3, status: 'UPCOMING', contributionDeadline: '2026-11-04T17:00:00Z' },
  ] } }))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(panel).toContainText('Cycle 3 of 5')
})

test('a receipt for a different cycle never suppresses the current unpaid warning', async ({ page }) => {
  await dashboard(page, 'paid')
  await page.route('**/api/rosca/family/contributions?*', r => r.fulfill({ json: { data: [
    { id: 'older', cycleNumber: 1, amount: '5000000', penaltyAmount: '0', paidAt: '2026-11-01T10:00:00Z' },
  ] } }))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('region', { name: 'Your contribution status' })).toContainText('₦50,000.00 remaining')
})

test('distant unpaid deadlines stay in the contribution card without an urgent warning', async ({ page }) => {
  await dashboard(page, 'soon')
  await page.route('**/api/rosca/family/schedules', r => r.fulfill({ json: { data: [
    { cycleNumber: 2, status: 'UPCOMING', contributionDeadline: '2026-11-30T17:00:00Z' },
  ] } }))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('region', { name: 'Next deadline' })).toContainText('30 Nov')
  await expect(page.getByRole('region', { name: 'Your contribution status' })).toHaveCount(0)
})

test('the contribution retry rechecks receipts instead of assuming a zero balance', async ({ page }) => {
  await dashboard(page, 'failed')
  await expect(page.getByRole('region', { name: 'Your contribution status' })).toContainText('Contribution status unavailable')
  await page.route('**/api/rosca/family/contributions?*', r => r.fulfill({ json: { data: [] } }))
  await page.getByRole('region', { name: 'Your contribution status' }).getByRole('button', { name: 'Retry contribution status' }).click()
  await expect(page.getByRole('region', { name: 'Your contribution status' })).toContainText('Your contribution is due tomorrow')
})

test('retry also recovers an unavailable membership list', async ({ page }) => {
  await dashboard(page, 'soon')
  await page.route('**/api/rosca/my-participations', r => r.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.reload({ waitUntil: 'domcontentloaded' })
  const panel = page.getByRole('region', { name: 'Your contribution status' })
  await expect(panel).toContainText('Contribution status unavailable')
  await page.unroute('**/api/rosca/my-participations')
  await panel.getByRole('button', { name: 'Retry contribution status' }).click()
  await expect(panel).toContainText('Your contribution is due tomorrow')
})

