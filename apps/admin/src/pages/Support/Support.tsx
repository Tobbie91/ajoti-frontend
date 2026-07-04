import { Badge, Button, Loader, Modal, Select, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { IconHeadset, IconPlus } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createTicket,
  listMyTickets,
  type PaginatedResponse,
  type SupportTicketRow,
  type TicketCategory,
  type TicketStatus,
} from '@/utils/api'

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  RESOLVED: '#10B981',
  CLOSED: '#9CA3AF',
}

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'TRANSACTION', label: 'Transaction' },
  { value: 'KYC', label: 'KYC' },
  { value: 'ROSCA', label: 'ROSCA / Savings Group' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'OTHER', label: 'Other' },
]

export function Support() {
  const navigate = useNavigate()
  const [data, setData] = useState<PaginatedResponse<SupportTicketRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Create form state
  const [category, setCategory] = useState<TicketCategory | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    listMyTickets({ limit: 30 })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!category || !subject.trim() || !body.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const ticket = await createTicket({ category, subject: subject.trim(), body: body.trim() })
      setModalOpen(false)
      setCategory(null)
      setSubject('')
      setBody('')
      navigate(`/support/${ticket.id}`)
    } catch (e: unknown) {
      setCreateError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const tickets = data?.data ?? []

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconHeadset size={24} color="#066F5B" />
          <h2 className="text-xl font-bold text-gray-900">Support</h2>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalOpen(true)}
          style={{ background: '#066F5B' }}
          size="sm"
        >
          New Ticket
        </Button>
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader color="#066F5B" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <IconHeadset size={48} color="#D1D5DB" />
          <Text c="dimmed" ta="center">No support tickets yet</Text>
          <Text c="dimmed" size="sm" ta="center">
            Need help? Open a ticket and our team will get back to you.
          </Text>
        </div>
      ) : (
        <Stack gap="sm">
          {tickets.map((ticket) => {
            const lastMsg = ticket.messages[0]
            return (
              <div
                key={ticket.id}
                onClick={() => navigate(`/support/${ticket.id}`)}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: '#fff',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
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
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {CATEGORY_OPTIONS.find((c) => c.value === ticket.category)?.label ?? ticket.category}
                      </span>
                    </div>
                    <Text fw={600} size="sm" lineClamp={1}>{ticket.subject}</Text>
                    {lastMsg && (
                      <Text size="xs" c="dimmed" mt={2} lineClamp={1}>
                        {lastMsg.senderRole === 'SUPERADMIN' ? 'Support: ' : 'You: '}{lastMsg.body}
                      </Text>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Text size="xs" c="dimmed">
                      {new Date(ticket.updatedAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text size="xs" c="dimmed">{ticket._count.messages} msg{ticket._count.messages !== 1 ? 's' : ''}</Text>
                  </div>
                </div>
              </div>
            )
          })}
        </Stack>
      )}

      {/* New Ticket Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => { setModalOpen(false); setCreateError('') }}
        title="New Support Ticket"
        radius="lg"
        size="md"
      >
        <Stack gap="sm">
          <Select
            label="Category"
            placeholder="What's this about?"
            data={CATEGORY_OPTIONS}
            value={category}
            onChange={(v) => setCategory(v as TicketCategory | null)}
            required
          />
          <TextInput
            label="Subject"
            placeholder="Brief description of your issue"
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
            maxLength={255}
            required
          />
          <Textarea
            label="Message"
            placeholder="Describe your issue in detail..."
            minRows={4}
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
            required
          />
          {createError && <Text c="red" size="sm">{createError}</Text>}
          <Button
            fullWidth
            onClick={handleCreate}
            loading={creating}
            disabled={!category || !subject.trim() || !body.trim()}
            style={{ background: '#066F5B' }}
          >
            Submit Ticket
          </Button>
        </Stack>
      </Modal>
    </div>
  )
}
