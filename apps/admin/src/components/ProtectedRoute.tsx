import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader } from '@mantine/core'
import { getUserProfile } from '@/utils/api'
import { storeCachedCustomerUser } from '@/utils/customer-storage'

type GuardState = 'loading' | 'ok' | 'no-auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [state, setState] = useState<GuardState>('loading')

  useEffect(() => {
    getUserProfile()
      .then((user) => {
        if (!user.role || !['MEMBER', 'CIRCLE_ADMIN'].includes(user.role)) {
          setState('no-auth')
          return
        }
        storeCachedCustomerUser(user)
        setState('ok')
      })
      .catch(() => setState('no-auth'))
  }, [])

  if (state === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]"><Loader color="#0b6b55" size="md" /></div>
  }
  if (state === 'no-auth') return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
