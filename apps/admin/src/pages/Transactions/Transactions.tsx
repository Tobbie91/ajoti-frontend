import { useState, useEffect } from 'react'
import { Text, TextInput, Select, Loader, Modal, Badge, Divider } from '@mantine/core'
import {
  IconArrowLeft,
  IconSearch,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconPlus,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getWalletTransactions, getWalletBalance, getAdminWalletBalance } from '@/utils/api'
import type { WalletTransaction } from '@/utils/api'

type Transaction = {
  id: string
  name: string
  type: string
  time: string
  amount: string
  direction: 'credit' | 'debit'
  date: string
  raw: WalletTransaction
}

function mapApiTxn(tx: WalletTransaction): Transaction {
  const d = new Date(tx.createdAt)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  let dateLabel: string
  if (d.toDateString() === today.toDateString()) dateLabel = 'Today'
  else if (d.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday'
  else dateLabel = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })

  const entryType: string = (tx as Record<string, unknown>).entryType as string ?? tx.type ?? ''
  const movementType: string = (tx as Record<string, unknown>).movementType as string ?? ''
  const label: string = movementType
    ? movementType.charAt(0) + movementType.slice(1).toLowerCase()
    : (tx.description ?? entryType)
  const amtNaira = Number(tx.amount) / 100

  return {
    id: tx.id,
    name: label,
    type: entryType,
    time: d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }),
    amount: `₦${amtNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
    direction: entryType === 'CREDIT' ? 'credit' : 'debit',
    date: dateLabel,
    raw: tx,
  }
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

function TransactionDetailModal({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  if (!tx) return null
  const raw = tx.raw
  const d = new Date(raw.createdAt)
  const isCredit = tx.direction === 'credit'
  const color = isCredit ? '#02A36E' : '#EF4444'

  const metaEntries = raw.metadata
    ? Object.entries(raw.metadata as Record<string, unknown>).filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
    : []

  return (
    <Modal
      opened={!!tx}
      onClose={onClose}
      title="Transaction Details"
      radius={16}
      size="sm"
      centered
    >
      <div className="mb-4 flex flex-col items-center gap-2 py-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: `${color}15` }}
        >
          {isCredit
            ? <IconArrowDownLeft size={26} color={color} />
            : <IconArrowUpRight size={26} color={color} />}
        </div>
        <Text fw={700} fz={28} style={{ color, lineHeight: 1 }}>
          {isCredit ? '+' : '-'}{tx.amount}
        </Text>
        <Badge
          variant="light"
          size="sm"
          style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
        >
          {tx.type}
        </Badge>
      </div>

      <Divider mb="sm" />

      <div className="flex flex-col divide-y divide-[#F3F4F6]">
        <DetailRow label="Description" value={tx.name} />
        {!!(raw as Record<string, unknown>).movementType && <DetailRow label="Movement" value={(raw as Record<string, unknown>).movementType as string} />}
        {!!(raw as Record<string, unknown>).bucketType && <DetailRow label="Bucket" value={(raw as Record<string, unknown>).bucketType as string} />}
        {!!(raw as Record<string, unknown>).sourceType && <DetailRow label="Source" value={(raw as Record<string, unknown>).sourceType as string} />}
        <DetailRow label="Date" value={d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} />
        <DetailRow label="Time" value={d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })} />
        {(raw as Record<string, unknown>).balanceBefore != null && <DetailRow label="Balance Before" value={formatKobo((raw as Record<string, unknown>).balanceBefore as string)} />}
        {(raw as Record<string, unknown>).balanceAfter != null && <DetailRow label="Balance After" value={formatKobo((raw as Record<string, unknown>).balanceAfter as string)} />}
        {metaEntries.map(([k, v]) => (
          <DetailRow key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={String(v)} />
        ))}
        <DetailRow
          label="Reference"
          value={<span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>{raw.id}</span>}
        />
      </div>
    </Modal>
  )
}

const STATUS_OPTIONS = ['All', 'Successful', 'Pending', 'Failed']
const TYPE_OPTIONS = ['All', 'Credit', 'Debit']
const CATEGORY_OPTIONS = ['All', 'Transfer', 'Funding', 'ROSCA', 'Investment']

export function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [walletBalance, setWalletBalance] = useState('₦ —')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>('All')
  const [type, setType] = useState<string | null>('All')
  const [category, setCategory] = useState<string | null>('All')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const storedUser = JSON.parse(localStorage.getItem('admin_user') ?? '{}')
  const userId = storedUser.id ?? storedUser._id ?? ''

  useEffect(() => {
    const balanceFetch = userId
      ? getAdminWalletBalance(userId)
          .then((data) => {
            const bal = data.available ?? data.total ?? 0
            setWalletBalance(`₦${Number(bal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`)
          })
          .catch(() =>
            getWalletBalance()
              .then((data) => {
                const bal = Number(data.available ?? data.total ?? 0) / 100
                setWalletBalance(`₦${bal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`)
              })
              .catch(() => setWalletBalance('₦0.00')),
          )
      : getWalletBalance()
          .then((data) => {
            const bal = Number(data.available ?? data.total ?? 0) / 100
            setWalletBalance(`₦${bal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`)
          })
          .catch(() => setWalletBalance('₦0.00'))

    Promise.all([
      balanceFetch,
      getWalletTransactions()
        .then((txns) => setTransactions(txns.map(mapApiTxn)))
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [userId])

  const filtered = transactions.filter((tx) => {
    if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) return false
    if (type && type !== 'All') {
      if (type === 'Credit' && tx.direction !== 'credit') return false
      if (type === 'Debit' && tx.direction !== 'debit') return false
    }
    return true
  })

  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})

  return (
    <div className="mx-auto w-full max-w-[700px] px-6 py-8">
      {/* Wallet balance banner */}
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#02A36E] px-6 py-4">
        <div>
          <Text fw={400} className="text-[12px] text-white/60">Wallet Balance</Text>
          {loading ? (
            <Loader size="sm" color="white" />
          ) : (
            <Text fw={600} className="text-[24px] text-white/90">{walletBalance}</Text>
          )}
        </div>
        <button
          onClick={() => navigate('/fund-wallet')}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-sm hover:bg-white/30"
        >
          <IconPlus size={16} /> Add money
        </button>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
      >
        <IconArrowLeft size={18} /> Back
      </button>

      <Text fw={700} className="mb-6 text-[24px] text-[#0F172A]">Transactions</Text>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Select data={STATUS_OPTIONS} value={status} onChange={setStatus} placeholder="Status" radius="md" size="xs" styles={{ input: { borderColor: '#E5E7EB', fontSize: 13, height: 36 } }} />
        <Select data={TYPE_OPTIONS} value={type} onChange={setType} placeholder="Type" radius="md" size="xs" styles={{ input: { borderColor: '#E5E7EB', fontSize: 13, height: 36 } }} />
        <Select data={CATEGORY_OPTIONS} value={category} onChange={setCategory} placeholder="Category" radius="md" size="xs" styles={{ input: { borderColor: '#E5E7EB', fontSize: 13, height: 36 } }} />
      </div>

      <TextInput
        placeholder="Search transactions"
        radius="md"
        size="sm"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<IconSearch size={16} color="#9CA3AF" />}
        styles={{ input: { borderColor: '#E5E7EB', fontSize: 13, height: 40 } }}
        className="mb-6"
      />

      {loading ? (
        <div className="flex justify-center pt-16">
          <Loader color="#02A36E" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6]">
            <IconSearch size={28} color="#9CA3AF" />
          </div>
          <Text fw={600} className="text-[16px] text-[#374151]">No transactions found</Text>
          <Text fw={400} className="max-w-[280px] text-[13px] text-[#9CA3AF]">
            Try adjusting your filters or search.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([date, txns]) => (
            <div key={date}>
              <Text fw={600} className="mb-3 text-[13px] text-[#6B7280]">{date}</Text>
              <div className="flex flex-col gap-2">
                {txns.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-[#F3F4F6] bg-white px-4 py-3 transition-colors hover:bg-[#F9FAFB] active:bg-[#F3F4F6]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.direction === 'credit' ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'}`}>
                        {tx.direction === 'credit'
                          ? <IconArrowDownLeft size={18} color="#02A36E" />
                          : <IconArrowUpRight size={18} color="#EF4444" />}
                      </div>
                      <div>
                        <Text fw={500} className="text-[14px] text-[#0F172A]">{tx.name}</Text>
                        <Text fw={400} className="text-[12px] text-[#9CA3AF]">{tx.type} · {tx.time}</Text>
                      </div>
                    </div>
                    <Text fw={600} className={`text-[14px] ${tx.direction === 'credit' ? 'text-[#02A36E]' : 'text-[#EF4444]'}`}>
                      {tx.direction === 'credit' ? '+' : '-'}{tx.amount}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
