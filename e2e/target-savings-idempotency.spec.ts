import { expect, test } from '@playwright/test'

test('retries a target contribution with the same idempotency key after an uncertain response', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({
    id: 'member-1', firstName: 'Test', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE',
  })))

  const contributionRequests: Array<{ amountKobo: string; idempotencyKey: string }> = []
  const plan = {
    id: 'target-1', ownerId: 'member-1', type: 'INDIVIDUAL', name: 'School fees',
    targetAmountKobo: '1000000', contributionAmountKobo: '100000', plannedContributionCount: 10,
    frequency: 'MONTHLY', currency: 'NGN', startDate: '2026-10-01T00:00:00.000Z',
    maturityDate: '2027-10-01T23:59:59.000Z', status: 'ACTIVE', isPublic: false,
    memberCount: 1, totalSavedKobo: '0', groupTargetAmountKobo: '1000000',
    myMembership: {
      id: 'membership-1', userId: 'member-1', user: { firstName: 'Test', lastName: 'Member' },
      savedAmountKobo: '0', targetAmountKobo: '1000000', remainingAmountKobo: '1000000',
      progressPercent: 0, status: 'ACTIVE', maturityDestination: 'SELF', joinedAt: '2026-10-01T00:00:00.000Z',
    },
    members: [], investment: {
      enabled: false, provider: null, productCode: null, productType: null,
      approvalVersion: null, lifecycleStatus: 'LEGACY',
    },
  }

  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'member-1', role: 'MEMBER' } })
    if (path === '/api/target-savings/mine') return route.fulfill({ json: { data: [plan] } })
    if (path === '/api/target-savings/public') return route.fulfill({ json: { data: [] } })
    if (path === '/api/kyc/status') return route.fulfill({ json: { kycLevel: 1 } })
    if (path === '/api/investments/cowrywise/state') return route.fulfill({ json: { activated: false, testMode: false } })
    if (path === '/api/target-savings/target-1/contributions' && route.request().method() === 'POST') {
      contributionRequests.push(route.request().postDataJSON())
      if (contributionRequests.length === 1) {
        return route.fulfill({ status: 503, json: { message: 'Response lost; contribution outcome is unknown' } })
      }
      return route.fulfill({ json: { data: { id: 'contribution-1' } } })
    }
    return route.fulfill({ json: {} })
  })

  await page.goto('/target-savings')
  await expect(page.getByText('School fees', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /School fees/ }).click()
  await page.getByRole('button', { name: 'Start saving' }).click()
  await page.getByRole('button', { name: 'Add money' }).click()
  await expect(page.getByText('Response lost; contribution outcome is unknown').first()).toBeVisible()
  await page.getByRole('button', { name: 'Add money' }).click()
  await expect.poll(() => contributionRequests).toHaveLength(2)

  expect(contributionRequests[0].amountKobo).toBe('100000')
  expect(contributionRequests[1]).toEqual(contributionRequests[0])
})
