import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconCurrencyNaira,
  IconDownload,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  exportCsv,
  getLedger,
  getTransactionAnalytics,
  reconcileFunding,
  type LedgerRow,
  type PaginatedResponse,
  type ReconcileResult,
  type TransactionAnalytics,
} from '@/utils/api'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatNaira(kobo: string | number) {
  const n = typeof kobo === 'string' ? parseFloat(kobo) : kobo
  if (isNaN(n)) return '₦0.00'
  const abs = Math.abs(n) / 100
  if (abs >= 1_000_000) return `₦${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `₦${(abs / 1_000).toFixed(1)}K`
  return `₦${abs.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

function entryTypeBadge(entryType: string, movementType: string) {
  const isCr = entryType === 'CREDIT'
  return (
    <Badge
      color={isCr ? 'green' : 'red'}
      variant="light"
      size="sm"
      leftSection={isCr ? <IconArrowDownRight size={12} /> : <IconArrowUpRight size={12} />}
    >
      {movementType ?? entryType}
    </Badge>
  )
}

// ── Stats banner ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  loading: boolean
}) {
  return (
    <Card withBorder radius="md" p="md" style={{ flex: 1 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        {icon}
      </div>
      <Text size="sm" fw={500} mb={4}>{label}</Text>
      {loading ? (
        <Skeleton height={28} width="60%" radius="sm" />
      ) : (
        <Text size="xl" fw={800}>{value}</Text>
      )}
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'TRANSACTION', label: 'Transaction' },
  { value: 'ROSCA_CONTRIBUTION', label: 'ROSCA Contribution' },
  { value: 'ROSCA_PAYOUT', label: 'ROSCA Payout' },
  { value: 'REVERSAL', label: 'Reversal' },
  { value: 'PLATFORM_FEE', label: 'Platform Fee' },
  { value: 'FUNDING', label: 'Funding' },
]

const LIMIT = 20

export function Transactions() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const [ledger, setLedger] = useState<PaginatedResponse<LedgerRow> | null>(null)
  const [ledgerLoading, setLedgerLoading] = useState(true)
  const [ledgerError, setLedgerError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sourceType, setSourceType] = useState<string | null>(null)

  const [exporting, setExporting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [reconcileRef, setReconcileRef] = useState('')
  const [reconciling, setReconciling] = useState(false)
  const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null)
  const [reconcileError, setReconcileError] = useState<string | null>(null)

  async function handleReconcile() {
    const ref = reconcileRef.trim()
    if (!ref) return
    setReconciling(true)
    setReconcileResult(null)
    setReconcileError(null)
    try {
      const res = await reconcileFunding(ref)
      setReconcileResult(res.data)
    } catch (e) {
      setReconcileError(e instanceof Error ? e.message : 'Reconciliation failed')
    } finally {
      setReconciling(false)
    }
  }

  // Load analytics
  useEffect(() => {
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    getTransactionAnalytics({ period })
      .then(setAnalytics)
      .catch((e) => setAnalyticsError(e instanceof Error ? e.message : 'Failed to load stats'))
      .finally(() => setAnalyticsLoading(false))
  }, [period])

  // Load ledger
  const fetchLedger = useCallback(() => {
    setLedgerLoading(true)
    setLedgerError(null)
    getLedger({
      page,
      limit: LIMIT,
      ...(search.trim() ? { reference: search.trim() } : {}),
      ...(sourceType ? { sourceType } : {}),
    })
      .then(setLedger)
      .catch((e) => setLedgerError(e instanceof Error ? e.message : 'Failed to load ledger'))
      .finally(() => setLedgerLoading(false))
  }, [page, search, sourceType])

  useEffect(() => { fetchLedger() }, [fetchLedger])

  function handleSearchChange(val: string) {
    setSearch(val)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchLedger, 400)
  }

  async function handleExport() {
    if (!analytics) return
    setExporting(true)
    try {
      const blob = await exportCsv({
        type: 'transactions',
        startDate: analytics.period.start.split('T')[0],
        endDate: analytics.period.end.split('T')[0],
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${period}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent — export errors are non-critical
    } finally {
      setExporting(false)
    }
  }

  const rows = ledger?.data ?? []
  const totalPages = ledger?.meta.totalPages ?? 1

  return (
    <Stack gap="lg" p="xl">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={2} fw={700}>Transactions</Title>
          <Text c="dimmed" size="sm" mt={4}>Ledger entries and transaction analytics.</Text>
        </div>
        <Group gap="sm">
          <SegmentedControl
            data={PERIOD_OPTIONS}
            value={period}
            onChange={(v) => setPeriod(v as '7d' | '30d' | '90d')}
            size="xs"
          />
          <Button
            leftSection={<IconDownload size={16} />}
            variant="outline"
            loading={exporting}
            onClick={handleExport}
            size="sm"
          >
            Export CSV
          </Button>
        </Group>
      </Group>

      {analyticsError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {analyticsError}
        </Alert>
      )}

      {/* Stats */}
      <Group grow gap="md">
        <StatCard
          label={`Inflow (${period})`}
          value={formatNaira(analytics?.inflow.totalKobo ?? 0)}
          icon={<IconArrowDownRight size={20} color="#16a34a" />}
          color="#16a34a"
          loading={analyticsLoading}
        />
        <StatCard
          label={`Outflow (${period})`}
          value={formatNaira(analytics?.outflow.totalKobo ?? 0)}
          icon={<IconArrowUpRight size={20} color="#dc2626" />}
          color="#dc2626"
          loading={analyticsLoading}
        />
        <StatCard
          label={`Platform Fees (${period})`}
          value={formatNaira(analytics?.platformFees.totalKobo ?? 0)}
          icon={<IconCurrencyNaira size={20} color="#2563eb" />}
          color="#2563eb"
          loading={analyticsLoading}
        />
        <StatCard
          label="Transactions"
          value={String((analytics?.inflow.count ?? 0) + (analytics?.outflow.count ?? 0))}
          icon={<IconCurrencyNaira size={20} color="#9333ea" />}
          color="#9333ea"
          loading={analyticsLoading}
        />
      </Group>

      {/* Ledger filters */}
      <Group gap="sm">
        <TextInput
          placeholder="Search by reference..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => handleSearchChange(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 320 }}
          radius="md"
        />
        <Select
          placeholder="Source type"
          data={SOURCE_OPTIONS}
          value={sourceType}
          onChange={(v) => { setSourceType(v); setPage(1) }}
          clearable
          radius="md"
          style={{ width: 200 }}
        />
        <ActionIcon variant="default" size="lg" radius="md" onClick={fetchLedger} title="Refresh">
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>

      {ledgerError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {ledgerError}
        </Alert>
      )}

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={800}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr bg="#066F5B">
                <Table.Th c="white">Date</Table.Th>
                <Table.Th c="white">Type</Table.Th>
                <Table.Th c="white">Amount</Table.Th>
                <Table.Th c="white">Balance After</Table.Th>
                <Table.Th c="white">Reference</Table.Th>
                <Table.Th c="white">User</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ledgerLoading ? (
                [...Array(10)].map((_, i) => (
                  <Table.Tr key={i}>
                    {[...Array(6)].map((__, j) => (
                      <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" py="xl" c="dimmed">No ledger entries found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => {
                  const user = row.wallet?.user
                  const amtKobo = parseFloat(String(row.amount))
                  const balKobo = parseFloat(String(row.balanceAfter))
                  return (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        <Text size="sm">{new Date(row.createdAt).toLocaleDateString('en-NG')}</Text>
                        <Text size="xs" c="dimmed">{new Date(row.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </Table.Td>
                      <Table.Td>{entryTypeBadge(row.entryType, row.movementType)}</Table.Td>
                      <Table.Td>
                        <Text
                          fw={600}
                          size="sm"
                          c={row.entryType === 'CREDIT' ? 'green' : 'red'}
                        >
                          {row.entryType === 'CREDIT' ? '+' : '-'}{formatNaira(amtKobo)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatNaira(balKobo)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.reference}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {user ? (
                          <div>
                            <Text size="sm" fw={500}>{user.firstName} {user.lastName}</Text>
                            <Text size="xs" c="dimmed">{user.email}</Text>
                          </div>
                        ) : <Text size="sm" c="dimmed">—</Text>}
                      </Table.Td>
                    </Table.Tr>
                  )
                })
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            {ledger ? `${ledger.meta.total.toLocaleString()} entries` : ''}
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      </Paper>

      {/* Manual Reconciliation */}
      <Paper withBorder radius="md" p="md">
        <Text fw={600} size="sm" mb="xs">Manual Funding Reconciliation</Text>
        <Text size="xs" c="dimmed" mb="md">
          Force-reconcile a stuck or unprocessed funding transaction by its internal reference (e.g. AJT-FUND-…).
        </Text>
        <Group gap="sm" align="flex-end">
          <TextInput
            placeholder="AJT-FUND-8ca2de2e-…"
            value={reconcileRef}
            onChange={(e) => { setReconcileRef(e.currentTarget.value); setReconcileResult(null); setReconcileError(null) }}
            style={{ flex: 1, maxWidth: 420 }}
            radius="md"
            size="sm"
          />
          <Button
            size="sm"
            loading={reconciling}
            disabled={!reconcileRef.trim()}
            onClick={handleReconcile}
          >
            Reconcile
          </Button>
        </Group>

        {reconcileError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" mt="sm">
            {reconcileError}
          </Alert>
        )}

        {reconcileResult && (
          <Paper withBorder radius="sm" p="sm" mt="sm" bg="gray.0">
            <Group gap="xs" mb="xs">
              <Badge
                color={
                  reconcileResult.outcome === 'settled' ? 'green'
                  : reconcileResult.outcome === 'already_processed' ? 'blue'
                  : reconcileResult.outcome === 'still_pending' ? 'yellow'
                  : 'red'
                }
                variant="filled"
                size="sm"
              >
                {reconcileResult.outcome.replace(/_/g, ' ')}
              </Badge>
              <Text size="xs" c="dimmed">{new Date(reconcileResult.reconciledAt).toLocaleString('en-NG')}</Text>
            </Group>
            <Text size="xs" style={{ fontFamily: 'monospace' }}>{reconcileResult.reference}</Text>
            {reconcileResult.amountKobo && (
              <Text size="xs" c="dimmed" mt={4}>Amount: {formatNaira(reconcileResult.amountKobo)}</Text>
            )}
            {(reconcileResult.reason || reconcileResult.providerMessage) && (
              <Text size="xs" c="dimmed" mt={4}>{reconcileResult.reason ?? reconcileResult.providerMessage}</Text>
            )}
          </Paper>
        )}
      </Paper>
    </Stack>
  )
}

export default Transactions
