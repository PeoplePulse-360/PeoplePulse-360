import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [adminStatus, setAdminStatus] = useState({ userId: null, isAdmin: false, loading: isSupabaseConfigured })

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      setAdminStatus({ userId: null, isAdmin: false, loading: false })
      return undefined
    }

    let active = true
    const userId = session.user.id
    setAdminStatus({ userId, isAdmin: false, loading: true })

    supabase
      .from('hr_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        setAdminStatus({ userId, isAdmin: !error && Boolean(data), loading: false })
      })

    return () => { active = false }
  }, [session])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    roleLoading: Boolean(session?.user?.id) && (adminStatus.loading || adminStatus.userId !== session.user.id),
    isHrAdmin: Boolean(session?.user?.id) && adminStatus.userId === session.user.id && adminStatus.isAdmin,
    configured: isSupabaseConfigured,
    async signIn(email, password) {
      return supabase.auth.signInWithPassword({ email, password })
    },
    async signUp(email, password) {
      return supabase.auth.signUp({ email, password })
    },
    async signOut() {
      return supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

