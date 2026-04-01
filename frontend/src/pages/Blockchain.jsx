import { useState, useEffect, useRef } from 'react'
import { bcGetNodes, bcGetEntries, bcAddTx, bcDetect, bcTamper, bcReset,
         bcConsensus, bcStatus, bcStats, bcTamperHistory } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './Blockchain.module.css'

const NODE_NAMES  = ['Node-A', 'Node-B', 'Node-C']
const shortHash   = h => h ? h.slice(0, 8) + '…' + h.slice(-4) : '—'
const fmtTime     = ts => new Date(ts * 1000).toLocaleString()
const fmtAge      = s  => s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h`

function StatCard({ icon, label, value, sub, danger }) {
  return (
    <div className={`${styles.statCard} ${danger ? styles.statDanger : ''}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statVal}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

function HashChain({ entries }) {
  if (!entries.length) return <div className={styles.noEntries}>No transactions yet</div>
  return (
    <div className={styles.hashChain}>
      {entries.map((e, i) => (
        <div key={e.id} className={styles.hashChainRow}>
          <div className={`${styles.hashBlock} ${e.tampered ? styles.hashBlockTampered : ''}`}>
            <div className={styles.hashBlockId}>#{e.id}</div>
            <div className={styles.hashBlockFlow}>{e.from} → {e.to}</div>
            <div className={styles.hashBlockAmt}>{e.amount}</div>
            <div className={styles.hashBlockHash} title={e.currentHash}>
              {shortHash(e.currentHash)}
            </div>
            {e.tampered && <div className={styles.hashBlockTamperBadge}>⚠ TAMPERED</div>}
          </div>
          {i < entries.length - 1 && (
            <div className={styles.hashArrow} title={`prev: ${shortHash(entries[i+1]?.previousHash)}`}>→</div>
          )}
        </div>
      ))}
    </div>
  )
}

function NodePanel({ node, entries, isAdmin, onTamper }) {
  const [view, setView] = useState('list') // 'list' | 'chain'
  return (
    <div className={`${styles.nodePanel} ${node.tampered ? styles.nodePanelTampered : ''}`}>
      <div className={styles.nodeHeader}>
        <span className={styles.nodeId}>{node.nodeId}</span>
        <span className={`${styles.nodeBadge} ${node.tampered ? styles.badgeBad : styles.badgeOk}`}>
          {node.tampered ? '✗ Tampered' : '✓ Clean'}
        </span>
        <span className={styles.nodeLen}>{node.entryCount} entries</span>
        <div className={styles.viewToggle}>
          <button className={view === 'list'  ? styles.viewActive : ''} onClick={() => setView('list')}>List</button>
          <button className={view === 'chain' ? styles.viewActive : ''} onClick={() => setView('chain')}>Chain</button>
        </div>
      </div>
      <div className={styles.hashRow} title={node.ledgerHash}>
        ledgerHash: <code>{shortHash(node.ledgerHash)}</code>
      </div>

      {view === 'list' ? (
        <div className={styles.entries}>
          {entries.length === 0
            ? <div className={styles.noEntries}>No transactions yet</div>
            : entries.map(e => <EntryRow key={e.id} entry={e} />)}
        </div>
      ) : (
        <HashChain entries={[...entries].reverse()} />
      )}

      {isAdmin && (
        <button onClick={() => onTamper(node.nodeIndex)} className={styles.btnDanger}>
          ⚠ Tamper this node
        </button>
      )}
    </div>
  )
}

function EntryRow({ entry }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`${styles.entry} ${entry.tampered ? styles.entryTampered : ''}`}
         onClick={() => setOpen(o => !o)}>
      <div className={styles.entryMain}>
        <span className={styles.entryId}>#{entry.id}</span>
        <span className={styles.entryFlow}>{entry.from} → {entry.to}</span>
        <span className={styles.entryAmt}>{entry.amount}</span>
        <span className={styles.entryTime}>{fmtTime(entry.timestamp)}</span>
        {entry.tampered && <span className={styles.tamperBadge}>TAMPERED</span>}
      </div>
      {open && (
        <div className={styles.entryDetail}>
          <div>currentHash: <code>{entry.currentHash}</code></div>
          <div>prevHash:    <code>{entry.previousHash}</code></div>
        </div>
      )}
    </div>
  )
}

