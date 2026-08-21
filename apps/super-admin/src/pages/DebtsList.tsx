import {
  Alert,
  Badge,
  Divider,
  Drawer,
  Group,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { getDebtDetail, getDebts, type DebtDetail, type DebtRow, type DebtStatus, type PaginatedResponse } from '@/utils/api'
import { SortableTh } from '@/components/SortableTh'
import { useSortState, sortRows, rowNumber } from '@/utils/sorting'

function formatNaira(kobo: string) {
  const n = parseFloat(kobo)
  if (isNaN(n)) return '₦0.00'
  return '₦' + (n / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function statusBadge(status: DebtStatus) {
  const color =
    status === 'SETTLED' ? 'green'
    : status === 'PARTIALLY_REPAID' ? 'yellow'
    : 'red'
  return <Badge color={color} variant="light" size="sm">{status.replace('_', ' ')}</Badge>
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'OUTSTANDING', label: 'Outstanding' },
  { value: 'PARTIALLY_REPAID', label: 'Partially repaid' },
  { value: 'SETTLED', label: 'Settled' },
]

const LIMIT = 20

// ── Detail drawer (read-only - no write actions) ────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={600} component="span">{value}</Text>
    </Group>
  )
}

function DebtDetailDrawer({
  debtId,
  opened,
  onClose,
}: {
  debtId: string | null
  opened: boolean
  onClose: () => void
}) {
  const [detail, setDetail] = useState<DebtDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!opened || !debtId) return
    setLoading(true)
    setError(null)
    setDetail(null)
    getDebtDetail(debtId)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load debt detail'))
      .finally(() => setLoading(false))
  }, [opened, debtId])

  return (
    <Drawer opened={opened} onClose={onClose} title={<Text fw={600}>Debt Detail</Text>} position="right" size="md" padding="lg">
      {loading && (
        <Stack gap="sm">
          {[...Array(8)].map((_, i) => <Skeleton key={i} height={20} radius="sm" />)}
        </Stack>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {error}
        </Alert>
      )}

      {detail && !loading && (
        <Stack gap="md">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Member</Text>
            <Text size="sm" fw={500}>{detail.user.firstName} {detail.user.lastName}</Text>
            <Text size="xs" c="dimmed">{detail.user.email}</Text>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Circle</Text>
            <Text size="sm" fw={500}>{detail.circleName ?? detail.circleId}</Text>
            {detail.circleStatus && <Text size="xs" c="dimmed">Circle status: {detail.circleStatus}</Text>}
          </div>

          <Divider label="Status" labelPosition="left" />
          <DetailRow label="Debt status" value={statusBadge(detail.status)} />
          <DetailRow label="Category" value={detail.categoryLabel} />
          <DetailRow label="Cycle" value={detail.cycleNumber} />
          <DetailRow label="Created" value={new Date(detail.createdAt).toLocaleString('en-NG')} />
          <DetailRow label="Settled" value={detail.settledAt ? new Date(detail.settledAt).toLocaleString('en-NG') : '-'} />
          <DetailRow label="Blocks loan eligibility" value={detail.blocksLoanEligibility ? 'Yes' : 'No'} />

          <Divider label="Outstanding breakdown" labelPosition="left" />
          <DetailRow label="Total outstanding" value={formatNaira(detail.outstandingTotal)} />
          <DetailRow label="Missed contribution" value={formatNaira(detail.outstandingBreakdown.contribution)} />
          <DetailRow label="Interest" value={formatNaira(detail.outstandingBreakdown.interest)} />
          <DetailRow label="Bridge" value={formatNaira(detail.outstandingBreakdown.bridge)} />
          <DetailRow label="Collateral deficit" value={formatNaira(detail.outstandingBreakdown.collateral)} />
          <DetailRow label="Late penalty" value={formatNaira(detail.outstandingBreakdown.penalty)} />
        </Stack>
      )}
    </Drawer>
  )
}

