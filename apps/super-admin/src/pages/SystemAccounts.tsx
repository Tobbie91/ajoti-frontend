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
  Select,
  Textarea,
  Alert,
  Skeleton,
  Drawer,
  Divider,
  ScrollArea,
  TextInput,
} from '@mantine/core'
import { IconAlertCircle, IconCoin } from '@tabler/icons-react'
import { useState, useEffect, useCallback } from 'react'
import {
  listSystemAccounts,
  getLoanFloatFundingReceipts,
  capitalizeLoanFloat,
  getSystemAccountReconciliation,
  getLedger,
  type SystemAccountRow,
  type SystemAccountType,
  type LedgerRow,
  type SystemWalletFundingReceiptRow,
  type SystemWalletReconciliation,
} from '@/utils/api'
import { getStaffRoleFromStorage, hasPermission } from '@/utils/permissions'

const ACCOUNT_LABELS: Record<SystemAccountType, { title: string; description: string }> = {
  PLATFORM_POOL: {
    title: 'Platform Pool',
    description: 'Custody only - balance equals undistributed ajo pots. Never revenue.',
  },
  PLATFORM_REVENUE: {
    title: 'Platform Revenue',
    description: 'Ajoti revenue, including the full early-payout fee collected at repayment.',
  },
  LOAN_FLOAT: {
    title: 'Loan Float',
    description: 'Early-payout lending capital. Repaid principal returns to this account.',
  },
}

