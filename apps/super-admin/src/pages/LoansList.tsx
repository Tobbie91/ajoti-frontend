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
import { IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { getLoanDetail, getLoans, type LoanDetail, type LoanRow, type LoanStatus, type PaginatedResponse } from '@/utils/api'
import { SortableTh } from '@/components/SortableTh'
import { useSortState, sortRows, rowNumber } from '@/utils/sorting'

function formatNaira(kobo: string) {
  const n = parseFloat(kobo)
  if (isNaN(n)) return '₦0.00'
  return '₦' + (n / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function statusBadge(status: LoanStatus) {
  const color =
    status === 'REPAID' ? 'green'
    : status === 'ACTIVE' ? 'blue'
    : status === 'DEFAULTED' ? 'red'
    : 'gray'
  return <Badge color={color} variant="light" size="sm">{status}</Badge>
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REPAID', label: 'Repaid' },
  { value: 'DEFAULTED', label: 'Defaulted' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const LIMIT = 20

// ── Detail drawer (read-only — no write-off/cancel/force-repay actions) ────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={600} component="span">{value}</Text>
    </Group>
  )
}

function LoanDetailDrawer({
  loanId,
  opened,
  onClose,
}: {
  loanId: string | null
  opened: boolean
  onClose: () => void
}) {
  const [detail, setDetail] = useState<LoanDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!opened || !loanId) return
    setLoading(true)
    setError(null)
    setDetail(null)
    getLoanDetail(loanId)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load loan detail'))
      .finally(() => setLoading(false))
  }, [opened, loanId])

  return (
    <Drawer opened={opened} onClose={onClose} title={<Text fw={600}>Loan Detail</Text>} position="right" size="md" padding="lg">
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
          {detail.stranded && (
            <Alert icon={<IconAlertTriangle size={16} />} color="orange" radius="md" variant="light">
              <Text size="sm" fw={600}>Stranded</Text>
              <Text size="xs" mt={4}>
                This loan is still ACTIVE, but the borrower already had a completed payout in this
                circle — the shortfall guard skipped repayment (the actual pot came in below what
                was owed) and there is no automatic collection path. Accepted risk of the 75%
                advance ratio, not a bug — see docs/specs/loan-repayment-flow.md.
              </Text>
            </Alert>
          )}

          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Borrower</Text>
            <Text size="sm" fw={500}>{detail.user.firstName} {detail.user.lastName}</Text>
            <Text size="xs" c="dimmed">{detail.user.email}</Text>
          </div>

          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Circle</Text>
            <Text size="sm" fw={500}>{detail.circle.name}</Text>
            <Text size="xs" c="dimmed">Circle status: {detail.circle.status}</Text>
          </div>

          <Divider label="Status" labelPosition="left" />
          <DetailRow label="Loan status" value={statusBadge(detail.status)} />
          <DetailRow label="Applied" value={new Date(detail.createdAt).toLocaleString('en-NG')} />
          <DetailRow label="Repaid" value={detail.repaidAt ? new Date(detail.repaidAt).toLocaleString('en-NG') : '—'} />

          <Divider label="Amounts — frozen at application time, not live" labelPosition="left" />
          <DetailRow label="Estimated expected payout" value={formatNaira(detail.payoutAmount)} />
          <DetailRow label="Advance disbursed (net)" value={formatNaira(detail.loanAmount)} />
          <DetailRow label="Company fee" value={formatNaira(detail.companyFee)} />
          <DetailRow label="Gross (advance + fee)" value={formatNaira(detail.grossAmount)} />
          <DetailRow label="Projected remaining payout" value={formatNaira(detail.finalPayout)} />

          <Divider label="Eligibility snapshot" labelPosition="left" />
          <DetailRow label="Credit score used" value={detail.creditScoreUsed} />
          <DetailRow label="Allowed percent" value={`${detail.allowedPercent}%`} />
        </Stack>
      )}
    </Drawer>
  )
}

