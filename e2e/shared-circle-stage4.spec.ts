import { expect, test, type Page } from '@playwright/test'

const id = 'shared-contract'
const sentinels = { bankDetails: 'PRIVATE_BANK_SENTINEL', wallet: 'PRIVATE_WALLET_SENTINEL', collateral: 'PRIVATE_COLLATERAL_SENTINEL', providerId: 'PROVIDER_SENTINEL', ledgerId: 'LEDGER_SENTINEL', debt: 'DEBT_SENTINEL', comment: 'PRIVATE_REVIEW_SENTINEL' }
async function fixture(page: Page, options: { owner?: boolean; member?: boolean; completed?: boolean; denied?: string; receiptsFail?: boolean; healthFail?: boolean; healthDelayMs?: number; emptyHealth?: boolean; large?: boolean; paidCurrent?: boolean; reviewedMemberIds?: string[]; reviewMineFail?: boolean; preferenceDelayMs?: number; preferenceFailOnce?: boolean; payoutRows?: unknown[] } = {}) {
  const member = options.member !== false
  const user = { id: 'me', firstName: 'Shared', lastName: 'Member', role: options.owner || !member ? 'CIRCLE_ADMIN' : 'MEMBER', status: 'ACTIVE' }
  await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), user)
  const circle = { id, name: 'Contract Circle', description: 'Safe circle', status: options.completed ? 'COMPLETED' : 'ACTIVE', visibility: 'PUBLIC', contributionAmount: '500000', frequency: 'MONTHLY', durationCycles: 3, currentCycle: options.completed ? 3 : 2, filledSlots: 2, maxSlots: 2, payoutLogic: 'SEQUENTIAL', admin: { firstName: 'Owner', lastName: 'Name' }, userMembershipStatus: options.denied ?? (member ? options.completed ? 'COMPLETED' : 'ACTIVE' : null), isRequestingUserAdmin: options.owner === true, previewOnly: !!options.denied, members: [...(member ? [{ userId: 'me', name: 'Shared Member', position: 1, status: options.completed ? 'COMPLETED' : 'ACTIVE' }] : []), { userId: 'other', name: 'Other Member', position: 2, status: 'ACTIVE' }] }
  const state = { reads: [] as string[], reviewPosts: [] as unknown[], preferences: [] as unknown[], healthFailures: options.healthFail ? 2 : 0, reviewMineFailures: options.reviewMineFail ? 2 : 0, preferenceFailures: options.preferenceFailOnce ? 2 : 0, summaryReads: 0 }
  const schedules = [1, 2, 3].map(cycleNumber => ({ cycleNumber, status: options.completed || cycleNumber === 1 ? 'COMPLETED' : 'UPCOMING', recipientName: cycleNumber === 1 ? 'Other Member' : 'Shared Member', contributionDeadline: `2031-0${cycleNumber}-15T18:00:00+01:00`, payoutDate: `2031-0${cycleNumber}-16T00:00:00+01:00` }))
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    const cycle = Number(url.searchParams.get('cycleNumber') ?? circle.currentCycle)
    state.reads.push(path + url.search)
    const send = (data: unknown) => route.fulfill({ json: { success: true, data } })
    if (path === '/api/users/me') return send(user)
    if (path === `/api/rosca/${id}`) return send(circle)
    if (path === `/api/admin/rosca/${id}`) return send(circle)
    if (path === `/api/rosca/${id}/schedules`) return send(schedules)
    if (path === `/api/rosca/${id}/financial-health`) {
      if (state.healthFailures > 0) { state.healthFailures--; return route.fulfill({ status: 503, json: { message: sentinels.providerId } }) }
      if (options.healthDelayMs) await new Promise(resolve => setTimeout(resolve, options.healthDelayMs))
      return send({ circleId: id, totalCollected: options.large ? '900719925474099399' : '749999', contributionAmount: '500000', filledSlots: 2, cycles: options.emptyHealth ? [] : schedules.map(schedule => ({ cycleNumber: schedule.cycleNumber, contributionDeadline: schedule.contributionDeadline, scheduleStatus: schedule.status, expectedPot: '1000000', collected: schedule.cycleNumber === 1 ? '500000' : '249999', outstanding: schedule.cycleNumber === 1 ? '500000' : '750001', expectedCount: 2, collectedCount: 1 })), ...sentinels })
    }
    if (path === `/api/rosca/${id}/progress`) return send({ circleId: id, durationCycles: 3, members: [{ userId: 'me', name: 'Shared Member', completedCycles: options.completed ? 3 : 1, durationCycles: 3, payoutStatus: 'UPCOMING', payoutPosition: 1 }, { userId: 'other', name: 'Other Member', completedCycles: 3, durationCycles: 3, payoutStatus: 'PAID', payoutPosition: 2 }] })
    if (path === `/api/rosca/${id}/contribution-summary`) return send({ circleId: id, cycleNumber: cycle, totalCollected: cycle === 1 ? '500000' : '249999', contributions: [{ memberName: 'Other Member', amount: cycle === 1 ? '500000' : '249999', paidAt: '2031-01-10T18:00:00+01:00', ...sentinels }] })
    if (path === `/api/rosca/${id}/contributions/roster`) return send([{ memberName: 'Other Member', cycleNumber: cycle, amount: cycle === 1 ? '500000' : '249999', paidAt: '2031-01-10T18:00:00+01:00', ...sentinels }])
    if (path === `/api/rosca/${id}/contributions`) {
      if (options.receiptsFail) return route.fulfill({ status: 503, json: { message: sentinels.providerId } })
      return send(options.paidCurrent ? [{ id: 'own', cycleNumber: 2, amount: '500000', penaltyAmount: '0', paidAt: '2031-01-10T00:00:00Z' }] : [])
    }
    if (path === `/api/rosca/${id}/disbursements` || path === `/api/admin/rosca/${id}/disbursements`) return send({ circleId: id, schedules: schedules.map(schedule => ({ ...schedule, scheduleStatus: schedule.status, payoutStatus: schedule.cycleNumber === 1 ? 'COMPLETED' : null, settlementStatus: schedule.cycleNumber === 1 ? 'COMPLETED' : null, amountPaidOut: schedule.cycleNumber === 1 ? '500000' : null, processedAt: schedule.cycleNumber === 1 ? '2031-01-16T00:00:00+01:00' : null, ...sentinels })) })
    if (path === `/api/rosca/${id}/payouts`) return send(options.payoutRows ?? [{ cycleNumber: 1, recipientName: 'Other Member', amount: '500000', amountPaidOut: null, settlementStatus: 'FAILED', status: 'FAILED', processedAt: null, payoutDate: schedules[0].payoutDate, ...sentinels }])
    if (path === `/api/rosca/${id}/reviews/summary`) { state.summaryReads++; return send([{ userId: 'other', name: 'Other Member', averageRating: state.reviewPosts.length > 0 ? 4.5 : 4.25, totalReviews: 4, ...sentinels }]) }
    if (path === `/api/rosca/${id}/reviews/mine`) {
      if (state.reviewMineFailures > 0) { state.reviewMineFailures--; return route.fulfill({ status: 503, json: { message: 'Unavailable' } }) }
      return send((options.reviewedMemberIds ?? []).map(revieweeId => ({ id: `review-${revieweeId}`, revieweeId, reviewerId: 'me', rating: 5 })))
    }
    if (path === `/api/rosca/${id}/reviews` && route.request().method() === 'POST') { state.reviewPosts.push(route.request().postDataJSON()); return send({ id: 'review' }) }
    if (path.endsWith('/contributions/payment-preference')) {
      if (route.request().method() === 'PATCH') state.preferences.push(route.request().postDataJSON())
      if (route.request().method() === 'GET' && state.preferenceFailures > 0) { state.preferenceFailures--; return route.fulfill({ status: 503, json: { message: 'Unavailable' } }) }
      if (route.request().method() === 'GET' && options.preferenceDelayMs) await new Promise(resolve => setTimeout(resolve, options.preferenceDelayMs))
      return send({ paymentMethod: 'MANUAL' })
    }
    if (path === '/api/wallet/balance') return send({ available: '999999999', total: '999999999', reserved: '0' })
    if (path === '/api/chat/circles') return route.fulfill({ json: [{ id, name: 'Contract Circle', lastMessage: null }] })
    if (path === `/api/chat/circles/${id}/messages`) return route.fulfill({ json: [{ id: 'chat', circleId: id, senderId: 'other', senderName: 'Other Member', senderInitials: 'OM', body: 'Historical group message', createdAt: '2031-01-01T00:00:00Z' }, { id: 'wrong', circleId: 'unrelated', senderId: 'private', body: 'CROSS_CIRCLE_MESSAGE_SENTINEL', createdAt: '2031-01-01T00:00:00Z' }] })
    if (path === '/api/trust/my-score') return send({ trustScore: 50 })
    if (path.endsWith('/early-payouts')) return send({ circleId: id, totalLoans: 1, activeCount: 0, repaidCount: 1, defaultedCount: 0, cancelledCount: 0 })
    return send([])
  })
  return state
}
async function noLeaks(page: Page) {
  const body = await page.locator('body').innerText()
  for (const value of Object.values(sentinels)) expect(body).not.toContain(value)
  expect(body).not.toContain('CROSS_CIRCLE_MESSAGE_SENTINEL')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}
