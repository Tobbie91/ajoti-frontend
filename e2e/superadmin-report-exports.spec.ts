import { expect, test, type Page } from '@playwright/test'

const user = { id: 'customer', firstName: 'Amina', lastName: 'Member', email: 'amina@example.test', phone: '+2348000000000', role: 'MEMBER', status: 'ACTIVE', createdAt: '2026-10-01T10:00:00Z' }
const row = { action: 'LOGIN', id: 'row-1', userId: 'customer', walletId: 'wallet-1', name: 'October savings', firstName: 'Amina', lastName: 'Staff', email: 'staff@example.test', staffRole: 'SUPPORT', user, owner: user, admin: user, circle: { id: 'circle', name: 'Family circle' }, circleId: 'circle', circleName: 'Family circle', currentCycle: 1, durationCycles: 10, memberCount: 4, totalSlots: 10, filledSlots: 4, contributionAmount: '2500000', frequency: 'MONTHLY', type: 'GROUP', status: 'ACTIVE', currency: 'NGN', balanceKobo: '999999999999999999', balanceNaira: '100000', reservedKobo: '10000', availableKobo: '10000', availableNaira: '100', amount: '2500000', balanceAfter: '5000000', entryType: 'DEBIT', movementType: 'CONTRIBUTION', sourceType: 'ROSCA', reference: '=UNTRUSTED', createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-02T10:00:00Z', receivedAt: '2026-10-02T10:00:00Z', lastActivityAt: null, loanAmount: '2500000', companyFee: '50000', grossAmount: '2550000', finalPayout: '2450000', creditScoreUsed: 600, allowedPercent: 50, stranded: false, repaidAt: null, category: 'ACCOUNT', categoryLabel: 'Missed contribution', cycleNumber: 1, outstandingTotal: '2500000', outstandingBreakdown: { contribution: '2500000', interest: '0', bridge: '0', collateral: '0', penalty: '0' }, blocksLoanEligibility: true, trustScore: 70, displayScore: 600, totalExpectedPayments: 5, totalOnTimePayments: 4, totalLatePayments: 1, totalMissedPayments: 0, totalDefaults: 0, totalPeerRatings: 0, averagePeerRating: 0, lastUpdated: '2026-10-01T10:00:00Z', kycLevel: 1, step: 'SUBMITTED', submittedAt: '2026-10-01T10:00:00Z', verificationData: { secret: 'DO-NOT-EXPORT' }, startDate: '2026-10-01', maturityDate: '2027-10-01', completedMemberCount: 0, totalSavedKobo: '5000000', effectiveTargetAmountKobo: '10000000', perMemberTargetAmountKobo: '2500000', contributionAmountKobo: '250000', investment: { enabled: false, lifecycleStatus: 'LEGACY' }, isPublic: false, _count: { messages: 0 }, subject: 'Help with account', assignedTo: null, messages: [], providerCleanupStatus: 'COMPLETED', isEmptyAccount: true, requestedAt: '2026-10-01T10:00:00Z' }

async function setup(page: Page) {
  const requested: URL[] = []
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    requested.push(url)
    if (path === '/api/superadmin/users/customer') return route.fulfill({ json: { user } })
    if (path === '/api/superadmin/users') return route.fulfill({ json: { data: [user], meta: { total: 1, totalPages: 1 } } })
    if (path === '/api/users/me') return route.fulfill({ json: { data: { ...user, id: 'staff', role: 'STAFF', staffRole: 'SUPERADMIN' } } })
    if (path.endsWith('/settings/payout-fee')) return route.fulfill({ json: { data: { flatFeeKobo: 50000, adminShareKobo: 10000, platformShareKobo: 40000, minimumFloorKobo: 0, meta: Object.fromEntries(['flatFeeKobo', 'adminShareKobo', 'platformShareKobo', 'minimumFloorKobo'].map(key => [key, { updatedAt: null }])) } } })
    if (path.endsWith('/settings/loan')) return route.fulfill({ json: { data: { maxPayoutRatioBps: 5000, minCompletedCycles: 1, maxLatePayments: 2, meta: Object.fromEntries(['maxPayoutRatioBps', 'minCompletedCycles', 'maxLatePayments'].map(key => [key, { updatedAt: null }])) } } })
    if (path.endsWith('/settings/circle-rules')) return route.fulfill({ json: { data: { collateralRatioBps: 1000, latePenaltyRatioBps: 150, minTrustScore: 50, postStartExitPenaltyBps: 1000, meta: Object.fromEntries(['collateralRatioBps', 'latePenaltyRatioBps', 'minTrustScore', 'postStartExitPenaltyBps'].map(key => [key, { updatedAt: null }])) } } })
    if (path.endsWith('/analytics/dashboard')) return route.fulfill({ json: { users: { total: 1, active: 1, suspended: 0, banned: 0, newThisWeek: 1 }, circles: { total: 1, active: 1, completed: 0, cancelled: 0 }, kyc: { pending: 1, approved: 0, rejected: 0 }, wallet: { totalUserBalanceKobo: '10000', platformPoolKobo: '5000', totalUserBalanceNaira: '100', platformPoolNaira: '50' }, defaulters: { outstandingDebts: 0 } } })
    if (path.endsWith('/analytics/growth')) return route.fulfill({ json: { period: '30d', users: { current: 1, previous: 0, delta: 1 }, circles: { current: 1, previous: 0, delta: 1 }, timeSeries: { users: [{ date: '2026-10-01', count: 1 }], circles: [{ date: '2026-10-01', count: 1 }] } } })
    if (path.endsWith('/analytics/wallet')) return route.fulfill({ json: { totalUserBalanceKobo: '10000', platformPoolKobo: '5000', totalUserBalanceNaira: '100', platformPoolNaira: '50', walletCounts: { active: 1, frozen: 0, suspended: 0 } } })
    if (path.endsWith('/analytics/transactions')) return route.fulfill({ json: { period: { start: '2026-10-01', end: '2026-10-29' }, inflow: { totalKobo: '10000', count: 1, byDay: [] }, outflow: { totalKobo: '10000', count: 1, byDay: [] }, platformFees: { totalKobo: '500', count: 1, byDay: [] } } })
    if (path.endsWith('/finance/reports')) return route.fulfill({ json: { data: { startDate: '2026-10-01', endDate: '2026-10-29', asOf: '2026-10-29T10:00:00Z', platformRevenueCreditsKobo: '10000', platformRevenueDebitsKobo: '1000', platformRevenueNetKobo: '9000', reportedExpensesKobo: '2000', operatingResultKobo: '7000', expensesByCategory: [], campaigns: [], unattributedRegistrations: 1, unattributedVerifiedRegistrations: 0 } } })
    if (path.endsWith('/finance/expenses') || path.endsWith('/finance/acquisition-sources') || path.endsWith('/finance/expense-categories') || path.endsWith('/funding-receipts')) return route.fulfill({ json: { data: [] } })
    if (path.endsWith('/finance/system-accounts')) return route.fulfill({ json: { data: [{ ...row, type: 'PLATFORM_REVENUE' }] } })
    if (path.endsWith('/account-closures/queue')) return route.fulfill({ json: { data: [{ ...row, status: 'REQUESTED' }] } })
    if (/\/support\/[^/]+$/.test(path) && !path.endsWith('/contact-details')) return route.fulfill({ json: { ...row, status: 'OPEN', messages: [{ id: 'message', body: 'Customer question', senderRole: 'USER', createdAt: row.createdAt, sender: user }] } })
    const pageNumber = Number(url.searchParams.get('page') || 1)
    const data = [{ ...row, id: `row-${pageNumber}`, walletId: `wallet-${pageNumber}`, userId: `user-${pageNumber}`, status: path.includes('/kyc') ? 'PENDING' : path.endsWith('/support') ? 'OPEN' : 'ACTIVE' }]
    return route.fulfill({ json: { success: true, data, meta: { page: pageNumber, limit: 1, total: 2, totalPages: 2 }, summary: { activePlans: 2, maturedPlans: 0, groupPlans: 2, totalSavedKobo: '10000000' } } })
  })
  return requested
}

