import { useState } from 'react'
import { getForensics } from '../api'
import styles from './Forensics.module.css'

export default function Forensics() {
  const [nodeId,  setNodeId]  = useState('Node-A')
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const { data } = await getForensics(nodeId); setReport(data) } catch {}
    finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <h3>🔬 Forensics Viewer</h3>
        <div className={styles.row}>
          <select value={nodeId} onChange={e => setNodeId(e.target.value)}>
            {['Node-A','Node-B','Node-C'].map(n => <option key={n}>{n}</option>)}
          </select>
          <button onClick={load} disabled={loading}>{loading ? 'Analyzing…' : 'Run Forensics'}</button>
        </div>
      </div>

      {report && (
        <>
          <div className={`${styles.panel} ${report.tampered ? styles.alertDanger : styles.alertSuccess}`}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryNode}>{report.nodeId}</span>
              <span className={`${styles.summaryStatus} ${report.tampered ? styles.statusBad : styles.statusOk}`}>
                {report.tampered ? '⚠ TAMPERED' : '✓ CLEAN'}
              </span>
              <span className={styles.summaryMeta}>{report.totalTransactions} transactions</span>
            </div>
            <div className={styles.merkleRow}>
              <span>Merkle Root:</span>
              <code className={styles.merkle}>{report.merkleRoot}</code>
            </div>
          </div>

          {report.chainErrors?.length > 0 && (
            <div className={styles.panel}>
              <h4 className={styles.errTitle}>⛓ Hash Chain Errors ({report.chainErrors.length})</h4>
              {report.chainErrors.map((e, i) => (
                <div key={i} className={styles.errCard}>
                  <div className={styles.errHeader}>
                    <strong>{e.transactionId}</strong>
                    <span className={styles.errTime}>{e.timestamp?.replace('T',' ').substring(0,19)}</span>
                    <span className={`${styles.sigBadge} ${e.signatureValid ? styles.sigOk : styles.sigBad}`}>
                      Sig: {e.signatureValid ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className={styles.hashRow}><span>Expected:</span><code>{e.expectedHash}</code></div>
                  <div className={styles.hashRow}><span>Actual:</span><code>{e.actualHash}</code></div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.panel}>
            <h4 className={styles.txTitle}>📄 Transaction Chain ({report.transactions?.length})</h4>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>ID</th><th>Timestamp</th><th>From</th><th>To</th><th>Amount</th><th>Type</th><th>Hash</th><th>Prev Hash</th></tr>
                </thead>
                <tbody>
                  {(report.transactions || []).map(tx => (
                    <tr key={tx.transactionId}>
                      <td><strong>{tx.transactionId}</strong></td>
                      <td className={styles.mono}>{tx.timestamp?.replace('T',' ').substring(0,19)}</td>
                      <td>{tx.from}</td>
                      <td>{tx.to}</td>
                      <td><strong>${tx.amount}</strong></td>
                      <td><span className={styles.typeBadge}>{tx.transactionType}</span></td>
                      <td className={styles.hashCell}>{tx.currentHash?.substring(0,12)}…</td>
                      <td className={styles.hashCell}>{tx.previousHash?.substring(0,12)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
