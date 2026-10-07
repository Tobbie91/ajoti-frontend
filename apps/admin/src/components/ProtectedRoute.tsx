import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader } from '@mantine/core'
import { getUserProfile, logout } from '@/utils/api'
import { storeCachedCustomerUser } from '@/utils/customer-storage'
import { DEV_AUTH_BYPASS_USER, isDevAuthBypass } from '@/utils/dev-auth-bypass'
import { watchCustomerInactivity } from '@/utils/customer-inactivity'

type GuardState = 'loading' | 'ok' | 'no-auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [state, setState] = useState<GuardState>('loading')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    if (isDevAuthBypass) {
      storeCachedCustomerUser(DEV_AUTH_BYPASS_USER)
      setState('ok')
      return
    }

    getUserProfile()
      .then((user) => {
        if (!user.role || !['MEMBER', 'CIRCLE_ADMIN'].includes(user.role)) {
          setState('no-auth')
          return
        }
        storeCachedCustomerUser(user)
        setUserId(user.id)
        setState('ok')
      })
      .catch(() => setState('no-auth'))
  }, [])

  useEffect(() => {
    if (state !== 'ok' || !userId || isDevAuthBypass) return

    let signingOut = false
    const finishSession = () => {
      if (signingOut) return
      signingOut = true
      logout()
        .catch(() => undefined)
        .finally(() => {
          localStorage.removeItem('user')
          window.location.replace('/login')
        })
    }
    return watchCustomerInactivity(userId, finishSession)
  }, [state, userId])

  if (state === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]"><Loader color="#0b6b55" size="md" /></div>
  }
  if (state === 'no-auth') return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
