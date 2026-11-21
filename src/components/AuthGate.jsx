import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

// Theme: shared PeoplePulse variables, with the official hex values as fallbacks.
const inputClass =
  'w-full rounded-xl border border-[var(--border,#E7E9F0)] bg-white px-3 py-2.5 text-sm text-[var(--text-main,#303447)] outline-none focus:border-[var(--primary,#A29BEA)] focus:ring-[3px] focus:ring-[var(--primary-light,#F0EEFC)]'

// Wraps a page: shows a login form until the user is signed in.
export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(isSupabaseConfigured)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession),
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setSubmitting(false)
    if (signInError) setError('Sign-in failed. Check your email and password.')
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-[20px] border border-[var(--warning,#E8B66F)] bg-white p-6 text-sm text-[var(--text-main,#303447)]">
        Supabase is not configured. Add VITE_SUPABASE_URL and
        VITE_SUPABASE_ANON_KEY to your .env file, then restart the dev server.
      </div>
    )
  }

  if (checking) {
    return (
      <p className="p-6 text-sm text-[var(--text-secondary,#777D91)]">Checking sign-in…</p>
    )
  }

  if (session) return children

  return (
    <div className="mx-auto mt-10 w-full max-w-sm rounded-[20px] border border-[var(--border,#E7E9F0)] bg-white p-6 shadow-[0_2px_8px_rgba(40,45,65,0.045)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-light,#F0EEFC)] text-[var(--primary-hover,#8F87DC)]">
          <Lock size={18} />
        </div>
        <h2 className="font-semibold text-[var(--text-main,#303447)]">HR sign in</h2>
      </div>
      <p className="mb-4 text-xs text-[var(--text-secondary,#777D91)]">
        Exit records contain confidential employee data. Sign in to continue.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputClass}
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={inputClass}
        />
        {error && <p className="text-xs text-[var(--text-main,#303447)]">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[var(--primary,#A29BEA)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover,#8F87DC)] disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}