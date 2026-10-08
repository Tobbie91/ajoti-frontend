import { expect, test } from '@playwright/test'
import { circle, mockRoscaReads } from './rosca-read-fixtures'

test('the organiser can review collateral and join as the fifth member without an invitation', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  const user = { id: 'member', role: 'CIRCLE_ADMIN', status: 'ACTIVE', firstName: 'Test', lastName: 'Owner' }
  await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), user)
  await page.route('**/api/users/me', route => route.fulfill({ json: user }))
  let joined = false
  let joinRequests = 0
  const ownGroup = () => ({ ...circle, status: 'DRAFT', filledSlots: joined ? 5 : 4, maxSlots: 5, durationCycles: 5,
    isRequestingUserAdmin: true, members: Array.from({ length: joined ? 5 : 4 }, (_, i) => ({
      userId: i === 4 ? 'member' : `other-${i}`, name: i === 4 ? 'Test Owner' : `Other ${i}`, status: 'ACTIVE', position: i + 1,
    })) })
  await page.route('**/api/admin/rosca/family', route => route.fulfill({ json: { data: ownGroup() } }))
  await page.route('**/api/rosca', route => route.fulfill({ json: { data: [ownGroup()] } }))
  await page.route('**/api/rosca/family/join', route => {
    joined = true
    joinRequests++
    return route.fulfill({ json: { success: true, data: { status: 'ACTIVE' } } })
  })
  await page.goto('/rosca/groups/family')
  await expect(page.getByText(/4\/5 active member slots/)).toBeVisible()
  await page.getByRole('button', { name: 'Join as a member', exact: true }).click()
  await expect(page.getByText('Join your group as a member')).toBeVisible()
  await expect(page.getByText(/Refundable collateral required/)).toContainText('5,000.00')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Confirm & Join' }).click()
  await expect(page).toHaveURL(/\/rosca\/groups\/family$/)
  await expect(page.getByRole('button', { name: 'Start Circle', exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Join as a member', exact: true })).toHaveCount(0)
  expect(joinRequests).toBe(1)
})

test('customers at the limit cannot submit direct joins or accept invitations', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/rosca/join-eligibility', route => route.fulfill({ json: { data: { limit: 3, ongoingMemberships: 3, remaining: 0, canJoin: false } } }))
  await page.route('**/api/rosca', route => route.fulfill({ json: { data: [{ ...circle, status: 'DRAFT' }] } }))
  await page.goto('/rosca/family/join')
  await expect(page.getByText(/You can join up to 3 ongoing/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request to Join', exact: true })).toBeDisabled()
  await page.route('**/api/rosca/invite-preview/token', route => route.fulfill({ json: { data: {
    circle: { ...circle, adminName: 'Circle Admin' }, expiresAt: '2027-01-01T00:00:00Z',
  } } }))
  await page.goto('/rosca/invite/token')
  await expect(page.getByRole('button', { name: 'Accept Invite' })).toBeDisabled()
  await expect(page.getByText(/You can join up to 3 ongoing/)).toBeVisible()
})

test('a failed eligibility read keeps joining disabled and offers a retry', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/rosca/family', route => route.fulfill({ json: { data: { ...circle, status: 'DRAFT', members: [], userMembershipStatus: undefined } } }))
  let failed = true
  await page.route('**/api/rosca/join-eligibility', route => failed
    ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    : route.fulfill({ json: { data: { limit: 3, ongoingMemberships: 2, remaining: 1, canJoin: true } } }))
  await page.goto('/rosca/family')
  await expect(page.getByRole('button', { name: 'Request to Join', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Check again' })).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Check again' }).click()
  await expect(page.getByRole('button', { name: 'Request to Join', exact: true })).toBeEnabled()
})
