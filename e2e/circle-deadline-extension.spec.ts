import { expect, test, type Page } from '@playwright/test'

const circleId = 'extension-circle'
const admin = { id: 'extension-admin', firstName: 'Circle', lastName: 'Admin', role: 'CIRCLE_ADMIN', status: 'ACTIVE' }
const member = { id: 'extension-member', firstName: 'Circle', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE' }

type MockOptions = {
  user?: typeof admin | typeof member
  currentDeadline?: string
  patchStatus?: number
  payoutStatus?: string | null
}

type MockState = {
  patches: Array<{ path: string; method: string; body: Record<string, unknown> }>
  financialHealthReads: number
  disbursementReads: number
  updatedDeadline: string | null
}

function deadlineWithOffset(targetDate: string, offsetDays: number): string {
  const day = new Date(`${targetDate}T12:00:00Z`)
  day.setUTCDate(day.getUTCDate() + offsetDays)
  return `${day.toISOString().slice(0, 10)}T23:59:59+01:00`
}

async function mockDeadlineExtensionApi(page: Page, options: MockOptions = {}): Promise<MockState> {
  const user = options.user ?? admin
  const state: MockState = { patches: [], financialHealthReads: 0, disbursementReads: 0, updatedDeadline: null }
  const circle = {
    id: circleId,
    name: 'Extension Circle',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    frequency: 'WEEKLY',
    contributionAmount: '100000',
    durationCycles: 4,
    currentCycle: 1,
    maxSlots: 4,
    filledSlots: 4,
    payoutLogic: 'SEQUENTIAL',
    isRequestingUserAdmin: user.role === 'CIRCLE_ADMIN',
    userMembershipStatus: 'ACTIVE',
    admin: { firstName: 'Circle', lastName: 'Admin' },
    members: [{ userId: user.id, name: 'Circle User', status: 'ACTIVE', position: 1 }],
  }
  const currentDeadline = options.currentDeadline ?? deadlineWithOffset(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), 0)

  await page.addInitScript((cachedUser) => localStorage.setItem('user', JSON.stringify(cachedUser)), user)
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/users/me') return route.fulfill({ json: { data: user } })
    if (path === `/api/rosca/${circleId}`) return route.fulfill({ json: { data: circle } })
    if (path === `/api/admin/rosca/${circleId}`) return route.fulfill({ json: { data: circle } })
    if (path === `/api/admin/rosca/${circleId}/financial-health`) {
      state.financialHealthReads += 1
      return route.fulfill({ json: { data: {
        totalCollected: '0',
        remainingBalance: '400000',
        cycles: [1, 2, 3, 4].map((cycleNumber) => ({
          cycleNumber,
          contributionDeadline: cycleNumber === 1 ? state.updatedDeadline ?? currentDeadline : '2030-01-01T23:59:59+01:00',
          scheduleStatus: 'UPCOMING',
          expectedPot: '400000', collected: '0', outstanding: '400000', expectedCount: 4, collectedCount: 0,
        })),
      } } })
    }
    if (path === `/api/admin/rosca/${circleId}/schedules/1/extend` && request.method() === 'PATCH') {
      const body = request.postDataJSON() as Record<string, unknown>
      state.patches.push({ path, method: request.method(), body })
      if (options.patchStatus === 409) {
        return route.fulfill({ status: 409, json: { message: 'Schedule conflict' } })
      }
      if (options.patchStatus === 403) {
        return route.fulfill({ status: 403, json: { message: 'Only the circle owner can extend a deadline' } })
      }
      if (options.patchStatus && options.patchStatus !== 200) {
        return route.fulfill({ status: options.patchStatus, json: { message: 'Invalid contribution deadline' } })
      }
      state.updatedDeadline = String(body.newContributionDeadline ?? '')
      return route.fulfill({ json: { message: 'Deadline extended successfully' } })
    }
    if (path === `/api/admin/rosca/${circleId}/disbursements`) {
      state.disbursementReads += 1
      return route.fulfill({ json: { data: { schedules: [{
        cycleNumber: 1,
        recipientId: 'member-1',
        recipientName: 'Member One',
        payoutDate: '2031-01-02T00:00:00+01:00',
        contributionDeadline: state.updatedDeadline ?? currentDeadline,
        scheduleStatus: 'UPCOMING',
        payoutStatus: options.payoutStatus ?? null,
        amountPaidOut: null,
        processedAt: null,
      }] } } })
    }
    if (path === `/api/admin/rosca/${circleId}/join-requests`) return route.fulfill({ json: { data: [] } })
    if (path === `/api/rosca/${circleId}/payouts`) return route.fulfill({ json: { data: [] } })
    if (path === `/api/admin/rosca/${circleId}/contributions`) return route.fulfill({ json: { data: {
      cycleNumber: 1, contributions: [], totalCollected: '0', totalPenalties: '0',
    } } })
    if (path.endsWith('/invites')) return route.fulfill({ json: { data: [] } })
    if (path === '/api/notifications') return route.fulfill({ json: { data: [] } })
    return route.fulfill({ json: { data: [] } })
  })
  return state
}

