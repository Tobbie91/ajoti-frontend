import { useState, useEffect, useCallback } from 'react'
import { Text, Loader } from '@mantine/core'
import { IconArrowLeft, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getMyDebts, repayDebt, type Debt } from '@/utils/api'

function formatNaira(kobo: string) {
  const n = Number(kobo)
  if (isNaN(n)) return '₦0.00'
  return '₦' + (n / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function statusColor(status: string) {
  if (status === 'SETTLED') return '#02A36E'
  if (status === 'PARTIALLY_REPAID') return '#F59E0B'
  return '#EF4444' // OUTSTANDING
}

function DebtCard({ debt, onRepaid }: { debt: Debt; onRepaid: () => void }) {
  const [repaying, setRepaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const outstanding = Number(debt.outstandingTotal)

  async function handleRepay(amountKobo?: number) {
    setRepaying(true)
    setError(null)
    try {
      await repayDebt(debt.id, amountKobo)
      onRepaid()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Repayment failed. Please try again.')
    } finally {
      setRepaying(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <Text fw={600} className="text-[14px] text-[#0F172A]">
            {debt.circleName ?? `Circle ${debt.circleId.slice(0, 6)}`} - Cycle {debt.cycleNumber}
          </Text>
          <Text fw={400} className="mt-0.5 text-[12px] text-[#6B7280]">{debt.categoryLabel}</Text>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: `${statusColor(debt.status)}15`, color: statusColor(debt.status) }}
        >
          {debt.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-4 flex justify-between">
        <Text fw={400} className="text-[13px] text-[#6B7280]">Outstanding</Text>
        <Text fw={700} className="text-[15px] text-[#0F172A]">{formatNaira(debt.outstandingTotal)}</Text>
      </div>

      {debt.blocksLoanEligibility && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FEF3C7] px-3 py-2">
          <IconAlertTriangle size={14} color="#92400E" className="mt-0.5 flex-shrink-0" />
          <Text fw={500} className="text-[11px] text-[#92400E]">
            This debt blocks early-payout (loan) eligibility on this circle until it's repaid, and may
            result in your payout being locked by an admin.
          </Text>
        </div>
      )}

      {outstanding > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {error && <Text className="text-[12px] text-[#EF4444]">{error}</Text>}
          {!showCustom ? (
            <div className="flex gap-2">
              <button
                disabled={repaying}
                onClick={() => handleRepay(undefined)}
                className="flex-1 cursor-pointer rounded-xl bg-[#02A36E] py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {repaying ? 'Repaying…' : `Repay in full (${formatNaira(debt.outstandingTotal)})`}
              </button>
              <button
                disabled={repaying}
                onClick={() => setShowCustom(true)}
                className="cursor-pointer rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-[13px] font-medium text-[#374151] disabled:opacity-60"
              >
                Custom
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                placeholder="Amount in Naira"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-[13px]"
              />
              <button
                disabled={repaying || !customAmount || Number(customAmount) <= 0}
                onClick={() => handleRepay(Math.round(Number(customAmount) * 100))}
                className="cursor-pointer rounded-xl bg-[#02A36E] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {repaying ? 'Repaying…' : 'Pay'}
              </button>
              <button
                disabled={repaying}
                onClick={() => { setShowCustom(false); setCustomAmount('') }}
                className="cursor-pointer rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-[13px] font-medium text-[#374151]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MyDebts() {
  const navigate = useNavigate()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDebts = useCallback(() => {
    setLoading(true)
    setError(null)
    getMyDebts()
      .then(setDebts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load your debts'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchDebts() }, [fetchDebts])

  const outstandingDebts = debts.filter((d) => d.status !== 'SETTLED')
  const settledDebts = debts.filter((d) => d.status === 'SETTLED')

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-8">
      <div className="flex flex-col gap-6">
        <button onClick={() => navigate(-1)} className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
          <IconArrowLeft size={18} /> Back
        </button>

        <div>
          <Text fw={700} className="text-[24px] text-[#0F172A]">My Debts</Text>
          <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
            Missed contributions and late-penalty shortfalls owed across your circles.
          </Text>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center">
            <Loader color="#02A36E" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl bg-[#FEF2F2] px-4 py-3">
            <Text className="text-[13px] text-red-600">{error}</Text>
          </div>
        )}

        {!loading && !error && debts.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D1FAE5]">
              <IconCircleCheck size={26} color="#02A36E" />
            </div>
            <Text fw={600} className="text-[15px] text-[#0F172A]">You don't owe anything</Text>
            <Text fw={400} className="max-w-[280px] text-[13px] text-[#6B7280]">
              No missed contributions or unpaid late penalties on any of your circles.
            </Text>
          </div>
        )}

        {!loading && !error && outstandingDebts.length > 0 && (
          <div className="flex flex-col gap-3">
            {outstandingDebts.map((debt) => (
              <DebtCard key={debt.id} debt={debt} onRepaid={fetchDebts} />
            ))}
          </div>
        )}

        {!loading && !error && settledDebts.length > 0 && (
          <div>
            <Text fw={600} className="mb-3 text-[13px] text-[#6B7280]">Settled</Text>
            <div className="flex flex-col gap-3">
              {settledDebts.map((debt) => (
                <DebtCard key={debt.id} debt={debt} onRepaid={fetchDebts} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyDebts
