import { expect, test } from '@playwright/test'

test('provider-backed plans do not promise unavailable actions and customer UI hides sandbox funding', async ({ page }) => {
  const plan = {
    id: 'provider-target', ownerId: 'member-1', type: 'INDIVIDUAL', name: 'Legacy Cowrywise target',
    targetAmountKobo: '1000000', contributionAmountKobo: '100000', plannedContributionCount: 10,
    frequency: 'MONTHLY', currency: 'NGN', startDate: '2026-01-01T00:00:00.000Z',
    maturityDate: '2027-01-01T23:59:59.000Z', status: 'ACTIVE', isPublic: false,
    memberCount: 1, totalSavedKobo: '1000000', groupTargetAmountKobo: '1000000',
    myMembership: {
      id: 'membership-1', userId: 'member-1', user: { firstName: 'Test', lastName: 'Member' },
      savedAmountKobo: '1000000', targetAmountKobo: '1000000', remainingAmountKobo: '0',
      progressPercent: 100, status: 'ACTIVE', maturityDestination: 'SELF', joinedAt: '2026-01-01T00:00:00.000Z',
    },
    members: [], investment: {
      enabled: true, provider: 'COWRYWISE', productCode: 'PROVIDER_ASSIGNED', productType: 'LOCKED_SAVINGS',
      approvalVersion: 'sandbox-test-v1', lifecycleStatus: 'DISABLED_PENDING_INTEGRATION',
    },
  }
  const maturedPlan = {
    ...plan,
    id: 'matured-provider-target',
    name: 'Matured Cowrywise target',
    startDate: '2025-01-01T00:00:00.000Z',
    maturityDate: '2026-01-01T23:59:59.000Z',
  }

  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({
    id: 'member-1', firstName: 'Test', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE',
  })))
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'member-1', role: 'MEMBER', status: 'ACTIVE' } })
    if (path === '/api/target-savings/mine') return route.fulfill({ json: { data: [plan, maturedPlan] } })
    if (path === '/api/target-savings/public') return route.fulfill({ json: { data: [] } })
    if (path === '/api/kyc/status') return route.fulfill({ json: { kycLevel: 1 } })
    if (path === '/api/investments/cowrywise/state') return route.fulfill({ json: { activated: false, testMode: true } })
    return route.fulfill({ json: {} })
  })

  await page.goto('/target-savings')
  await page.getByRole('button', { name: /Legacy Cowrywise target/ }).click()
  await expect(page.getByText('Investment-backed actions are unavailable')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel my savings' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Add to savings' })).toHaveCount(0)
  await expect(page.getByText('Access', { exact: true }).locator('..')).toContainText('Unavailable')

  const cardText = await page.locator('#target-plan-provider-target').first().innerText()
  expect(cardText).not.toContain('will be released')
  expect(cardText).not.toContain('is being released')
  expect(cardText).not.toContain('early cancellation')
  expect(cardText).not.toContain('funds unlocked')
  await expect(page.getByText('Sandbox tools', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Fake Ajoti wallet funding', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: /Matured Cowrywise target/ }).click()
  await expect(page.locator('#target-plan-matured-provider-target').first()).toContainText('Maturity date passed')
  const maturedCardText = await page.locator('#target-plan-matured-provider-target').first().innerText()
  expect(maturedCardText).not.toContain('funds unlocked')
  expect(maturedCardText).not.toContain('is being released')
})
