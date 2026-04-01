import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

const ROLE_COLOR = { ADMIN: '#dc3545', AUDITOR: '#fd7e14', USER: '#28a745', VIEWER: '#6c757d' }

export default function Navbar() {
  const { auth, signOut } = useAuth()
  const navigate = useNavigate()

  const links = [
    { to: '/dashboard', label: '⛓ Blockchain', roles: ['VIEWER', 'USER', 'AUDITOR', 'ADMIN'] },
    { to: '/users',     label: '👥 Users',      roles: ['ADMIN'] },
  ]

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>⛓ Ledger Tampering Detection</span>
      <div className={styles.links}>
        {links
          .filter(l => l.roles.includes(auth?.role))
          .map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
              {l.label}
            </NavLink>
          ))}
      </div>
      <div className={styles.right}>
        <span className={styles.user}>{auth?.user}</span>
        <span className={styles.badge} style={{ background: ROLE_COLOR[auth?.role] || '#6c757d' }}>
          {auth?.role}
        </span>
        <button className={styles.logout} onClick={() => { signOut(); navigate('/') }}>Logout</button>
      </div>
    </nav>
  )
}
