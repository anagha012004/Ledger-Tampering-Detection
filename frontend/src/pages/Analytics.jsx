import { useState, useEffect } from 'react'
import { bcStats, bcGetNodes, bcTamperHistory, bcConsensus } from '../api'
import styles from './Analytics.module.css'

const fmtTime = ts => new Date(ts * 1000).toLocaleString()
const fmtAge  = s  => {
  if (s < 60)   return `${s} seconds`
  if (s < 3600) return `${Math.floor(s/60)} minutes`
  return `${Math.floor(s/3600)} hours ${Math.floor((s%3600)/60)} minutes`
}

export default function Analytics() {
  const [stats,      setStats]      = useState(null)
  const [nodes,      setNodes]      = useState([])
  const [tamperHist, setTamperHist] = useState([])
  const [consensus,  setConsensus]  = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [s, n, t, c] = await Promise.all([
        bcStats(), bcGetNodes(), bcTamperHistory(), bcConsensus()
      ])
      setStats(s.data)
      setNodes(n.data)
      setTamperHist(t.data)
      setConsensus(c.data)
    } catch {}
    setLoading(false)
  }

  if (loading) return <div className={styles.loading}>Loading analytics…</div>
  if (!stats)  return <div className={styles.loading}>Bridge offline</div>

  const integrityPct = stats.totalTransactions === 0 ? 100
    : Math.round(((stats.totalTransactions - stats.tamperCount) / stats.totalTransactions) * 100)

  const tamperByNode = ['Node-A', 'Node-B', 'Node-C'].map(id => ({
    id,
    count: tamperHist.filter(r => r.nodeId === id).length,
  }))
  const maxTampers = Math.max(...tamperByNode.map(n => n.count), 1)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>📊 Analytics</h2>
        <button onClick={load}>↻ Refresh</button>
      </div>

      {/* Summary cards */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardVal}>{stats.totalTransactions}</div>
          <div className={styles.cardLabel}>Total Transactions</div>
        </div>
        <div className={`${styles.card} ${stats.tamperCount > 0 ? styles.cardDanger : ''}`}>
          <div className={styles.cardVal}>{stats.tamperCount}</div>
          <div className={styles.cardLabel}>Tamper Attempts</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardVal}>{stats.detectCount}</div>
          <div className={styles.cardLabel}>Detection Runs</div>
        </div>
        <div className={`${styles.card} ${integrityPct < 100 ? styles.cardWarn : styles.cardGood}`}>
          <div className={styles.cardVal}>{integrityPct}%</div>
          <div className={styles.cardLabel}>Ledger Integrity</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardVal}>{fmtAge(stats.contractAge)}</div>
          <div className={styles.cardLabel}>Contract Uptime</div>
        </div>
      </div>

      {/* Integrity bar */}
      <div className={styles.panel}>
        <h3>🔐 Ledger Integrity</h3>
        <div className={styles.integrityBar}>
          <div className={styles.integrityFill}
            style={{ width: `${integrityPct}%`, background: integrityPct === 100 ? '#16a34a' : '#dc2626' }} />
        </div>
        <div className={styles.integrityLabel}>
          {integrityPct === 100
            ? '✓ All transactions intact — no tampering detected'
            : `⚠ ${stats.tamperCount} tamper attempt(s) recorded`}
        </div>
      </div>

      {/* Node health */}
      <div className={styles.panel}>
        <h3>🖥 Node Health</h3>
        <div className={styles.nodeHealth}>
          {nodes.map(n => (
            <div key={n.nodeId} className={`${styles.nodeHealthCard} ${n.tampered ? styles.nodeHealthBad : styles.nodeHealthOk}`}>
              <div className={styles.nodeHealthId}>{n.nodeId}</div>
              <div className={styles.nodeHealthStatus}>{n.tampered ? '✗ Compromised' : '✓ Healthy'}</div>
              <div className={styles.nodeHealthEntries}>{n.entryCount} entries</div>
              <div className={styles.nodeHealthHash} title={n.ledgerHash}>
                {n.ledgerHash?.slice(0, 12)}…
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consensus */}
      <div className={styles.panel}>
        <h3>🤝 Consensus Status</h3>
        <div className={`${styles.consensusBox} ${consensus?.inConsensus ? styles.consensusOk : styles.consensusBad}`}>
          <div className={styles.consensusMsg}>{consensus?.message}</div>
          <div className={styles.hashCompare}>
            {Object.entries(consensus?.ledgerHashes || {}).map(([id, hash]) => (
              <div key={id} className={styles.hashCompareRow}>
                <span className={styles.hashCompareId}>{id}</span>
                <code className={styles.hashCompareVal}>{hash?.slice(0, 20)}…</code>
                <span className={`${styles.hashCompareBadge} ${consensus?.chainValidity?.[id] ? styles.pillOk : styles.pillBad}`}>
                  {consensus?.chainValidity?.[id] ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tamper attempts by node */}
      <div className={styles.panel}>
        <h3>⚠ Tamper Attempts by Node</h3>
        <div className={styles.barChart}>
          {tamperByNode.map(n => (
            <div key={n.id} className={styles.barRow}>
              <span className={styles.barLabel}>{n.id}</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill}
                  style={{ width: `${(n.count / maxTampers) * 100}%`, background: n.count > 0 ? '#dc2626' : '#374151' }} />
              </div>
              <span className={styles.barCount}>{n.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tamper timeline */}
      {tamperHist.length > 0 && (
        <div className={styles.panel}>
          <h3>🕵 Tamper Timeline</h3>
          <div className={styles.timeline}>
            {[...tamperHist].reverse().map((r, i) => (
              <div key={i} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineContent}>
                  <span className={styles.timelineNode}>{r.nodeId}</span>
                  Entry #{r.entryId} → amount changed to <strong>{r.newAmount}</strong>
                  <span className={styles.timelineTime}>{fmtTime(r.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
