import { useState, useEffect } from 'react'
import { Text, Button, Loader, Modal, Badge, Divider } from '@mantine/core'
import { IconPlus, IconArrowUpRight, IconArrowDownLeft } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getAdminWalletBalance, getWalletBalance, getWalletTransactions } from '@/utils/api'
import type { WalletTransaction } from '@/utils/api'

function formatTxLabel(raw: string): string {
  if (!raw) return 'Transaction'
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatKobo(val: string | number | undefined): string {
  if (val == null) return '—'
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
  const movementType = (tx as Record<string, unknown>).movementType as string ?? ''
  const label = movementType
    ? movementType.charAt(0) + movementType.slice(1).toLowerCase()
    : tx.description || formatTxLabel((tx as Record<string, unknown>).sourceType as string || entryType)
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
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null)

  const storedUser = JSON.parse(localStorage.getItem('admin_user') ?? '{}')
  const userId = storedUser.id ?? storedUser._id ?? ''

  useEffect(() => {
    const fetchBalance = userId
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
  }, [userId])

  return (
    <div className="mx-auto w-full max-w-[700px] px-6 py-8">
      {/* Balance card */}
      <div className="mb-6 rounded-2xl bg-[#02A36E] px-6 py-6">
        <Text fw={400} className="text-[12px] text-white/60">Wallet Balance</Text>
        {loading ? (
          <div className="mb-4 flex items-center gap-2 py-1">
            <Loader size="sm" color="white" />
            <Text fw={400} className="text-white/60 text-[14px]">Loading...</Text>
          </div>
        ) : (
          <Text fw={600} className="mb-4 text-[32px] text-white/90">
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
        <button
          onClick={() => navigate('/transactions')}
          className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline"
        >
          View all
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {transactions.length === 0 && !loading && (
          <Text fw={400} className="py-6 text-center text-[14px] text-[#9CA3AF]">No transactions yet</Text>
        )}
        {transactions.map((tx) => {
          const entryType = (tx as Record<string, unknown>).entryType as string ?? tx.type ?? ''
          const isCredit = entryType === 'CREDIT'
          const movementType = (tx as Record<string, unknown>).movementType as string ?? ''
          const label = movementType
            ? movementType.charAt(0) + movementType.slice(1).toLowerCase()
            : tx.description || formatTxLabel((tx as Record<string, unknown>).sourceType as string || entryType)
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
      </div>

      <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
