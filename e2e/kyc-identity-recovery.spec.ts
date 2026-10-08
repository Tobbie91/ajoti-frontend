import { expect, test } from '@playwright/test'
import { mockRoscaReads } from './rosca-read-fixtures'

test('an overridden customer completes missing identity and returns to funding', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  const status = { status: 'APPROVED', kycLevel: 3, step: 'SUBMITTED', requiresIdentityCompletion: true, ninVerified: false, bvnVerified: false }
  await page.route('**/api/kyc/status', route => route.fulfill({ json: status }))
  await page.route('**/api/users/me', route => route.fulfill({ json: { id: 'member', firstName: 'Test', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE', phone: '+2348012345678' } }))
  let preSaved = false
  let verified = false
  let completed = false
  await page.route('**/api/kyc/pre-submit-nok', route => {
    expect(route.request().postDataJSON()).toMatchObject({ nextOfKinName: 'Test Kin', nextOfKinRelationship: 'Sister' })
    preSaved = true
    return route.fulfill({ json: status })
  })
  await page.route('**/api/kyc/lookup/verify', route => {
    expect(preSaved).toBe(true)
    expect(route.request().postDataJSON()).toEqual({ nin: '12345678901', bvn: '10987654321' })
    verified = true
    return route.fulfill({ json: { monoUrl: null, reference: 'fixture-verified' } })
  })
  await page.route('**/api/kyc/submit-nok', route => {
    expect(verified).toBe(true)
    completed = true
    return route.fulfill({ json: { ...status, requiresIdentityCompletion: false } })
  })
  await page.route('**/api/wallet/virtual-account', route => {
    expect(completed).toBe(true)
    return route.fulfill({ json: { data: { id: 'va', bankName: 'Provider Bank', accountNumber: '9900000001', accountName: 'Ajoti Wallet - Test Member', currency: 'NGN', isActive: true } } })
  })
  await page.goto('/kyc')
  await expect(page.getByText('Complete missing details for wallet funding')).toBeVisible()
  await expect(page.getByText(/Your current KYC level is preserved/)).toBeVisible()
  await page.getByLabel('National Identification Number (NIN)').fill('12345678901')
  await page.getByLabel('Bank Verification Number (BVN)').fill('10987654321')
  await page.getByRole('button', { name: 'Continue to Next of Kin' }).click()
  await page.getByLabel('Full Name').fill('Test Kin')
  await page.getByRole('textbox', { name: 'Relationship' }).click()
  await page.getByRole('option', { name: 'Sister', exact: true }).click()
  await page.getByPlaceholder('8012345678', { exact: true }).fill('8099999999')
  await page.getByRole('button', { name: 'Save & Continue to Verification' }).click()
  await expect(page.getByRole('checkbox')).toBeVisible({ timeout: 8000 })
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Verify Identity', exact: true }).click()
  await expect(page).toHaveURL(/\/fund-wallet$/)
  await expect(page.getByText('9900000001')).toBeVisible()
  expect(completed).toBe(true)
})

test('recovery preserves unresolved provider review instead of restarting identity entry', async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  await page.route('**/api/kyc/status', route => route.fulfill({ json: { status: 'PENDING', kycLevel: 3, step: 'PROVE_PENDING', providerStatus: 'ambiguous', requiresIdentityCompletion: true } }))
  await page.goto('/kyc')
  await expect(page.getByLabel('National Identification Number (NIN)')).toHaveCount(0)
  await expect(page.getByText(/review/i).first()).toBeVisible()
})
