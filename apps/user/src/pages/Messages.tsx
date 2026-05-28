import { useState, useEffect, useRef } from 'react'
import { Loader, Text, TextInput } from '@mantine/core'
import { IconSend, IconMessages, IconSearch, IconChevronLeft } from '@tabler/icons-react'
import { getChatCircles, getAccessToken, type ChatCircle } from '@/utils/api'
import { useChat } from '@/hooks/useChat'

const PRIMARY = '#02A36E'
const PRIMARY_LIGHT = '#F0FDF4'

function timeLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - d.getTime()) / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h`
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

function CircleListItem({ circle, active, onClick }: { circle: ChatCircle; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: active ? PRIMARY_LIGHT : 'transparent',
        border: 'none', borderBottom: '1px solid #F3F4F6',
        cursor: 'pointer', width: '100%', textAlign: 'left',
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {circle.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text fw={600} fz={15} style={{ color: '#0F172A' }} truncate="end">{circle.name}</Text>
          {circle.lastMessage && <Text fz={11} c="dimmed" style={{ flexShrink: 0, marginLeft: 8 }}>{timeLabel(circle.lastMessage.createdAt)}</Text>}
        </div>
        {circle.lastMessage ? (
          <Text fz={13} c="dimmed" truncate="end" style={{ marginTop: 2 }}>
            <span style={{ fontWeight: 500 }}>{circle.lastMessage.senderName.split(' ')[0]}:</span>{' '}{circle.lastMessage.body}
          </Text>
        ) : (
          <Text fz={13} c="dimmed" style={{ marginTop: 2 }}>No messages yet</Text>
        )}
      </div>
    </button>
  )
}

function ChatThread({ circleId, circleName, currentUserId, onBack }: { circleId: string; circleName: string; currentUserId: string; onBack: () => void }) {
  const { messages, loading, sending, sendMessage } = useChat(circleId)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    sendMessage(text)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}>
          <IconChevronLeft size={22} color="#374151" />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {circleName.charAt(0).toUpperCase()}
        </div>
        <div>
          <Text fw={700} fz={15} style={{ color: '#0F172A' }}>{circleName}</Text>
          <Text fz={11} c="dimmed">Group chat</Text>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <Loader size="sm" color={PRIMARY} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, opacity: 0.5 }}>
            <IconMessages size={36} color="#9CA3AF" />
            <Text fz={13} c="dimmed">No messages yet. Say hello!</Text>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                {!isMe && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {msg.senderInitials}
                  </div>
                )}
                <div style={{ maxWidth: '75%' }}>
                  {!isMe && <Text fz={11} fw={600} style={{ color: PRIMARY, marginBottom: 2, paddingLeft: 4 }}>{msg.senderName}</Text>}
                  <div style={{ padding: '8px 12px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? PRIMARY : '#F3F4F6', color: isMe ? '#fff' : '#0F172A', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {msg.body}
                  </div>
                  <Text fz={10} c="dimmed" style={{ marginTop: 3, textAlign: isMe ? 'right' : 'left', paddingLeft: 4, paddingRight: 4 }}>
                    {timeLabel(msg.createdAt)}
                  </Text>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #F3F4F6', background: '#fff', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <TextInput
          style={{ flex: 1 }}
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          radius="xl"
          size="md"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          style={{ width: 42, height: 42, borderRadius: '50%', background: draft.trim() ? PRIMARY : '#E5E7EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: draft.trim() ? 'pointer' : 'default', transition: 'background 0.15s', flexShrink: 0 }}
        >
          <IconSend size={18} color={draft.trim() ? '#fff' : '#9CA3AF'} />
        </button>
      </div>
    </div>
  )
}

export function Messages() {
  const [circles, setCircles] = useState<ChatCircle[]>([])
  const [loadingCircles, setLoadingCircles] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const currentUserId = (() => {
    try {
      const token = getAccessToken()
      if (!token) return ''
      const payload = JSON.parse(atob(token.split('.')[1]))
      return (payload.sub ?? payload.userId ?? '') as string
    } catch { return '' }
  })()

  useEffect(() => {
    getChatCircles()
      .then((data) => { setCircles(data) })
      .catch(() => {})
      .finally(() => setLoadingCircles(false))
  }, [])

  const filtered = circles.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
  const selectedCircle = circles.find((c) => c.id === selectedId) ?? null

  // Mobile: show thread when selected, list otherwise
  if (selectedCircle) {
    return (
      <div style={{ height: 'calc(100vh - 80px)' }}>
        <ChatThread
          key={selectedCircle.id}
          circleId={selectedCircle.id}
          circleName={selectedCircle.name}
          currentUserId={currentUserId}
          onBack={() => setSelectedId(null)}
        />
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 8px' }}>
        <Text fw={700} fz={20} style={{ color: '#0F172A', marginBottom: 12 }}>Messages</Text>
        <TextInput
          placeholder="Search circles…"
          leftSection={<IconSearch size={15} />}
          radius="xl"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      {loadingCircles ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
          <Loader color={PRIMARY} size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 10 }}>
          <IconMessages size={40} color="#D1D5DB" />
          <Text fw={600} fz={15} style={{ color: '#374151' }}>No circles yet</Text>
          <Text fz={13} c="dimmed" style={{ textAlign: 'center' }}>Join or create a ROSCA circle to start chatting.</Text>
        </div>
      ) : (
        <div>
          {filtered.map((c) => (
            <CircleListItem key={c.id} circle={c} active={false} onClick={() => setSelectedId(c.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
