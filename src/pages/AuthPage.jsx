import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'

export default function AuthPage({ mode = 'login' }) {
  const registering = mode === 'register'
  const { configured, user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const { error, data } = registering ? await signUp(email, password) : await signIn(email, password)
    setBusy(false)
    if (error) return setMessage(error.message)
    if (registering && !data.session) return setMessage('Account created. Check your email to confirm, then sign in.')
    navigate('/', { replace: true })
  }

  return <div className="auth-screen"><div className="auth-card"><div className="brand auth-brand"><span className="brand-mark">P</span><span>peoplepulse<span className="brand-light">360</span></span></div><p className="eyebrow">PEOPLE OPERATIONS, IN ONE PLACE</p><h1>{registering ? 'Create your account' : 'Welcome back'}</h1><p className="muted">{registering ? 'Use your approved HR email. HR administrator access is granted separately.' : 'Sign in with your HR administrator account.'}</p>
    {!configured && <div className="notice">Add your Supabase project URL and public anon key in <code>frontend/.env</code> to enable sign in.</div>}
    <form onSubmit={handleSubmit} className="auth-form"><label>Email address<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label><label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} required minLength="6" autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /><button type="button" className="password-visibility" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{message && <p className="form-message" role="status">{message}</p>}<button className="primary-button full-width" disabled={!configured || busy}>{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button></form>
    <p className="auth-switch">{registering ? 'Already have an account?' : 'New to PeoplePulse?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
  </div><p className="auth-caption">PEOPLEPULSE 360 <span>·</span> WORKFORCE INTELLIGENCE</p></div>
}

