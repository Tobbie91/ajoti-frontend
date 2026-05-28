import { Navigate, Outlet } from 'react-router-dom'

export function RequireAuth() {
  const token = localStorage.getItem('superadmin_access_token')
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}
