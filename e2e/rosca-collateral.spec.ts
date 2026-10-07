import { expect, test } from '@playwright/test'
import { mockRoscaReads } from './rosca-read-fixtures'

function bucket(circleId: string, circleName: string, reservedAmount: string, status = 'ACTIVE', original = reservedAmount) {
  return {
    id: `bucket-${circleId}`, bucketType: 'ROSCA', sourceId: `membership-${circleId}`, reservedAmount,
    rosca: { membershipId: `membership-${circleId}`, membershipStatus: status, originalCollateralKobo: original,
      circleId, circleName, contributionAmountKobo: '5000000' },
  }
}

const breakdown = () => ({ totalRoscaReservedKobo: '2250000', data: [
  bucket('family', 'Family Ajo', '500000', 'PENDING'),
  bucket('december', 'December Savings', '1000000'),
  bucket('business', 'Business Group', '750000', 'ACTIVE', '1000000'),
  bucket('released', 'Released Group', '0', 'COMPLETED', '1000000'),
  { id: 'target', bucketType: 'TARGET', sourceId: 'target', reservedAmount: '9000000', rosca: null },
] })

test('dashboard explains the total and each current group reservation and respects amount privacy', async ({ page }) => {
  await mockRoscaReads(page, { duration: 6, buckets: breakdown() })
  await page.goto('/home')
  const section = page.getByRole('region', { name: 'Ajo commitments' })
  await expect(section.getByText('₦22,500.00', { exact: true })).toBeVisible()
  await expect(section.getByRole('link', { name: 'Family Ajo' })).toHaveAttribute('href', '/rosca/family')
  for (const amount of ['₦5,000.00', '₦10,000.00', '₦7,500.00']) await expect(section.getByText(amount, { exact: true })).toBeVisible()
  await expect(section.getByText('pending', { exact: true })).toBeVisible()
  await expect(section.getByRole('link', { name: 'Released Group' })).toHaveCount(0)
  await expect(section.getByText(/not a platform fee/)).toBeVisible()
  await page.getByRole('button', { name: /Hide wallet balance/ }).filter({ visible: true }).first().click()
  await expect(section.getByText(/₦/)).toHaveCount(0)
  await expect(section.getByText('••••••', { exact: true }).first()).toBeVisible()
})

test('group detail uses current bucket amount after a partial seizure and shows zero after release', async ({ page }) => {
  const state = { duration: 6, buckets: { totalRoscaReservedKobo: '750000', data: [bucket('family', 'Family Ajo', '750000', 'ACTIVE', '1000000')] } }
  await mockRoscaReads(page, state)
  await page.goto('/rosca/family')
  const section = page.getByRole('region', { name: 'Group collateral' })
  await expect(section.getByText('₦7,500.00', { exact: true })).toBeVisible()
  await expect(section.getByText('Original collateral committed: ₦10,000.00', { exact: true })).toBeVisible()
  await expect(section.getByText(/unavailable to spend/)).toBeVisible()
  state.buckets = { totalRoscaReservedKobo: '0', data: [bucket('family', 'Family Ajo', '0', 'COMPLETED', '1000000')] }
  await section.getByRole('button', { name: 'Refresh collateral' }).click()
  await expect(section.getByText('₦0.00', { exact: true })).toBeVisible()
  await expect(section.getByText('₦7,500.00', { exact: true })).toHaveCount(0)
})

test('wallet and group Growth overview show the same reservations', async ({ page }) => {
  await mockRoscaReads(page, { duration: 6, buckets: breakdown() })
  await page.goto('/my-wallet')
  await expect(page.getByRole('region', { name: 'Ajo commitments' }).getByText('₦22,500.00', { exact: true })).toBeVisible()
  await page.goto('/rosca/family/activities')
  await expect(page.getByRole('region', { name: 'Group collateral' }).getByText('₦5,000.00', { exact: true })).toBeVisible()
})

test('zero reservations have a clear zero state and failed reads never masquerade as zero', async ({ page }) => {
  await mockRoscaReads(page, { duration: 6, buckets: { data: [bucket('released', 'Released Group', '0', 'COMPLETED', '1000000')], totalRoscaReservedKobo: '0' } })
  await page.goto('/home')
  const section = page.getByRole('region', { name: 'Ajo commitments' })
  await expect(section.getByText('₦0.00', { exact: true })).toBeVisible()
  await expect(section.getByText('No collateral is currently reserved for Ajo groups.')).toBeVisible()
  await page.route('**/api/wallet/buckets', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await section.getByRole('button', { name: 'Refresh collateral' }).click()
  await expect(section.getByText('Unable to load collateral. Please refresh.')).toBeVisible()
  await expect(section.getByText('₦0.00', { exact: true })).toHaveCount(0)
})

test('existing ledger history identifies reserved/released collateral without presenting it as a debit', async ({ page }) => {
  const history = ['RESERVE', 'RELEASE'].map((entryType, i) => ({
    id: `ledger-${i}`, entryType, movementType: 'TRANSFER', bucketType: 'ROSCA', amount: '500000',
    createdAt: '2026-10-07T12:00:00Z', sourceType: 'COLLATERAL_RESERVE',
    circleId: 'family', description: `Collateral ${i === 0 ? 'reserved' : 'released'} — Family Ajo`,
  }))
  await mockRoscaReads(page, { duration: 6, buckets: breakdown(), history })
  for (const path of ['/home', '/my-wallet', '/transactions']) {
    await page.goto(path)
    await expect(page.getByText('Collateral reserved — Family Ajo', { exact: true })).toBeVisible()
    await expect(page.getByText('Collateral released — Family Ajo', { exact: true })).toBeVisible()
    await expect(page.getByText('-₦5,000.00', { exact: true })).toHaveCount(0)
  }
})
