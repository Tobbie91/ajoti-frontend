import { expect, test, type Page } from '@playwright/test'

type Circle = {
  id: string
  name: string
  status: string
  visibility: string
  maxSlots: number
  totalSlots: number
  filledSlots: number
  durationCycles: number
  currentCycle: number
  contributionAmount: string
  frequency: string
  admin: { firstName: string; lastName: string }
  nextContributionDeadline?: string | null
}

const admin = { id: 'admin-1', firstName: 'Circle', lastName: 'Admin', role: 'CIRCLE_ADMIN', status: 'ACTIVE' }
const member = { id: 'member-1', firstName: 'Circle', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE' }

function makeCircle(id: string, name: string, status: string): Circle {
  return {
    id, name, status, visibility: 'PUBLIC', maxSlots: 4, totalSlots: 4, filledSlots: 4,
    durationCycles: 4, currentCycle: status === 'COMPLETED' ? 4 : 1,
    contributionAmount: '500000', frequency: 'MONTHLY', admin: { firstName: 'Ajo', lastName: 'Admin' },
  }
}

const managedCircles = [
  makeCircle('active', 'Active Ajo', 'ACTIVE'),
  makeCircle('active', 'Duplicate Active Ajo', 'ACTIVE'),
  makeCircle('ready', 'Ready Ajo', 'DRAFT'),
  makeCircle('waiting', 'Waiting Ajo', 'DRAFT'),
  makeCircle('completed', 'Completed Ajo', 'COMPLETED'),
  makeCircle('cancelled', 'Cancelled Ajo', 'CANCELLED'),
]
managedCircles[2].filledSlots = 4
managedCircles[3].filledSlots = 2

async function mockAdminApi(page: Page, options: {
  deadline?: string | null
  circles?: Circle[]
  failDashboard?: boolean
  failCirclesOnce?: boolean
} = {}) {
  await page.addInitScript((user) => localStorage.setItem('user', JSON.stringify(user)), admin)
  let failCircles = options.failCirclesOnce ?? false
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/admin/rosca/my-circles' && failCircles) {
      failCircles = false
      return route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    }
    if (path === '/api/admin/rosca/dashboard' && options.failDashboard) {
      return route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    }
    if (path === '/api/users/me') return route.fulfill({ json: { data: admin } })
    if (path === '/api/admin/rosca/my-circles') return route.fulfill({ json: { data: options.circles ?? managedCircles } })
    if (/^\/api\/rosca\/[^/]+\/schedules$/.test(path)) return route.fulfill({ json: { success: true, data: options.deadline ? [{ cycleNumber: 2, contributionDeadline: options.deadline, payoutDate: '2031-01-01T00:00:00+01:00', status: 'UPCOMING', recipientName: 'Member' }] : [] } })
    if (path === '/api/admin/rosca/dashboard') return route.fulfill({ json: { data: {
      totalGroups: 99,
      memberGroupCount: 7,
      nextDeadline: options.deadline ? { groupName: 'Verified Deadline Ajo', deadline: options.deadline } : null,
      pendingJoinRequests: { total: 0, breakdown: [] },
    } } })
    if (path === '/api/wallet/balance') return route.fulfill({ json: { data: { total: '0', reserved: '0', available: '0', currency: 'NGN' } } })
    if (path === '/api/trust/my-score') return route.fulfill({ json: { data: { trustScore: 50 } } })
    if (path === '/api/credit-score') return route.fulfill({ json: { data: { score: 50 } } })
    if (path === '/api/target-savings/mine' || path === '/api/notifications') return route.fulfill({ json: { data: [] } })
    return route.fulfill({ json: { data: [] } })
  })
}

test('dashboard exposes joined membership count separately from administered circles', async ({ page }) => {
  await mockAdminApi(page)
  await page.goto('/dashboard')
  await expect(page.getByText('Joined Groups', { exact: true }).locator('..')).toContainText('7')
  await expect(page.getByText('Total Groups', { exact: true }).locator('..')).toContainText('4')
})

