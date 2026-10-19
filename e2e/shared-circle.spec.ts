import { expect, test } from '@playwright/test'
import { circle, mockRoscaReads } from './rosca-read-fixtures'

for (const admin of [false, true]) {
  test(`${admin ? 'organiser member' : 'member'} sees shared information and contribution history`, async ({ page }) => {
    await mockRoscaReads(page, { duration: 5 })
    await page.route('**/api/rosca/family', route => route.fulfill({ json: { data: { ...circle, isRequestingUserAdmin: admin } } }))
    await page.route('**/api/rosca/family/contributions/roster', route => route.fulfill({ json: { data: [{ contributionId: 'c1', memberName: 'Test Member', userId: 'member', cycleNumber: 2, amount: '123456', paidAt: '2026-10-01T10:00:00Z', isLate: false }] } }))
    await page.goto('/rosca/family')
    await expect(page.getByText('Family Ajo', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Manage Group', exact: true })).toHaveCount(admin ? 1 : 0)
    await expect(page.getByRole('button', { name: 'Make a contribution', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Contributions', exact: true }).click()
    await expect(page.getByText('Contribution History', { exact: true })).toBeVisible()
    await expect(page.getByText('₦1,234.56', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('legacy activity links preserve payment shortcuts', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.goto('/rosca/family/activities?tab=growth&pay=1')
  await expect(page).toHaveURL(/\/rosca\/family\?tab=growth&pay=1$/)
  await expect(page.getByRole('dialog')).toBeVisible()
})

for (const status of ['PENDING', 'REJECTED', 'REMOVED']) {
  test(`${status} membership cannot request protected data`, async ({ page }) => {
    await mockRoscaReads(page, { duration: 5 })
    await page.route('**/api/rosca/family', route => route.fulfill({ json: { data: { ...circle, userMembershipStatus: status, previewOnly: true } } }))
    const protectedReads: string[] = []
    page.on('request', request => { if (/family\/(schedules|contributions|reviews)/.test(request.url())) protectedReads.push(request.url()) })
    await page.goto('/rosca/family?view=manage')
    await expect(page.getByText('Group Details', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Manage Group', exact: true })).toHaveCount(0)
    expect(protectedReads).toEqual([])
  })
}

test('denied circle request shows the error without loading protected tabs', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/rosca/family', route => route.fulfill({ status: 403, json: { message: 'Circle access denied' } }))
  await page.goto('/rosca/family')
  await expect(page.getByRole('alert')).toContainText('Circle access denied')
  await expect(page.getByRole('button', { name: 'Contributions', exact: true })).toHaveCount(0)
})

test('completed members see history and read-only chat', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/rosca/family', route => route.fulfill({ json: { data: { ...circle, status: 'COMPLETED', userMembershipStatus: 'COMPLETED' } } }))
  await page.route('**/api/chat/circles', route => route.fulfill({ json: [{ id: 'family', name: 'Family Ajo', lastMessage: null }] }))
  await page.route('**/api/chat/circles/family/messages*', route => route.fulfill({ json: [{ id: 'old', circleId: 'family', senderId: 'other', senderName: 'Other Member', senderInitials: 'OM', body: 'Previous group message', createdAt: '2026-10-01T10:00:00Z' }] }))
  await page.goto('/rosca/family')
  await expect(page.getByText(/This group is completed/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pay Now', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Group chat history', exact: true }).click()
  await expect(page.getByText('Previous group message')).toBeVisible()
  await expect(page.getByText(/Chat is read-only/)).toBeVisible()
  await expect(page.getByPlaceholder('Type a message…')).toHaveCount(0)
})

test('failed roster loads show an error instead of unpaid members or an empty history', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/rosca/family/contributions/roster', route => route.fulfill({ status: 503, json: { message: 'Financial service unavailable' } }))
  await page.goto('/rosca/family')
  await expect(page.getByText('Group financial health', { exact: true })).toBeVisible()
  await expect(page.getByText('0 paid · 0 partial · 1 unpaid · 0 defaulted')).toHaveCount(0)
  await page.getByRole('button', { name: 'Contributions', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Unable to load contribution history')
  await expect(page.getByText('No contributions found for this circle')).toHaveCount(0)
})

test('organiser management preserves due-payout action and hides staff recovery controls', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  const ownCircle = { ...circle, isRequestingUserAdmin: true }
  await page.route('**/api/rosca/family', route => route.fulfill({ json: { data: ownCircle } }))
  await page.route('**/api/admin/rosca/family', route => route.fulfill({ json: { data: ownCircle } }))
  await page.route('**/api/rosca/family/payouts', route => route.fulfill({ json: { data: [
    { id: 'failed', cycleNumber: 1, amount: '123456', status: 'FAILED' },
    { id: 'pending', cycleNumber: 2, amount: '5000000', status: 'PENDING' },
  ] } }))
  await page.goto('/rosca/groups/family')
  await expect(page).toHaveURL(/\/rosca\/family\?view=manage$/)
  await page.getByRole('tab', { name: 'Payouts', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Process Payout', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reverse', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'View shared group information' }).click()
  await expect(page.getByRole('button', { name: 'Make a contribution', exact: true })).toBeVisible()
})

test('completed join-request history remains accessible without an active participation', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/rosca/my-participations', route => route.fulfill({ json: { data: [] } }))
  await page.route('**/api/rosca/my-join-requests', route => route.fulfill({ json: { data: [{ membershipId: 'completed', circleId: 'family', status: 'COMPLETED', circle: { ...circle, status: 'COMPLETED', durationCycles: 5 } }] } }))
  await page.goto('/rosca?tab=joined')
  await expect(page.getByText('Family Ajo', { exact: true })).toHaveCount(1)
  await expect(page.getByRole('button', { name: /^View group$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pay contribution', exact: true })).toBeDisabled()
})
