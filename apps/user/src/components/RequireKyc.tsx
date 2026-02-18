import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

interface RequireKycProps {
  children: ReactNode
}

export function RequireKyc({ children }: RequireKycProps) {
  const kycCompleted = localStorage.getItem('kyc_completed') === 'true'

  if (!kycCompleted) {
    return <Navigate to="/kyc" replace />
  }

  return <>{children}</>
}
