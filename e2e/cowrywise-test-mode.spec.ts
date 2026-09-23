import { expect, test } from '@playwright/test'

test('Cowrywise Test Mode renders activation and authoritative verified wallet states', async ({ page }) => {
  let activated = false
  await page.route('**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'u1', firstName: 'Stage', lastName: 'Tester', role: 'MEMBER', status: 'ACTIVE' } })
    if (path === '/api/target-savings/mine' || path === '/api/target-savings/public') return route.fulfill({ json: { data: [] } })
    if (path === '/api/kyc/status') return route.fulfill({ json: { kycLevel: 1 } })
    if (path === '/api/investments/cowrywise/state') return route.fulfill({ json: activated ? { activated: true, testMode: true, accountStatus: 'ACTIVE', verificationStatus: 'VERIFIED', verified: true } : { activated: false, testMode: true } })
    if (path === '/api/investments/cowrywise/activate') { activated = true; return route.fulfill({ json: { activated: true } }) }
    if (path === '/api/investments/cowrywise/wallets') return route.fulfill({ json: [{ currency: 'NGN', balanceMinor: '500000', status: 'ACTIVE', productCode: 'wallet-ngn', walletId: 'redacted' }] })
    if (path === '/api/investments/cowrywise/savings') return route.fulfill({ json: [] })
    return route.fulfill({ json: {} })
  })

  await page.goto('/target-savings')
  await expect(page.getByText('Cowrywise Savings')).toBeVisible()
  await expect(page.getByText('Test Mode')).toBeVisible()
  await page.getByRole('button', { name: 'Activate Savings' }).click()
  await expect(page.getByText('Identity: VERIFIED')).toBeVisible()
  await expect(page.getByText('₦5,000.00')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add Sandbox Funds' })).toBeVisible()
})
