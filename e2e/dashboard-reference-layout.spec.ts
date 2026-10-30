import { expect, test } from '@playwright/test'

for (const screen of ['dashboard', 'home']) {
test(`${screen} uses personal receipts while preserving privacy`, async ({ page }) => {
  let failHistory = false
  const circle = (id: string) => ({ id, name: id === 'joined' ? 'My joined circle' : 'Managed only', status: 'ACTIVE', currentCycle: 2, durationCycles: 5, filledSlots: 5, maxSlots: 5, contributionAmount: '2500000', admin: { firstName: 'Ajo', lastName: 'Admin' } })
  const goal = (id: string, joinedAt: string, saved: string) => ({ id, name: id, status: 'ACTIVE', type: 'GROUP', totalSavedKobo: '99999999', groupTargetAmountKobo: '999999999', startDate: joinedAt, maturityDate: '2030-12-15', myMembership: { joinedAt, savedAmountKobo: saved, targetAmountKobo: '60000000' } })
  const contributionRequests: string[] = []
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/users/me') return route.fulfill({ json: { data: { id: 'admin', firstName: 'Ajo', role: screen === 'home' ? 'MEMBER' : 'CIRCLE_ADMIN', status: 'ACTIVE' } } })
    if (path === '/api/rosca/my-participations') return route.fulfill({ json: { data: [circle('joined'), circle('joined')] } })
    if (path === '/api/admin/rosca/my-circles') return route.fulfill({ json: { data: [circle('managed')] } })
    if (path.endsWith('/contributions')) {
      contributionRequests.push(path)
      return failHistory ? route.fulfill({ status: 503, json: { message: 'Unavailable' } }) : route.fulfill({ json: { data: [{ id: 'receipt', cycleNumber: 1, amount: '2500000', penaltyAmount: '50000', paidAt: '2026-10-20T10:00:00Z' }] } })
    }
    if (path.endsWith('/schedules')) return route.fulfill({ json: { data: [{ cycleNumber: 2, contributionDeadline: '2030-11-01T10:00:00Z', status: 'UPCOMING' }] } })
    if (path === '/api/target-savings/mine') return route.fulfill({ json: { data: [goal('Older goal', '2026-01-01', '100000'), goal('Latest goal', '2026-10-20', '43200000')] } })
    if (path === '/api/wallet/transactions') return route.fulfill({ json: { data: [{ id: 'tx', entryType: 'DEBIT', movementType: 'CONTRIBUTION', description: 'Ajo contribution', amount: '2500000', createdAt: '2026-10-20T10:00:00Z' }] } })
    if (path === '/api/wallet/balance') return route.fulfill({ json: { data: { total: '24850000', available: '21000000', reserved: '3850000' } } })
    if (path === '/api/admin/rosca/dashboard') return route.fulfill({ json: { data: { totalGroups: 1, memberGroupCount: 1, pendingJoinRequests: { total: 0 } } } })
    return route.fulfill({ json: { data: [] } })
  })
  await page.goto(`/${screen}`)
  await expect(page.getByRole('button', { name: 'Create a circle' })).toHaveCount(0)
  const order = await page.getByRole('heading', { name: 'Everything grows together.' }).evaluate(el => {
    const hero = el.closest('section')!
    const siblings = Array.from(hero.parentElement!.children).filter(node => node.tagName !== 'STYLE')
    return siblings.slice(siblings.indexOf(hero) + 1, siblings.indexOf(hero) + 4).map(node => node.getAttribute('aria-label'))
  })
  expect(order).toEqual(['Wallet balances', screen === 'home' ? 'Next deadline' : 'Next contribution', 'Quick actions'])
  if (screen === 'dashboard') {
    await expect(page.getByRole('button', { name: 'Groups I manage', exact: true })).toHaveCount(1)
    await expect(page.getByText('Create New Group', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Join Groups', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Send Group Notification', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Quick actions' }).getByRole('button', { name: 'Explore', exact: true })).toHaveCount(1)
  }
  const orbit = page.locator('.growth-orbit-inner')
  await expect(orbit).toContainText('₦25,000.00')
  expect([...new Set(contributionRequests)]).toEqual(['/api/rosca/joined/contributions'])
  const next = page.getByRole('region', { name: screen === 'home' ? 'Next deadline' : 'Next contribution' })
  await expect(next).toContainText('My joined circle')
  await expect(next).not.toContainText('Managed only')
  if (screen === 'dashboard') {
  const savings = page.getByRole('region', { name: 'Latest savings goal' })
  await expect(savings).toContainText('Latest goal')
  await expect(savings).toContainText('₦432,000.00 of ₦600,000.00')
  await expect(savings).toContainText('72%')
  await expect(savings).toContainText('₦168,000.00')
  await expect(page.getByRole('region', { name: 'Recent transactions' })).toContainText('Ajo contribution')
  }
  await page.getByRole('button', { name: 'Hide wallet balance and transactions' }).click()
  await expect(orbit).not.toContainText('₦25,000.00')
  if (screen === 'dashboard') {
    await expect(page.getByRole('region', { name: 'Latest savings goal' })).not.toContainText('₦432,000.00')
    await expect(page.getByRole('region', { name: 'Recent transactions' })).toContainText('Transaction history hidden')
  }
  await page.getByRole('button', { name: 'Show wallet balance and transactions' }).click()
  failHistory = true
  await page.reload()
  await expect(orbit).toContainText('Unavailable')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

}