export function LoansList() {
  const [loans, setLoans] = useState<PaginatedResponse<LoanRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | null>(null)
  const [circleId, setCircleId] = useState('')
  const [strandedOnly, setStrandedOnly] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)

  const fetchLoans = useCallback(() => {
    setLoading(true)
    setError(null)
    getLoans({
      page,
      limit: LIMIT,
      ...(status ? { status: status as LoanStatus } : {}),
      ...(circleId.trim() ? { circleId: circleId.trim() } : {}),
      ...(strandedOnly ? { stranded: true } : {}),
    })
      .then(setLoans)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load loans'))
      .finally(() => setLoading(false))
  }, [page, status, circleId, strandedOnly])

  useEffect(() => { fetchLoans() }, [fetchLoans])

  const rows = loans?.data ?? []
  const totalPages = loans?.meta.totalPages ?? 1

  type LoanSortKey = 'borrower' | 'circle' | 'advance' | 'fee' | 'gross' | 'status' | 'applied' | 'repaid'
  const { sort, toggleSort } = useSortState<LoanSortKey>()
  const sortedRows = sortRows(rows, sort, {
    borrower: (l) => `${l.user.firstName} ${l.user.lastName}`,
    circle: (l) => l.circle.name,
    advance: (l) => Number(l.loanAmount),
    fee: (l) => Number(l.companyFee),
    gross: (l) => Number(l.grossAmount),
    status: (l) => l.status,
    applied: (l) => new Date(l.createdAt).getTime(),
    repaid: (l) => (l.repaidAt ? new Date(l.repaidAt).getTime() : null),
  })

  return (
    <Stack gap="lg" p="xl">
      <div>
        <Title order={2} fw={700}>Loans</Title>
        <Text c="dimmed" size="sm" mt={4}>
          Early payouts against expected ROSCA payouts — outstanding and historical.
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
          style={{ width: 260 }}
        />
        <Badge
          component="button"
          onClick={() => { setStrandedOnly((v) => !v); setPage(1) }}
          variant={strandedOnly ? 'filled' : 'outline'}
          color="orange"
          size="lg"
          style={{ cursor: 'pointer' }}
          leftSection={<IconAlertTriangle size={12} />}
        >
          Stranded only
        </Badge>
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
                <SortableTh label="Borrower" sortKey="borrower" sort={sort} onSort={toggleSort} width={180} />
                <SortableTh label="Circle" sortKey="circle" sort={sort} onSort={toggleSort} width={160} />
                <SortableTh label="Advance" sortKey="advance" sort={sort} onSort={toggleSort} width={130} />
                <SortableTh label="Fee" sortKey="fee" sort={sort} onSort={toggleSort} width={110} />
                <SortableTh label="Gross" sortKey="gross" sort={sort} onSort={toggleSort} width={130} />
                <SortableTh label="Status" sortKey="status" sort={sort} onSort={toggleSort} width={110} />
                <SortableTh label="Applied" sortKey="applied" sort={sort} onSort={toggleSort} width={140} />
                <SortableTh label="Repaid" sortKey="repaid" sort={sort} onSort={toggleSort} width={140} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <Table.Tr key={i}>
                    {[...Array(9)].map((__, j) => (
                      <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text ta="center" py="xl" c="dimmed">No loans found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                sortedRows.map((loan, i) => (
                  <Table.Tr
                    key={loan.id}
                    onClick={() => setSelectedLoanId(loan.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Text size="sm" c="dimmed">{rowNumber(page, LIMIT, i)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{loan.user.firstName} {loan.user.lastName}</Text>
                      <Text size="xs" c="dimmed">{loan.user.email}</Text>
                    </Table.Td>
                    <Table.Td><Text size="sm">{loan.circle.name}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={600}>{formatNaira(loan.loanAmount)}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{formatNaira(loan.companyFee)}</Text></Table.Td>
                    <Table.Td><Text size="sm">{formatNaira(loan.grossAmount)}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        {statusBadge(loan.status)}
                        {loan.stranded && (
                          <Badge color="orange" variant="filled" size="sm" leftSection={<IconAlertTriangle size={10} />}>
                            Stranded
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm">{new Date(loan.createdAt).toLocaleDateString('en-NG')}</Text></Table.Td>
                    <Table.Td>
                      <Text size="sm">{loan.repaidAt ? new Date(loan.repaidAt).toLocaleDateString('en-NG') : '—'}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            {loans ? `${loans.meta.total.toLocaleString()} loans` : ''}
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      </Paper>

      <LoanDetailDrawer
        loanId={selectedLoanId}
        opened={selectedLoanId !== null}
        onClose={() => setSelectedLoanId(null)}
      />
    </Stack>
  )
}

export default LoansList
