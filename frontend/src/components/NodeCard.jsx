import styles from './NodeCard.module.css'

function getNodeStatus(node) {
  if (node.tampered) return 'tampered'
  const txList = node.ledger?.transactions || []
  if (txList.length === 0) return 'secure'
  return 'secure'
}

const STATUS_CONFIG = {
  secure:   { label: '● SECURE',     cls: 'indicatorSecure'   },
  tampered: { label: '● TAMPERED',   cls: 'indicatorTampered' },
}

export default function NodeCard({ node }) {
  const txList  = node.ledger?.transactions || []
  const status  = getNodeStatus(node)
  const cfg     = STATUS_CONFIG[status]

  return (
    <div className={`${styles.card} ${node.tampered ? styles.tampered : styles.safe}`}>

      {/* ── Real-time status indicator ── */}
      <div className={`${styles.indicator} ${styles[cfg.cls]}`}>
        <span className={styles.pulse} />
        {cfg.label}
      </div>

      <div className={styles.header}>
        <span className={styles.nodeId}>{node.nodeId}</span>
        <span className={`${styles.status} ${node.tampered ? styles.statusBad : styles.statusOk}`}>
          {node.tampered ? '⚠ TAMPERED' : '✓ OK'}
        </span>
      </div>

      <div className={styles.label}>Ledger Hash</div>
      <div className={styles.hash}>{node.ledgerHash}</div>

      <div className={styles.label} style={{ marginTop: 8 }}>Merkle Root</div>
      <div className={styles.hash}>{node.merkleRoot || '—'}</div>

      <div className={styles.txHeader}>Transactions ({txList.length})</div>
      <div className={styles.txList}>
        {txList.length === 0
          ? <em className={styles.empty}>No transactions yet</em>
          : txList.map(tx => (
              <div key={tx.transactionId + tx.nodeId} className={styles.txItem}>
                <strong>{tx.transactionId}</strong>
                <span className={styles.arrow}>{tx.from} → {tx.to}</span>
                <strong className={styles.amount}>${tx.amount}</strong>
                <span className={styles.txType}>{tx.transactionType}</span>
              </div>
            ))
        }
      </div>
    </div>
  )
}
