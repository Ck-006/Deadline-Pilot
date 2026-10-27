import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Clock3, ShieldCheck, Sparkles } from 'lucide-react'
import { api } from '../api.js'

export default function AuthPage({ mode = 'login', onAuthenticated }) {
  const register = mode === 'register'
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: values })
      onAuthenticated(result.user)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link className="brand brand-light" to="/login"><span className="brand-mark">dp</span><span>DeadlinePilot</span></Link>
        <div className="story-copy">
          <div className="eyebrow"><Sparkles size={14} /> A little more headspace</div>
          <h1>Make room for<br /><em>your best work.</em></h1>
          <p>One calm place for every course, assignment, and deadline. Know what matters next, before the rush.</p>
          <div className="story-points">
            <span><Check size={16} /> Your coursework, in one view</span>
            <span><Clock3 size={16} /> Smart focus for what's due next</span>
            <span><ShieldCheck size={16} /> Private to your account</span>
          </div>
        </div>
        <div className="story-foot">Built for the weeks that fill up fast <span>✳</span></div>
      </section>
      <section className="auth-panel">
        <Link className="brand auth-mobile-brand" to="/login"><span className="brand-mark">dp</span><span>DeadlinePilot</span></Link>
        <div className="auth-card">
          <div className="auth-heading"><span className="eyebrow">YOUR STUDY SPACE</span><h2>{register ? 'Start with a clear slate.' : 'Welcome back.'}</h2><p>{register ? 'Create your account and get your deadlines in order.' : 'Sign in to see what deserves your attention today.'}</p></div>
          {error && <div className="alert error" role="alert">{error}</div>}
          <form onSubmit={submit} className="auth-form">
            {register && <label>Your name<input autoComplete="name" required minLength={2} maxLength={80} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="Alex Morgan" /></label>}
            <label>Email address<input type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@college.edu" /></label>
            <label>Password<input type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : 1} maxLength={128} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder={register ? 'At least 8 characters' : 'Your password'} /></label>
            <button className="button button-dark full" disabled={busy}>{busy ? 'One moment…' : register ? 'Create my account' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">{register ? 'Already have an account?' : 'New to DeadlinePilot?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
          <p className="privacy-note"><ShieldCheck size={14} /> Your assignments are visible only to you.</p>
        </div>
        <span className="auth-bottom">A clearer week starts here.</span>
      </section>
    </main>
  )
}
