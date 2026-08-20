export type AppRole = 'MEMBER' | 'CIRCLE_ADMIN' | 'STAFF' | 'SYSTEM' | string

export function getTokenRole(token?: string | null): AppRole | undefined {
  if (!token) return undefined
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { role?: AppRole }
    return payload.role
  } catch {
    return undefined
  }
}

export function getCurrentRole(): AppRole | undefined {
  return getTokenRole(localStorage.getItem('access_token'))
}

export function isCircleAdmin(role = getCurrentRole()): boolean {
  return role === 'CIRCLE_ADMIN'
}

export function defaultAuthenticatedPath(role = getCurrentRole()): string {
  return role === 'CIRCLE_ADMIN' ? '/dashboard' : '/home'
}
