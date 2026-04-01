import { useState, useEffect } from 'react'
import { bcGetNodes, bcGetEntries, bcAddTx, bcDetect, bcTamper, bcReset, bcConsensus, bcStatus } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './Blockchain.module.css'

const NODE_NAMES = ['Node-A', 'Node-B', 'Node-C']
const shortHash  = h => h ? h.slice(0, 10) + '…' : '—'

function EntryRow({ entry }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`${styles.entry} ${entry.tampered ? styles.entryTampered : ''}`}
         onClick={() => setOpen(o => !o)}>
      <div className={styles.entryMain}>
        <span className={styles.entryId}>#{entry.id}</span>
        <span className={styles.entryFlow}>{entry.from} → {entry.to}</span>
        <span className={styles.entryAmt}>{entry.amount}</span>
        {entry.tampered && <span className={styles.tamperBadge}>TAMPERED</span>}
      </div>
      {open && (
        <div className={styles.entryDetail}>
          <div>currentHash: <code>{entry.currentHash}</code></div>
          <div>prevHash:    <code>{entry.previousHash}</code></div>
          <div>timestamp:   {new Date(entry.timestamp * 1000).toLocaleString()}</div>
        </div>
      )}
    </div>
  )
}

function NodePanel({ node, entries, isAdmin, onTamper }) {
  return (
    <div className={`${styles.nodePanel} ${node.tampered ? styles.nodePanelTampered : ''}`}>
      <div className={styles.nodeHeader}>
        <span className={styles.nodeId}>{node.nodeId}</span>
        <span className={`${styles.nodeBadge} ${node.tampered ? styles.badgeBad : styles.badgeOk}`}>
          {node.tampered ? '✗ Tampered' : '✓ Clean'}
        </span>
        <span className={styles.nodeLen}>{node.entryCount} entries</span>
      </div>
      <div className={styles.hashRow}>
        ledgerHash: <code>{shortHash(node.ledgerHash)}</code>
      </div>
      <div className={styles.entries}>
        {entries.length === 0
          ? <div className={styles.noEntries}>No transactions yet</div>
          : entries.map(e => <EntryRow key={e.id} entry={e} />)
        }
      </div>
      {isAdmin && (
        <button onClick={() => onTamper(node.nodeIndex)} className={styles.btnDanger}>
          ⚠ Tamper this node
        </button>
      )}
    </div>
  )
}

