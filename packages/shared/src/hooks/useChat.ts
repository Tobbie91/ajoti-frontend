// Shared chat state: HTTP handles durable reads/writes, WebSocket only real-time updates.
import { useState, useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'

export interface UseChatConfig<TMessage> {
  chatBaseUrl: string
  fetchMessages: (circleId: string) => Promise<TMessage[]>
  postMessage: (circleId: string, body: string) => Promise<TMessage>
}

export function useChat<TMessage extends { id: string }>(
  circleId: string | null,
  config: UseChatConfig<TMessage>,
) {
  const { chatBaseUrl, fetchMessages, postMessage } = config
  const [messages, setMessages] = useState<TMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const joinedRef = useRef<string | null>(circleId)
  joinedRef.current = circleId

  const mergeMessages = useCallback((incoming: TMessage[]) => {
    setMessages((prev) => {
      const byId = new Map<string, TMessage>()
      // Server history is oldest -> newest, followed by any real-time messages.
      for (const msg of incoming) byId.set(msg.id, msg)
      for (const msg of prev) byId.set(msg.id, msg)
      return [...byId.values()]
    })
  }, [])

  useEffect(() => {
    const socket = io(`${chatBaseUrl}/chat`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    // Rooms are lost after a disconnect, so join again on every reconnect.
    socket.on('connect', () => {
      if (joinedRef.current) socket.emit('chat.join', joinedRef.current)
    })
    socket.on('chat.message', (msg: TMessage) => mergeMessages([msg]))
    socket.on('chat.error', (data: { message?: string }) => {
      setError(data.message ?? 'Unable to receive the chat update')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [chatBaseUrl, mergeMessages])

  useEffect(() => {
    const socket = socketRef.current
    if (circleId && socket?.connected) socket.emit('chat.join', circleId)
    setMessages([])
    setError(null)
    if (!circleId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetchMessages(circleId)
      .then((history) => { if (!cancelled) mergeMessages(history) })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load messages')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    // When proxies block Socket.IO, HTTP polling keeps incoming messages visible.
    const interval = setInterval(() => {
      if (socket?.connected || (typeof document !== 'undefined' && document.hidden)) return
      fetchMessages(circleId)
        .then((history) => { if (!cancelled) mergeMessages(history) })
        .catch(() => {})
    }, 12000)

    return () => {
      cancelled = true
      clearInterval(interval)
      if (socket?.connected) socket.emit('chat.leave', circleId)
    }
  }, [circleId, fetchMessages, mergeMessages])

  const sendMessage = useCallback(async (body: string) => {
    if (!circleId || !body.trim()) throw new Error('Select a conversation and enter a message')
    setSending(true)
    setError(null)
    try {
      const saved = await postMessage(circleId, body.trim())
      mergeMessages([saved])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send message')
      throw reason
    } finally {
      setSending(false)
    }
  }, [circleId, postMessage, mergeMessages])

  return { messages, loading, sending, error, sendMessage }
}
