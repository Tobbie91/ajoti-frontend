import type { BrowserContext, Route } from '@playwright/test'

export async function mockCustomer(context: BrowserContext, handle?: (route: Route, path: string) => Promise<boolean>) {
  await context.addInitScript(() => localStorage.setItem('user', JSON.stringify({
    id: 'review-member', firstName: 'Review', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE',
  })))
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (handle && await handle(route, path)) return
    const responses: Record<string, unknown> = {
      '/api/users/me': { id: 'review-member', firstName: 'Review', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE' },
      '/api/kyc/status': { kycLevel: 1, status: 'APPROVED' },
      '/api/users/me/pin/status': { hasPin: true },
      '/api/wallet': { data: { id: 'review-wallet', balance: { total: '500000', available: '500000', reserved: '0' }, pendingWithdrawal: null } },
      '/api/users/me/bank-accounts': { data: [{ id: 'bank-1', bankName: 'Test Bank', bankCode: '044', accountName: 'Review Member', accountNumber: '1234567890', isDefault: true }] },
    }
    await route.fulfill({ json: responses[path] ?? { data: [], unreadCount: 0 } })
  })
}
