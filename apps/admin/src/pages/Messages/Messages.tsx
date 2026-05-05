import { useState, useEffect } from 'react'
import { Text, Loader, Badge } from '@mantine/core'
import { IconMessageCircle, IconInbox } from '@tabler/icons-react'
import { getNotifications, markNotificationRead, type AppNotification } from '@/utils/api'

const PRIMARY = '#0b6b55'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

function parseMessage(n: AppNotification) {
  // Title format: "Message from {SenderName} — {CircleName}"
  const match = n.title?.match(/^Message from (.+?) — (.+)$/)
  return {
    sender: match?.[1] ?? 'Member',
    circle: match?.[2] ?? '',
    body: n.message ?? '',
  }
}

export function Messages() {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<AppNotification[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getNotifications()
      .then((all) => setMessages(all.filter((n) => n.title?.startsWith('Message from'))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleClick(n: AppNotification) {
    setExpanded((prev) => (prev === n.id ? null : n.id))
    if (!n.read) {
      await markNotificationRead(n.id).catch(() => {})
      setMessages((prev) => prev.map((m) => (m.id === n.id ? { ...m, read: true } : m)))
    }
  }

  const unread = messages.filter((m) => !m.read).length

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#D1FAE5' }}>
          <IconMessageCircle size={22} color={PRIMARY} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Text fw={700} fz={22} style={{ color: '#0F172A' }}>Messages</Text>
            {unread > 0 && (
              <Badge size="sm" radius="xl" styles={{ root: { background: PRIMARY, color: '#fff' } }}>
                {unread} new
              </Badge>
            )}
          </div>
          <Text fz={13} c="dimmed">Messages from your circle members</Text>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader color={PRIMARY} size="md" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white py-20">
          <IconInbox size={40} color="#D1D5DB" />
          <Text fw={600} fz={15} style={{ color: '#374151', marginTop: 12 }}>No messages yet</Text>
          <Text fz={13} c="dimmed" mt={4}>When members message you, they'll appear here.</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {messages.map((n) => {
            const { sender, circle, body } = parseMessage(n)
            const isExpanded = expanded === n.id
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, width: '100%', cursor: 'pointer' }}
              >
                <div
                  className="rounded-2xl border p-5 transition-all"
                  style={{
                    background: n.read ? '#FFFFFF' : '#F0FDF4',
                    borderColor: n.read ? '#E5E7EB' : '#BBF7D0',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
                        style={{ background: PRIMARY }}
                      >
                        {sender.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Text fw={700} fz={14} style={{ color: '#0F172A' }}>{sender}</Text>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full" style={{ background: PRIMARY, display: 'inline-block' }} />
                          )}
                        </div>
                        <Text fz={12} c="dimmed">{circle}</Text>
                      </div>
                    </div>
                    <Text fz={11} c="dimmed" style={{ flexShrink: 0 }}>{timeAgo(n.createdAt)}</Text>
                  </div>

                  {/* Message body — always visible preview, full on expand */}
                  <div className="mt-3 pl-[52px]">
                    <Text
                      fz={13}
                      style={{
                        color: '#374151',
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical' as const,
                        WebkitLineClamp: isExpanded ? undefined : 2,
                        overflow: isExpanded ? 'visible' : 'hidden',
                      }}
                    >
                      {body}
                    </Text>
                    {!isExpanded && body.length > 120 && (
                      <Text fz={12} style={{ color: PRIMARY, marginTop: 4 }}>Read more</Text>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
