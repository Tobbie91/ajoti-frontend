import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader } from '@mantine/core'
import { getTokenRole } from '@/utils/auth-role'

type GuardState = 'loading' | 'ok' | 'no-auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [state, setState] = useState<GuardState>('loading')

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token')
    const role = getTokenRole(token)
    if (!token || !role || !['MEMBER', 'CIRCLE_ADMIN'].includes(role)) {
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
      setState('no-auth')
      return
    }
    setState('ok')
  }, [])

  if (state === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]"><Loader color="#0b6b55" size="md" /></div>
  }
  if (state === 'no-auth') return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
