import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// In dev, backend is on localhost:8080.
// In production, VITE_API_URL = https://your-backend.onrender.com
const WS_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/ws`
  : `${window.location.protocol}//${window.location.hostname}:8080/ws`

export function useAlertSocket(onMessage) {
  const clientRef   = useRef(null)
  const callbackRef = useRef(onMessage)

  useEffect(() => { callbackRef.current = onMessage }, [onMessage])

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/alerts', frame => {
          try {
            const payload = JSON.parse(frame.body)
            callbackRef.current(payload)
          } catch {
            // ignore malformed frames
          }
        })
      },
      onStompError: frame => {
        console.warn('[WS] STOMP error', frame.headers?.message)
      },
    })

    client.activate()
    clientRef.current = client

    return () => { client.deactivate() }
  }, [])
}
