import { useState, useEffect } from 'react'
import { getUsers, createUser, updateUserRole, deleteUser } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './Users.module.css'

const ROLES = ['ADMIN', 'AUDITOR', 'USER', 'VIEWER']

const ROLE_META = {
  ADMIN:   { color: '#dc3545', bg: '#f8d7da', desc: 'Full access — tamper demo, reset, manage users' },
  AUDITOR: { color: '#fd7e14', bg: '#fff3cd', desc: 'Detect tampering, view forensics & reports'     },
  USER:    { color: '#28a745', bg: '#d4edda', desc: 'Add transactions, view node status'              },
  VIEWER:  { color: '#6c757d', bg: '#e9ecef', desc: 'Read-only access to nodes and status'            },
}

export default function Users() {
  const { auth } = useAuth()
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({ username: '', password: '', role: 'USER' })
  const [formErr, setFormErr] = useState('')
  const [msg,     setMsg]     = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await getUsers(); setUsers(data) } catch {}
    finally { setLoading(false) }
  }

  const flash = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  const handleCreate = async e => {
    e.preventDefault()
    setFormErr('')
    if (!form.username.trim() || !form.password.trim()) {
      setFormErr('Username and password are required.')
      return
    }
    try {
      await createUser(form)
      setForm({ username: '', password: '', role: 'USER' })
      flash(`User "${form.username}" created successfully.`)
      load()
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to create user.')
    }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role)
      flash('Role updated.')
      load()
    } catch {
      flash('Failed to update role.', 'error')
    }
  }

  const handleDelete = async (id, username) => {
    if (username === auth?.user) { flash('You cannot delete your own account.', 'error'); return }
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try {
      await deleteUser(id)
      flash(`User "${username}" deleted.`)
      load()
    } catch {
      flash('Failed to delete user.', 'error')
    }
  }

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length
    return acc
  }, {})

  return (
    <div className={styles.page}>
      {msg && <div className={`${styles.toast} ${styles['toast_' + msg.type]}`}>{msg.text}</div>}

      {/* Role summary cards */}
      <div className={styles.roleCards}>
        {ROLES.map(r => (
          <div key={r} className={styles.roleCard} style={{ borderColor: ROLE_META[r].color, background: ROLE_META[r].bg }}>
            <div className={styles.roleCardCount} style={{ color: ROLE_META[r].color }}>{roleCounts[r]}</div>
            <div className={styles.roleCardName} style={{ color: ROLE_META[r].color }}>{r}</div>
            <div className={styles.roleCardDesc}>{ROLE_META[r].desc}</div>
          </div>
        ))}
      </div>

      {/* Create user form */}
      <div className={styles.panel}>
        <h3>➕ Create New User</h3>
        <form className={styles.form} onSubmit={handleCreate}>
          <input
            placeholder="Username"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            autoComplete="off"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
          />
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit" className={styles.btnCreate}>Create User</button>
        </form>
        {formErr && <div className={styles.formErr}>{formErr}</div>}
      </div>

      {/* Users table */}
      <div className={styles.panel}>
        <div className={styles.tableHeader}>
          <h3>👥 All Users <span className={styles.count}>{users.length} total</span></h3>
          <button className={styles.refresh} onClick={load} disabled={loading}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Change Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0
                ? <tr><td colSpan={5} className={styles.empty}>{loading ? 'Loading…' : 'No users found'}</td></tr>
                : users.map(u => (
                    <tr key={u.id} className={u.username === auth?.user ? styles.selfRow : ''}>
                      <td>
                        <div className={styles.usernameCell}>
                          <span className={styles.avatar} style={{ background: ROLE_META[u.role]?.color || '#888' }}>
                            {u.username[0].toUpperCase()}
                          </span>
                          <span className={styles.username}>{u.username}</span>
                          {u.username === auth?.user && <span className={styles.youTag}>you</span>}
                        </div>
                      </td>
                      <td>
                        <span className={styles.roleBadge}
                          style={{ background: ROLE_META[u.role]?.bg, color: ROLE_META[u.role]?.color }}>
                          {u.role}
                        </span>
                      </td>
                      <td className={styles.permCell}>{ROLE_META[u.role]?.desc}</td>
                      <td>
                        <select
                          className={styles.roleSelect}
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={u.username === auth?.user}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>
                        <button
                          className={styles.btnDelete}
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={u.username === auth?.user}
                          title={u.username === auth?.user ? 'Cannot delete your own account' : `Delete ${u.username}`}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
