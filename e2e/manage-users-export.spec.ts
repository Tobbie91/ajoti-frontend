import { expect, test } from '@playwright/test'

test('user downloads carry filters across pages and produce CSV and branded PDF', async ({ page }) => {
  const requests: URL[] = []
  const user = (id: number) => ({ id: String(id), firstName: id === 1 ? '=1+1' : 'Second', lastName: 'Member', email: `member${id}@example.test`, phone: '+2348000000000', role: 'MEMBER', status: 'ACTIVE', createdAt: '2026-10-01T12:00:00Z', kyc: { status: 'APPROVED' }, _count: { roscaMemberships: 2 } })
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (url.pathname === '/api/users/me') return route.fulfill({ json: { data: { id: 'staff', role: 'STAFF', staffRole: 'SUPERADMIN', firstName: 'Staff' } } })
    if (url.pathname === '/api/superadmin/users') {
      requests.push(url)
      const current = Number(url.searchParams.get('page') ?? 1)
      return route.fulfill({ json: { data: [user(current)], meta: { page: current, total: 2, totalPages: 2, limit: 1 } } })
    }
    return route.fulfill({ json: { data: [] } })
  })
  await page.goto('/manage-users')
  await page.getByPlaceholder('Search by name, email or phone').fill('Member')
  await page.getByLabel('Registered from').fill('2026-10-01')
  await expect(page.getByRole('button', { name: 'Download CSV', exact: true })).toBeEnabled()
  const csvPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSV', exact: true }).click()
  const csv = await csvPromise
  const stream = await csv.createReadStream()
  const chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  const content = Buffer.concat(chunks).toString('utf8')
  expect(content).toContain("'=1+1 Member")
  expect(content).toContain('Second Member')
  expect(content).toContain("'+2348000000000")
  const exports = requests.filter(url => url.searchParams.get('limit') === '100')
  expect(exports).toHaveLength(2)
  for (const url of exports) {
    expect(url.searchParams.get('search')).toBe('Member')
    expect(url.searchParams.get('registeredFrom')).toBe('2026-10-01')
  }
  const pdfPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click()
  const pdf = await pdfPromise
  expect(pdf.suggestedFilename()).toMatch(/^ajoti-users-.*\.pdf$/)
  const pdfStream = await pdf.createReadStream()
  const pdfChunks = []
  for await (const chunk of pdfStream!) pdfChunks.push(chunk)
  const bytes = Buffer.concat(pdfChunks).toString('latin1')
  expect(bytes).toContain('%PDF')
  expect(bytes).toContain('Users report')
  expect(bytes).toContain('/Subtype /Image')
  expect(bytes).toContain('Registered from: 2026-10-01')
  expect(bytes).toContain('Page 1 of 1')
})
