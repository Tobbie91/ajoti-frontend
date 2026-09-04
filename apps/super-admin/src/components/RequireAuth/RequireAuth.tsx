import { useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Loader } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { type Permission, getStaffRoleFromStorage, hasPermission } from '@/utils/permissions'
import { getCurrentUser } from '@/utils/api'
import { storeCachedStaffUser } from '@/utils/staff-storage'

export function RequireAuth() {
  const [state, setState] = useState<'loading' | 'ok' | 'no-auth'>('loading')

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user.role !== 'STAFF') {
          setState('no-auth')
          return
        }
        storeCachedStaffUser(user)
        setState('ok')
      })
      .catch(() => setState('no-auth'))
  }, [])

  if (state === 'loading') return <div className="flex min-h-screen items-center justify-center"><Loader /></div>
  if (state === 'no-auth') return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequirePermission({ permission }: { permission: Permission }) {
  const staffRole = getStaffRoleFromStorage()
  const allowed = hasPermission(staffRole, permission)
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
