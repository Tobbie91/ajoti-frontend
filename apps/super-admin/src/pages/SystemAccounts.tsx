import {
  Stack,
  Title,
  Text,
  Paper,
  Table,
  Badge,
  Group,
  Button,
  Modal,
  NumberInput,
  Textarea,
  Alert,
  Skeleton,
  Drawer,
  Divider,
  ScrollArea,
} from '@mantine/core'
import { IconAlertCircle, IconCoin } from '@tabler/icons-react'
import { useState, useEffect, useCallback } from 'react'
import {
  listSystemAccounts,
  capitalizeLoanFloat,
  getLedger,
  type SystemAccountRow,
  type SystemAccountType,
  type LedgerRow,
} from '@/utils/api'
import { getStaffRoleFromStorage, hasPermission } from '@/utils/permissions'

const ACCOUNT_LABELS: Record<SystemAccountType, { title: string; description: string }> = {
  PLATFORM_POOL: {
    title: 'Platform Pool',
    description: 'Custody only — balance equals undistributed ROSCA pots. Never revenue.',
  },
  PLATFORM_REVENUE: {
    title: 'Platform Revenue',
    description: "Money Ajoti has earned — Ajoti's ₦600 share of the flat ₦1,000 payout fee, and the early-payout company fee.",
  },
  LOAN_FLOAT: {
    title: 'Loan Float',
    description: 'Lending capital for early payouts — capitalizations minus outstanding principal.',
  },
}

function fmt(naira: string) {
  return '₦' + Number(naira).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function fmtKobo(kobo: string) {
  return '₦' + (Number(kobo) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function SystemAccounts() {
  const staffRole = getStaffRoleFromStorage()
  const canManage = hasPermission(staffRole, 'MANAGE_SYSTEM_ACCOUNTS')

  const [accounts, setAccounts] = useState<SystemAccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<SystemAccountRow | null>(null)
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)

  const [capitalizeOpened, setCapitalizeOpened] = useState(false)
  const [amountNaira, setAmountNaira] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [capitalizing, setCapitalizing] = useState(false)
  const [capitalizeError, setCapitalizeError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listSystemAccounts()
      setAccounts(res.data)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load system accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const openDrawer = async (row: SystemAccountRow) => {
    setSelected(row)
    setLedger([])
    setLedgerLoading(true)
    try {
      const res = await getLedger({ walletId: row.walletId, limit: 20, page: 1 })
      setLedger(res.data)
    } catch {
      // silent
    } finally {
      setLedgerLoading(false)
    }
  }

  const handleCapitalize = async () => {
    if (!amountNaira || amountNaira <= 0 || !note.trim()) return
    setCapitalizing(true)
    setCapitalizeError(null)
    try {
      await capitalizeLoanFloat(Math.round(amountNaira * 100), note.trim())
      setCapitalizeOpened(false)
      setAmountNaira('')
      setNote('')
      void load()
      if (selected?.type === 'LOAN_FLOAT') await openDrawer(selected)
    } catch (e) {
      setCapitalizeError(e instanceof Error ? e.message : 'Failed to record capitalization')
    } finally {
      setCapitalizing(false)
    }
  }

  return (
    <Stack mt="xl" gap="lg">
      {loadError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" withCloseButton onClose={() => setLoadError(null)}>
          {loadError}
        </Alert>
      )}

      <Group justify="space-between">
        <Title order={3}>Platform Accounts</Title>
        {canManage && (
          <Button leftSection={<IconCoin size={16} />} onClick={() => setCapitalizeOpened(true)}>
            Capitalize Loan Float
          </Button>
        )}
      </Group>

      <Text size="sm" c="dimmed">
        Internal chart-of-accounts — custody, earnings, and lending capital. Not tied to any customer.
      </Text>

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={820}>
          <Table striped highlightOnHover layout="fixed" styles={{ th: { padding: '14px 18px' }, td: { padding: '14px 18px' } }}>
            <Table.Thead>
              <Table.Tr bg="#0B6B55">
                <Table.Th c="white" w={260}>Account</Table.Th>
                <Table.Th c="white" w={200}>Balance</Table.Th>
                <Table.Th c="white" w={160}>Status</Table.Th>
                <Table.Th c="white" w={200}>Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Table.Tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Table.Td key={j}><Skeleton h={16} radius="sm" /></Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : (
                accounts.map((row) => {
                  const info = ACCOUNT_LABELS[row.type]
                  return (
                    <Table.Tr key={row.walletId} style={{ cursor: 'pointer' }} onClick={() => openDrawer(row)}>
                      <Table.Td>
                        <Text fw={500}>{info?.title ?? row.type}</Text>
                        <Text size="xs" c="dimmed">{info?.description}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} c={Number(row.balanceKobo) > 0 ? 'green.7' : undefined}>
                          {fmt(row.balanceNaira)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={row.status === 'ACTIVE' ? 'green' : 'gray'}>{row.status}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{fmtDate(row.createdAt)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  )
                })
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal opened={capitalizeOpened} onClose={() => setCapitalizeOpened(false)} title="Capitalize Loan Float" centered size="sm">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Records real money committed as lending capital. The actual bank transfer happens
            outside the platform — this only creates the matching ledger entry.
          </Text>
          {capitalizeError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {capitalizeError}
            </Alert>
          )}
          <NumberInput
            label="Amount (₦)"
            placeholder="50000"
            min={0.01}
            value={amountNaira}
            onChange={(v) => setAmountNaira(typeof v === 'number' ? v : '')}
            thousandSeparator=","
            decimalScale={2}
          />
          <Textarea
            label="Note"
            placeholder="Initial capitalization — bank transfer ref XYZ123"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            minRows={2}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setCapitalizeOpened(false)}>Cancel</Button>
            <Button
              onClick={() => void handleCapitalize()}
              loading={capitalizing}
              disabled={!amountNaira || amountNaira <= 0 || !note.trim()}
            >
              Record Capitalization
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Drawer
        opened={!!selected}
        onClose={() => setSelected(null)}
        title={<Text fw={600}>{selected ? ACCOUNT_LABELS[selected.type]?.title ?? selected.type : ''}</Text>}
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
              <Badge variant="light" color={selected.status === 'ACTIVE' ? 'green' : 'gray'}>{selected.status}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Wallet ID</Text>
              <Text size="xs" ff="monospace">{selected.walletId}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Created</Text>
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
