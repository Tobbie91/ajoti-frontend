import { useState, useEffect } from 'react'
import { Text, Loader } from '@mantine/core'
import { IconBell, IconInbox } from '@tabler/icons-react'
import { getNotifications, markNotificationRead, type AppNotification } from '@/utils/api'

const PRIMARY = '#02A36E'

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

export function Messages() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleClick(n: AppNotification) {
    setExpanded((prev) => (prev === n.id ? null : n.id))
    if (!n.read) {
      await markNotificationRead(n.id).catch(() => {})
      setNotifications((prev) => prev.map((m) => (m.id === n.id ? { ...m, read: true } : m)))
    }
  }

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#D1FAE5' }}>
          <IconBell size={20} color={PRIMARY} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Text fw={700} fz={20} style={{ color: '#0F172A' }}>Messages</Text>
            {unread > 0 && (
              <span
                className="flex h-5 items-center rounded-full px-2 text-[11px] font-bold text-white"
                style={{ background: PRIMARY }}
              >
                {unread}
              </span>
            )}
          </div>
          <Text fz={13} c="dimmed">Notifications and messages from your circles</Text>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader color={PRIMARY} size="md" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white py-20">
          <IconInbox size={40} color="#D1D5DB" />
          <Text fw={600} fz={15} style={{ color: '#374151', marginTop: 12 }}>No messages yet</Text>
          <Text fz={13} c="dimmed" mt={4}>Circle updates and admin messages will appear here.</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const isExpanded = expanded === n.id
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, width: '100%', cursor: 'pointer' }}
              >
                <div
                  className="rounded-2xl border p-4 transition-all"
                  style={{
                    background: n.read ? '#FFFFFF' : '#F0FDF4',
                    borderColor: n.read ? '#E5E7EB' : '#BBF7D0',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: n.read ? '#F3F4F6' : '#D1FAE5' }}
                      >
                        <IconBell size={16} color={n.read ? '#9CA3AF' : PRIMARY} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Text fw={600} fz={13} style={{ color: '#0F172A' }}>{n.title}</Text>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full" style={{ background: PRIMARY, display: 'inline-block' }} />
                          )}
                        </div>
                        <Text
                          fz={12}
                          style={{
                            color: '#6B7280',
                            marginTop: 2,
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical' as const,
                            WebkitLineClamp: isExpanded ? undefined : 2,
                            overflow: isExpanded ? 'visible' : 'hidden',
                          }}
                        >
                          {n.message}
                        </Text>
                        {!isExpanded && (n.message?.length ?? 0) > 100 && (
                          <Text fz={11} style={{ color: PRIMARY, marginTop: 2 }}>Read more</Text>
                        )}
                      </div>
                    </div>
                    <Text fz={11} c="dimmed" style={{ flexShrink: 0 }}>{timeAgo(n.createdAt)}</Text>
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
