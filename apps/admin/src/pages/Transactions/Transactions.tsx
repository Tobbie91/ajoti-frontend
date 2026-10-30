import { downloadTransactionPdf } from '@/utils/transaction-report'
import { useState, useEffect } from 'react'
import { ActionIcon, Text, TextInput, Select, Loader, Modal, Badge, Divider } from '@mantine/core'
import {
  IconArrowLeft,
  IconSearch,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconPlus,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
  IconDownload,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  getActiveTransactionExport,
  getTransactionExportStatus,
  getWalletTransactions,
  getWalletBalance,
  requestTransactionExport,
} from '@/utils/api'
import type { TransactionExportStatus, WalletTransaction } from '@/utils/api'
import { useWalletPrivacy } from '@/hooks/useWalletPrivacy'

type Transaction = {
  id: string
  name: string
  type: string
  time: string
  amount: string
  direction: 'credit' | 'debit' | 'reservation'
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
  const label: string = tx.description ?? (movementType
    ? movementType.charAt(0) + movementType.slice(1).toLowerCase()
    : entryType)
  const amtNaira = Number(tx.amount) / 100

  return {
    id: tx.id,
    name: label,
    type: entryType,
    time: d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }),
    amount: `₦${amtNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
    direction: ['RESERVE', 'RELEASE'].includes(entryType) ? 'reservation' : entryType === 'CREDIT' ? 'credit' : 'debit',
    date: dateLabel,
    raw: tx,
  }
}

function transactionCategory(tx: WalletTransaction): string {
  const bucket = (tx.bucketType ?? '').toUpperCase()
  const source = (tx.sourceType ?? '').toUpperCase()
  const movement = String(tx.movementType ?? '').toUpperCase()
  if (bucket === 'ROSCA' || ['ROSCA_CIRCLE', 'CONTRIBUTION', 'COLLATERAL_RESERVE', 'COLLATERAL_RELEASE', 'COLLATERAL_SEIZURE', 'PENALTY', 'EXIT_PENALTY', 'EXIT_FORFEIT_COMPENSATION', 'HELD_PAYOUT_DEPOSIT', 'HELD_PAYOUT_RELEASE', 'ROSCA_ADMIN_FEE', 'LATE_PENALTY_ADMIN_FEE'].includes(source)) return 'ROSCA'
  if (bucket === 'TARGET' || ['TARGET_SAVINGS', 'TARGET_MATURITY'].includes(source)) return 'Investment'
  if (movement === 'FUNDING') return 'Funding'
  if (movement === 'WITHDRAWAL' || movement === 'TRANSFER') return 'Transfer'
  return 'Other'
}

function formatKobo(val: string | number | undefined): string {
  if (val == null) return 'Not available'
  return `₦${(Number(val) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

const KOBO_METADATA_FIELDS = new Set(['flatFee', 'netPayout', 'grossPayout'])

function formatMetadataLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
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
  const reservation = tx.direction === 'reservation'
  const reservationRelease = reservation && tx.type === 'RELEASE'
  const color = reservation ? '#0B6B55' : isCredit ? '#02A36E' : '#EF4444'

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
      styles={{
        content: { borderRadius: 20, overflow: 'hidden' },
        body: { maxHeight: '70vh', overflowY: 'auto' },
      }}
    >
      <div className="mb-4 flex flex-col items-center gap-2 py-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: `${color}15` }}
        >
          {reservation
            ? reservationRelease
              ? <IconLockOpen size={26} color={color} />
              : <IconLock size={26} color={color} />
            : isCredit
              ? <IconArrowDownLeft size={26} color={color} />
              : <IconArrowUpRight size={26} color={color} />}
        </div>
        <Text fw={700} fz={28} style={{ color, lineHeight: 1 }}>
          {tx.direction === 'reservation' ? '' : isCredit ? '+' : '-'}{tx.amount}
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
          <DetailRow key={k} label={formatMetadataLabel(k)} value={KOBO_METADATA_FIELDS.has(k) ? formatKobo(String(v)) : String(v)} />
        ))}
        <DetailRow
          label="Reference"
          value={<span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>{raw.id}</span>}
        />
      </div>
    </Modal>
  )
}

const TYPE_OPTIONS = ['All', 'Credit', 'Debit']
const CATEGORY_OPTIONS = ['All', 'Transfer', 'Funding', 'ROSCA', 'Investment']

