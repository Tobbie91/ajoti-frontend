import { expect, test } from '@playwright/test'
import { mockCustomer } from './review-fix-fixtures'

test('customer navigation resets scroll and recent PDF has Ajoti branding', async ({ page, context, isMobile }) => {
  await mockCustomer(context, async (route, path) => {
    if (path === '/api/wallet/transaction-exports/active') { await route.fulfill({ json: { data: null } }); return true }
    if (path === '/api/wallet/balance') { await route.fulfill({ json: { data: { total: '999999999999999999', available: '999999999999999999', reserved: '0' } } }); return true }
    if (path === '/api/wallet/transactions') {
      await route.fulfill({ json: { data: [{ id: 'transaction-1', entryType: 'CREDIT', movementType: 'FUNDING', description: 'Wallet funding', amount: '999999999999999999', balanceBefore: '0', balanceAfter: '999999999999999999', createdAt: '2026-10-18T10:00:00Z' }] } }); return true
    }
    return false
  })
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: 'Everything grows together.' })).toBeVisible()
  await expect(page.getByText('Create your own circles, invite members, and manage contributions.', { exact: true })).toHaveCount(0)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
  if (isMobile) await page.locator('.mantine-Burger-root').click()
  await page.getByRole('link', { name: 'Transactions', exact: true }).click()
  await expect(page).toHaveURL(/\/transactions$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await expect(page.getByRole('img', { name: 'Ajoti logo' })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download recent PDF (up to 50)', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^ajoti-recent-transactions-.*\.pdf$/)
  const stream = await download.createReadStream(), chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  const pdf = Buffer.concat(chunks).toString('latin1')
  expect(pdf).toContain('%PDF')
  expect(pdf).toContain('/Subtype /Image')
  expect(pdf).toContain('Recent transaction history')
  expect(pdf).toContain('9,999,999,999,999,999.99')
  expect(pdf).toContain('Page 1 of 1')
  await expect(page.getByRole('button', { name: 'Email my CSV', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Hide wallet balance and transactions' }).click()
  await expect(page.getByRole('button', { name: 'Download recent PDF (up to 50)', exact: true })).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'Ajoti logo' })).toHaveCount(0)
})
