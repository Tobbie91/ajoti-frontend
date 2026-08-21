import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Menu,
  ScrollArea,
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconChevronDown,
  IconMessageCircle,
  IconUser,
  IconUserCheck,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  assignSupportTicket,
  getSupportTicketDetail,
  replySupportTicket,
  updateSupportTicketStatus,
  type SupportTicketDetail as TicketDetail,
  type TicketStatus,
} from '@/utils/api'

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
}

function MessageBubble({
  body,
  senderName,
  senderRole,
  createdAt,
}: {
  body: string
  senderName: string
  senderRole: string
  createdAt: string
}) {
  const isSupport = senderRole === 'SUPERADMIN'
  return (
    <div style={{ display: 'flex', flexDirection: isSupport ? 'row-reverse' : 'row', gap: 8, marginBottom: 16 }}>
      <div
        style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginTop: 4,
          background: isSupport ? '#10B981' : '#E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {isSupport ? <IconUserCheck size={16} color="#fff" /> : <IconUser size={16} color="#6B7280" />}
      </div>
      <div style={{ maxWidth: '70%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: isSupport ? 'row-reverse' : 'row' }}>
          <Text size="xs" fw={600} c={isSupport ? 'teal' : 'dark'}>{senderName}</Text>
          <Badge size="xs" variant="outline" color={isSupport ? 'teal' : 'gray'}>
            {isSupport ? 'Support' : senderRole.toLowerCase()}
          </Badge>
        </div>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isSupport ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
            background: isSupport ? '#ECFDF5' : '#F9FAFB',
            border: `1px solid ${isSupport ? '#A7F3D0' : '#E5E7EB'}`,
          }}
        >
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{body}</Text>
        </div>
        <Text size="xs" c="dimmed" mt={4} ta={isSupport ? 'right' : 'left'}>
          {new Date(createdAt).toLocaleDateString('en-NG', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </div>
    </div>
  )
}

export function SupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!ticketId) return
    setLoading(true)
    getSupportTicketDetail(ticketId)
      .then(setTicket)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticketId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages?.length])

  async function handleReply() {
    if (!reply.trim() || !ticketId) return
    setSending(true)
    setReplyError('')
    try {
      const msg = await replySupportTicket(ticketId, reply.trim())
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, msg], status: prev.status === 'OPEN' ? 'IN_PROGRESS' : prev.status } : prev)
      setReply('')
    } catch (e: unknown) {
      setReplyError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  async function handleAssign() {
    if (!ticketId) return
    setActionLoading(true)
    try {
      const res = await assignSupportTicket(ticketId)
      const superadminUser = JSON.parse(localStorage.getItem('superadmin_user') ?? '{}')
      setTicket((prev) => prev
        ? { ...prev, assignedToId: res.assignedToId, assignedTo: { id: res.assignedToId, firstName: superadminUser.firstName ?? 'Me', lastName: superadminUser.lastName ?? '' } }
        : prev)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStatusChange(newStatus: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') {
    if (!ticketId) return
    setActionLoading(true)
    try {
      const updated = await updateSupportTicketStatus(ticketId, newStatus)
      setTicket(updated)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Stack gap="md" p="md">
        <Skeleton height={32} width={200} radius="sm" />
        <Skeleton height={120} radius="md" />
        <Skeleton height={400} radius="md" />
      </Stack>
    )
  }

  if (error || !ticket) {
    return (
      <Stack gap="md" p="md">
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/support')}>
          Back to inbox
        </Button>
        <Card withBorder radius="md" p="md">
          <Text c="red">{error || 'Ticket not found'}</Text>
        </Card>
      </Stack>
    )
  }

  const isClosed = ticket.status === 'CLOSED'

  return (
    <Stack gap="md" p="md" style={{ maxWidth: 900 }}>
      <Group>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/support')} size="sm">
          Back to inbox
        </Button>
      </Group>

      {/* Ticket header */}
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <div>
            <Group gap="xs" mb={4}>
              <Badge color={STATUS_COLORS[ticket.status]} variant="light">
                {ticket.status.replace('_', ' ')}
              </Badge>
              <Badge variant="light" color="violet">{ticket.category}</Badge>
            </Group>
            <Title order={4}>{ticket.subject}</Title>
            <Text size="sm" c="dimmed" mt={4}>
              From <strong>{ticket.user.firstName} {ticket.user.lastName}</strong> ({ticket.user.email})
              &nbsp;·&nbsp;{new Date(ticket.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
            {ticket.refType && ticket.refId && (
              <Text size="xs" c="dimmed" mt={4}>
                Context: {ticket.refType} - <code style={{ fontSize: 11 }}>{ticket.refId}</code>
              </Text>
            )}
          </div>

          <Group gap="xs">
            {!ticket.assignedTo && (
              <Button
                size="xs"
                variant="default"
                leftSection={<IconUserCheck size={14} />}
                loading={actionLoading}
                onClick={handleAssign}
              >
                Assign to me
              </Button>
            )}
            {ticket.assignedTo && (
              <Text size="xs" c="dimmed">
                Assigned: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
              </Text>
            )}

            {!isClosed && (
              <Menu shadow="md" width={180}>
                <Menu.Target>
                  <Button size="xs" variant="default" rightSection={<IconChevronDown size={14} />} loading={actionLoading}>
                    Update Status
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {ticket.status !== 'IN_PROGRESS' && (
                    <Menu.Item onClick={() => handleStatusChange('IN_PROGRESS')}>In Progress</Menu.Item>
                  )}
                  {ticket.status !== 'RESOLVED' && (
                    <Menu.Item onClick={() => handleStatusChange('RESOLVED')}>Resolved</Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={() => handleStatusChange('CLOSED')}>Close Ticket</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </Card>

      {/* Thread */}
      <Card withBorder radius="md" p="md">
        <Group mb="md" gap="xs">
          <IconMessageCircle size={18} color="#10B981" />
          <Text fw={600} size="sm">{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</Text>
        </Group>
        <Divider mb="md" />

        <ScrollArea style={{ maxHeight: 480 }}>
          {ticket.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              body={msg.body}
              senderName={`${msg.sender.firstName} ${msg.sender.lastName}`}
              senderRole={msg.senderRole}
              createdAt={msg.createdAt}
            />
          ))}
          <div ref={bottomRef} />
        </ScrollArea>

        {!isClosed && (
          <>
            <Divider mt="md" mb="md" />
            {replyError && <Text c="red" size="xs" mb="xs">{replyError}</Text>}
            <Textarea
              placeholder="Type your reply..."
              minRows={3}
              value={reply}
              onChange={(e) => setReply(e.currentTarget.value)}
              disabled={sending}
              mb="xs"
            />
            <Group justify="flex-end">
              <Button
                size="sm"
                onClick={handleReply}
                loading={sending}
                disabled={!reply.trim()}
              >
                Send Reply
              </Button>
            </Group>
          </>
        )}

        {isClosed && (
          <Text size="sm" c="dimmed" ta="center" mt="md">This ticket is closed.</Text>
        )}
      </Card>
    </Stack>
  )
}
