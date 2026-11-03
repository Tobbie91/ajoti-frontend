import { expect, test } from '@playwright/test'
import { mockRoscaReads } from './rosca-read-fixtures'

test('a member can continue paying through the final future cycle while the group stays on cycle 2', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  const receipts = [2, 3].map(cycleNumber => ({ id: `paid-${cycleNumber}`, cycleNumber, amount: '5000000', penaltyAmount: '0', paidAt: '2026-11-03T10:00:00Z' }))
  const submitted: number[] = []
  await page.route('**/api/rosca/family/contributions**', route => {
    if (route.request().method() === 'POST') {
      const { cycleNumber } = route.request().postDataJSON()
      submitted.push(cycleNumber)
      const receipt = { id: `paid-${cycleNumber}`, cycleNumber, amount: '5000000', penaltyAmount: '0', paidAt: '2026-11-03T10:00:00Z' }
      receipts.push(receipt)
      return route.fulfill({ json: { data: receipt } })
    }
    return route.fulfill({ json: { data: receipts } })
  })
  await page.goto('/rosca?tab=joined', { waitUntil: 'domcontentloaded' })
  for (const cycle of [4, 5]) {
    await page.getByRole('button', { name: `Pay Cycle ${cycle} Early`, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm & Pay' }).click()
    await expect.poll(() => submitted).toEqual(cycle === 4 ? [4] : [4, 5])
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  await expect(page.getByRole('button', { name: /Pay Cycle .* Early/ })).toHaveCount(0)
  await expect(page.getByText('All scheduled contributions paid', { exact: true })).toBeVisible()
})
