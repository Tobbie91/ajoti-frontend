import type { Page } from '@playwright/test'

export const circle = {
  id: 'family', name: 'Family Ajo', description: '', status: 'ACTIVE', visibility: 'PUBLIC',
  contributionAmount: '5000000', frequency: 'MONTHLY', durationCycles: 10, currentCycle: 2,
  maxSlots: 10, filledSlots: 6, payoutLogic: 'SEQUENTIAL',
  admin: { firstName: 'Circle', lastName: 'Admin' },
  userMembershipStatus: 'ACTIVE', userPayoutPosition: 3,
  members: [{ userId: 'member', name: 'Test Member', status: 'ACTIVE', position: 3 }],
}

export async function mockRoscaReads(page: Page, state: { duration: number; buckets?: unknown; history?: unknown[] }) {
  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({
    id: 'member', firstName: 'Test', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE',
  })))
  await page.route('**/*', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    const current = { ...circle, durationCycles: state.duration }
    if (path === '/api/users/me') return route.fulfill({ json: { id: 'member', firstName: 'Test', lastName: 'Member', role: 'MEMBER', status: 'ACTIVE' } })
    if (path === '/api/rosca') return route.fulfill({ json: { data: [{ ...current, id: 'discoverable', name: 'December Savings' }] } })
    if (path === '/api/rosca/my-participations') return route.fulfill({ json: { data: [current] } })
    if (path === '/api/rosca/family') return route.fulfill({ json: { data: current } })
    if (path === '/api/rosca/my-join-requests') return route.fulfill({ json: { data: [{ membershipId: 'membership-family', circleId: 'family', status: 'PENDING', collateralReserved: '500000', circle: current }] } })
    if (path === '/api/rosca/family/schedules') return route.fulfill({ json: { data: Array.from({ length: state.duration }, (_, i) => ({
      id: `s-${i}`, cycleNumber: i + 1, recipientId: 'member', status: i === 0 ? 'COMPLETED' : 'UPCOMING',
      contributionDeadline: '2026-11-01T12:00:00Z', payoutDate: '2026-11-02T12:00:00Z',
    })) } })
    if (path === '/api/rosca/circle-rules') return route.fulfill({ json: { data: { collateralRatioPercent: 10, postStartExitPenaltyPercent: 25 } } })
    if (path === '/api/wallet/buckets') return route.fulfill({ json: state.buckets ?? { data: [], totalRoscaReservedKobo: '0' } })
    if (path === '/api/wallet/transactions') return route.fulfill({ json: { data: state.history ?? [] } })
    if (path === '/api/wallet/balance') return route.fulfill({ json: { data: { total: '10000000', reserved: '2250000', available: '7750000', currency: 'NGN' } } })
    if (path.endsWith('/contributions') || path.endsWith('/reviews/mine')) return route.fulfill({ json: { data: [] } })
    return route.fulfill({ json: { data: [], trustScore: 50, finalScore: 50 } })
  })
}