export default function Blockchain() {
  const { auth } = useAuth()
  const isAdmin = auth?.role === 'ADMIN'
  const canTx   = ['ADMIN', 'AUDITOR', 'USER'].includes(auth?.role)

  const [nodes,     setNodes]     = useState([])
  const [entries,   setEntries]   = useState({ 0: [], 1: [], 2: [] })
  const [consensus, setConsensus] = useState(null)
  const [detect,    setDetect]    = useState(null)
  const [status,    setStatus]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [msg,       setMsg]       = useState(null)
  const [tx,        setTx]        = useState({ from: 'Alice', to: 'Bob', amount: 100 })
  const [tamperCfg, setTamperCfg] = useState({ nodeIndex: 0, entryId: 1, newAmount: 9999 })
  const [showTamper, setShowTamper] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [nodesRes, conRes, statusRes] = await Promise.all([
        bcGetNodes(), bcConsensus(), bcStatus()
      ])
      setNodes(nodesRes.data)
      setConsensus(conRes.data)
      setStatus(statusRes.data)

      const [e0, e1, e2] = await Promise.all([
        bcGetEntries(0), bcGetEntries(1), bcGetEntries(2)
      ])
      setEntries({ 0: e0.data, 1: e1.data, 2: e2.data })
    } catch {
      flash('Bridge offline — run: cd blockchain && npm run node, then npm run deploy, then npm run bridge', 'error')
    }
    setLoading(false)
  }

  const handleAddTx = async e => {
    e.preventDefault()
    try {
      const { data } = await bcAddTx({ ...tx, amount: parseFloat(tx.amount) })
      flash(data.message, 'success')
      load()
    } catch (err) { flash(err.response?.data?.error || 'Failed', 'error') }
  }

  const handleDetect = async () => {
    try {
      const { data } = await bcDetect()
      setDetect(data)
      flash(data.message, data.tamperingDetected ? 'warn' : 'success')
      load()
    } catch (err) { flash(err.response?.data?.error || 'Detect failed', 'error') }
  }

  const openTamper = nodeIndex => {
    setTamperCfg(c => ({ ...c, nodeIndex }))
    setShowTamper(true)
  }

  const submitTamper = async e => {
    e.preventDefault()
    try {
      const { data } = await bcTamper({
        nodeIndex: parseInt(tamperCfg.nodeIndex),
        entryId:   parseInt(tamperCfg.entryId),
        newAmount: parseFloat(tamperCfg.newAmount),
      })
      flash(data.message, 'warn')
      setShowTamper(false)
      load()
    } catch (err) { flash(err.response?.data?.error || 'Tamper failed', 'error') }
  }

  const handleReset = async () => {
    if (!confirm('Reset contract state? All entries will be deleted.')) return
    try {
      await bcReset()
      setDetect(null)
      flash('Contract reset', 'success')
      load()
    } catch (err) { flash(err.response?.data?.error || 'Reset failed', 'error') }
  }

  const flash = (text, type) => { setMsg({ text, type }); setTimeout(() => setMsg(null), 5000) }

  const ok = consensus?.inConsensus && consensus?.tamperedNodes?.length === 0

  return (
    <div className={styles.page}>
      {msg && <div className={`${styles.toast} ${styles['toast_' + msg.type]}`}>{msg.text}</div>}

      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>⛓ Hardhat Blockchain</h2>
          {status && (
            <div className={styles.contractInfo}>
              Contract: <code>{status.contractAddress}</code> · {status.network}
            </div>
          )}
        </div>
        <div className={styles.topActions}>
          <button onClick={load} disabled={loading}>{loading ? '…' : '↻ Refresh'}</button>
          <button onClick={handleDetect} className={styles.btnDetect}>🔍 Detect Tampering</button>
          {isAdmin && <button onClick={handleReset} className={styles.btnDanger}>⚠ Reset</button>}
        </div>
      </div>

      {/* Consensus banner */}
      {consensus && (
        <div className={`${styles.consensusBanner} ${ok ? styles.bannerOk : styles.bannerBad}`}>
          <span className={styles.pulse} />
          <div>
            <strong>{consensus.message}</strong>
            <div className={styles.consensusDetail}>
              {NODE_NAMES.map(id => (
                <span key={id} className={`${styles.pill} ${consensus.chainValidity?.[id] ? styles.pillOk : styles.pillBad}`}>
                  {id}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detect results */}
      {detect && detect.tamperedEntries?.length > 0 && (
        <div className={styles.panel + ' ' + styles.detectPanel}>
          <strong>⚠ Tampered entries found:</strong>
          {detect.tamperedEntries.map((d, i) => (
            <div key={i} className={styles.detectRow}>
              {d.nodeId} · entry #{d.entryId} · stored: <code>{shortHash(d.storedHash)}</code>
              → recomputed: <code>{shortHash(d.recomputedHash)}</code>
            </div>
          ))}
        </div>
      )}

      {/* Add transaction */}
      {canTx && (
        <div className={styles.panel}>
          <h3>📝 Add Transaction (replicated to all 3 nodes)</h3>
          <form className={styles.row} onSubmit={handleAddTx}>
            <input placeholder="From" value={tx.from} onChange={e => setTx(t => ({ ...t, from: e.target.value }))} />
            <input placeholder="To"   value={tx.to}   onChange={e => setTx(t => ({ ...t, to: e.target.value }))} />
            <input type="number" placeholder="Amount" value={tx.amount}
              onChange={e => setTx(t => ({ ...t, amount: e.target.value }))} />
            <button type="submit" className={styles.btnSuccess}>Add to Contract</button>
          </form>
          <p className={styles.hint}>
            Calls <code>addTransaction()</code> on the Solidity contract — entry is written to all 3 nodes on-chain.
          </p>
        </div>
      )}

      {/* Tamper form */}
      {isAdmin && showTamper && (
        <div className={`${styles.panel} ${styles.tamperPanel}`}>
          <h3>⚠️ Tamper Node <span className={styles.adminTag}>(Admin Demo)</span></h3>
          <p className={styles.hint}>
            Calls <code>tamperNode()</code> — mutates an entry's amount WITHOUT updating its hash.
            Then click 🔍 Detect Tampering to see the on-chain mismatch.
          </p>
          <form className={styles.row} onSubmit={submitTamper}>
            <select value={tamperCfg.nodeIndex}
              onChange={e => setTamperCfg(c => ({ ...c, nodeIndex: e.target.value }))}>
              {NODE_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
            <input type="number" placeholder="Entry ID" value={tamperCfg.entryId}
              onChange={e => setTamperCfg(c => ({ ...c, entryId: e.target.value }))} />
            <input type="number" placeholder="New Amount" value={tamperCfg.newAmount}
              onChange={e => setTamperCfg(c => ({ ...c, newAmount: e.target.value }))} />
            <button type="submit" className={styles.btnDanger}>Execute Tamper</button>
            <button type="button" onClick={() => setShowTamper(false)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Node panels */}
      <div className={styles.nodesGrid}>
        {nodes.length === 0 && !loading && (
          <div className={styles.offline}>
            <p>🔌 Bridge is offline. Start the Hardhat network and bridge:</p>
            <code>cd blockchain</code>
            <code>npm run node &nbsp;&nbsp;&nbsp;# terminal 1 — starts Hardhat node</code>
            <code>npm run deploy &nbsp;# terminal 2 — deploys contract</code>
            <code>npm run bridge &nbsp;# terminal 2 — starts bridge on :3001</code>
          </div>
        )}
        {nodes.map(n => (
          <NodePanel key={n.nodeId} node={n} entries={entries[n.nodeIndex] || []}
            isAdmin={isAdmin} onTamper={openTamper} />
        ))}
      </div>
    </div>
  )
}
