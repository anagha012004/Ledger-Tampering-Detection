import { useState, useEffect } from 'react'
import { getSnapshots, createSnapshot, compareSnapshot } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './Snapshots.module.css'

export default function Snapshots() {
  const { auth } = useAuth()
  const isAdmin = auth?.role === 'ADMIN'

  const [snapshots, setSnapshots] = useState([])
  const [label,     setLabel]     = useState('')
  const [diffs,     setDiffs]     = useState(null)
  const [selId,     setSelId]     = useState('')
  const [loading,   setLoading]   = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const { data } = await getSnapshots(); setSnapshots(data) } catch {}
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      await createSnapshot(label || 'Manual-' + new Date().toISOString().substring(0,19), auth?.user || 'admin')
      setLabel('')
      load()
    } catch {}
    finally { setLoading(false) }
  }

  const handleCompare = async () => {
    try {
      const { data } = await compareSnapshot(selId || null)
      setDiffs(data)
    } catch {}
  }

  return (
    <div className={styles.page}>
      {isAdmin && (
        <div className={styles.panel}>
          <h3>📸 Create Snapshot</h3>
          <div className={styles.row}>
            <input placeholder="Label (optional)" value={label} onChange={e => setLabel(e.target.value)} />
            <button onClick={handleCreate} disabled={loading}>{loading ? 'Creating…' : 'Create Snapshot'}</button>
          </div>
        </div>
      )}

      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>📋 Snapshot History</h3>
          <button className={styles.refresh} onClick={load}>↻ Refresh</button>
        </div>
        {snapshots.length === 0
          ? <p className={styles.empty}>No snapshots yet</p>
          : <table className={styles.table}>
              <thead>
                <tr><th>ID</th><th>Label</th><th>Created At</th><th>By</th><th>Tx Count</th><th>Node-A Merkle</th><th>Node-B Merkle</th><th>Node-C Merkle</th></tr>
              </thead>
              <tbody>
                {snapshots.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td><strong>{s.label}</strong></td>
                    <td className={styles.mono}>{s.createdAt?.replace('T',' ').substring(0,19)}</td>
                    <td>{s.createdBy}</td>
                    <td>{s.transactionCount}</td>
                    <td className={styles.hash}>{s.merkleRootNodeA?.substring(0,12)}…</td>
                    <td className={styles.hash}>{s.merkleRootNodeB?.substring(0,12)}…</td>
                    <td className={styles.hash}>{s.merkleRootNodeC?.substring(0,12)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      <div className={styles.panel}>
        <h3>🔍 Compare Snapshot vs Current</h3>
        <div className={styles.row}>
          <select value={selId} onChange={e => setSelId(e.target.value)}>
            <option value="">Latest snapshot</option>
            {snapshots.map(s => <option key={s.id} value={s.id}>#{s.id} — {s.label}</option>)}
          </select>
          <button onClick={handleCompare}>Compare</button>
        </div>

        {diffs && (
          <div className={styles.diffs}>
            {diffs.length === 0 || (diffs[0]?.message)
              ? <p className={styles.empty}>{diffs[0]?.message || '✅ No divergence detected'}</p>
              : diffs.map((d, i) => (
                  <div key={i} className={`${styles.diffCard} ${d.diverged ? styles.diffBad : styles.diffOk}`}>
                    <div className={styles.diffHeader}>
                      <strong>{d.nodeId}</strong>
                      <span className={d.diverged ? styles.tagBad : styles.tagOk}>
                        {d.diverged ? '⚠ DIVERGED' : '✓ MATCH'}
                      </span>
                    </div>
                    <div className={styles.diffRow}><span>Snapshot:</span><code>{d.snapshotMerkle}</code></div>
                    <div className={styles.diffRow}><span>Current:</span><code>{d.currentMerkle}</code></div>
                  </div>
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
