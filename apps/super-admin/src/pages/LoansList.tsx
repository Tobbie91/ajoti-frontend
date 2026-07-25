import {
  Alert,
  Badge,
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
import { getLoans, type LoanRow, type LoanStatus, type PaginatedResponse } from '@/utils/api'

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

export function LoansList() {
  const [loans, setLoans] = useState<PaginatedResponse<LoanRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | null>(null)
  const [circleId, setCircleId] = useState('')
  const [strandedOnly, setStrandedOnly] = useState(false)

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
                <Table.Th c="white" w={180}>Borrower</Table.Th>
                <Table.Th c="white" w={160}>Circle</Table.Th>
                <Table.Th c="white" w={130}>Advance</Table.Th>
                <Table.Th c="white" w={110}>Fee</Table.Th>
                <Table.Th c="white" w={130}>Gross</Table.Th>
                <Table.Th c="white" w={110}>Status</Table.Th>
                <Table.Th c="white" w={140}>Applied</Table.Th>
                <Table.Th c="white" w={140}>Repaid</Table.Th>
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
                    <Text ta="center" py="xl" c="dimmed">No loans found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((loan) => (
                  <Table.Tr key={loan.id}>
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
    </Stack>
  )
}

export default LoansList