export default function Blockchain() {
  const { auth } = useAuth()
  const isAdmin = auth?.role === 'ADMIN'
  const canTx   = ['ADMIN', 'AUDITOR', 'USER'].includes(auth?.role)

  const [nodes,        setNodes]        = useState([])
  const [entries,      setEntries]      = useState({ 0: [], 1: [], 2: [] })
  const [consensus,    setConsensus]    = useState(null)
  const [detect,       setDetect]       = useState(null)
  const [status,       setStatus]       = useState(null)
  const [stats,        setStats]        = useState(null)
  const [tamperHist,   setTamperHist]   = useState([])
  const [loading,      setLoading]      = useState(false)
  const [autoRefresh,  setAutoRefresh]  = useState(false)
  const [msg,          setMsg]          = useState(null)
  const [tx,           setTx]           = useState({ from: 'Alice', to: 'Bob', amount: 100 })
  const [tamperCfg,    setTamperCfg]    = useState({ nodeIndex: 0, entryId: 1, newAmount: 9999 })
  const [showTamper,   setShowTamper]   = useState(false)
  const [showHistory,  setShowHistory]  = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 5000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoRefresh])

  const load = async () => {
    setLoading(true)
    try {
      const [nodesRes, conRes, statusRes, statsRes, histRes] = await Promise.all([
        bcGetNodes(), bcConsensus(), bcStatus(), bcStats(), bcTamperHistory()
      ])
      setNodes(nodesRes.data)
      setConsensus(conRes.data)
      setStatus(statusRes.data)
      setStats(statsRes.data)
      setTamperHist(histRes.data)

      const [e0, e1, e2] = await Promise.all([
        bcGetEntries(0), bcGetEntries(1), bcGetEntries(2)
      ])
      setEntries({ 0: e0.data, 1: e1.data, 2: e2.data })
    } catch {
      flash('Bridge offline — start blockchain nodes', 'error')
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

      {/* Top bar */}
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>⛓ Blockchain Ledger</h2>
          {status && (
            <div className={styles.contractInfo}>
              <code>{status.contractAddress}</code> · {status.network}
            </div>
          )}
        </div>
        <div className={styles.topActions}>
          <label className={styles.autoRefreshToggle}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-refresh
          </label>
          <button onClick={load} disabled={loading}>{loading ? '…' : '↻ Refresh'}</button>
          <button onClick={handleDetect} className={styles.btnDetect}>🔍 Detect Tampering</button>
          {isAdmin && <button onClick={() => setShowTamper(true)} className={styles.btnWarn}>⚠ Tamper</button>}
          {isAdmin && <button onClick={handleReset} className={styles.btnDanger}>↺ Reset</button>}
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className={styles.statsBar}>
          <StatCard icon="📦" label="Transactions" value={stats.totalTransactions} />
          <StatCard icon="⚠" label="Tamper Attempts" value={stats.tamperCount} danger={stats.tamperCount > 0} />
          <StatCard icon="🔍" label="Detections Run" value={stats.detectCount} />
          <StatCard icon="🖥" label="Compromised Nodes" value={`${stats.tamperedNodeCount}/3`} danger={stats.tamperedNodeCount > 0} />
          <StatCard icon="⏱" label="Contract Age" value={fmtAge(stats.contractAge)} />
        </div>
      )}

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
      {detect?.tamperedEntries?.length > 0 && (
        <div className={`${styles.panel} ${styles.detectPanel}`}>
          <strong>⚠ Tampered entries found on-chain:</strong>
          {detect.tamperedEntries.map((d, i) => (
            <div key={i} className={styles.detectRow}>
              <span className={styles.detectNode}>{d.nodeId}</span>
              entry #{d.entryId} ·
              stored: <code>{shortHash(d.storedHash)}</code> ≠
              recomputed: <code>{shortHash(d.recomputedHash)}</code>
            </div>
          ))}
        </div>
      )}

      {/* Add transaction */}
      {canTx && (
        <div className={styles.panel}>
          <h3>📝 Add Transaction</h3>
          <form className={styles.row} onSubmit={handleAddTx}>
            <input placeholder="From" value={tx.from} onChange={e => setTx(t => ({ ...t, from: e.target.value }))} required />
            <input placeholder="To"   value={tx.to}   onChange={e => setTx(t => ({ ...t, to: e.target.value }))} required />
            <input type="number" placeholder="Amount" value={tx.amount} min="1"
              onChange={e => setTx(t => ({ ...t, amount: e.target.value }))} required />
            <button type="submit" className={styles.btnSuccess}>Add to All Nodes</button>
          </form>
          <p className={styles.hint}>Calls <code>addTransaction()</code> — written to all 3 nodes with keccak256 hash chain.</p>
        </div>
      )}

      {/* Tamper form */}
      {isAdmin && showTamper && (
        <div className={`${styles.panel} ${styles.tamperPanel}`}>
          <h3>⚠️ Tamper Node <span className={styles.adminTag}>Admin Demo</span></h3>
          <p className={styles.hint}>
            Calls <code>tamperNode()</code> — mutates amount WITHOUT updating the hash. Run Detect to catch it.
          </p>
          <form className={styles.row} onSubmit={submitTamper}>
            <select value={tamperCfg.nodeIndex} onChange={e => setTamperCfg(c => ({ ...c, nodeIndex: e.target.value }))}>
              {NODE_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
            <input type="number" placeholder="Entry ID" value={tamperCfg.entryId} min="1"
              onChange={e => setTamperCfg(c => ({ ...c, entryId: e.target.value }))} />
            <input type="number" placeholder="New Amount" value={tamperCfg.newAmount}
              onChange={e => setTamperCfg(c => ({ ...c, newAmount: e.target.value }))} />
            <button type="submit" className={styles.btnDanger}>Execute Tamper</button>
            <button type="button" onClick={() => setShowTamper(false)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Tamper history */}
      {tamperHist.length > 0 && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>🕵 Tamper History ({tamperHist.length})</h3>
            <button onClick={() => setShowHistory(h => !h)}>{showHistory ? 'Hide' : 'Show'}</button>
          </div>
          {showHistory && (
            <table className={styles.histTable}>
              <thead><tr><th>Node</th><th>Entry</th><th>New Amount</th><th>Time</th></tr></thead>
              <tbody>
                {[...tamperHist].reverse().map((r, i) => (
                  <tr key={i}>
                    <td><span className={styles.badgeBad}>{r.nodeId}</span></td>
                    <td>#{r.entryId}</td>
                    <td className={styles.tamperAmt}>{r.newAmount}</td>
                    <td>{fmtTime(r.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Node panels */}
      <div className={styles.nodesGrid}>
        {nodes.length === 0 && !loading && (
          <div className={styles.offline}>
            <p>🔌 Bridge is offline.</p>
            <code>cd blockchain && npx hardhat node</code>
            <code>npm run deploy && npm run bridge</code>
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
