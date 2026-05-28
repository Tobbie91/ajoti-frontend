import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  getChatBaseUrl,
  getAccessToken,
  getChatMessages,
  type ChatMessage,
} from '@/utils/api'

export function useChat(circleId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const joinedRef = useRef<string | null>(null)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const socket = io(`${getChatBaseUrl()}/chat`, {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('chat.message', (msg: ChatMessage) => {
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

    getChatMessages(circleId)
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
