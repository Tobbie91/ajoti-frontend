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

type StaffRole = 'SUPERADMIN' | 'MANAGER' | 'SUPPORT' | 'COMPLIANCE' | 'OPERATIONS'

const ALL_PERMISSIONS: Permission[] = [
  'READ_PLATFORM_DATA', 'MANAGE_TICKETS', 'SUSPEND_ACCOUNT',
  'MANAGE_KYC', 'VIEW_AUDIT_LOGS',
  'MANAGE_COLLATERAL', 'MANAGE_CIRCLES', 'REVERSE_TRANSACTIONS',
  'VIEW_LEDGER', 'EXPORT_LEDGER',
  'MANAGE_ADMIN_ACCOUNTS', 'DEACTIVATE_USER', 'SYSTEM_CONFIG',
]

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  SUPPORT: ['READ_PLATFORM_DATA', 'MANAGE_TICKETS'],
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
  MANAGER: [
    'READ_PLATFORM_DATA', 'MANAGE_TICKETS', 'SUSPEND_ACCOUNT',
    'MANAGE_KYC', 'VIEW_AUDIT_LOGS', 'MANAGE_ADMIN_ACCOUNTS',
    'MANAGE_COLLATERAL', 'MANAGE_CIRCLES', 'REVERSE_TRANSACTIONS',
    'VIEW_LEDGER', 'EXPORT_LEDGER',
  ],
  SUPERADMIN: ALL_PERMISSIONS,
}

export function getPermissions(staffRole: string | null | undefined): Permission[] {
  if (!staffRole) return []
  return ROLE_PERMISSIONS[staffRole as StaffRole] ?? []
}

export function hasPermission(staffRole: string | null | undefined, permission: Permission): boolean {
  return getPermissions(staffRole).includes(permission)
}

export function getStaffRoleFromStorage(): string | null {
  try {
    const stored = localStorage.getItem('superadmin_user')
    if (!stored) return null
    return (JSON.parse(stored) as { staffRole?: string | null }).staffRole ?? null
  } catch {
    return null
  }
}
