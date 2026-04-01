import { useState, useEffect } from 'react'
import { bcEvents } from '../api'
import styles from './AuditLog.module.css'

const EVENT_META = {
  TransactionAdded:   { icon: '📦', color: '#16a34a', label: 'Transaction Added'   },
  NodeTampered:       { icon: '⚠',  color: '#dc2626', label: 'Node Tampered'       },
  TamperingDetected:  { icon: '🔍', color: '#d97706', label: 'Tampering Detected'  },
  SystemReset:        { icon: '↺',  color: '#6366f1', label: 'System Reset'        },
}

function EventRow({ event }) {
  const [open, setOpen] = useState(false)
  const meta = EVENT_META[event.name] || { icon: '📋', color: '#6b7280', label: event.name }

  const summary = () => {
    const a = event.args
    if (event.name === 'TransactionAdded')
      return `Entry #${a.entryId} · ${a.from} → ${a.to} · amount: ${a.amount}`
    if (event.name === 'NodeTampered')
      return `${a.nodeId} · entry #${a.entryId} · new amount: ${a.newAmount}`
    if (event.name === 'TamperingDetected')
      return `${a.nodeId} · entry #${a.entryId} · hash mismatch`
    if (event.name === 'SystemReset')
      return 'All contract state cleared'
    return JSON.stringify(a)
  }

  return (
    <div className={styles.eventRow} onClick={() => setOpen(o => !o)}>
      <div className={styles.eventMain}>
        <span className={styles.eventIcon}>{meta.icon}</span>
        <span className={styles.eventName} style={{ color: meta.color }}>{meta.label}</span>
        <span className={styles.eventSummary}>{summary()}</span>
        <span className={styles.eventBlock}>block #{event.blockNumber}</span>
      </div>
      {open && (
        <div className={styles.eventDetail}>
          <div><b>Event:</b> {event.name}</div>
          <div><b>Block:</b> {event.blockNumber}</div>
          <div><b>Tx:</b> <code>{event.txHash}</code></div>
          {Object.entries(event.args).map(([k, v]) => (
            <div key={k}><b>{k}:</b> <code>{v}</code></div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AuditLog() {
  const [events,  setEvents]  = useState([])
  const [filter,  setFilter]  = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await bcEvents(); setEvents(data) } catch {}
    setLoading(false)
  }

  const types    = ['ALL', ...Object.keys(EVENT_META)]
  const filtered = filter === 'ALL' ? events : events.filter(e => e.name === filter)

  const counts = Object.keys(EVENT_META).reduce((acc, k) => {
    acc[k] = events.filter(e => e.name === k).length
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>📋 On-Chain Audit Log</h2>
        <button onClick={load} disabled={loading}>{loading ? '…' : '↻ Refresh'}</button>
      </div>
      <p className={styles.sub}>All events emitted by the LedgerTampering smart contract — immutable on-chain record.</p>

      {/* Summary */}
      <div className={styles.summary}>
        {Object.entries(EVENT_META).map(([k, m]) => (
          <div key={k} className={styles.summaryCard} style={{ borderColor: m.color }}>
            <span className={styles.summaryIcon}>{m.icon}</span>
            <span className={styles.summaryCount} style={{ color: m.color }}>{counts[k] || 0}</span>
            <span className={styles.summaryLabel}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className={styles.filters}>
        {types.map(t => (
          <button key={t}
            className={`${styles.filterBtn} ${filter === t ? styles.filterActive : ''}`}
            onClick={() => setFilter(t)}>
            {t === 'ALL' ? `All (${events.length})` : `${EVENT_META[t]?.icon} ${t} (${counts[t] || 0})`}
          </button>
        ))}
      </div>

      {/* Events */}
      <div className={styles.events}>
        {loading && <div className={styles.empty}>Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>No events yet — add a transaction to get started.</div>
        )}
        {filtered.map((e, i) => <EventRow key={i} event={e} />)}
      </div>
    </div>
  )
}
