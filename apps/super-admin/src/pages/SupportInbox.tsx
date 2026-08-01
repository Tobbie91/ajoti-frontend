import {
  Badge,
  Button,
  Card,
  Group,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconSearch, IconMessageCircle } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listSupportTickets,
  type PaginatedResponse,
  type SupportTicketRow,
  type TicketCategory,
  type TicketStatus,
} from '@/utils/api'
import { SortableTh } from '@/components/SortableTh'
import { useSortState, sortRows, rowNumber } from '@/utils/sorting'

const PAGE_SIZE = 20

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ACCOUNT: 'Account',
  WALLET: 'Wallet',
  TRANSACTION: 'Transaction',
  KYC: 'KYC',
  ROSCA: 'ROSCA',
  LOAN: 'Loan',
  OTHER: 'Other',
}

export function SupportInbox() {
  const navigate = useNavigate()
  const [data, setData] = useState<PaginatedResponse<SupportTicketRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [category, setCategory] = useState<TicketCategory | ''>('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listSupportTickets({ page, limit: 20, status: status || undefined, category: category || undefined, search: search || undefined })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, status, category, search])

  useEffect(() => { load() }, [load])

  function handleSearch() {
    setPage(1)
    setSearch(searchInput)
  }

  const rows = data?.data ?? []

  type TicketSortKey = 'user' | 'subject' | 'category' | 'status' | 'messages' | 'lastActivity' | 'assigned'
  const { sort, toggleSort } = useSortState<TicketSortKey>()
  const sortedRows = sortRows(rows, sort, {
    user: (t) => `${t.user.firstName} ${t.user.lastName}`,
    subject: (t) => t.subject,
    category: (t) => t.category,
    status: (t) => t.status,
    messages: (t) => t._count.messages,
    lastActivity: (t) => new Date(t.updatedAt).getTime(),
    assigned: (t) => (t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : null),
  })

  return (
    <Stack gap="md" p="md">
      <Group justify="space-between" align="center">
        <Title order={3}>Support Inbox</Title>
        <Text size="sm" c="dimmed">{data?.meta.total ?? 0} tickets</Text>
      </Group>

      {/* Filters */}
      <Card withBorder radius="md" p="md">
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Search by subject or user..."
            leftSection={<IconSearch size={16} />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Button variant="default" onClick={handleSearch}>Search</Button>
          <Select
            placeholder="Status"
            clearable
            value={status}
            onChange={(v) => { setStatus((v as TicketStatus) ?? ''); setPage(1) }}
            data={[
              { value: 'OPEN', label: 'Open' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'RESOLVED', label: 'Resolved' },
              { value: 'CLOSED', label: 'Closed' },
            ]}
            style={{ width: 150 }}
          />
          <Select
            placeholder="Category"
            clearable
            value={category}
            onChange={(v) => { setCategory((v as TicketCategory) ?? ''); setPage(1) }}
            data={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
            style={{ width: 150 }}
          />
        </Group>
      </Card>

      {error && (
        <Card withBorder radius="md" p="md" style={{ borderColor: '#FCA5A5' }}>
          <Text c="red" size="sm">{error}</Text>
        </Card>
      )}

      <Card withBorder radius="md" p={0}>
        <Table highlightOnHover striped={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}>#</Table.Th>
              <SortableTh label="User" sortKey="user" sort={sort} onSort={toggleSort} dark={false} />
              <SortableTh label="Subject" sortKey="subject" sort={sort} onSort={toggleSort} dark={false} />
              <SortableTh label="Category" sortKey="category" sort={sort} onSort={toggleSort} dark={false} />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggleSort} dark={false} />
              <SortableTh label="Messages" sortKey="messages" sort={sort} onSort={toggleSort} dark={false} />
              <SortableTh label="Last Activity" sortKey="lastActivity" sort={sort} onSort={toggleSort} dark={false} />
              <SortableTh label="Assigned" sortKey="assigned" sort={sort} onSort={toggleSort} dark={false} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Stack align="center" py="xl" gap="xs">
                    <IconMessageCircle size={32} color="#D1D5DB" />
                    <Text c="dimmed" size="sm">No tickets found</Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              sortedRows.map((ticket, i) => (
                <Table.Tr
                  key={ticket.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/support/${ticket.id}`)}
                >
                  <Table.Td>
                    <Text size="sm" c="dimmed">{rowNumber(page, PAGE_SIZE, i)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {ticket.user.firstName} {ticket.user.lastName}
                    </Text>
                    <Text size="xs" c="dimmed">{ticket.user.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>{ticket.subject}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm" color="violet">
                      {CATEGORY_LABELS[ticket.category]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[ticket.status]} variant="light" size="sm">
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{ticket._count.messages}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {new Date(ticket.updatedAt).toLocaleDateString('en-NG', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {ticket.assignedTo ? (
                      <Text size="xs">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</Text>
                    ) : (
                      <Text size="xs" c="dimmed">Unassigned</Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {data && data.meta.totalPages > 1 && (
        <Group justify="center">
          <Pagination total={data.meta.totalPages} value={page} onChange={setPage} />
        </Group>
      )}
    </Stack>
  )
}
