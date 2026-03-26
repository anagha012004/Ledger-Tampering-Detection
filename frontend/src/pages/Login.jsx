import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const [tab,      setTab]      = useState('login')   // 'login' | 'signup'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const reset = t => { setTab(t); setError(''); setUsername(''); setPassword(''); setConfirm('') }

  const handleLogin = async e => {
    e.preventDefault()
    if (!username || !password) { setError('Enter username and password.'); return }
    setLoading(true); setError('')
    try {
      const { data } = await login(username, password)
      signIn(data.token, data.username, data.role)
      navigate('/dashboard')
    } catch {
      setError('Invalid credentials or server unreachable.')
    } finally { setLoading(false) }
  }

  const handleSignup = async e => {
    e.preventDefault()
    if (!username.trim())        { setError('Username is required.'); return }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return }
    if (!password)               { setError('Password is required.'); return }
    if (password.length < 6)     { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)    { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const { data } = await signup(username.trim(), password)
      signIn(data.token, data.username, data.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Username already exists or server unreachable.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.icon}>🔒</div>
        <h2>Ledger Security System</h2>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'login'  ? styles.tabActive : ''}`}
            onClick={() => reset('login')}
          >Sign In</button>
          <button
            className={`${styles.tab} ${tab === 'signup' ? styles.tabActive : ''}`}
            onClick={() => reset('signup')}
          >Create Account</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <input className={styles.input} placeholder="Username" value={username}
              onChange={e => setUsername(e.target.value)} autoComplete="username" />
            <input className={styles.input} type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            <button className={styles.btn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Signup form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup}>
            <input className={styles.input} placeholder="Username (min 3 chars)" value={username}
              onChange={e => setUsername(e.target.value)} autoComplete="username" />
            <input className={styles.input} type="password" placeholder="Password (min 6 chars)" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            <input className={styles.input} type="password" placeholder="Confirm Password" value={confirm}
              onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
            <div className={styles.roleNote}>
              🔖 New accounts are created with <strong>USER</strong> role. An admin can upgrade your role later.
            </div>
            <button className={styles.btn} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}


      </div>
    </div>
  )
}
