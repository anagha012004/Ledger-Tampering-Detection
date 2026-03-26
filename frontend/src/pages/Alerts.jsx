import { useState, useEffect, useRef } from 'react'
import { getAlerts, resolveAlert } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './Alerts.module.css'

export default function Alerts() {
  const { auth } = useAuth()
  const canResolve = ['AUDITOR', 'ADMIN'].includes(auth?.role)
  const [alerts,  setAlerts]  = useState([])
  const [loading, setLoading] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 15000)
    return () => clearInterval(pollRef.current)
  }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await getAlerts(); setAlerts(data) } catch {}
    finally { setLoading(false) }
  }

  const handleResolve = async id => {
    try { await resolveAlert(id); load() } catch {}
  }

  const active   = alerts.filter(a => !a.resolved)
  const resolved = alerts.filter(a =>  a.resolved)
  const critical = active.filter(a => a.severity === 'CRITICAL').length
  const high     = active.filter(a => a.severity === 'HIGH').length

  return (
    <div className={styles.page}>

      {/* Summary stats */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${active.length > 0 ? styles.statDanger : styles.statSafe}`}>
          <div className={styles.statNum}>{active.length}</div>
          <div className={styles.statLbl}>Active Alerts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum} style={{ color: critical > 0 ? '#dc3545' : '#28a745' }}>{critical}</div>
          <div className={styles.statLbl}>Critical</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum} style={{ color: high > 0 ? '#fd7e14' : '#28a745' }}>{high}</div>
          <div className={styles.statLbl}>High</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum} style={{ color: '#28a745' }}>{resolved.length}</div>
          <div className={styles.statLbl}>Resolved</div>
        </div>
      </div>

      {/* Active alerts */}
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>
            🚨 Active Alerts
            {active.length > 0 && <span className={styles.badge}>{active.length}</span>}
          </h3>
          <button className={styles.refresh} onClick={load} disabled={loading}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {active.length === 0
          ? <div className={styles.allClear}>
              <span className={styles.allClearIcon}>✅</span>
              <span>No active alerts — all nodes are clean</span>
            </div>
          : active.map(a => <AlertCard key={a.id} alert={a} onResolve={handleResolve} canResolve={canResolve} />)
        }
      </div>

      {/* Resolved alerts */}
      {resolved.length > 0 && (
        <div className={styles.panel}>
          <h3 className={styles.resolvedTitle}>
            ✅ Resolved Alerts
            <span className={styles.badgeGreen}>{resolved.length}</span>
          </h3>
          {resolved.map(a => <AlertCard key={a.id} alert={a} resolved />)}
        </div>
      )}
    </div>
  )
}

function AlertCard({ alert: a, onResolve, resolved, canResolve }) {
  const sevKey = (a.severity || 'HIGH').toLowerCase()
  return (
    <div className={`${styles.card} ${resolved ? styles.cardResolved : styles.cardActive}`}>
      <div className={styles.cardHeader}>
        <span className={styles.node}>{a.nodeId}</span>
        <span className={`${styles.sev} ${styles['sev_' + sevKey]}`}>{a.severity}</span>
        <span className={styles.time}>{a.detectedAt?.replace('T', ' ').substring(0, 19)}</span>
        {!resolved && canResolve
          ? <button className={styles.resolveBtn} onClick={() => onResolve(a.id)}>✓ Resolve</button>
          : resolved ? <span className={styles.resolvedTag}>✓ RESOLVED</span> : null
        }
      </div>
      <div className={styles.detail}>{a.details}</div>
      <div className={styles.hashes}>
        <div className={styles.hashItem}>
          <span className={styles.hashLbl}>Expected</span>
          <code>{a.expectedHash?.substring(0, 20)}…</code>
        </div>
        <div className={styles.hashItem}>
          <span className={styles.hashLbl}>Actual</span>
          <code className={styles.hashActual}>{a.actualHash?.substring(0, 20)}…</code>
        </div>
      </div>
    </div>
  )
}
