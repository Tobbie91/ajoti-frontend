import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentRole } from '@/utils/auth-role'

export function CircleAdminRoute({ children }: { children: ReactNode }) {
  const role = getCurrentRole()
  if (role !== 'CIRCLE_ADMIN') return <Navigate to="/my-wallet" replace />
  return <>{children}</>
}