export function DebtsList() {
  const [debts, setDebts] = useState<PaginatedResponse<DebtRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | null>(null)
  const [circleId, setCircleId] = useState('')
  const [userId, setUserId] = useState('')
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)

  const fetchDebts = useCallback(() => {
    setLoading(true)
    setError(null)
    getDebts({
      page,
      limit: LIMIT,
      ...(status ? { status: status as DebtStatus } : {}),
      ...(circleId.trim() ? { circleId: circleId.trim() } : {}),
      ...(userId.trim() ? { userId: userId.trim() } : {}),
    })
      .then(setDebts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load debts'))
      .finally(() => setLoading(false))
  }, [page, status, circleId, userId])

  useEffect(() => { fetchDebts() }, [fetchDebts])

  const rows = debts?.data ?? []
  const totalPages = debts?.meta.totalPages ?? 1

  type DebtSortKey = 'member' | 'circle' | 'category' | 'outstanding' | 'status' | 'created' | 'settled'
  const { sort, toggleSort } = useSortState<DebtSortKey>()
  const sortedRows = sortRows(rows, sort, {
    member: (d) => `${d.user.firstName} ${d.user.lastName}`,
    circle: (d) => d.circleName ?? d.circleId,
    category: (d) => d.categoryLabel,
    outstanding: (d) => Number(d.outstandingTotal),
    status: (d) => d.status,
    created: (d) => new Date(d.createdAt).getTime(),
    settled: (d) => (d.settledAt ? new Date(d.settledAt).getTime() : null),
  })

  return (
    <Stack gap="lg" p="xl">
      <div>
        <Title order={2} fw={700}>Debts</Title>
        <Text c="dimmed" size="sm" mt={4}>
          Missed contributions and late-penalty shortfalls owed by members - outstanding and historical.
        </Text>
      </div>

      <Group gap="sm">
        <Select
          placeholder="Status"
          data={STATUS_OPTIONS}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1) }}
          clearable
          radius="md"
          style={{ width: 180 }}
        />
        <TextInput
          placeholder="Filter by circle ID..."
          value={circleId}
          onChange={(e) => { setCircleId(e.currentTarget.value); setPage(1) }}
          radius="md"
          style={{ width: 240 }}
        />
        <TextInput
          placeholder="Filter by user ID..."
          value={userId}
          onChange={(e) => { setUserId(e.currentTarget.value); setPage(1) }}
          radius="md"
          style={{ width: 240 }}
        />
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {error}
        </Alert>
      )}

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={950}>
          <Table highlightOnHover layout="fixed">
            <Table.Thead>
              <Table.Tr bg="#0B6B55">
                <Table.Th c="white" w={40}>#</Table.Th>
                <SortableTh label="Member" sortKey="member" sort={sort} onSort={toggleSort} width={180} />
                <SortableTh label="Circle" sortKey="circle" sort={sort} onSort={toggleSort} width={160} />
                <SortableTh label="Category" sortKey="category" sort={sort} onSort={toggleSort} width={170} />
                <SortableTh label="Outstanding" sortKey="outstanding" sort={sort} onSort={toggleSort} width={130} />
                <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggleSort} width={130} />
                <SortableTh label="Created" sortKey="created" sort={sort} onSort={toggleSort} width={140} />
                <SortableTh label="Settled" sortKey="settled" sort={sort} onSort={toggleSort} width={140} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <Table.Tr key={i}>
                    {[...Array(8)].map((__, j) => (
                      <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text ta="center" py="xl" c="dimmed">No debts found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                sortedRows.map((debt, i) => (
                  <Table.Tr
                    key={debt.id}
                    onClick={() => setSelectedDebtId(debt.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Text size="sm" c="dimmed">{rowNumber(page, LIMIT, i)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{debt.user.firstName} {debt.user.lastName}</Text>
                      <Text size="xs" c="dimmed">{debt.user.email}</Text>
                    </Table.Td>
                    <Table.Td><Text size="sm">{debt.circleName ?? debt.circleId}</Text></Table.Td>
                    <Table.Td><Text size="sm">{debt.categoryLabel}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={600}>{formatNaira(debt.outstandingTotal)}</Text></Table.Td>
                    <Table.Td>{statusBadge(debt.status)}</Table.Td>
                    <Table.Td><Text size="sm">{new Date(debt.createdAt).toLocaleDateString('en-NG')}</Text></Table.Td>
                    <Table.Td>
                      <Text size="sm">{debt.settledAt ? new Date(debt.settledAt).toLocaleDateString('en-NG') : '-'}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            {debts ? `${debts.meta.total.toLocaleString()} debts` : ''}
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      </Paper>

      <DebtDetailDrawer
        debtId={selectedDebtId}
        opened={selectedDebtId !== null}
        onClose={() => setSelectedDebtId(null)}
      />
    </Stack>
  )
}

export default DebtsList
