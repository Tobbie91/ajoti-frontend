import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader } from '@mantine/core'
import { getUserProfile, logout } from '@/utils/api'
import { storeCachedCustomerUser } from '@/utils/customer-storage'
import { DEV_AUTH_BYPASS_USER, isDevAuthBypass } from '@/utils/dev-auth-bypass'

type GuardState = 'loading' | 'ok' | 'no-auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [state, setState] = useState<GuardState>('loading')

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
        setState('ok')
      })
      .catch(() => setState('no-auth'))
  }, [])

  useEffect(() => {
    if (state !== 'ok' || isDevAuthBypass) return

    let timeout: number
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
    const resetTimeout = () => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(finishSession, 3 * 60 * 1000)
    }
    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'pointermove',
      'keydown',
      'touchstart',
      'wheel',
      'scroll',
    ]

    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetTimeout, { passive: true }))
    resetTimeout()
    return () => {
      window.clearTimeout(timeout)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimeout))
    }
  }, [state])

  if (state === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]"><Loader color="#0b6b55" size="md" /></div>
  }
  if (state === 'no-auth') return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
