import { useState, useEffect, useRef } from 'react'
import { getNodes, detectTamper, addTx, tamperNode, resetSystem } from '../api'
import { useAuth } from '../context/AuthContext'
import NodeCard from '../components/NodeCard'
import styles from './Dashboard.module.css'

function SystemStatusBar({ nodes }) {
  const total    = nodes.length
  const tampered = nodes.filter(n => n.tampered).length
  const clean    = total - tampered

  let level = 'secure'
  if (tampered > 0 && tampered < total) level = 'suspicious'
  if (tampered === total && total > 0)  level = 'tampered'

  const cfg = {
    secure:     { label: '● SYSTEM SECURE',     sub: `All ${total} nodes synchronized`,                  cls: styles.barSecure     },
    suspicious: { label: '● SUSPICIOUS ACTIVITY', sub: `${tampered} of ${total} nodes compromised`,      cls: styles.barSuspicious },
    tampered:   { label: '● SYSTEM COMPROMISED', sub: `All ${total} nodes show tampering`,               cls: styles.barTampered   },
  }[level]

  return (
    <div className={`${styles.statusBar} ${cfg.cls}`}>
      <span className={styles.statusPulse} />
      <div>
        <div className={styles.statusLabel}>{cfg.label}</div>
        <div className={styles.statusSub}>{cfg.sub}</div>
      </div>
      <div className={styles.statusNodes}>
        {nodes.map(n => (
          <span key={n.nodeId} className={`${styles.nodePill} ${n.tampered ? styles.nodePillBad : styles.nodePillOk}`}>
            {n.nodeId}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { auth } = useAuth()
  const role    = auth?.role
  const isAdmin  = role === 'ADMIN'
  const canAddTx = ['ADMIN', 'AUDITOR', 'USER'].includes(role)

  const [nodes,  setNodes]  = useState([])
  const [status, setStatus] = useState(null)
  const [txForm, setTxForm] = useState({ transactionId: 'TX-001', from: 'UserA', to: 'UserB', amount: 500, transactionType: 'TRANSFER' })
  const [tamper, setTamper] = useState({ nodeId: 'Node-A', transactionId: 'TX-001', amount: 9999 })
  const [msg,    setMsg]    = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    loadNodes()
    // Poll every 10 seconds for real-time status
    pollRef.current = setInterval(loadNodes, 10000)
    return () => clearInterval(pollRef.current)
  }, [])

  const loadNodes = async () => {
    try { const { data } = await getNodes(); setNodes(data) } catch {}
  }

  const handleDetect = async () => {
    try {
      const { data } = await detectTamper()
      setStatus(data)
      loadNodes()
    } catch {}
  }

  const handleAddTx = async e => {
    e.preventDefault()
    try {
      const { data } = await addTx({ ...txForm, amount: parseFloat(txForm.amount) })
      flash(data.message, 'success')
      const num = parseInt(txForm.transactionId.replace(/\D/g, '')) || 0
      setTxForm(f => ({ ...f, transactionId: 'TX-' + String(num + 1).padStart(3, '0') }))
      loadNodes()
    } catch (err) { flash(err.response?.data?.message || 'Error adding transaction', 'error') }
  }

  const handleTamper = async e => {
    e.preventDefault()
    try {
      const { data } = await tamperNode(tamper.nodeId, tamper.transactionId, tamper.amount)
      flash(data.message, 'warn')
      loadNodes()
    } catch (err) { flash(err.response?.data?.message || 'Error', 'error') }
  }

  const handleReset = async () => {
    if (!confirm('Reset entire system? All transactions will be deleted.')) return
    try { await resetSystem(); setStatus(null); loadNodes(); flash('System reset successfully.', 'success') } catch {}
  }

  const flash = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500) }

  return (
    <div className={styles.page}>
      {msg && <div className={`${styles.toast} ${styles['toast_' + msg.type]}`}>{msg.text}</div>}

      {/* System-wide real-time status bar */}
      {nodes.length > 0 && <SystemStatusBar nodes={nodes} />}

      {canAddTx && (
        <div className={styles.panel}>
          <h3>📝 Add Transaction</h3>
          <form className={styles.row} onSubmit={handleAddTx}>
            <input placeholder="Transaction ID" value={txForm.transactionId}
              onChange={e => setTxForm(f => ({ ...f, transactionId: e.target.value }))} />
            <input placeholder="From" value={txForm.from}
              onChange={e => setTxForm(f => ({ ...f, from: e.target.value }))} />
            <input placeholder="To" value={txForm.to}
              onChange={e => setTxForm(f => ({ ...f, to: e.target.value }))} />
            <input type="number" placeholder="Amount" value={txForm.amount}
              onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} />
            <select value={txForm.transactionType}
              onChange={e => setTxForm(f => ({ ...f, transactionType: e.target.value }))}>
              {['TRANSFER', 'CREDIT', 'DEBIT'].map(t => <option key={t}>{t}</option>)}
            </select>
            <button type="submit" className={styles.btnSuccess}>Add Transaction</button>
          </form>
        </div>
      )}

      {isAdmin && (
        <div className={styles.panel}>
          <h3>⚠️ Tamper Ledger <span className={styles.adminTag}>(Admin Demo)</span></h3>
          <form className={styles.row} onSubmit={handleTamper}>
            <select value={tamper.nodeId} onChange={e => setTamper(f => ({ ...f, nodeId: e.target.value }))}>
              {['Node-A', 'Node-B', 'Node-C'].map(n => <option key={n}>{n}</option>)}
            </select>
            <input placeholder="Transaction ID" value={tamper.transactionId}
              onChange={e => setTamper(f => ({ ...f, transactionId: e.target.value }))} />
            <input type="number" placeholder="New Amount" value={tamper.amount}
              onChange={e => setTamper(f => ({ ...f, amount: e.target.value }))} />
            <button type="submit" className={styles.btnDanger}>Tamper Node</button>
          </form>
        </div>
      )}

      <div className={styles.panel}>
        <h3>🔍 System Actions</h3>
        <div className={styles.row}>
          <button onClick={loadNodes}>↻ Refresh Nodes</button>
          <button onClick={handleDetect}>🔍 Detect Tampering</button>
          {isAdmin && <button className={styles.btnDanger} onClick={handleReset}>⚠ Reset System</button>}
        </div>
      </div>

      {status && (
        <div className={`${styles.panel} ${status.tamperingDetected ? styles.alertDanger : styles.alertSuccess}`}>
          <strong>{status.message}</strong>
          {status.chainErrors?.length > 0 && (
            <div className={styles.chainErrNote}>⛓ {status.chainErrors.length} hash chain error(s) detected</div>
          )}
        </div>
      )}

      <div className={styles.grid}>
        {nodes.map(n => <NodeCard key={n.nodeId} node={n} />)}
      </div>
    </div>
  )
}
