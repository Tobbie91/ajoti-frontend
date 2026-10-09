import { useEffect, useMemo, useState } from 'react'
import { Loader, Text, TextInput } from '@mantine/core'
import { useSearchParams } from 'react-router-dom'
import {
  getChatCircles,
  getDirectChatThreads,
  getDirectChatMessages,
  sendDirectChatMessage,
  type ChatCircle,
  type DirectChatMessage,
  type DirectChatThread,
} from '@/utils/api'

const PRIMARY = '#02A36E'

function DirectThread({ circleId, memberId, title }: { circleId: string; memberId: string; title: string }) {
  const [messages, setMessages] = useState<DirectChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setMessages([])
    setDraft('')
    setError(null)
    setLoading(true)

    function refresh() {
      getDirectChatMessages(circleId, memberId)
        .then((incoming) => {
          if (active) setMessages((prev) => {
            const byId = new Map(prev.map((m) => [m.id, m]))
            for (const message of incoming) byId.set(message.id, message)
            return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          })
        })
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : 'Unable to load private messages')
        })
        .finally(() => { if (active) setLoading(false) })
    }

    refresh()
    const interval = setInterval(() => {
      if (!document.hidden) refresh()
    }, 10000)
    return () => { active = false; clearInterval(interval) }
  }, [circleId, memberId])

  async function handleSend() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    try {
      const saved = await sendDirectChatMessage(circleId, memberId, body)
      setMessages((prev) => prev.some((msg) => msg.id === saved.id) ? prev : [...prev, saved])
      setDraft('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send your message')
    } finally {
      setSending(false)
    }
  }

  const currentUserId = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { id?: string; _id?: string }
      return user.id ?? user._id ?? ''
    } catch { return '' }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 440 }}>
      <div style={{ borderBottom: '1px solid #E5E7EB', padding: 16 }}>
        <Text fw={700}>{title}</Text>
        <Text size="xs" c="dimmed">Private conversation. Only this member and the group admin can read these messages.</Text>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
        {loading && <Loader size="sm" color={PRIMARY} />}
        {!loading && messages.length === 0 && !error && <Text c="dimmed" size="sm">No private messages yet. Start the conversation below.</Text>}
        {messages.map((msg) => {
          const mine = msg.senderId === currentUserId
          return (
            <div key={msg.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', background: mine ? '#E5F7EF' : '#F3F4F6', padding: '10px 14px', borderRadius: 12 }}>
              <Text size="xs" fw={600} c="dimmed">{msg.senderName}</Text>
              <Text size="sm" style={{ overflowWrap: 'anywhere' }}>{msg.body}</Text>
              <Text size="xs" c="dimmed">{new Date(msg.createdAt).toLocaleString('en-NG')}</Text>
            </div>
          )
        })}
      </div>
      {error && <Text size="sm" c="red" role="alert" style={{ padding: '8px 16px' }}>{error}</Text>}
      <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #E5E7EB' }}>
        <TextInput
          style={{ flex: 1 }}
          placeholder="Type a private message…"
          value={draft}
          maxLength={2000}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void handleSend() } }}
        />
        <button
          type="button"
          disabled={!draft.trim() || sending}
          onClick={() => { void handleSend() }}
          style={{ background: PRIMARY, color: 'white', border: 0, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', opacity: sending ? 0.5 : 1 }}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export function DirectMessages() {
  const [params, setParams] = useSearchParams()
  const [threads, setThreads] = useState<DirectChatThread[]>([])
  const [circles, setCircles] = useState<ChatCircle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestedCircleId = params.get('circleId')
  const requestedMemberId = params.get('memberId')

  const currentUserId = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { id?: string; _id?: string }
      return user.id ?? user._id ?? ''
    } catch { return '' }
  })()

  useEffect(() => {
    Promise.all([getDirectChatThreads(), getChatCircles()])
      .then(([loadedThreads, loadedCircles]) => {
        setThreads(loadedThreads)
        setCircles(loadedCircles)
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load conversations'))
      .finally(() => setLoading(false))
  }, [])

  const selected = useMemo(() => {
    const match = threads.find((thread) =>
      thread.circleId === requestedCircleId && thread.memberId === (requestedMemberId ?? currentUserId),
    )
    if (match) return match
    if (requestedCircleId) {
      const circle = circles.find((c) => c.id === requestedCircleId)
      if (circle && (!requestedMemberId || requestedMemberId === currentUserId || requestedMemberId === 'me')) {
        return {
          circleId: requestedCircleId,
          circleName: circle.name,
          memberId: currentUserId || 'me',
          memberName: 'You',
          isCircleAdmin: false,
          lastMessage: null,
        }
      }
    }
    return requestedCircleId ? null : threads[0] ?? null
  }, [threads, circles, currentUserId, requestedCircleId, requestedMemberId])

  function selectThread(circleId: string, memberId: string) {
    setParams({ view: 'direct', circleId, memberId })
  }

  return (
    <div style={{ display: 'flex', minHeight: 500, height: 'calc(100vh - 160px)', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ width: 265, flexShrink: 0, borderRight: '1px solid #E5E7EB', overflowY: 'auto' }}>
        <Text fw={700} style={{ padding: 16 }}>Private conversations</Text>
        {loading && <Loader size="sm" color={PRIMARY} style={{ margin: 16 }} />}
        {error && <Text size="xs" c="red" style={{ padding: 16 }}>{error}</Text>}
        {!loading && threads.length === 0 && <Text size="sm" c="dimmed" style={{ padding: 16 }}>No conversations yet. Open a group and choose Message Admin to start one.</Text>}
        {threads.map((thread) => (
          <button key={`${thread.circleId}:${thread.memberId}`} type="button" onClick={() => selectThread(thread.circleId, thread.memberId)}
            style={{ display: 'block', width: '100%', border: 0, borderBottom: '1px solid #E5E7EB', background: selected?.circleId === thread.circleId && selected?.memberId === thread.memberId ? '#E5F7EF' : 'white', textAlign: 'left', padding: 16, cursor: 'pointer' }}>
            <Text fw={600} size="sm">{thread.isCircleAdmin ? thread.memberName : 'Group admin'}</Text>
            <Text size="xs" c="dimmed">{thread.circleName}</Text>
            <Text size="xs" c="dimmed" lineClamp={1}>{thread.lastMessage.body}</Text>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {selected ? <DirectThread key={`${selected.circleId}:${selected.memberId}`} circleId={selected.circleId} memberId={selected.memberId} title={selected.isCircleAdmin ? selected.memberName : `Group admin · ${selected.circleName}`} /> : (
          <Text size="sm" c="dimmed" style={{ padding: 24 }}>Choose a private conversation, or use Message Admin in a group to start one.</Text>
        )}
      </div>
    </div>
  )
}
