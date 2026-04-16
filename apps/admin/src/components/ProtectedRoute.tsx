import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader } from '@mantine/core'
import { getKycStatus } from '@/utils/api'

type GuardState = 'loading' | 'ok' | 'no-auth' | 'no-kyc'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [state, setState] = useState<GuardState>('loading')

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token')
    if (!token) {
      setState('no-auth')
      return
    }

    getKycStatus()
      .then((kyc) => {
        if (kyc.kycLevel >= 1) setState('ok')
        else setState('no-kyc')
      })
      .catch(() => {
        // getKycStatus 401 means token is invalid/expired — send to login
        // Any other error (network, etc.) treat as no-kyc so they can complete it
        const t = localStorage.getItem('admin_access_token')
        setState(t ? 'no-kyc' : 'no-auth')
      })
  }, [])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader color="#0b6b55" size="md" />
      </div>
    )
  }

  if (state === 'no-auth') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (state === 'no-kyc') {
    return <Navigate to="/kyc" replace state={{ from: location }} />
  }

  return <>{children}</>
}
