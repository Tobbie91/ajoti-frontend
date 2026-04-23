import {
  Stack,
  Title,
  Paper,
  Table,
  Text,
  Badge,
  Group,
  TextInput,
  ActionIcon,
  Select,
  Pagination,
  Skeleton,
  Drawer,
  Divider,
  ScrollArea,
} from '@mantine/core'
import { IconSearch, IconX, IconWallet } from '@tabler/icons-react'
import { useState, useEffect, useCallback } from 'react'
import { listWallets, getLedger, type WalletRow, type LedgerRow } from '@/utils/api'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'green',
  RESTRICTED: 'yellow',
  SUSPENDED: 'red',
  FROZEN: 'blue',
}

function fmt(naira: string) {
  return '₦' + Number(naira).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtKobo(kobo: string) {
  return '₦' + (Number(kobo) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

export function Wallets() {
  const [wallets, setWallets] = useState<WalletRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const [selected, setSelected] = useState<WalletRow | null>(null)
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listWallets({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      })
      setWallets(res.data)
      setTotal(res.meta.total)
      setTotalPages(res.meta.totalPages)
    } catch {
      // silently fail — table stays empty
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter])

  useEffect(() => { void load() }, [load])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const openDrawer = async (row: WalletRow) => {
    setSelected(row)
    setLedger([])
    setLedgerLoading(true)
    try {
      const res = await getLedger({ userId: row.userId, limit: 20, page: 1 })
      setLedger(res.data)
    } catch {
      // silent
    } finally {
      setLedgerLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter(null)
    setPage(1)
  }

  const hasFilters = !!search || !!statusFilter

  return (
    <Stack mt="xl" gap="lg">
      <Group justify="space-between">
        <Group>
          <Title order={3}>User Wallets</Title>
          {hasFilters && (
            <ActionIcon variant="subtle" color="gray" onClick={clearFilters} title="Clear filters" size="sm">
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>
        <Text size="sm" c="dimmed">{total} wallets</Text>
      </Group>

      {/* Filters */}
      <Group>
        <TextInput
          placeholder="Search by name or email..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          rightSection={
            search ? (
              <ActionIcon size="sm" onClick={() => setSearch('')}>
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          style={{ flex: 1, maxWidth: 360 }}
        />
        <Select
          placeholder="All statuses"
          data={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'RESTRICTED', label: 'Restricted' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'FROZEN', label: 'Frozen' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          w={160}
        />
      </Group>

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={800}>
          <Table striped highlightOnHover styles={{ th: { padding: '14px 18px' }, td: { padding: '14px 18px' } }}>
            <Table.Thead>
              <Table.Tr bg="#066F5B">
                <Table.Th c="white">User</Table.Th>
                <Table.Th c="white">Wallet ID</Table.Th>
                <Table.Th c="white">Balance</Table.Th>
                <Table.Th c="white">Status</Table.Th>
                <Table.Th c="white">Last Activity</Table.Th>
                <Table.Th c="white">Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Table.Tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <Table.Td key={j}><Skeleton h={16} radius="sm" /></Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : wallets.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" py="xl" c="dimmed">No wallets found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                wallets.map((row) => (
                  <Table.Tr
                    key={row.walletId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDrawer(row)}
                  >
                    <Table.Td>
                      <Text fw={500}>{row.user.firstName} {row.user.lastName}</Text>
                      <Text size="xs" c="dimmed">{row.user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" ff="monospace" c="dimmed">{row.walletId.slice(0, 8)}…</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600} c={Number(row.balanceKobo) > 0 ? 'green.7' : undefined}>
                        {fmt(row.balanceNaira)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={STATUS_COLORS[row.status] ?? 'gray'}>
                        {row.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{fmtDate(row.lastActivityAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{fmtDate(row.createdAt)}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {total > 0 && (
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}
            </Text>
            {totalPages > 1 && (
              <Pagination total={totalPages} value={page} onChange={setPage} color="#066F5B" />
            )}
          </Group>
        )}
      </Paper>

      {/* Detail drawer */}
      <Drawer
        opened={!!selected}
        onClose={() => setSelected(null)}
        title={
          <Group gap="xs">
            <IconWallet size={20} />
            <Text fw={600}>
              {selected?.user.firstName} {selected?.user.lastName}
            </Text>
          </Group>
        }
        position="right"
        size="lg"
        padding="lg"
      >
        {selected && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Balance</Text>
              <Text fw={700} fz="xl" c="green.7">{fmt(selected.balanceNaira)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Status</Text>
              <Badge variant="light" color={STATUS_COLORS[selected.status] ?? 'gray'}>{selected.status}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Email</Text>
              <Text size="sm">{selected.user.email}</Text>
            </Group>
            {selected.user.phone && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Phone</Text>
                <Text size="sm">{selected.user.phone}</Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Wallet ID</Text>
              <Text size="xs" ff="monospace">{selected.walletId}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Last activity</Text>
              <Text size="sm">{fmtDate(selected.lastActivityAt)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Wallet created</Text>
              <Text size="sm">{fmtDate(selected.createdAt)}</Text>
            </Group>

            <Divider label="Recent Transactions" labelPosition="left" mt="sm" />

            {ledgerLoading ? (
              <Stack gap="xs">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={28} radius="sm" />)}
              </Stack>
            ) : ledger.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">No transactions yet</Text>
            ) : (
              <ScrollArea h={380}>
                <Stack gap={4}>
                  {ledger.map((tx) => (
                    <Paper key={tx.id} withBorder p="sm" radius="sm">
                      <Group justify="space-between" mb={2}>
                        <Badge
                          size="xs"
                          variant="light"
                          color={tx.movementType === 'FUNDING' ? 'green' : tx.movementType === 'WITHDRAWAL' ? 'red' : 'blue'}
                        >
                          {tx.movementType}
                        </Badge>
                        <Text fw={600} size="sm" c={tx.entryType === 'CREDIT' ? 'green.7' : 'red.7'}>
                          {tx.entryType === 'CREDIT' ? '+' : '-'}{fmtKobo(tx.amount)}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">{tx.sourceType}</Text>
                        <Text size="xs" c="dimmed">{new Date(tx.createdAt).toLocaleDateString('en-NG')}</Text>
                      </Group>
                      <Text size="xs" c="dimmed" mt={2}>
                        Balance after: {fmtKobo(tx.balanceAfter)}
                      </Text>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Stack>
        )}
      </Drawer>
    </Stack>
  )
}
