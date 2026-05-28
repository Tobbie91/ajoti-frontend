import { useState, useEffect, useRef } from 'react'
import { Loader, Text, TextInput } from '@mantine/core'
import { IconSend, IconMessages, IconSearch } from '@tabler/icons-react'
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
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: active ? PRIMARY_LIGHT : 'transparent',
        border: 'none',
        borderLeft: active ? `3px solid ${PRIMARY}` : '3px solid transparent',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 42, height: 42, borderRadius: '50%',
          background: active ? PRIMARY : '#E5E7EB',
          color: active ? '#fff' : '#6B7280',
          fontWeight: 700, fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {circle.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text fw={600} fz={14} style={{ color: '#0F172A' }} truncate="end">{circle.name}</Text>
          {circle.lastMessage && (
            <Text fz={11} c="dimmed" style={{ flexShrink: 0, marginLeft: 8 }}>{timeLabel(circle.lastMessage.createdAt)}</Text>
          )}
        </div>
        {circle.lastMessage ? (
          <Text fz={12} c="dimmed" truncate="end" style={{ marginTop: 2 }}>
            <span style={{ fontWeight: 500 }}>{circle.lastMessage.senderName.split(' ')[0]}:</span>{' '}{circle.lastMessage.body}
          </Text>
        ) : (
          <Text fz={12} c="dimmed" style={{ marginTop: 2 }}>No messages yet</Text>
        )}
      </div>
    </button>
  )
}

function ChatThread({ circleId, circleName, currentUserId }: { circleId: string; circleName: string; currentUserId: string }) {
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
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#fff' }}>
        <Text fw={700} fz={16} style={{ color: '#0F172A' }}>{circleName}</Text>
        <Text fz={12} c="dimmed">Group chat</Text>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <Loader size="sm" color={PRIMARY} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, opacity: 0.5 }}>
            <IconMessages size={36} color="#9CA3AF" />
            <Text fz={14} c="dimmed">No messages yet. Say hello!</Text>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                {!isMe && (
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {msg.senderInitials}
                  </div>
                )}
                <div style={{ maxWidth: '70%' }}>
                  {!isMe && (
                    <Text fz={11} fw={600} style={{ color: PRIMARY, marginBottom: 2, paddingLeft: 4 }}>{msg.senderName}</Text>
                  )}
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

      <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#fff', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <TextInput
          style={{ flex: 1 }}
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          radius="xl"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: '50%', background: draft.trim() ? PRIMARY : '#E5E7EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: draft.trim() ? 'pointer' : 'default', transition: 'background 0.15s', flexShrink: 0 }}
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
      .then((data) => {
        setCircles(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => {})
      .finally(() => setLoadingCircles(false))
  }, [])

  const filtered = circles.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
  const selectedCircle = circles.find((c) => c.id === selectedId) ?? null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
      {/* Circle list */}
      <div style={{ width: 300, borderRight: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 8px' }}>
          <Text fw={700} fz={18} style={{ color: '#0F172A', marginBottom: 10 }}>Messages</Text>
          <TextInput
            placeholder="Search circles…"
            leftSection={<IconSearch size={15} />}
            radius="xl"
            size="sm"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingCircles ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
              <Loader size="sm" color={PRIMARY} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Text fz={13} c="dimmed">No circles found</Text>
            </div>
          ) : (
            filtered.map((c) => (
              <CircleListItem key={c.id} circle={c} active={c.id === selectedId} onClick={() => setSelectedId(c.id)} />
            ))
          )}
        </div>
      </div>

      {/* Chat thread */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedCircle ? (
          <ChatThread key={selectedCircle.id} circleId={selectedCircle.id} circleName={selectedCircle.name} currentUserId={currentUserId} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.4 }}>
            <IconMessages size={48} color="#9CA3AF" />
            <Text fz={14} c="dimmed">Select a circle to start chatting</Text>
          </div>
        )}
      </div>
    </div>
  )
}
