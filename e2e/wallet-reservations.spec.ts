import { expect, test } from '@playwright/test'
import { mockRoscaReads } from './rosca-read-fixtures'

test('reservation preview shows both products and masks all amounts without API calls', async ({ page }) => {
  const apiCalls: string[] = []
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiCalls.push(request.url()) })
  await page.goto('/preview/reservations.html')
  const panel = page.getByRole('region', { name: 'Reserved money breakdown' })
  await expect(panel).toContainText('22,500.00')
  await expect(panel).toContainText('Huawei Group')
  await expect(panel).toContainText('School fees')
  await page.screenshot({ path: `../docs/specs/previews/issue-4-reservations-${test.info().project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Hide amounts' }).click()
  await expect(panel).not.toContainText('22,500.00')
  await expect(panel).not.toContainText('5,000.00')
  expect(apiCalls).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

for (const role of ['MEMBER', 'CIRCLE_ADMIN']) test(`${role} dashboard attributes actual reservations and retries failed reads`, async ({ page }) => {
  await mockRoscaReads(page, { duration: 5 })
  const user = { id: 'member', role, status: 'ACTIVE', firstName: 'Test', lastName: 'Customer' }
  await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), user)
  await page.route('**/api/users/me', route => route.fulfill({ json: user }))
  await page.route('**/api/admin/rosca/dashboard', route => route.fulfill({ json: { data: { totalGroups: 1, nextDeadline: null, pendingJoinRequests: { total: 0 } } } }))
  await page.route('**/api/target-savings/mine', route => route.fulfill({ json: { data: [{ id: 'school', name: 'School fees' }] } }))
  let fail = true
  await page.route('**/api/wallet/buckets', route => fail ? route.fulfill({ status: 503, json: { message: 'Unavailable' } }) : route.fulfill({ json: { data: [
    { id: 'rosca', bucketType: 'ROSCA', reservedAmount: '500000', sourceId: 'membership', rosca: { circleId: 'family', circleName: 'Family Ajo' } },
    { id: 'target', bucketType: 'TARGET', reservedAmount: '1000000', sourceId: 'school', rosca: null },
    { id: 'released', bucketType: 'TARGET', reservedAmount: '0', sourceId: 'closed', rosca: null },
  ] } }))
  await page.goto(role === 'MEMBER' ? '/home' : '/dashboard')
  const panel = page.getByRole('region', { name: 'Reserved money breakdown' })
  await expect(panel).toContainText('Could not load the reservation breakdown')
  await expect(panel).not.toContainText('No money is currently reserved')
  fail = false
  await panel.getByRole('button', { name: 'Refresh reservations' }).click()
  await expect(panel).toContainText('Family Ajo')
  await expect(panel).toContainText('School fees')
  await expect(panel).toContainText('Other wallet reservations')
  await expect(panel.getByRole('link', { name: 'Open Family Ajo' })).toHaveAttribute('href', '/rosca/family')
  await expect(panel.getByRole('link', { name: 'Open School fees' })).toHaveAttribute('href', '/target-savings#target-plan-school')
  await expect(panel).not.toContainText('closed')
  await page.getByRole('button', { name: 'Hide wallet balance', exact: true }).click()
  await expect(panel).not.toContainText('22,500.00')
  await expect(panel).not.toContainText('10,000.00')
})