for (const path of ['/', '/wallets', '/transactions', '/loans', '/debts', '/trust-scores', '/savings/TargetSavings', '/support', '/kyc-approvals', '/manage-rosca', '/settings-logs', '/staff', '/system-accounts', '/finance-reports', '/settings/payout-fee', '/settings/loan', '/settings/circle-rules', '/account-closures']) {
  test(`CSV and branded PDF are downloadable on ${path}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await setup(page)
    await page.goto(path)
    const csvButton = page.getByRole('button', { name: 'Download CSV', exact: true }).first()
    await expect(csvButton).toBeEnabled()
    const csvPromise = page.waitForEvent('download')
    await csvButton.click()
    const csv = await csvPromise
    expect(csv.suggestedFilename()).toMatch(/^ajoti-.*\.csv$/)
    const stream = await csv.createReadStream(), chunks = []
    for await (const chunk of stream!) chunks.push(chunk)
    const content = Buffer.concat(chunks).toString('utf8')
    expect(content).not.toContain('DO-NOT-EXPORT')
    if (path === '/wallets') expect(content).toContain('9,999,999,999,999,999.99')
    if (path === '/transactions') expect(content).toContain("'=UNTRUSTED")
    const pdfPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download PDF', exact: true }).first().click()
    const pdf = await pdfPromise
    const pdfStream = await pdf.createReadStream(), pdfChunks = []
    for await (const chunk of pdfStream!) pdfChunks.push(chunk)
    const bytes = Buffer.concat(pdfChunks).toString('latin1')
    expect(bytes).toContain('%PDF')
    expect(bytes).toContain('/Subtype /Image')
    expect(bytes).toContain('Page 1 of')
    expect(errors).toEqual([])
  })
}

for (const [path, tab, title] of [['/manage-rosca', 'Defaulters', 'Defaulters report'], ['/staff', 'Audit Log', 'Staff audit report']]) {
  test(`${title} downloads from its tab`, async ({ page }) => {
    await setup(page)
    await page.goto(path)
    await page.getByRole('tab', { name: tab, exact: true }).click()
    for (const format of ['CSV', 'PDF']) {
      const download = page.waitForEvent('download')
      await page.getByRole('button', { name: `Download ${format}`, exact: true }).last().click()
      expect((await download).suggestedFilename()).toMatch(new RegExp(`\\.${format.toLowerCase()}$`))
    }
  })
}

test('ticket conversation and saved customer details are exported', async ({ page }) => {
  await setup(page)
  await page.goto('/support/ticket-1')
  let download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSV', exact: true }).click()
  let stream = await (await download).createReadStream()
  let chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  expect(Buffer.concat(chunks).toString('utf8')).toContain('Customer question')
  download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click()
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/)

  await page.goto('/support/contact-details')
  await page.getByPlaceholder('customer@example.com').fill(user.email)
  await page.getByRole('button', { name: 'Load user' }).click()
  await page.getByLabel('First name').fill('Unsaved draft')
  download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSV', exact: true }).click()
  stream = await (await download).createReadStream()
  chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  const content = Buffer.concat(chunks).toString('utf8')
  expect(content).toContain('Amina')
  expect(content).not.toContain('Unsaved draft')
  download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click()
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/)
})

test('report helpers reject partial and changing pages and preserve exact currency', async ({ page }) => {
  await page.goto('/login')
  const results = await page.evaluate(async () => {
    // @ts-expect-error Vite serves the source module in the test browser.
    const { collectReportPages, reportMoney, csvCell } = await import('/src/utils/report-export.ts')
    const attempt = async (fetcher: (page: number) => Promise<unknown>) => {
      try { await collectReportPages(fetcher); return 'unexpected success' } catch (error) { return (error as Error).message }
    }
    return {
      exact: reportMoney('999999999999999999'), unsafe: reportMoney(999999999999999999), formula: csvCell(' =1+1'),
      partial: await attempt(async () => ({ data: [{ id: 'one' }], meta: { total: 2, totalPages: 1 } })),
      changed: await attempt(async page => ({ data: [{ id: `row-${page}` }], meta: { total: page === 1 ? 2 : 3, totalPages: 2 } })),
      duplicate: await attempt(async () => ({ data: [{ id: 'one' }], meta: { total: 2, totalPages: 2 } })),
      limit: await attempt(async () => ({ data: [], meta: { total: 25001, totalPages: 251 } })),
    }
  })
  expect(results.exact).toBe('9,999,999,999,999,999.99')
  expect(results.unsafe).toBe('Unavailable')
  expect(results.formula).toContain("' =1+1")
  expect(results.partial).toContain('every matching record')
  expect(results.changed).toContain('changed')
  expect(results.duplicate).toContain('changed')
  expect(results.limit).toContain('25,000')
})