export function Transactions() {
  const navigate = useNavigate()
  const { hidden, toggle } = useWalletPrivacy()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [walletBalance, setWalletBalance] = useState('₦0.00')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<string | null>('All')
  const [category, setCategory] = useState<string | null>('All')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [exportFromDate, setExportFromDate] = useState('')
  const [exportToDate, setExportToDate] = useState('')
  const [exportJob, setExportJob] = useState<TransactionExportStatus | null>(null)
  const [exportRequesting, setExportRequesting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [pdfDownloading, setPdfDownloading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  async function downloadRecentPdf() {
    setPdfDownloading(true); setPdfError(null)
    try { await downloadTransactionPdf(transactions.map(transaction => transaction.raw)) }
    catch (error) { setPdfError(error instanceof Error ? error.message : 'Unable to download the PDF.') }
    finally { setPdfDownloading(false) }
  }

  function downloadRecentTransactions() {
    const csvCell = (value: unknown) => {
      let text = String(value ?? '')
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
      return `"${text.replace(/"/g, '""')}"`
    }
    const rows = [
      ['Date', 'Description', 'Type', 'Movement', 'Bucket', 'Amount (NGN)', 'Balance Before (NGN)', 'Balance After (NGN)', 'Reference'],
      ...transactions.map(({ raw }) => [
        raw.createdAt,
        raw.description ?? raw.movementType ?? raw.entryType,
        raw.entryType,
        raw.movementType,
        raw.bucketType ?? '',
        Number(raw.amount) / 100,
        raw.balanceBefore == null ? '' : Number(raw.balanceBefore) / 100,
        raw.balanceAfter == null ? '' : Number(raw.balanceAfter) / 100,
        raw.id,
      ]),
    ]
    const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'ajoti-transaction-history.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    let active = true
    Promise.all([
      getWalletBalance()
        .then((data) => {
          const bal = Number(data.available ?? data.total ?? 0) / 100
          setWalletBalance(`₦${bal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`)
        })
        .catch(() => setWalletBalance('₦0.00')),
      getWalletTransactions()
        .then((txns) => setTransactions(txns.map(mapApiTxn)))
        .catch(() => {}),
    ]).finally(() => setLoading(false))
    getActiveTransactionExport()
      .then((job) => {
        if (active) setExportJob(job)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!exportJob || !['QUEUED', 'PROCESSING'].includes(exportJob.status)) return
    let active = true
    const timer = window.setInterval(() => {
      getTransactionExportStatus(exportJob.id)
        .then((status) => {
          if (active) setExportJob(status)
        })
        .catch(() => {})
    }, 5000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [exportJob?.id, exportJob?.status])

  async function emailTransactionHistory() {
    setExportRequesting(true)
    setExportError(null)
    try {
      const job = await requestTransactionExport({
        ...(exportFromDate && { fromDate: exportFromDate }),
        ...(exportToDate && { toDate: exportToDate }),
      })
      setExportJob(job)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not request the export.')
    } finally {
      setExportRequesting(false)
    }
  }

  const filtered = transactions.filter((tx) => {
    if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) return false
    if (type && type !== 'All') {
      if (type === 'Credit' && tx.direction !== 'credit') return false
      if (type === 'Debit' && tx.direction !== 'debit') return false
    }
    if (category && category !== 'All' && transactionCategory(tx.raw) !== category) return false
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
            <Loader size="sm" color="white" />
          ) : hidden ? (
            <IconLock size={25} color="white" aria-label="Wallet balance hidden" />
          ) : (
            <Text fw={600} fz={24} c="white">{walletBalance}</Text>
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

      <div className="mb-6 flex items-center justify-between gap-3">
        <Text fw={700} className="text-[24px] text-[#0F172A]">Transactions</Text>

      </div>

      {!hidden && (
        <div className="mb-6 rounded-2xl border border-[#d9e8cf] bg-[#f4f8ef] p-5">
          <div className="mb-4 flex flex-col gap-4 border-b border-[#d9e8cf] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><img src="/favicon.png" alt="Ajoti logo" className="h-10 w-10 object-contain" /><div><Text fw={700} c="#0b5140">Download transaction history</Text><Text size="xs" c="dimmed">PDF with the Ajoti logo and colours. CSV for spreadsheets.</Text></div></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadRecentTransactions} disabled={loading || !transactions.length} className="flex items-center gap-2 rounded-xl border border-[#0b5140] bg-white px-4 py-2 text-sm font-semibold text-[#0b5140] disabled:opacity-50"><IconDownload size={16} /> Download recent CSV (up to 50)</button>
              <button type="button" onClick={downloadRecentPdf} disabled={loading || !transactions.length || pdfDownloading} className="flex items-center gap-2 rounded-xl bg-[#0b5140] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><IconDownload size={16} /> {pdfDownloading ? 'Preparing PDF…' : 'Download recent PDF (up to 50)'}</button>
            </div>
          </div>
          {pdfError && <Text role="alert" c="red" fz={12} mb={8}>{pdfError}</Text>}
          <Text fw={600} fz={14} c="#0F172A">Email a larger transaction history</Text>
          <Text fz={12} c="dimmed" mt={4}>
            Leave dates blank for all history. Exports are limited to 25,000 rows or 10 MB; choose a narrower date range if your history is larger. The private download link expires after 24 hours and the file is deleted after 48 hours.
          </Text>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-[#667085]">
              From date (inclusive, WAT)
              <input
                aria-label="Export start date"
                type="date"
                value={exportFromDate}
                onChange={(event) => setExportFromDate(event.currentTarget.value)}
                className="h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#344054]"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[#667085]">
              To date (inclusive, WAT)
              <input
                aria-label="Export end date"
                type="date"
                value={exportToDate}
                onChange={(event) => setExportToDate(event.currentTarget.value)}
                className="h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#344054]"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={emailTransactionHistory}
            disabled={exportRequesting || Boolean(exportJob && ['QUEUED', 'PROCESSING'].includes(exportJob.status))}
            className="mt-3 rounded-lg bg-[#0b5140] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportRequesting ? 'Requesting export…' : 'Email my CSV'}
          </button>
          {exportError && <Text role="alert" c="red" fz={12} mt={8}>{exportError}</Text>}
          {exportJob && (
            <Text role="status" fz={12} c="dimmed" mt={8}>
              {exportJob.status === 'QUEUED' || exportJob.status === 'PROCESSING'
                ? 'Your export is being prepared. We will email you when it is ready.'
                : exportJob.status === 'READY'
                  ? `Your export is ready and the email is queued${exportJob.rowCount == null ? '.' : ` (${exportJob.rowCount.toLocaleString()} rows).`}`
                  : exportJob.errorMessage ?? `Export status: ${exportJob.status.toLowerCase().replace('_', ' ')}.`}
            </Text>
          )}
        </div>
      )}

      {hidden ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-[#F3F4F6] bg-white">
          <IconLock size={25} color="#667085" aria-label="Transaction history hidden" />
        </div>
      ) : (
        <>
      {/* Filters */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Select data={TYPE_OPTIONS} value={type} onChange={setType} placeholder="Type" radius="lg" size="xs" styles={{ input: { borderColor: '#E5E7EB', fontSize: 13, height: 36 } }} />
        <Select data={CATEGORY_OPTIONS} value={category} onChange={setCategory} placeholder="Category" radius="lg" size="xs" styles={{ input: { borderColor: '#E5E7EB', fontSize: 13, height: 36 } }} />
      </div>

      <TextInput
        placeholder="Search transactions"
        radius="lg"
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
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.direction === 'reservation' ? 'bg-[#E7F4EE]' : tx.direction === 'credit' ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'}`}>
                        {tx.direction === 'reservation'
                          ? tx.type === 'RELEASE'
                            ? <IconLockOpen size={18} color="#0B6B55" />
                            : <IconLock size={18} color="#0B6B55" />
                          : tx.direction === 'credit'
                            ? <IconArrowDownLeft size={18} color="#02A36E" />
                            : <IconArrowUpRight size={18} color="#EF4444" />}
                      </div>
                      <div>
                        <Text fw={500} className="text-[14px] text-[#0F172A]">{tx.name}</Text>
                        <Text fw={400} className="text-[12px] text-[#9CA3AF]">{tx.type} / {tx.time}</Text>
                      </div>
                    </div>
                    <Text fw={600} className={`text-[14px] ${tx.direction === 'reservation' ? 'text-[#0B6B55]' : tx.direction === 'credit' ? 'text-[#02A36E]' : 'text-[#EF4444]'}`}>
                      {tx.direction === 'reservation' ? '' : tx.direction === 'credit' ? '+' : '-'}{tx.amount}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {!hidden && <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  )
}
