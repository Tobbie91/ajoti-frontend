export type AppRole = 'MEMBER' | 'CIRCLE_ADMIN' | 'STAFF' | 'SYSTEM' | string

export function getCurrentRole(): AppRole | undefined {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { role?: AppRole }
    return user.role
  } catch {
    return undefined
  }
}

export function isCircleAdmin(role = getCurrentRole()): boolean {
  return role === 'CIRCLE_ADMIN'
}

export function defaultAuthenticatedPath(role = getCurrentRole()): string {
  return role === 'CIRCLE_ADMIN' ? '/dashboard' : '/home'
}