function fmt(naira: string) {
  return '₦' + Number(naira).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function fmtKobo(kobo: string) {
  return '₦' + (Number(kobo) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function fmtDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function SystemAccounts() {
  const staffRole = getStaffRoleFromStorage()
  const canManage = hasPermission(staffRole, 'MANAGE_SYSTEM_ACCOUNTS')

  const [accounts, setAccounts] = useState<SystemAccountRow[]>([])
  const [fundingReceipts, setFundingReceipts] = useState<SystemWalletFundingReceiptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<SystemAccountRow | null>(null)
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)

  const [capitalizeOpened, setCapitalizeOpened] = useState(false)
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [bankTransferReference, setBankTransferReference] = useState('')
  const [capitalizing, setCapitalizing] = useState(false)
  const [capitalizeError, setCapitalizeError] = useState<string | null>(null)
  const [reconciliation, setReconciliation] = useState<SystemWalletReconciliation | null>(null)
  const [reconciliationLoading, setReconciliationLoading] = useState(false)
  const [reconciliationError, setReconciliationError] = useState<string | null>(null)
  const [reconciliationTo, setReconciliationTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [reconciliationFrom, setReconciliationFrom] = useState(() =>
    new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10),
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [res, receipts] = await Promise.all([listSystemAccounts(), getLoanFloatFundingReceipts()])
      setAccounts(res.data)
      setFundingReceipts(receipts.data)
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
    if (!selectedReceiptId || !note.trim() || !bankTransferReference.trim()) return
    setCapitalizing(true)
    setCapitalizeError(null)
    try {
      await capitalizeLoanFloat(selectedReceiptId, note.trim(), bankTransferReference.trim())
      setCapitalizeOpened(false)
      setSelectedReceiptId(null)
      setNote('')
      setBankTransferReference('')
      void load()
      if (selected?.type === 'LOAN_FLOAT') await openDrawer(selected)
    } catch (e) {
      setCapitalizeError(e instanceof Error ? e.message : 'Failed to record capitalization')
    } finally {
      setCapitalizing(false)
    }
  }

  const handleReconciliation = async () => {
    setReconciliationLoading(true)
    setReconciliationError(null)
    try {
      const result = await getSystemAccountReconciliation(reconciliationFrom, reconciliationTo)
      setReconciliation(result.data)
    } catch (e) {
      setReconciliationError(e instanceof Error ? e.message : 'Failed to load provider reconciliation')
    } finally {
      setReconciliationLoading(false)
    }
  }

  const floatEnvironment = accounts.find((account) => account.type === 'LOAN_FLOAT')?.providerAccount?.environment
  const capitalizableReceipts = fundingReceipts.filter((receipt) =>
    receipt.status === 'CONFIRMED' && receipt.environment === floatEnvironment,
  )

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
        Internal chart-of-accounts - custody, earnings, and lending capital. Not tied to any customer.
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

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={4}>Provider reconciliation</Title>
              <Text size="sm" c="dimmed">Read-only balance comparison and recent provider activity. Differences are never adjusted automatically.</Text>
            </div>
            <Group align="flex-end">
              <TextInput label="From" type="date" value={reconciliationFrom} onChange={(e) => setReconciliationFrom(e.currentTarget.value)} />
              <TextInput label="To" type="date" value={reconciliationTo} onChange={(e) => setReconciliationTo(e.currentTarget.value)} />
              <Button onClick={() => void handleReconciliation()} loading={reconciliationLoading} disabled={!reconciliationFrom || !reconciliationTo}>
                Compare provider balances
              </Button>
            </Group>
          </Group>
          {reconciliationError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {reconciliationError}
            </Alert>
          )}
          {reconciliation && (
            <>
              <Text size="xs" c="dimmed">
                {reconciliation.environment} · {reconciliation.mode} · {reconciliation.period.from} to {reconciliation.period.to}. {reconciliation.policy}
              </Text>
              <Table.ScrollContainer minWidth={900}>
                <Table striped withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Provider account</Table.Th>
                      <Table.Th>Local balance / liability</Table.Th>
                      <Table.Th>Provider available</Table.Th>
                      <Table.Th>Difference</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>Merchant · member wallet backing</Table.Td>
                      <Table.Td>{fmtKobo(reconciliation.merchant.localBalanceMinor)}</Table.Td>
                      <Table.Td>{reconciliation.merchant.providerBalanceMinor ? fmtKobo(reconciliation.merchant.providerBalanceMinor) : '—'}</Table.Td>
                      <Table.Td>{reconciliation.merchant.differenceMinor ? fmtKobo(reconciliation.merchant.differenceMinor) : '—'}</Table.Td>
                      <Table.Td><Badge color={reconciliation.merchant.reconciliationStatus === 'MATCH' ? 'green' : reconciliation.merchant.reconciliationStatus === 'DIFFERENCE' ? 'orange' : 'gray'}>{reconciliation.merchant.reconciliationStatus}</Badge></Table.Td>
                    </Table.Tr>
                    {reconciliation.systemAccounts.map((account) => (
                      <Table.Tr key={account.accountType}>
                        <Table.Td>{ACCOUNT_LABELS[account.accountType]?.title ?? account.accountType}</Table.Td>
                        <Table.Td>{fmtKobo(account.localBalanceMinor)}</Table.Td>
                        <Table.Td>{account.providerBalanceMinor ? fmtKobo(account.providerBalanceMinor) : '—'}</Table.Td>
                        <Table.Td>{account.differenceMinor ? fmtKobo(account.differenceMinor) : '—'}</Table.Td>
                        <Table.Td><Badge color={account.reconciliationStatus === 'MATCH' ? 'green' : account.reconciliationStatus === 'DIFFERENCE' ? 'orange' : 'gray'}>{account.reconciliationStatus}</Badge></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
              {reconciliation.systemAccounts.some((account) => account.errorCode) && (
                <Text size="xs" c="orange.8">Some provider account reads failed; see account statuses and retry the comparison.</Text>
              )}
              <Divider label="Provider activity (first page)" labelPosition="left" />
              <ScrollArea h={320}>
                <Stack gap="xs">
                  {[...reconciliation.merchant.collections.map((item) => ({ account: 'Merchant collection', item })),
                    ...reconciliation.merchant.transfers.map((item) => ({ account: 'Merchant transfer', item })),
                    ...reconciliation.systemAccounts.flatMap((account) => account.transactions.map((item) => ({
                      account: ACCOUNT_LABELS[account.accountType]?.title ?? account.accountType,
                      item,
                    })))].map(({ account, item }, index) => (
                    <Paper key={`${account}-${item.id ?? item.reference ?? index}`} withBorder p="xs">
                      <Group justify="space-between" wrap="nowrap">
                        <div>
                          <Text size="sm" fw={500}>{account} · {item.type ?? item.status ?? 'Activity'}</Text>
                          <Text size="xs" c="dimmed">{item.reference ?? item.id ?? 'No reference'} · {item.narration ?? '—'}</Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Text size="sm" fw={600}>{item.amountMinor ? fmtKobo(item.amountMinor) : '—'}</Text>
                          <Text size="xs" c="dimmed">{item.status ?? '—'} · {fmtDate(item.createdAt)}</Text>
                        </div>
                      </Group>
                    </Paper>
                  ))}
                  {reconciliation.merchant.collections.length + reconciliation.merchant.transfers.length + reconciliation.systemAccounts.reduce((sum, account) => sum + account.transactions.length, 0) === 0 && (
                    <Text size="sm" c="dimmed" ta="center" py="md">No provider activity returned for this date range.</Text>
                  )}
                </Stack>
              </ScrollArea>
            </>
          )}
        </Stack>
      </Paper>

      <Modal opened={capitalizeOpened} onClose={() => setCapitalizeOpened(false)} title="Capitalize Loan Float" centered size="sm">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Select a confirmed LOAN_FLOAT receipt and enter the matching Ajoti company-bank debit reference.
            This records the matched capitalization; it does not move provider funds.
          </Text>
          {capitalizeError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {capitalizeError}
            </Alert>
          )}
          <Select
            label="Confirmed funding receipt"
            placeholder={capitalizableReceipts.length ? 'Choose a receipt' : 'No confirmed receipts available'}
            data={capitalizableReceipts.map((receipt) => ({
              value: receipt.id,
              label: `${fmtKobo(receipt.amountMinor)} · ${receipt.providerReference} · ${fmtDate(receipt.receivedAt)}`,
            }))}
            value={selectedReceiptId}
            onChange={setSelectedReceiptId}
            searchable
            nothingFoundMessage="No confirmed receipts"
          />
          <TextInput
            label="Ajoti company-bank transfer reference"
            placeholder="BANK-TRANSFER-REF-20261014-01"
            value={bankTransferReference}
            onChange={(e) => setBankTransferReference(e.currentTarget.value)}
            maxLength={160}
          />
          <Textarea
            label="Note"
            placeholder="Initial capitalization - bank transfer ref XYZ123"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            minRows={2}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setCapitalizeOpened(false)}>Cancel</Button>
            <Button
              onClick={() => void handleCapitalize()}
              loading={capitalizing}
              disabled={!selectedReceiptId || !note.trim() || !bankTransferReference.trim()}
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
