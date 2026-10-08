import { expect, test } from '@playwright/test'
import { circle, mockRoscaReads } from './rosca-read-fixtures'

test('a member can open a joined group before the first cycle completes and return to Joined', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5, buckets: { totalRoscaReservedKobo: '500000', data: [{
    id: 'bucket-family', bucketType: 'ROSCA', sourceId: 'membership-family', reservedAmount: '500000',
    rosca: { membershipId: 'membership-family', membershipStatus: 'ACTIVE', originalCollateralKobo: '500000',
      circleId: 'family', circleName: 'Family Ajo', contributionAmountKobo: '5000000' },
  }] } })
  const firstCycle = { ...circle, durationCycles: 5, currentCycle: 1 }
  await page.route('**/api/rosca/my-participations', route => route.fulfill({ json: { data: [firstCycle] } }))
  await page.route('**/api/rosca/family', route => route.fulfill({ json: { data: firstCycle } }))
  await page.goto('/rosca?tab=joined')
  // Support the previous UI while reproducing the missing cycle-one entry point.
  await page.getByRole('button', { name: 'Joined', exact: true }).or(page.getByRole('tab', { name: 'Joined', exact: true })).filter({ visible: true }).first().click()
  await expect(page.getByText(/0 of 5 cycles/)).toBeVisible()
  await page.getByRole('button', { name: 'View Group', exact: true }).click({ timeout: 5000 })
  await expect(page).toHaveURL(/\/rosca\/family\/activities$/)
  await expect(page.getByRole('region', { name: 'Group collateral' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to joined groups' }).click()
  await expect(page).toHaveURL(/\/rosca\?tab=joined$/)
  await expect(page.getByText('Family Ajo', { exact: true })).toBeVisible()
})

test('joined cards display the contribution deadline rather than the payout date', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/rosca/my-participations', route => route.fulfill({ json: { data: [{
    ...circle, currentCycle: 1, durationCycles: 5,
    nextContributionDeadline: '2026-10-10T12:00:00Z', nextPayoutDate: '2026-10-11T12:00:00Z',
  }] } }))
  await page.goto('/rosca?tab=joined')
  await page.getByRole('button', { name: 'Joined', exact: true }).or(page.getByRole('tab', { name: 'Joined', exact: true })).filter({ visible: true }).first().click()
  await expect(page.getByText(/Next contribution/)).toContainText('10 Oct 2026', { timeout: 5000 })
  await expect(page.getByText(/Next contribution/)).not.toContainText('11 Oct')
})
