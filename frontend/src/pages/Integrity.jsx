import { useState, useEffect } from 'react'
import { getIntegrity } from '../api'
import styles from './Integrity.module.css'

export default function Integrity() {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await getIntegrity(); setReport(data) } catch {}
    finally { setLoading(false) }
  }

  const status = report?.ledgerStatus === 'SECURE' ? 'secure' : 'compromised'

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>🔐 Integrity Report</h3>
          <button className={styles.refresh} onClick={load} disabled={loading}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {!report
          ? <p className={styles.empty}>{loading ? 'Loading…' : 'No data'}</p>
          : <>
              {/* Status banner */}
              <div className={`${styles.statusBanner} ${styles[status]}`}>
                <div className={styles.statusLeft}>
                  <span className={styles.statusPulse} />
                  <div>
                    <div className={styles.statusLabel}>
                      {status === 'secure' ? '✅ SYSTEM SECURE' : '⚠️ SYSTEM COMPROMISED'}
                    </div>
                    <div className={styles.statusSub}>
                      {status === 'secure'
                        ? 'All nodes are synchronized and untampered'
                        : `${report.tamperedNodes} node(s) show signs of tampering`}
                    </div>
                  </div>
                </div>
                <div className={styles.statusTime}>
                  Last verified<br />
                  <strong>{report.lastVerified?.replace('T', ' ').substring(0, 19)}</strong>
                </div>
              </div>

              {/* Stats */}
              <div className={styles.stats}>
                {[
                  { label: 'Total Transactions', value: report.totalTransactions, color: '#667eea' },
                  { label: 'Total Nodes',         value: report.totalNodes,         color: '#667eea' },
                  { label: 'Tampered Nodes',      value: report.tamperedNodes,      color: report.tamperedNodes > 0 ? '#dc3545' : '#28a745' },
                  { label: 'Clean Nodes',         value: report.totalNodes - report.tamperedNodes, color: '#28a745' },
                ].map(s => (
                  <div key={s.label} className={styles.stat}>
                    <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Per-node Merkle root display */}
              <h4 className={styles.subtitle}>🌳 Merkle Root per Node</h4>
              <div className={styles.nodeGrid}>
                {(report.nodes || []).map(n => (
                  <div key={n.nodeId} className={`${styles.nodeCard} ${n.tampered ? styles.nodeTampered : styles.nodeSafe}`}>
                    <div className={styles.nodeHeader}>
                      <span className={styles.nodeId}>{n.nodeId}</span>
                      <span className={`${styles.nodeStatus} ${n.tampered ? styles.statusBad : styles.statusOk}`}>
                        {n.tampered ? '⚠ TAMPERED' : '✓ CLEAN'}
                      </span>
                    </div>

                    <div className={styles.merkleSection}>
                      <div className={styles.merkleLabel}>🌳 Merkle Root</div>
                      <div className={styles.merkleHash}>{n.merkleRoot}</div>
                    </div>

                    <div className={styles.merkleSection}>
                      <div className={styles.merkleLabel}>🔑 Ledger Hash</div>
                      <div className={styles.merkleHash}>{n.ledgerHash}</div>
                    </div>

                    <div className={styles.nodeMeta}>
                      <span>{n.transactionCount} transactions</span>
                      {n.tampered && <span className={styles.tamperWarn}>Hash mismatch detected</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
        }
      </div>
    </div>
  )
}
