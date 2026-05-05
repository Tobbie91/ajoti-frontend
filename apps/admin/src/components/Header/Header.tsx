import { useState, useEffect } from 'react'
import { Group, Burger, Text, Avatar, Box, Popover, Modal, ScrollArea, Loader } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconBell } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '@/utils/api'

interface HeaderProps {
  opened: boolean
  onToggle: () => void
}

const PRIMARY = '#0b6b55'

function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getUnreadNotificationCount().then(setUnreadCount).catch(() => {})
    const interval = setInterval(() => {
      getUnreadNotificationCount().then(setUnreadCount).catch(() => {})
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setLoading(true)
      getNotifications()
        .then(setNotifications)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead().catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function handleMarkOne(id: string) {
    await markNotificationRead(id).catch(() => {})
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const isMobile = useMediaQuery('(max-width: 639px)')

  const notifBody = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', padding: '12px 16px' }}>
        <Text fw={600} fz={14} style={{ color: '#0F172A' }}>Notifications</Text>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: PRIMARY }}>
            Mark all as read
          </button>
        )}
      </div>
      <ScrollArea h={isMobile ? undefined : 360} style={isMobile ? { maxHeight: '70vh' } : undefined}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Loader size="sm" color={PRIMARY} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 8 }}>
            <IconBell size={32} color="#D1D5DB" />
            <Text fz={13} style={{ color: '#9CA3AF' }}>No notifications yet</Text>
          </div>
        ) : (
          <div>
            {notifications.map((n, i) => (
              <button
                key={n.id}
                onClick={() => !n.read && handleMarkOne(n.id)}
                style={{ width: '100%', background: !n.read ? '#F0FDF4' : 'transparent', border: 'none', borderBottom: i < notifications.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: !n.read ? 'pointer' : 'default', padding: '12px 16px', textAlign: 'left', display: 'block' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {!n.read && <div style={{ marginTop: 6, width: 8, height: 8, flexShrink: 0, borderRadius: '50%', background: PRIMARY }} />}
                  <div style={{ paddingLeft: n.read ? 16 : 0 }}>
                    <Text fw={600} fz={13} style={{ color: '#0F172A' }}>{n.title}</Text>
                    <Text fw={400} fz={12} style={{ color: '#6B7280', marginTop: 2 }}>{n.message}</Text>
                    <Text fw={400} fz={11} style={{ color: '#9CA3AF', marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  )

  const bellButton = (
    <button
      onClick={() => handleOpen(!open)}
      style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      aria-label="Notifications"
    >
      <IconBell size={20} stroke={1.5} color="#495057" />
      {unreadCount > 0 && (
        <span style={{ position: 'absolute', top: 0, right: 0, background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: '999px', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', lineHeight: 1 }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )

  if (isMobile) {
    return (
      <>
        {bellButton}
        <Modal
          opened={open}
          onClose={() => setOpen(false)}
          withCloseButton={false}
          padding={0}
          radius="lg"
          size="100%"
          styles={{ content: { position: 'fixed', bottom: 0, left: 0, right: 0, margin: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '85vh' }, body: { padding: 0 } }}
        >
          {notifBody}
        </Modal>
      </>
    )
  }

  return (
    <Popover opened={open} onChange={handleOpen} width={340} position="bottom-end" shadow="md" radius="md" withArrow>
      <Popover.Target>{bellButton}</Popover.Target>
      <Popover.Dropdown style={{ padding: 0 }}>{notifBody}</Popover.Dropdown>
    </Popover>
  )
}

export function Header({ opened, onToggle }: HeaderProps) {
  const navigate = useNavigate()
  const storedUser = JSON.parse(localStorage.getItem('admin_user') ?? '{}')
  const firstName = storedUser.firstName ?? 'Admin'
  const initials = firstName.charAt(0).toUpperCase()

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />
        <Text fw={900} fz={20} style={{ color: PRIMARY, letterSpacing: 1 }} visibleFrom="sm">
          AJOTI
        </Text>
      </Group>

      <Group gap="sm">
        <NotificationPanel />
        <Box
          onClick={() => navigate('/my-profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <Box style={{ textAlign: 'right' }}>
            <Text fz="sm" fw={600} lh={1.2}>{firstName}</Text>
            <Text fz="xs" c="dimmed" lh={1.2}>Admin</Text>
          </Box>
          <Avatar
            size={36}
            radius="xl"
            style={{ backgroundColor: PRIMARY, color: 'white', fontWeight: 700 }}
          >
            {initials}
          </Avatar>
        </Box>
      </Group>
    </Group>
  )
}
