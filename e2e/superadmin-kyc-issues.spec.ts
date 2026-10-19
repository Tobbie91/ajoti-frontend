import { expect, test } from '@playwright/test'

const issue = {
  id: 'kyc-issue-1',
  userId: 'customer-1',
  status: 'PENDING',
  step: 'PROVE_PENDING',
  kycLevel: 1,
  submittedAt: '2026-10-10T10:00:00.000Z',
  reviewedAt: null,
  reviewedBy: null,
  rejectionReason: null,
  ninVerifiedAt: null,
  bvnVerifiedAt: null,
  nextOfKinName: null,
  nextOfKinRelationship: null,
  nextOfKinPhone: null,
  address: null,
  city: null,
  state: null,
  lga: null,
  country: null,
  providerStatus: 'failed',
  issueType: 'FAILED_LOOKUP',
  issueReason: 'The identity response needs staff review.',
  issueLevel: 1,
  user: {
    id: 'customer-1',
    firstName: 'Amina',
    lastName: 'Member',
    email: 'amina@example.test',
    phone: null,
    gender: null,
    dob: null,
    isVerified: false,
    status: 'ACTIVE',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
}

async function setup(page: import('@playwright/test').Page, savedDocumentKey: 'encryptedNumber' | 'numberEncrypted' = 'encryptedNumber') {
  await page.addInitScript(() => {
    localStorage.setItem('superadmin_user', JSON.stringify({ id: 'staff-1', staffRole: 'SUPERADMIN' }))
  })
  await page.route(url => new URL(url).pathname === '/api/users/me', route => route.fulfill({
    json: { data: { id: 'staff-1', email: 'staff@example.test', firstName: 'Test', lastName: 'Staff', role: 'STAFF', staffRole: 'SUPERADMIN' } },
  }))
  await page.route(url => ['/api/superadmin/kyc', '/api/superadmin/kyc/issues'].includes(new URL(url).pathname), route => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/api/superadmin/kyc/issues') {
      return route.fulfill({ json: {
        data: [{
          ...issue,
          verificationData: {
            provider: 'mono_lookup',
            levels: {
              level1: {
                status: 'successful',
                lookupType: 'mashup',
                firstName: 'Amina',
                middleName: 'Grace',
                ninLastFour: '1234',
                verifiedAt: '2026-10-10T09:00:00.000Z',
              },
            },
            submittedDocument: { type: 'national_id', lastFour: '9876', [savedDocumentKey]: 'encrypted-not-rendered' },
            lastAttempt: {
              status: 'failed',
              error: 'Provider response was ambiguous.',
              returnedIdentity: { firstName: 'Amina', ninLastFour: '1234' },
            },
          },
        }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      } })
    }
    return route.fulfill({ json: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } } })
  })
  await page.goto('/kyc-approvals')
  await expect(page.getByRole('heading', { name: 'KYC Approvals' })).toBeVisible()
  await page.getByRole('tab', { name: 'Issues', exact: true }).click()
  await expect(page.getByText('The identity response needs staff review.', { exact: true })).toBeVisible()
}

test('staff issues tab requests the dedicated queue and labels the escalation reason', async ({ page }) => {
  const requested: string[] = []
  await page.route(url => new URL(url).pathname === '/api/superadmin/kyc/issues', route => {
    requested.push(route.request().url())
    return route.fulfill({ json: {
      data: [{ ...issue, verificationData: null }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    } })
  })
  await page.route(url => new URL(url).pathname === '/api/users/me', route => route.fulfill({
    json: { data: { id: 'staff-1', email: 'staff@example.test', firstName: 'Test', lastName: 'Staff', role: 'STAFF', staffRole: 'SUPERADMIN' } },
  }))
  await page.route(url => new URL(url).pathname === '/api/superadmin/kyc', route => route.fulfill({
    json: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
  }))
  await page.addInitScript(() => {
    localStorage.setItem('superadmin_user', JSON.stringify({ id: 'staff-1', staffRole: 'SUPERADMIN' }))
  })

  await page.goto('/kyc-approvals')
  await page.getByRole('tab', { name: 'Issues', exact: true }).click()
  await expect(page.getByText('FAILED LOOKUP', { exact: true })).toBeVisible()
  await expect(page.getByText('The identity response needs staff review.', { exact: true })).toBeVisible()
  expect(requested).toHaveLength(1)
  expect(new URL(requested[0]).searchParams.get('page')).toBe('1')
  expect(new URL(requested[0]).searchParams.get('limit')).toBe('20')
})

for (const savedDocumentKey of ['encryptedNumber', 'numberEncrypted'] as const) {
  test(`issue detail shows saved safe evidence with ${savedDocumentKey} response shape`, async ({ page }) => {
    await setup(page, savedDocumentKey)
    const reverifyPayloads: unknown[] = []
    await page.route(url => new URL(url).pathname === '/api/superadmin/kyc/identity/customer-1/reverify', route => {
      expect(route.request().method()).toBe('POST')
      reverifyPayloads.push(route.request().postDataJSON())
      return route.fulfill({ json: { success: true, data: { status: 'successful' } } })
    })
    const issueRow = page.getByRole('row').filter({ hasText: 'Amina Member' })
    await issueRow.getByRole('button').click()
    await expect(page.getByText('Provider returned (not verified)', { exact: true })).toBeVisible()
    await expect(page.getByText('NIN (last 4)', { exact: true })).toHaveCount(2)
    await expect(page.getByText('ending in 9876', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'View safe data', exact: true }).click()
    const renderedData = await page.locator('body').innerText()
    expect(renderedData).not.toContain('encrypted-not-rendered')
    expect(renderedData).toContain(`"${savedDocumentKey}": "••••••"`)
    await page.getByRole('button', { name: 'Run new Lookup', exact: true }).click()
    await page.getByRole('textbox', { name: 'Verification level' }).click()
    await page.getByRole('option', { name: 'Level 2 - Government ID Lookup', exact: true }).click()
    await expect(page.getByText('A saved national id is available.', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Confirm & Run Lookup', exact: true }).click()
    await expect.poll(() => reverifyPayloads).toEqual([{ level: 2 }])
  })
}
