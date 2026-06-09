import { Navigate, Outlet } from 'react-router-dom'
import { type Permission, getAdminRoleFromStorage, hasPermission } from '@/utils/permissions'

export function RequireAuth() {
  const token = localStorage.getItem('superadmin_access_token')
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequirePermission({ permission }: { permission: Permission }) {
  const adminRole = getAdminRoleFromStorage()
  if (!hasPermission(adminRole, permission)) return <Navigate to="/" replace />
  return <Outlet />
}
