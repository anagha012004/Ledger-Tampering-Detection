import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

/**
 * Connects to the Spring STOMP broker at /ws and subscribes to /topic/alerts.
 * Calls onMessage(payload) for every frame received.
 * Automatically reconnects on disconnect.
 */
export function useAlertSocket(onMessage) {
  const clientRef  = useRef(null)
  const callbackRef = useRef(onMessage)

  // Keep callback ref fresh without restarting the socket
  useEffect(() => { callbackRef.current = onMessage }, [onMessage])

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
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
