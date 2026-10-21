import { useEffect, useMemo, useState } from 'react'
import { Loader, Text, TextInput } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useSearchParams } from 'react-router-dom'
import {
  getChatCircles,
  getDirectChatThreads,
  getDirectChatMessages,
  sendDirectChatMessage,
  type ChatCircle,
  type DirectChatMessage,
  type DirectChatThread,
  type DirectChatThreadCursor,
} from '@/utils/api'

const PRIMARY = '#02A36E'

function DirectThread({ circleId, memberId, title, onBack }: { circleId: string; memberId: string; title: string; onBack?: () => void }) {
  const [messages, setMessages] = useState<DirectChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlderMessages, setHasOlderMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setMessages([])
    setHasOlderMessages(false)
    setDraft('')
    setError(null)
    setLoading(true)

    function refresh() {
      getDirectChatMessages(circleId, memberId)
        .then((incoming) => {
          if (active) {
            setHasOlderMessages(incoming.length >= 50)
            setMessages((prev) => {
              const byId = new Map(prev.map((m) => [m.id, m]))
              for (const message of incoming) byId.set(message.id, message)
              return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            })
          }
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

  async function loadOlderMessages() {
    if (!hasOlderMessages || loadingOlder || messages.length === 0) return
    setLoadingOlder(true)
    try {
      const older = await getDirectChatMessages(circleId, memberId, messages[0].createdAt)
      setMessages((prev) => {
        const byId = new Map(older.map((message) => [message.id, message]))
        for (const message of prev) byId.set(message.id, message)
        return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      })
      setHasOlderMessages(older.length >= 50)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load older messages')
    } finally {
      setLoadingOlder(false)
    }
  }

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
      <div style={{ borderBottom: '1px solid #E5E7EB', padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="flex sm:hidden"
            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: '#374151' }}
          >
            <IconArrowLeft size={20} />
          </button>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text fw={700} truncate="end">{title}</Text>
          <Text size="xs" c="dimmed">Private conversation. Only this member and the group admin can read these messages.</Text>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
        {hasOlderMessages && (
          <button type="button" disabled={loadingOlder} onClick={() => { void loadOlderMessages() }} style={{ alignSelf: 'center', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, opacity: loadingOlder ? 0.5 : 1 }}>
            {loadingOlder ? 'Loading older messages…' : 'Load older messages'}
          </button>
        )}
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
  const [threadCursor, setThreadCursor] = useState<DirectChatThreadCursor | null>(null)
  const [loadingMoreThreads, setLoadingMoreThreads] = useState(false)
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
      .then(([threadPage, loadedCircles]) => {
        setThreads(threadPage.threads)
        setThreadCursor(threadPage.nextCursor)
        setCircles(loadedCircles)
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load conversations'))
      .finally(() => setLoading(false))
  }, [])

  async function loadMoreThreads() {
    if (!threadCursor || loadingMoreThreads) return
    setLoadingMoreThreads(true)
    setError(null)
    try {
      const page = await getDirectChatThreads(threadCursor)
      setThreads((current) => {
        const seen = new Set(current.map((thread) => `${thread.circleId}:${thread.memberId}`))
        return [...current, ...page.threads.filter((thread) => !seen.has(`${thread.circleId}:${thread.memberId}`))]
      })
      setThreadCursor(page.nextCursor)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load more conversations')
    } finally {
      setLoadingMoreThreads(false)
    }
  }

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

  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  function selectThread(circleId: string, memberId: string) {
    setParams({ view: 'direct', circleId, memberId })
    setMobileView('thread')
  }

  // When a selected conversation is resolved from URL params on load, auto-swap
  // to the thread pane on mobile so the user doesn't land on the list.
  useEffect(() => {
    if (requestedCircleId && selected) setMobileView('thread')
  }, [requestedCircleId, selected])

  return (
    <div
      className="flex overflow-hidden rounded-xl border border-[#E5E7EB]"
      style={{ minHeight: 500, height: 'calc(100vh - 160px)' }}
    >
      {/* List pane — full-width on mobile, 265px side on desktop */}
      <div
        className={`${mobileView === 'thread' ? 'hidden' : 'flex'} sm:flex w-full flex-col overflow-y-auto sm:w-[265px] sm:flex-shrink-0 sm:border-r sm:border-[#E5E7EB]`}
      >
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
        {threadCursor && (
          <button
            type="button"
            disabled={loadingMoreThreads}
            onClick={() => { void loadMoreThreads() }}
            style={{ border: 0, background: 'white', padding: 16, color: PRIMARY, cursor: 'pointer', opacity: loadingMoreThreads ? 0.5 : 1 }}
          >
            {loadingMoreThreads ? 'Loading conversations…' : 'Load more conversations'}
          </button>
        )}
      </div>

      {/* Thread pane — full-width on mobile when active, right pane on desktop */}
      <div
        className={`${mobileView === 'list' ? 'hidden' : 'flex'} sm:flex w-full flex-col sm:flex-1 sm:min-w-0`}
      >
        {selected ? (
          <DirectThread
            key={`${selected.circleId}:${selected.memberId}`}
            circleId={selected.circleId}
            memberId={selected.memberId}
            title={selected.isCircleAdmin ? selected.memberName : `Group admin · ${selected.circleName}`}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <Text size="sm" c="dimmed" style={{ padding: 24 }}>Choose a private conversation, or use Message Admin in a group to start one.</Text>
        )}
      </div>
    </div>
  )
}
