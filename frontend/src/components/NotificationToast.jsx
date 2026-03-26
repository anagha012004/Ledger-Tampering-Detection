import { useState, useCallback } from 'react'
import { useAlertSocket } from '../hooks/useAlertSocket'
import styles from './NotificationToast.module.css'

let idCounter = 0

export default function NotificationToast() {
  const [toasts, setToasts] = useState([])

  const dismiss = id =>
    setToasts(prev => prev.filter(t => t.id !== id))

  const onMessage = useCallback(payload => {
    const id = ++idCounter

    // STATUS_UPDATE with no tampering → skip (not worth a toast)
    if (payload.type === 'STATUS_UPDATE' && !payload.tampered) return

    const toast = {
      id,
      type:    payload.type,
      title:   payload.type === 'TAMPER_ALERT' ? `⚠ Tampering — ${payload.nodeId}` : '🔔 Status Update',
      body:    payload.details || payload.message || '',
      severity: payload.severity || null,
      time:    new Date().toLocaleTimeString(),
    }

    setToasts(prev => [toast, ...prev].slice(0, 5)) // max 5 visible

    // Auto-dismiss after 8 s
    setTimeout(() => dismiss(id), 8000)
  }, [])

  useAlertSocket(onMessage)

  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${t.type === 'TAMPER_ALERT' ? styles.danger : styles.info}`}>
          <div className={styles.header}>
            <span className={styles.title}>{t.title}</span>
            {t.severity && (
              <span className={`${styles.sev} ${styles['sev_' + t.severity.toLowerCase()]}`}>
                {t.severity}
              </span>
            )}
            <span className={styles.time}>{t.time}</span>
            <button className={styles.close} onClick={() => dismiss(t.id)}>✕</button>
          </div>
          {t.body && <div className={styles.body}>{t.body}</div>}
        </div>
      ))}
    </div>
  )
}