test('dashboard counts unique administered circles and completed links open history filter', async ({ page }) => {
  await mockAdminApi(page, { deadline: '2030-02-03T12:00:00Z' })
  await page.goto('/dashboard')
  const deadlineCard = page.getByText('Next Deadline', { exact: true }).locator('..')

  await expect(page.getByRole('button', { name: 'Active — 1', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ready — 1', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Not Ready — 1', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Completed — 1', exact: true })).toBeVisible()
  await expect(page.getByText('Admin circles · excl. cancelled')).toBeVisible()
  await expect(deadlineCard).toContainText('Duplicate Active Ajo · Cycle 2 · Upcoming')
  await expect(deadlineCard).toContainText(/3 Feb 2030/)

  await page.getByRole('button', { name: 'Completed — 1', exact: true }).click()
  await expect(page).toHaveURL(/\/rosca\/groups\?status=completed$/)
  await expect(page.getByText('Completed Ajo').filter({ visible: true })).toBeVisible()
  await expect(page.getByText('Active Ajo')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('dashboard shows overdue, completed, unavailable, and API error deadline states', async ({ page }) => {
  await mockAdminApi(page, { deadline: '2020-01-01T12:00:00Z' })
  await page.goto('/dashboard')
  const deadlineCard = page.getByText('Next Deadline', { exact: true }).locator('..')
  await expect(deadlineCard).toContainText('Duplicate Active Ajo · Cycle 2 · Overdue')

  await page.route('**/api/admin/rosca/dashboard', route => route.fulfill({ json: { data: {
    totalGroups: 1, nextDeadline: null, pendingJoinRequests: { total: 0, breakdown: [] },
  } } }))
  await page.route('**/api/admin/rosca/my-circles', route => route.fulfill({ json: { data: [makeCircle('done', 'Done', 'COMPLETED')] } }))
  await page.reload()
  await expect(deadlineCard).toContainText('Completed')

  await page.route('**/api/admin/rosca/my-circles', route => route.fulfill({ json: { data: [makeCircle('running', 'Running', 'ACTIVE')] } }))
  await page.route('**/api/rosca/running/schedules', route => route.fulfill({ json: { success: true, data: [] } }))
  await page.reload()
  await expect(deadlineCard).toContainText('Unavailable')

  await page.route('**/api/admin/rosca/dashboard', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.reload()
  await expect(page.getByText('Unable to load group dashboard and deadlines. Refresh to try again.')).toBeVisible()
  await page.route('**/api/rosca/running/schedules', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.reload()
  await expect(deadlineCard).toContainText('Failed to load')
})

test('administered group list reports API errors and can retry', async ({ page }) => {
  await mockAdminApi(page, { failCirclesOnce: true })
  await page.goto('/rosca/groups?status=completed')
  await expect(page.getByRole('alert')).toContainText('Groups could not be loaded')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('Completed Ajo').filter({ visible: true })).toBeVisible()
})

test('joined circles retain unique completed history and explicit overdue status', async ({ page }) => {
  await page.addInitScript((user) => localStorage.setItem('user', JSON.stringify(user)), member)
  const active = { ...makeCircle('member-active', 'Member Active Ajo', 'ACTIVE'), nextContributionDeadline: '2020-01-01T12:00:00Z' }
  const completed = makeCircle('member-completed', 'Member Completed Ajo', 'COMPLETED')
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/users/me') return route.fulfill({ json: { data: member } })
    if (path === '/api/rosca') return route.fulfill({ json: { data: [] } })
    if (path === '/api/rosca/my-participations') return route.fulfill({ json: { data: [active, active, completed] } })
    if (path === '/api/rosca/my-join-requests') return route.fulfill({ json: { data: [
      { circleId: active.id, status: 'ACTIVE', circle: active },
      { circleId: completed.id, status: 'COMPLETED', circle: completed },
      { circleId: completed.id, status: 'COMPLETED', circle: completed },
    ] } })
    if (path.endsWith('/schedules') && path.includes(active.id)) return route.fulfill({ json: { data: [
      { id: 'active-cycle', cycleNumber: 1, status: 'IN_PROGRESS', contributionDeadline: '2020-01-01T12:00:00Z' },
    ] } })
    if (path.endsWith('/schedules') && path.includes(completed.id)) return route.fulfill({ json: { data: [
      { id: 'completed-cycle-1', cycleNumber: 1, status: 'COMPLETED' },
      { id: 'completed-cycle-2', cycleNumber: 2, status: 'COMPLETED' },
      { id: 'completed-cycle-3', cycleNumber: 3, status: 'COMPLETED' },
      { id: 'completed-cycle-4', cycleNumber: 4, status: 'COMPLETED' },
    ] } })
    if (path.includes('/contributions')) return route.fulfill({ json: { data: [] } })
    if (path === '/api/notifications') return route.fulfill({ json: { data: [] } })
    return route.fulfill({ json: { data: [] } })
  })
  await page.goto('/rosca?tab=joined')

  await expect(page.getByText('Member Active Ajo', { exact: true })).toHaveCount(1)
  await expect(page.getByText('Member Completed Ajo', { exact: true })).toHaveCount(1)
  await expect(page.getByRole('button', { name: /Joined/ }).first()).toContainText('2')
  await expect(page.getByText(/Overdue · Due .*2020/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'View history' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous group chat' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('member home deduplicates circles, shows the scheduled cycle deadline and reports unavailable counts honestly', async ({ page }) => {
  await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), member)
  const active = { ...makeCircle('home-active', 'Member Home Ajo', 'ACTIVE'), currentCycle: 2 }
  const completed = makeCircle('home-completed', 'Member Home History', 'COMPLETED')
  let failMembership = false
  let failWallet = false
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/users/me') return route.fulfill({ json: { data: member } })
    if (path === '/api/rosca/my-participations') return failMembership
      ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
      : route.fulfill({ json: { data: [active, active] } })
    if (path === '/api/rosca/my-join-requests') return route.fulfill({ json: { data: [
      { circleId: active.id, status: 'ACTIVE', circle: active },
      { circleId: completed.id, status: 'COMPLETED', circle: completed },
      { circleId: completed.id, status: 'COMPLETED', circle: completed },
    ] } })
    if (path === `/api/rosca/${active.id}/schedules`) return route.fulfill({ json: { data: [
      { cycleNumber: 1, status: 'COMPLETED', contributionDeadline: '2030-01-01T18:00:00+01:00' },
      { cycleNumber: 2, status: 'UPCOMING', contributionDeadline: '2031-06-15T18:00:00+01:00' },
    ] } })
    if (path === `/api/rosca/${completed.id}/schedules`) return route.fulfill({ json: { data: [{ cycleNumber: 1, status: 'COMPLETED' }] } })
    if (path.startsWith('/api/rosca/') && path.includes('/contributions')) return route.fulfill({ json: { data: [] } })
    if (path === '/api/wallet/balance' && failWallet) return route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    if (path === '/api/wallet/balance') return route.fulfill({ json: { data: { total: '0', reserved: '0', available: '0', currency: 'NGN' } } })
    if (path === '/api/wallet/transactions' || path === '/api/trust/my-score' || path === '/api/credit-score' || path === '/api/target-savings/mine' || path === '/api/notifications') return route.fulfill({ json: { data: [] } })
    return route.fulfill({ json: { data: [] } })
  })
  await page.goto('/home')
  const joinedTile = page.getByText('Joined groups', { exact: true }).locator('..')
  const activeTile = page.getByText('Active', { exact: true }).locator('..')
  const completedTile = page.getByText('Completed', { exact: true }).locator('..')
  await expect(joinedTile).toContainText('2')
  await expect(activeTile).toContainText('1')
  await expect(completedTile).toContainText('1')
  const deadlineTile = page.getByText('Next Deadline', { exact: true }).locator('..')
  await expect(deadlineTile).toContainText('Member Home Ajo · Cycle 2')
  await expect(deadlineTile).toContainText('Upcoming')
  await expect(deadlineTile).toContainText('15 Jun 2031')
  await deadlineTile.click()
  await expect(page).toHaveURL(/\/rosca\/home-active$/)
  await page.goBack()
  await completedTile.click()
  await expect(page).toHaveURL(/\/rosca\?tab=joined&status=completed$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  failMembership = true
  failWallet = true
  await page.goto('/home')
  await expect(page.getByText('Unable to load joined-circle counts')).toBeVisible()
  await expect(page.getByText('Unable to load wallet balances')).toBeVisible()
  await expect(joinedTile).toContainText('Unavailable')
  await expect(page.getByText('Available', { exact: true }).locator('../..')).toContainText('Unavailable')
})
