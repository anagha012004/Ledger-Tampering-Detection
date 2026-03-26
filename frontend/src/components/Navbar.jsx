import { useState, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlertSocket } from '../hooks/useAlertSocket'
import styles from './Navbar.module.css'

const ROLE_COLOR = { ADMIN: '#dc3545', AUDITOR: '#fd7e14', USER: '#28a745', VIEWER: '#6c757d' }

export default function Navbar() {
  const { auth, signOut } = useAuth()
  const navigate = useNavigate()
  const [wsConnected, setWsConnected] = useState(false)

  // Reuse the socket here just to track connection state for the indicator
  // (NotificationToast has its own independent connection for toasts)
  const onMsg = useCallback(() => {
    setWsConnected(true)
  }, [])

  useAlertSocket(onMsg)

  const handleLogout = () => { signOut(); navigate('/') }

  const links = [
    { to: '/dashboard',  label: '🖥 Nodes',     roles: ['VIEWER','USER','AUDITOR','ADMIN'] },
    { to: '/audit',      label: '📋 Audit Log',  roles: ['VIEWER','USER','AUDITOR','ADMIN'] },
    { to: '/alerts',     label: '🚨 Alerts',     roles: ['VIEWER','USER','AUDITOR','ADMIN'] },
    { to: '/integrity',  label: '🔐 Integrity',  roles: ['VIEWER','USER','AUDITOR','ADMIN'] },
    { to: '/snapshots',  label: '📸 Snapshots',  roles: ['AUDITOR','ADMIN'] },
    { to: '/forensics',  label: '🔬 Forensics',  roles: ['AUDITOR','ADMIN'] },
    { to: '/users',      label: '👥 Users',      roles: ['ADMIN'] },
  ]

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>🔒 Ledger Security</span>
      <div className={styles.links}>
        {links
          .filter(l => l.roles.includes(auth?.role))
          .map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
              {l.label}
            </NavLink>
          ))
        }
      </div>
      <div className={styles.right}>
        <span className={styles.wsIndicator} title={wsConnected ? 'Live alerts connected' : 'Connecting to live alerts…'}>
          <span className={`${styles.wsDot} ${wsConnected ? styles.wsDotOn : styles.wsDotOff}`} />
          {wsConnected ? 'Live' : 'Connecting…'}
        </span>
        <span className={styles.user}>{auth?.user}</span>
        <span className={styles.badge} style={{ background: ROLE_COLOR[auth?.role] || '#6c757d' }}>{auth?.role}</span>
        <button className={styles.logout} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
