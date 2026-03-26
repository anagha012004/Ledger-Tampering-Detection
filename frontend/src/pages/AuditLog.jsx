import { useState, useEffect } from 'react'
import { getAuditLogs } from '../api'
import styles from './AuditLog.module.css'

const ACTION_CLASS = {
  LOGIN: 'login', ADD_TRANSACTION: 'add', TAMPER_ATTEMPT: 'tamper',
  DETECT_TAMPERING: 'detect', SYSTEM_RESET: 'reset', UPDATE_TRANSACTION_REVERSAL: 'reversal'
}

export default function AuditLog() {
  const [logs,    setLogs]    = useState([])
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await getAuditLogs(); setLogs(data) } catch {}
    finally { setLoading(false) }
  }

  const visible = logs.filter(l => {
    const matchFilter = !filter || l.action === filter
    const q = search.toLowerCase()
    const matchSearch = !q || [l.username, l.action, l.details, l.transactionId]
      .some(v => (v || '').toLowerCase().includes(q))
    return matchFilter && matchSearch
  })

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>📋 Audit Log</h3>
          <span className={styles.count}>{visible.length} / {logs.length} entries</span>
          <button className={styles.refresh} onClick={load}>↻ Refresh</button>
        </div>

        <div className={styles.toolbar}>
          <input placeholder="Search user, action, details…" value={search} onChange={e => setSearch(e.target.value)} />
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Actions</option>
            {['LOGIN','ADD_TRANSACTION','TAMPER_ATTEMPT','DETECT_TAMPERING','SYSTEM_RESET','UPDATE_TRANSACTION_REVERSAL']
              .map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th><th>Timestamp</th><th>User</th><th>Action</th>
                <th>Transaction ID</th><th>IP</th><th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} className={styles.empty}>Loading…</td></tr>
                : visible.length === 0
                  ? <tr><td colSpan={7} className={styles.empty}>No logs found</td></tr>
                  : visible.map((l, i) => (
                      <tr key={l.id}>
                        <td className={styles.num}>{i + 1}</td>
                        <td className={styles.mono}>{l.timestamp?.replace('T',' ').substring(0,19)}</td>
                        <td><strong>{l.username || '—'}</strong></td>
                        <td>
                          <span className={`${styles.badge} ${styles[ACTION_CLASS[l.action] || 'def']}`}>
                            {l.action || '—'}
                          </span>
                        </td>
                        <td className={styles.mono}>{l.transactionId || '—'}</td>
                        <td className={styles.ip}>{l.ipAddress || '—'}</td>
                        <td className={styles.details} title={l.details}>{l.details || '—'}</td>
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
