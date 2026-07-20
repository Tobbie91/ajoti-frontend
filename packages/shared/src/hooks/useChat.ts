// packages/shared/src/hooks/useChat.ts
//
// Socket.io connection + circle chat state management — previously
// duplicated near-identically in the user and admin apps. Each app's own
// getChatBaseUrl/getAccessToken/getChatMessages stay where they are (they
// go through that app's own api-client instance), injected here as config
// so this hook has no direct dependency on either app's utils/api.ts.
import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface UseChatConfig<TMessage> {
  chatBaseUrl: string
  getAccessToken: () => string | null
  fetchMessages: (circleId: string) => Promise<TMessage[]>
}

export function useChat<TMessage extends { id: string }>(
  circleId: string | null,
  config: UseChatConfig<TMessage>,
) {
  const { chatBaseUrl, getAccessToken, fetchMessages } = config

  const [messages, setMessages] = useState<TMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const joinedRef = useRef<string | null>(null)

  // Connect socket once
  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const socket = io(`${chatBaseUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('chat.message', (msg: TMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      joinedRef.current = null
    }
  }, [])

  // Join/leave room when circleId changes
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    if (joinedRef.current && joinedRef.current !== circleId) {
      socket.emit('chat.leave', joinedRef.current)
      joinedRef.current = null
    }

    if (!circleId) {
      setMessages([])
      return
    }

    setLoading(true)
    setMessages([])

    fetchMessages(circleId)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false))

    socket.emit('chat.join', circleId)
    joinedRef.current = circleId
  }, [circleId])

  const sendMessage = useCallback(
    async (body: string) => {
      if (!circleId || !body.trim() || !socketRef.current) return
      setSending(true)
      socketRef.current.emit('chat.send', { circleId, body: body.trim() })
      setSending(false)
    },
    [circleId],
  )

  return { messages, loading, sending, sendMessage }
}
