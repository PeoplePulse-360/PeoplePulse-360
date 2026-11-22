import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'

export default function ProtectedRoute() {
  const { configured, loading, user } = useAuth()

  if (!configured) return <Navigate to="/login" replace />
  if (loading) return <div className="page-loading">Checking your session…</div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
