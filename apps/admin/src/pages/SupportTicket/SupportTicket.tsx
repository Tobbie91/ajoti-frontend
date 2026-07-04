import { Button, Loader, Text, Textarea } from '@mantine/core'
import { IconArrowLeft, IconHeadset, IconUser, IconUserCheck } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  closeMyTicket,
  getMyTicket,
  replyToTicket,
  type SupportMessage,
  type SupportTicketDetail,
  type TicketStatus,
} from '@/utils/api'

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  RESOLVED: '#10B981',
  CLOSED: '#9CA3AF',
}

function MessageBubble({ msg }: { msg: SupportMessage }) {
  const isSupport = msg.senderRole === 'SUPERADMIN'
  return (
    <div style={{ display: 'flex', flexDirection: isSupport ? 'row-reverse' : 'row', gap: 8, marginBottom: 14 }}>
      <div
        style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: isSupport ? '#ECFDF5' : '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {isSupport
          ? <IconUserCheck size={15} color="#066F5B" />
          : <IconUser size={15} color="#6B7280" />}
      </div>
      <div style={{ maxWidth: '78%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: isSupport ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: isSupport ? '#066F5B' : '#374151' }}>
            {isSupport ? 'Ajoti Support' : 'You'}
          </span>
        </div>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isSupport ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
            background: isSupport ? '#ECFDF5' : '#F9FAFB',
            border: `1px solid ${isSupport ? '#A7F3D0' : '#E5E7EB'}`,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#111827' }}>
            {msg.body}
          </p>
        </div>
        <span style={{ fontSize: 11, color: '#9CA3AF', display: 'block', marginTop: 3, textAlign: isSupport ? 'right' : 'left' }}>
          {new Date(msg.createdAt).toLocaleDateString('en-NG', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}

export function SupportTicket() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!ticketId) return
    getMyTicket(ticketId)
      .then(setTicket)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticketId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages.length])

  async function handleReply() {
    if (!reply.trim() || !ticketId) return
    setSending(true)
    setReplyError('')
    try {
      const msg = await replyToTicket(ticketId, reply.trim())
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
      setReply('')
    } catch (e: unknown) {
      setReplyError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  async function handleClose() {
    if (!ticketId) return
    setClosing(true)
    try {
      await closeMyTicket(ticketId)
      setTicket((prev) => prev ? { ...prev, status: 'CLOSED' } : prev)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader color="#066F5B" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <button onClick={() => navigate('/support')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#066F5B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, fontSize: 14 }}>
          <IconArrowLeft size={16} /> Back to support
        </button>
        <Text c="red">{error || 'Ticket not found'}</Text>
      </div>
    )
  }

  const isClosed = ticket.status === 'CLOSED'

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', paddingBottom: 100 }}>
      {/* Back */}
      <button
        onClick={() => navigate('/support')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#066F5B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, fontSize: 14 }}
      >
        <IconArrowLeft size={16} /> Back to support
      </button>

      {/* Ticket header */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  background: `${STATUS_COLORS[ticket.status]}18`,
                  color: STATUS_COLORS[ticket.status],
                }}
              >
                {ticket.status.replace('_', ' ')}
              </span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{ticket.category}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{ticket.subject}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>
              Opened {new Date(ticket.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          {!isClosed && (
            <Button size="xs" variant="subtle" color="red" loading={closing} onClick={handleClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Thread */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
        <div className="flex items-center gap-2 mb-4">
          <IconHeadset size={16} color="#066F5B" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
          </span>
        </div>

        {ticket.messages.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="md">No messages yet</Text>
        ) : (
          ticket.messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {!isClosed ? (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px' }}>
          {replyError && <Text c="red" size="xs" mb="xs">{replyError}</Text>}
          <Textarea
            placeholder="Type your message..."
            minRows={3}
            value={reply}
            onChange={(e) => setReply(e.currentTarget.value)}
            disabled={sending}
            mb="sm"
          />
          <Button
            fullWidth
            onClick={handleReply}
            loading={sending}
            disabled={!reply.trim()}
            style={{ background: '#066F5B' }}
          >
            Send Message
          </Button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', color: '#9CA3AF', fontSize: 13 }}>
          This ticket is closed.
        </div>
      )}
    </div>
  )
}
