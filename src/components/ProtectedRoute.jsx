import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'

export default function ProtectedRoute() {
  const { configured, loading, roleLoading, user, isHrAdmin, signOut } = useAuth()

  if (!configured) return <Navigate to="/login" replace />
  if (loading || (user && roleLoading)) return <div className="page-loading">Checking your access…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!isHrAdmin) {
    return <div className="page-loading"><h1>HR administrator access required</h1><p>This account is not approved to view PeoplePulse HR records.</p><button className="primary-button" onClick={signOut}>Sign out</button></div>
  }
  return <Outlet />
}

