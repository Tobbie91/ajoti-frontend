import { useState, useEffect } from 'react'
import { Text, Loader } from '@mantine/core'
import { IconArrowLeft, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { listRoscaCircles, getWalletBalance, type RoscaCircle } from '@/utils/api'

function addPeriods(date: Date, frequency: string, count: number): Date {
  const d = new Date(date)
  if (frequency === 'WEEKLY') d.setDate(d.getDate() + count * 7)
  else if (frequency === 'BI_WEEKLY') d.setDate(d.getDate() + count * 14)
  else d.setMonth(d.getMonth() + count) // MONTHLY default
  return d
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function JoinSummary() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [circle, setCircle] = useState<RoscaCircle | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listRoscaCircles().then((circles) => circles.find((c) => c.id === id) ?? null),
      getWalletBalance().then((b) => Number(b.available ?? b.total ?? 0) / 100).catch(() => 0),
    ])
      .then(([c, balance]) => {
        setCircle(c)
        setWalletBalance(balance)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-5">
        <Loader size={48} color="#02A36E" />
        <div className="text-center">
          <Text fw={700} className="text-[20px] text-[#0F172A]">Loading summary...</Text>
        </div>
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Text fw={600} className="text-[#374151]">Circle not found</Text>
        <button onClick={() => navigate('/rosca')} className="cursor-pointer text-sm font-medium text-[#02A36E]">Back to groups</button>
      </div>
    )
  }

  const contributionNaira = Number(circle.contributionAmount ?? 0) / 100
  const totalToRaise = contributionNaira * (circle.maxSlots ?? 1)
  const duration = circle.durationCycles ?? 0
  const frequency = (circle.frequency as string) ?? 'MONTHLY'

  const deadlineRaw = (circle as Record<string, unknown>).initialContributionDeadline as string | null | undefined
  const firstPaymentDate = deadlineRaw ? new Date(deadlineRaw) : null
  const lastPaymentDate = firstPaymentDate ? addPeriods(firstPaymentDate, frequency, duration - 1) : null

  const hasInsufficientBalance = walletBalance < contributionNaira

  const frequencyLabel: Record<string, string> = { WEEKLY: 'week', BI_WEEKLY: '2 weeks', MONTHLY: 'month' }
  const durationLabel = `${duration} ${frequency === 'WEEKLY' ? 'weeks' : frequency === 'BI_WEEKLY' ? 'bi-weekly cycles' : 'months'}`

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back button + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">Payment Summary</Text>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#02A36E]">
            <IconCheck size={32} color="white" stroke={3} />
          </div>
        </div>

        {/* Savings Details Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">Savings Details</Text>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Contribution per {frequencyLabel[frequency] ?? 'cycle'}</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">
                ₦{contributionNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Total Payout (when your turn comes)</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">
                ₦{totalToRaise.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">First Payment Date</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">
                {firstPaymentDate ? formatDate(firstPaymentDate) : 'Pending activation'}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Last Payment Date</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">
                {lastPaymentDate ? formatDate(lastPaymentDate) : 'Pending activation'}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">ROSCA Duration</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">{durationLabel}</Text>
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">Account Details</Text>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Payment Method</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">Wallet</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Wallet Balance</Text>
              <Text fw={600} className={`text-[14px] ${hasInsufficientBalance ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                ₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
            </div>
          </div>
        </div>

        {/* Insufficient Balance Error */}
        {hasInsufficientBalance && (
          <div className="flex items-start gap-3 rounded-xl bg-[#FEF2F2] px-5 py-4">
            <IconAlertCircle size={20} color="#EF4444" className="mt-0.5 flex-shrink-0" />
            <Text fw={500} className="text-[13px] leading-relaxed text-[#991B1B]">
              Insufficient wallet balance. Please fund your wallet before proceeding.
            </Text>
          </div>
        )}

        {/* Buttons */}
        {hasInsufficientBalance ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/fund-wallet')}
              className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white"
            >
              Fund Wallet
            </button>
            <button
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-[#D1D5DB] py-4 text-[15px] font-semibold text-white"
            >
              Proceed
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/rosca/requests')}
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white"
          >
            Done
          </button>
        )}
      </div>
    </div>
  )
}
