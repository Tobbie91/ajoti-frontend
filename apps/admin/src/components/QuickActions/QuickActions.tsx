import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paper, Text, Box, Group, ThemeIcon, Divider, Modal, ScrollArea, Loader } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconMessage2,
  IconTopologyRing,
  IconUserCheck,
  IconBell,
  IconX,
} from '@tabler/icons-react'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '@/utils/api'

const PRIMARY = '#0b6b55'

export function QuickActions() {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 639px)')

  // Notifications state
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifModal, setNotifModal] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => {})
  }, [])

  function openNotifications() {
    setNotifModal(true)
    setLoading(true)
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false))
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

  const actions = [
    {
      label: 'Messages',
      icon: IconMessage2,
      badge: unreadCount || undefined,
      onClick: openNotifications,
    },
    {
      label: 'Create New Group',
      icon: IconTopologyRing,
      onClick: () => navigate('/create-group'),
    },
    {
      label: 'Manage Join Request',
      icon: IconUserCheck,
      onClick: () => navigate('/manage-join-request'),
    },
    {
      label: 'Send Group Notification',
      icon: IconBell,
      onClick: () => navigate('/rosca/groups'),
    },
  ]

  return (
    <>
      <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
        <Box px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Text fw={700} fz="md">Group Activity</Text>
        </Box>

        <Box py="xs">
          {actions.map((action, i) => (
            <Box key={action.label}>
              <Box
                px="lg"
                py="sm"
                style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={action.onClick}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fffe' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <ThemeIcon size={36} radius="md" style={{ background: '#e6f5f1', color: PRIMARY }} variant="light">
                      <action.icon size={18} stroke={1.5} />
                    </ThemeIcon>
                    <Text fz="sm" fw={500}>{action.label}</Text>
                  </Group>
                  {action.badge !== undefined && action.badge > 0 && (
                    <span style={{
                      background: '#EF4444',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 999,
                      minWidth: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                    }}>
                      {action.badge > 9 ? '9+' : action.badge}
                    </span>
                  )}
                </Group>
              </Box>
              {i < actions.length - 1 && <Divider mx="lg" />}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Notifications Modal */}
      <Modal
        opened={notifModal}
        onClose={() => setNotifModal(false)}
        withCloseButton={false}
        padding={0}
        radius={isMobile ? 'lg' : 'md'}
        size={isMobile ? '100%' : 'md'}
        centered={!isMobile}
        styles={isMobile
          ? { content: { position: 'fixed', bottom: 0, left: 0, right: 0, margin: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '85vh' }, body: { padding: 0 } }
          : { body: { padding: 0 } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', padding: '12px 16px' }}>
          <Text fw={700} fz="md">Notifications</Text>
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: PRIMARY }}>
              Mark all as read
            </button>
          )}
        </div>
        <ScrollArea h={isMobile ? undefined : 400} style={isMobile ? { maxHeight: '70vh' } : undefined}>
          {loading ? (
            <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
              <Loader size="sm" color={PRIMARY} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box py="xl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <IconX size={32} color="#D1D5DB" />
              <Text fz={13} c="dimmed">No notifications yet</Text>
            </Box>
          ) : (
            <Box>
              {notifications.map((n, i) => (
                <Box
                  key={n.id}
                  onClick={() => !n.read && handleMarkOne(n.id)}
                  style={{
                    background: !n.read ? '#F0FDF4' : 'transparent',
                    borderBottom: i < notifications.length - 1 ? '1px solid #F3F4F6' : 'none',
                    cursor: !n.read ? 'pointer' : 'default',
                    padding: '12px 4px',
                  }}
                >
                  <Group align="flex-start" gap="sm">
                    {!n.read && (
                      <div style={{ marginTop: 6, width: 8, height: 8, flexShrink: 0, borderRadius: '50%', background: PRIMARY }} />
                    )}
                    <Box style={{ paddingLeft: n.read ? 16 : 0, flex: 1 }}>
                      <Text fw={600} fz={13}>{n.title}</Text>
                      <Text fw={400} fz={12} c="dimmed" mt={2}>{n.message}</Text>
                      <Text fw={400} fz={11} c="dimmed" mt={4}>
                        {new Date(n.createdAt).toLocaleDateString('en-NG', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </Box>
                  </Group>
                </Box>
              ))}
            </Box>
          )}
        </ScrollArea>
      </Modal>
    </>
  )
}