async function selectSection(page: Page, section: string) {
  if ((page.viewportSize()?.width ?? 0) >= 640) {
    await page.getByRole('button', { name: section, exact: true }).last().click()
    return
  }
  await page.getByRole('textbox', { name: 'View group section' }).click()
  await page.getByRole('option', { name: section, exact: true }).click()
}
for (const actor of [{ name: 'member' }, { name: 'owner', owner: true, member: false }, { name: 'owner member', owner: true }, { name: 'completed member', completed: true }]) {
  test(`${actor.name} sees safe financial progress, history and ratings`, async ({ page }) => {
    const state = await fixture(page, actor)
    await page.goto(`/rosca/${id}`)
    await expect(page.getByText('Group financial health', { exact: true })).toBeVisible()
    await expect(page.getByText('₦7,499.99', { exact: true })).toBeVisible()
    await expect(page.getByText('Member cycle progress', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Manage Group', exact: true })).toHaveCount(actor.owner ? 1 : 0)
    await expect(page.getByText('Group balance remaining is unavailable', { exact: false })).toBeVisible()
    if (actor.completed) await expect(page.getByText('Next Deadline: Completed', { exact: true })).toBeVisible()
    else await expect(page.getByText('Next Deadline · Cycle 2: Upcoming', { exact: true })).toBeVisible()
    await selectSection(page, 'Contributions')
    await expect(page.getByText('₦2,499.99', { exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: 'Contribution history cycle' }).click()
    await page.getByRole('option', { name: 'Cycle 1', exact: true }).click()
    await expect(page.getByText('₦5,000.00', { exact: true })).toBeVisible()
    expect(state.reads.some(path => path.includes('/contributions/roster?cycleNumber=1'))).toBe(true)
    await selectSection(page, 'Payouts')
    await expect(page.getByText('Payout history', { exact: true })).toBeVisible()
    await expect(page.getByText('Failed', { exact: true }).filter({ visible: true })).toBeVisible()
    await expect(page.getByText('Not settled').filter({ visible: true }).first()).toBeVisible()
    await selectSection(page, 'Peers')
    await expect(page.getByText('4.3 / 5', { exact: true }).filter({ visible: true })).toBeVisible()
    if (!actor.owner) expect(state.reads.filter(path => path.startsWith('/api/admin/rosca'))).toEqual([])
    await noLeaks(page)
  })
}
test('financial failures can retry, and missing member balance never becomes zero', async ({ page }) => {
  await fixture(page, { healthFail: true, large: true })
  await page.goto(`/rosca/${id}`)
  await expect(page.getByRole('alert')).toContainText('Unable to load group financial health')
  await noLeaks(page)
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByText('₦9,007,199,254,740,993.99', { exact: true })).toBeVisible()
  await noLeaks(page)
})
test('slow and empty health responses keep progress available and do not invent cycle totals', async ({ page }) => {
  await fixture(page, { healthDelayMs: 400, emptyHealth: true })
  await page.goto(`/rosca/${id}`)
  await expect(page.getByText('Loading group financial health…')).toBeVisible()
  await expect(page.getByText('Member cycle progress', { exact: true })).toBeVisible()
  await expect(page.getByText('Expected contributions').locator('..')).toContainText('Unavailable')
  await expect(page.getByText('Outstanding contributions').locator('..')).toContainText('Unavailable')
})
test('payout history shows only confirmed money paid and separates settlement states', async ({ page }) => {
  const rows = [
    { cycleNumber: 1, recipientName: 'Settled Member', amount: '900000', amountPaidOut: '500000', settlementStatus: 'COMPLETED', status: 'COMPLETED', processedAt: '2031-01-16T00:00:00+01:00', payoutDate: '2031-01-16T00:00:00+01:00' },
    { cycleNumber: 2, recipientName: 'Pending Member', amount: '800000', amountPaidOut: null, settlementStatus: 'PENDING', status: 'PENDING', processedAt: null, payoutDate: '2031-02-16T00:00:00+01:00' },
    { cycleNumber: 3, recipientName: 'Failed Member', amount: '700000', amountPaidOut: null, settlementStatus: 'FAILED', status: 'FAILED', processedAt: null, payoutDate: '2031-03-16T00:00:00+01:00' },
    { cycleNumber: 4, recipientName: 'Review Member', amount: '600000', amountPaidOut: null, settlementStatus: 'UNDER_REVIEW', status: 'COMPLETED', processedAt: null, payoutDate: '2031-04-16T00:00:00+01:00' },
  ]
  await fixture(page, { payoutRows: rows })
  await page.goto(`/rosca/${id}`)
  await selectSection(page, 'Payouts')

  await expect(page.getByText('Amount paid out', { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('Settlement status', { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('₦5,000.00', { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('₦9,000.00', { exact: true }).filter({ visible: true })).toHaveCount(0)
  await expect(page.getByText('Not settled').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('Settled', { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('Pending', { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('Failed', { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('Under review', { exact: true }).filter({ visible: true }).first()).toBeVisible()
})
test('admin payout history labels stored amounts separately from confirmed settlement', async ({ page }) => {
  await fixture(page, {
    owner: true,
    member: false,
    payoutRows: [
      { cycleNumber: 1, recipientName: 'Settled Member', amount: '900000', amountPaidOut: '500000', settlementStatus: 'COMPLETED', status: 'COMPLETED', processedAt: '2031-01-16T00:00:00+01:00', payoutDate: '2031-01-16T00:00:00+01:00' },
      { cycleNumber: 2, recipientName: 'Review Member', amount: '600000', amountPaidOut: null, settlementStatus: 'UNDER_REVIEW', status: 'COMPLETED', processedAt: null, payoutDate: '2031-02-16T00:00:00+01:00' },
    ],
  })
  await page.goto(`/rosca/${id}?view=manage`)
  await page.getByRole('tab', { name: 'Payouts', exact: true }).click()

  await expect(page.getByText('Amount paid out', { exact: true })).toBeVisible()
  await expect(page.getByText('Settlement status', { exact: true })).toBeVisible()
  await expect(page.getByText('₦5,000.00', { exact: true })).toBeVisible()
  await expect(page.getByText('₦9,000.00', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Not settled', { exact: true })).toBeVisible()
  await expect(page.getByText('Settled', { exact: true })).toBeVisible()
  await expect(page.getByText('Under review', { exact: true })).toBeVisible()
})
test('personal receipt failure does not hide shared health and prevents a guessed payment', async ({ page }) => {
  await fixture(page, { receiptsFail: true })
  await page.goto(`/rosca/${id}`)
  await expect(page.getByRole('alert')).toContainText('Payment controls are unavailable')
  await expect(page.getByText('Group financial health', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Make a contribution', exact: true })).toHaveCount(0)
  await noLeaks(page)
})
for (const status of ['PENDING', 'REJECTED', 'EXITED', 'DEFAULTED', 'REMOVED', 'UNRELATED']) {
  test(`${status} cannot load protected circle data even with a global admin role`, async ({ page }) => {
    const state = await fixture(page, { member: false, denied: status })
    await page.goto(`/rosca/${id}?view=manage`)
    await expect(page.getByText('Group Details', { exact: true })).toBeVisible()
    expect(state.reads.filter(path => path.startsWith(`/api/rosca/${id}/`))).toEqual([])
    await expect(page.getByRole('button', { name: 'Manage Group', exact: true })).toHaveCount(0)
  })
}
test('completed chat is read-only and filters unrelated circle messages', async ({ page }) => {
  await fixture(page, { completed: true })
  await page.goto(`/messages?circleId=${id}`)
  await expect(page.getByText('Historical group message')).toBeVisible()
  await expect(page.getByText(/Chat is read-only/)).toBeVisible()
  await expect(page.getByPlaceholder('Type a message…')).toHaveCount(0)
  await noLeaks(page)
})
test('unauthorized historical chat does not request messages', async ({ page }) => {
  const state = await fixture(page, { denied: 'EXITED' })
  await page.goto(`/messages?circleId=${id}`)
  await expect(page.getByRole('alert')).toContainText('Group chat history is unavailable')
  expect(state.reads.some(path => path.includes(`/chat/circles/${id}/messages`))).toBe(false)
})
test('early payments and payment preferences remain available for an owner who is a member', async ({ page }) => {
  const state = await fixture(page, { owner: true, paidCurrent: true, preferenceDelayMs: 500 })
  await page.goto(`/rosca/${id}`)
  await expect(page.getByRole('button', { name: 'Pay next cycle early' })).toBeVisible()
  await selectSection(page, 'Growth')
  await expect(page.getByText('Contribution payment method', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save payment preference' })).toBeDisabled()
  await expect(page.getByRole('textbox', { name: 'Contribution payment method' }).first()).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Save payment preference' })).toBeEnabled()
  await page.getByRole('button', { name: 'Save payment preference' }).click()
  await expect(page.getByText('Payment preference saved')).toBeVisible()
  expect(state.preferences).toEqual([{ paymentMethod: 'MANUAL' }])
  await page.getByRole('button', { name: 'Pay Cycle 3 Early', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Cycle 3')
})
test('completed members can submit a permitted review while aggregate data stays separate', async ({ page }) => {
  const state = await fixture(page, { completed: true })
  await page.goto(`/rosca/${id}?tab=peer`)
  await page.getByRole('button', { name: /Other Member.*Tap to review/ }).click()
  await page.getByRole('button', { name: 'Submit Review', exact: true }).click()
  await expect(page.getByText('Review submitted!', { exact: true })).toBeVisible()
  expect(state.reviewPosts).toEqual([{ revieweeId: 'other', rating: 4 }])
  await expect(page.getByText('4.5 / 5', { exact: true }).filter({ visible: true })).toBeVisible()
  expect(state.summaryReads).toBeGreaterThanOrEqual(2)
})

test('existing peer reviews are marked and cannot be submitted twice', async ({ page }) => {
  const state = await fixture(page, { completed: true, reviewedMemberIds: ['other'] })
  await page.goto(`/rosca/${id}?tab=peer`)
  const alreadyReviewed = page.getByRole('button', { name: /Other Member.*Reviewed/ })
  await expect(alreadyReviewed).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Submit Review', exact: true })).toHaveCount(0)
  expect(state.reviewPosts).toEqual([])
})

test('peer review history errors retry without enabling duplicate submissions', async ({ page }) => {
  await fixture(page, { completed: true, reviewMineFail: true })
  await page.goto(`/rosca/${id}?tab=peer`)
  await expect(page.getByRole('alert')).toContainText('Unable to load your review history')
  const reviewCard = page.getByRole('button', { name: /Other Member.*Tap to review/ })
  await expect(reviewCard).toBeDisabled()
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(reviewCard).toBeEnabled()
})

test('owner-only viewers see aggregate ratings without member review submission access', async ({ page }) => {
  const state = await fixture(page, { owner: true, member: false, completed: true })
  await page.goto(`/rosca/${id}?tab=peer`)
  await expect(page.getByText('4.3 / 5', { exact: true }).filter({ visible: true })).toBeVisible()
  expect(state.reads.some(path => path.endsWith('/reviews/mine'))).toBe(false)
  await expect(page.getByText(/Rate your fellow members/)).toHaveCount(0)
})

test('personal contribution history paginates all receipts before deriving totals or payment targets', async ({ page }) => {
  await fixture(page, { paidCurrent: true })
  const requestedOffsets: string[] = []
  await page.route(url => {
    const parsed = new URL(url)
    return parsed.pathname === `/api/rosca/${id}/contributions` && parsed.searchParams.get('limit') === '100'
  }, async route => {
    const url = new URL(route.request().url())
    const offset = Number(url.searchParams.get('offset') ?? 0)
    requestedOffsets.push(String(offset))
    const cycleNumber = offset === 0 ? 2 : 3
    const count = offset === 0 ? 100 : 2
    const amount = offset === 0 ? '5000' : '250000'
    return route.fulfill({ json: { success: true, data: Array.from({ length: count }, (_, index) => ({ id: `receipt-${offset + index}`, cycleNumber, amount, penaltyAmount: '0', paidAt: '2031-01-10T00:00:00Z' })) } })
  })
  await page.goto(`/rosca/${id}`)
  await expect(page.getByRole('paragraph').filter({ hasText: /^₦10,000\.00$/ })).toBeVisible()
  expect(requestedOffsets).toContain('100')
  await expect(page.getByRole('button', { name: 'Make a contribution', exact: true })).toHaveCount(0)
})

test('payment preference remains unavailable until the verified server value loads and supports retry', async ({ page }) => {
  await fixture(page, { preferenceFailOnce: true, preferenceDelayMs: 250 })
  await page.goto(`/rosca/${id}`)
  await selectSection(page, 'Growth')
  await expect(page.getByRole('alert')).toContainText('Unable to load payment preference')
  await expect(page.getByRole('textbox', { name: 'Contribution payment method' }).first()).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Save payment preference' })).toBeDisabled()
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Save payment preference' })).toBeEnabled()
})
