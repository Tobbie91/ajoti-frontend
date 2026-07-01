import { useEffect } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { type Permission, getAdminRoleFromStorage, hasPermission } from '@/utils/permissions'

export function RequireAuth() {
  const token = localStorage.getItem('superadmin_access_token')
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequirePermission({ permission }: { permission: Permission }) {
  const adminRole = getAdminRoleFromStorage()
  const allowed = hasPermission(adminRole, permission)
  const navigate = useNavigate()

  useEffect(() => {
    if (!allowed) {
      notifications.show({
        message: "You don't have permission to access that page",
        color: 'red',
        autoClose: 4000,
      })
      navigate('/', { replace: true })
    }
  }, [allowed, navigate])

  if (!allowed) return null
  return <Outlet />
}