async function openExtensionForm(page: Page, targetDate: string, cutoffTime?: string) {
  await page.goto(`/rosca/${circleId}?view=manage`)
  await page.getByRole('tab', { name: 'Payment Oversight' }).click()
  await page.getByRole('button', { name: 'Extend Deadline' }).click()
  const input = page.getByLabel('New contribution deadline (WAT)')
  await input.fill(targetDate)
  if (cutoffTime) await page.getByLabel('New cutoff time (WAT)').fill(cutoffTime)
  await page.getByText('Extend Cycle Deadline', { exact: true }).click()
}

test('extension validates dates, sends the independent deadline payload, and handles HTTP 409', async ({ page }) => {
  const targetDate = await page.evaluate(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const conflictState = await mockDeadlineExtensionApi(page, { patchStatus: 409 })
  await openExtensionForm(page, targetDate)
  const healthReadsBeforePatch = conflictState.financialHealthReads
  const submit = page.getByRole('button', { name: 'Extend deadline', exact: true })
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(page.getByText(/schedule changed or conflicts with another cycle/i)).toBeVisible()
  expect(conflictState.patches).toEqual([{
    path: `/api/admin/rosca/${circleId}/schedules/1/extend`,
    method: 'PATCH',
    body: { newContributionDeadline: `${targetDate}T23:59:59+01:00` },
  }])
  expect(conflictState.financialHealthReads).toBe(healthReadsBeforePatch)
})

test('server-side deadline validation is shown without closing the form', async ({ page }) => {
  const targetDate = await page.evaluate(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const state = await mockDeadlineExtensionApi(page, { patchStatus: 400 })
  await openExtensionForm(page, targetDate)
  await page.getByRole('button', { name: 'Extend deadline', exact: true }).click()
  await expect(page.getByText('Invalid contribution deadline')).toBeVisible()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(state.patches).toHaveLength(1)
})

test('backend authorization errors remain visible when submission is denied', async ({ page }) => {
  const targetDate = await page.evaluate(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const state = await mockDeadlineExtensionApi(page, { patchStatus: 403 })
  await openExtensionForm(page, targetDate)
  await page.getByRole('button', { name: 'Extend deadline', exact: true }).click()
  await expect(page.getByText('Only the circle owner can extend a deadline')).toBeVisible()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(state.patches).toHaveLength(1)
})

test('extension rejects a date that does not move the current deadline forward', async ({ page }) => {
  const targetDate = await page.evaluate(() => {
    const date = new Date()
    date.setDate(date.getDate() + 5)
    return date.toISOString().slice(0, 10)
  })
  const laterCurrentDeadline = deadlineWithOffset(targetDate, 2)
  const state = await mockDeadlineExtensionApi(page, { currentDeadline: laterCurrentDeadline })
  await openExtensionForm(page, targetDate)
  await expect(page.getByText(/after this cycle.s current contribution deadline/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Extend deadline', exact: true })).toBeDisabled()
  expect(state.patches).toHaveLength(0)
})

test('successful extension refreshes financial schedules and disbursement schedules', async ({ page }) => {
  const targetDate = await page.evaluate(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const state = await mockDeadlineExtensionApi(page)
  await openExtensionForm(page, targetDate)
  const healthReadsBeforePatch = state.financialHealthReads
  const disbursementReadsBeforePatch = state.disbursementReads
  await page.getByRole('button', { name: 'Extend deadline', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(() => state.financialHealthReads).toBeGreaterThan(healthReadsBeforePatch)
  await expect.poll(() => state.disbursementReads).toBeGreaterThan(disbursementReadsBeforePatch)
  expect(state.patches[0]?.body).toEqual({ newContributionDeadline: `${targetDate}T23:59:59+01:00` })
  expect(state.updatedDeadline).toBe(`${targetDate}T23:59:59+01:00`)
})

test('extension keeps the configured 18:00 WAT cutoff when the organiser changes only the date', async ({ page }) => {
  const { currentDate, targetDate } = await page.evaluate(() => {
    const current = new Date()
    current.setDate(current.getDate() + 7)
    const target = new Date(current)
    target.setDate(target.getDate() + 1)
    return { currentDate: current.toISOString().slice(0, 10), targetDate: target.toISOString().slice(0, 10) }
  })
  const state = await mockDeadlineExtensionApi(page, { currentDeadline: `${currentDate}T18:00:00+01:00` })
  await openExtensionForm(page, targetDate)
  await expect(page.getByLabel('New cutoff time (WAT)')).toHaveValue('18:00:00')
  await page.getByRole('button', { name: 'Extend deadline', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.patches[0]?.body).toEqual({ newContributionDeadline: `${targetDate}T18:00:00+01:00` })
})

test('00:00 WAT cutoff preview schedules payout on the following WAT calendar day', async ({ page }) => {
  const { currentDate, targetDate, payoutDate } = await page.evaluate(() => {
    const current = new Date()
    current.setDate(current.getDate() + 7)
    const target = new Date(current)
    target.setDate(target.getDate() + 1)
    const payout = new Date(target)
    payout.setDate(payout.getDate() + 1)
    return { currentDate: current.toISOString().slice(0, 10), targetDate: target.toISOString().slice(0, 10), payoutDate: payout.toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'long' }) }
  })
  const state = await mockDeadlineExtensionApi(page, { currentDeadline: `${currentDate}T18:00:00+01:00` })
  await openExtensionForm(page, targetDate, '00:00:00')
  await expect(page.getByText(`Corresponding payout: ${payoutDate} at 00:00 WAT.`, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Extend deadline', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.patches[0]?.body).toEqual({ newContributionDeadline: `${targetDate}T00:00:00+01:00` })
})

test('23:59:59 WAT cutoff previews payout at midnight on the following day', async ({ page }) => {
  const { currentDate, targetDate, payoutDate } = await page.evaluate(() => {
    const current = new Date()
    current.setDate(current.getDate() + 7)
    const target = new Date(current)
    target.setDate(target.getDate() + 1)
    const payout = new Date(target)
    payout.setDate(payout.getDate() + 1)
    return {
      currentDate: current.toISOString().slice(0, 10),
      targetDate: target.toISOString().slice(0, 10),
      payoutDate: payout.toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'long' }),
    }
  })
  const state = await mockDeadlineExtensionApi(page, { currentDeadline: `${currentDate}T18:00:00+01:00` })
  await openExtensionForm(page, targetDate, '23:59:59')
  await expect(page.getByText(`Corresponding payout: ${payoutDate} at 00:00 WAT.`, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Extend deadline', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.patches[0]?.body).toEqual({ newContributionDeadline: `${targetDate}T23:59:59+01:00` })
})

for (const payoutStatus of ['FAILED', 'INITIATED']) {
  test(`${payoutStatus.toLowerCase()} payout prevents a new deadline extension`, async ({ page }) => {
    const state = await mockDeadlineExtensionApi(page, { payoutStatus })
    await page.goto(`/rosca/${circleId}?view=manage`)
    await page.getByRole('tab', { name: 'Payment Oversight' }).click()
    await expect(page.getByText('Cycle 1', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Extend Deadline', exact: true })).toHaveCount(0)
    expect(state.patches).toEqual([])
  })
}

test('an expired contribution cutoff cannot be extended', async ({ page }) => {
  const state = await mockDeadlineExtensionApi(page, { currentDeadline: '2020-01-01T18:00:00+01:00' })
  await page.goto(`/rosca/${circleId}?view=manage`)
  await page.getByRole('tab', { name: 'Payment Oversight' }).click()
  await expect(page.getByText('Cycle 1', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Extend Deadline', exact: true })).toHaveCount(0)
  expect(state.patches).toEqual([])
})

test('non-admin members do not receive deadline extension controls', async ({ page }) => {
  await mockDeadlineExtensionApi(page, { user: member })
  await page.goto(`/rosca/${circleId}?view=manage`)
  await expect(page.getByRole('button', { name: 'Extend Deadline' })).toHaveCount(0)
})

test('actual circle owners can submit deadline extensions in production builds', async ({ page }) => {
  const targetDate = await page.evaluate(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const state = await mockDeadlineExtensionApi(page)
  await openExtensionForm(page, targetDate)
  const submit = page.getByRole('button', { name: 'Extend deadline', exact: true })
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.patches).toHaveLength(1)
  expect(state.patches[0]?.body).toEqual({ newContributionDeadline: `${targetDate}T23:59:59+01:00` })
})
