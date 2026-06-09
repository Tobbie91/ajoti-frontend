export type Permission =
  | 'READ_PLATFORM_DATA'
  | 'MANAGE_TICKETS'
  | 'SUSPEND_ACCOUNT'
  | 'MANAGE_KYC'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_COLLATERAL'
  | 'MANAGE_CIRCLES'
  | 'REVERSE_TRANSACTIONS'
  | 'VIEW_LEDGER'
  | 'EXPORT_LEDGER'
  | 'MANAGE_ADMIN_ACCOUNTS'
  | 'DEACTIVATE_USER'
  | 'SYSTEM_CONFIG'

type AdminRole = 'SUPERADMIN' | 'SUPPORT' | 'COMPLIANCE' | 'OPERATIONS'

const ALL_PERMISSIONS: Permission[] = [
  'READ_PLATFORM_DATA', 'MANAGE_TICKETS', 'SUSPEND_ACCOUNT',
  'MANAGE_KYC', 'VIEW_AUDIT_LOGS',
  'MANAGE_COLLATERAL', 'MANAGE_CIRCLES', 'REVERSE_TRANSACTIONS',
  'VIEW_LEDGER', 'EXPORT_LEDGER',
  'MANAGE_ADMIN_ACCOUNTS', 'DEACTIVATE_USER', 'SYSTEM_CONFIG',
]

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPPORT: ['READ_PLATFORM_DATA', 'MANAGE_TICKETS', 'SUSPEND_ACCOUNT'],
  COMPLIANCE: [
    'READ_PLATFORM_DATA', 'MANAGE_TICKETS', 'SUSPEND_ACCOUNT',
    'MANAGE_KYC', 'VIEW_AUDIT_LOGS',
  ],
  OPERATIONS: [
    'READ_PLATFORM_DATA', 'MANAGE_TICKETS', 'SUSPEND_ACCOUNT',
    'MANAGE_KYC', 'VIEW_AUDIT_LOGS',
    'MANAGE_COLLATERAL', 'MANAGE_CIRCLES', 'REVERSE_TRANSACTIONS',
    'VIEW_LEDGER', 'EXPORT_LEDGER',
  ],
  SUPERADMIN: ALL_PERMISSIONS,
}

export function getPermissions(adminRole: string | null | undefined): Permission[] {
  if (!adminRole) return ALL_PERMISSIONS
  return ROLE_PERMISSIONS[adminRole as AdminRole] ?? ALL_PERMISSIONS
}

export function hasPermission(adminRole: string | null | undefined, permission: Permission): boolean {
  return getPermissions(adminRole).includes(permission)
}

export function getAdminRoleFromStorage(): string | null {
  try {
    const stored = localStorage.getItem('superadmin_user')
    if (!stored) return null
    return (JSON.parse(stored) as { adminRole?: string | null }).adminRole ?? null
  } catch {
    return null
  }
}
