import { useState, useEffect } from 'react'
import { ActionIcon, Text, Button, Loader, Modal, Badge, Divider } from '@mantine/core'
import {
  IconPlus,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconEye,
  IconEyeOff,
  IconLock,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getAdminWalletBalance, getWalletBalance, getWalletTransactions } from '@/utils/api'
import type { WalletTransaction } from '@/utils/api'
import { useWalletPrivacy } from '@/hooks/useWalletPrivacy'
import { isCircleAdmin } from '@/utils/auth-role'

// Friendly overrides for sourceTypes whose humanized enum name reads awkwardly
// or should be phrased for this audience specifically.
const SOURCE_TYPE_LABELS: Record<string, string> = {
  ROSCA_ADMIN_FEE: 'Group admin payout fee share',
  LATE_PENALTY_ADMIN_FEE: 'Late-penalty proceeds from a member',
}

function formatTxLabel(raw: string): string {
  if (!raw) return 'Transaction'
  if (SOURCE_TYPE_LABELS[raw]) return SOURCE_TYPE_LABELS[raw]
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// A sourceType with a friendly override always wins; otherwise generic
// movementTypes like TRANSFER would mask it (a fee credit and a plain
// wallet-to-wallet transfer both have movementType=TRANSFER).
function resolveTxLabel(tx: WalletTransaction, entryType: string): string {
  const sourceType = (tx as Record<string, unknown>).sourceType as string | undefined
  if (sourceType && SOURCE_TYPE_LABELS[sourceType]) return SOURCE_TYPE_LABELS[sourceType]

  const movementType = (tx as Record<string, unknown>).movementType as string ?? ''
  if (movementType) return movementType.charAt(0) + movementType.slice(1).toLowerCase()

  return tx.description || formatTxLabel(sourceType || entryType)
}

function formatKobo(val: string | number | undefined): string {
  if (val == null) return 'Not available'
  return `₦${(Number(val) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <Text fz={13} c="dimmed" style={{ flexShrink: 0 }}>{label}</Text>
      <Text fz={13} fw={500} ta="right" style={{ wordBreak: 'break-all' }}>{value}</Text>
    </div>
  )
}

function TransactionDetailModal({ tx, onClose }: { tx: WalletTransaction | null; onClose: () => void }) {
  if (!tx) return null
  const entryType = (tx as Record<string, unknown>).entryType as string ?? tx.type ?? ''
  const isCredit = entryType === 'CREDIT'
  const color = isCredit ? '#02A36E' : '#EF4444'
  const label = resolveTxLabel(tx, entryType)
  const d = new Date(tx.createdAt)
  const amtNaira = `₦${(Number(tx.amount) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  const metaEntries = tx.metadata
    ? Object.entries(tx.metadata as Record<string, unknown>).filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
    : []

  return (
    <Modal opened={!!tx} onClose={onClose} title="Transaction Details" radius={16} size="sm" centered>
      <div className="mb-4 flex flex-col items-center gap-2 py-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${color}15` }}>
          {isCredit ? <IconArrowDownLeft size={26} color={color} /> : <IconArrowUpRight size={26} color={color} />}
        </div>
        <Text fw={700} fz={28} style={{ color, lineHeight: 1 }}>
          {isCredit ? '+' : '-'}{amtNaira}
        </Text>
        <Badge variant="light" size="sm" style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
          {entryType}
        </Badge>
      </div>

      <Divider mb="sm" />

      <div className="flex flex-col divide-y divide-[#F3F4F6]">
        <DetailRow label="Description" value={label} />
        {!!(tx as Record<string, unknown>).movementType && <DetailRow label="Movement" value={(tx as Record<string, unknown>).movementType as string} />}
        {!!(tx as Record<string, unknown>).bucketType && <DetailRow label="Bucket" value={(tx as Record<string, unknown>).bucketType as string} />}
        {!!(tx as Record<string, unknown>).sourceType && <DetailRow label="Source" value={(tx as Record<string, unknown>).sourceType as string} />}
        <DetailRow label="Date" value={d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} />
        <DetailRow label="Time" value={d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })} />
        {(tx as Record<string, unknown>).balanceBefore != null && <DetailRow label="Balance Before" value={formatKobo((tx as Record<string, unknown>).balanceBefore as string)} />}
        {(tx as Record<string, unknown>).balanceAfter != null && <DetailRow label="Balance After" value={formatKobo((tx as Record<string, unknown>).balanceAfter as string)} />}
        {metaEntries.map(([k, v]) => (
          <DetailRow key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={String(v)} />
        ))}
        <DetailRow label="Reference" value={<span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>{tx.id}</span>} />
      </div>
    </Modal>
  )
}

interface Tx extends WalletTransaction {}

export function MyWallet() {
  const navigate = useNavigate()
  const { hidden, toggle } = useWalletPrivacy()
  const admin = isCircleAdmin()
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null)

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}')
  const userId = storedUser.id ?? storedUser._id ?? ''

  useEffect(() => {
    const fetchBalance = admin && userId
      ? getAdminWalletBalance(userId)
          .then((data) => setBalance(data.available ?? data.total ?? 0))
          .catch(() =>
            getWalletBalance()
              .then((data) => setBalance(Number(data.available ?? data.total ?? 0) / 100))
              .catch(() => setBalance(0)),
          )
      : getWalletBalance()
          .then((data) => setBalance(Number(data.available ?? data.total ?? 0) / 100))
          .catch(() => setBalance(0))

    Promise.all([
      fetchBalance,
      getWalletTransactions()
        .then((txns) => setTransactions(txns.slice(0, 5)))
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [admin, userId])

  return (
    <div className="mx-auto w-full max-w-[700px] px-6 py-8">
      {/* Balance card */}
      <div className="mb-6 rounded-2xl bg-[#02A36E] px-6 py-6">
        <div className="flex items-center gap-2">
          <Text fw={400} fz={12} c="white" opacity={0.75}>Wallet Balance</Text>
          <ActionIcon
            variant="subtle"
            aria-label={hidden ? 'Show wallet balance and transactions' : 'Hide wallet balance and transactions'}
            onClick={toggle}
            style={{ color: 'white' }}
          >
            {hidden ? <IconEye size={18} /> : <IconEyeOff size={18} />}
          </ActionIcon>
        </div>
        {loading ? (
          <div className="mb-4 flex items-center gap-2 py-1">
            <Loader size="sm" color="white" />
            <Text fw={400} className="text-white/60 text-[14px]">Loading...</Text>
          </div>
        ) : hidden ? (
          <IconLock
            size={25}
            color="white"
            aria-label="Wallet balance hidden"
            style={{ display: 'block', marginTop: 4, marginBottom: 16 }}
          />
        ) : (
          <Text fw={600} fz={32} c="white" mb={16}>
            ₦{(balance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </Text>
        )}
        <div className="flex gap-3">
          <Button
            radius="md"
            size="sm"
            leftSection={<IconPlus size={16} />}
            className="bg-white/20 text-white hover:bg-white/30"
            onClick={() => navigate('/fund-wallet')}
          >
            Fund Wallet
          </Button>
          <Button
            radius="md"
            size="sm"
            leftSection={<IconArrowUpRight size={16} />}
            className="bg-white/20 text-white hover:bg-white/30"
            onClick={() => navigate('/withdraw')}
          >
            Withdraw
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-4 flex items-center justify-between">
        <Text fw={700} className="text-[18px] text-[#0F172A]">Recent Transactions</Text>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/debts')}
            className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline"
          >
            My Debts
          </button>
          <button
            onClick={() => navigate('/transactions')}
            className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline"
          >
            View all
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {hidden ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-[#F3F4F6] bg-white">
            <IconLock size={25} color="#667085" aria-label="Transaction history hidden" />
          </div>
        ) : (
          <>
          {transactions.length === 0 && !loading && (
            <Text fw={400} className="py-6 text-center text-[14px] text-[#9CA3AF]">No transactions yet</Text>
          )}
          {transactions.map((tx) => {
          const entryType = (tx as Record<string, unknown>).entryType as string ?? tx.type ?? ''
          const isCredit = entryType === 'CREDIT'
          const label = resolveTxLabel(tx, entryType)
          return (
            <div
              key={tx.id}
              onClick={() => setSelectedTx(tx)}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-[#F3F4F6] bg-white px-4 py-3 transition-colors hover:bg-[#F9FAFB] active:bg-[#F3F4F6]"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCredit ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'}`}>
                  {isCredit
                    ? <IconArrowDownLeft size={18} color="#02A36E" />
                    : <IconArrowUpRight size={18} color="#EF4444" />}
                </div>
                <div>
                  <Text fw={500} className="text-[14px] text-[#0F172A]">{label}</Text>
                  <Text fw={400} className="text-[12px] text-[#9CA3AF]">
                    {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </Text>
                </div>
              </div>
              <Text fw={600} className={`text-[14px] ${isCredit ? 'text-[#02A36E]' : 'text-[#EF4444]'}`}>
                {isCredit ? '+' : '-'}₦{(Number(tx.amount) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
            </div>
          )
          })}
          </>
        )}
      </div>

      <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
