import { useState, useEffect } from 'react'
import { Text, Select, Loader } from '@mantine/core'
import {
  IconArrowLeft,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconBackspace,
  IconUsers,
  IconCalendar,
  IconCash,
  IconClock,
  IconHistory,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  listRoscaCircles,
  getLoanEligibility,
  getLoanStatus,
  getLoanHistory,
  applyForLoan,
  type RoscaCircle,
  type Loan,
  type LoanEligibility,
} from '@/utils/api'

type Step = 'overview' | 'form' | 'confirm' | 'pin' | 'processing' | 'success' | 'error'

const SERVICE_FEE_RATE = 0.02

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function loanStatusColor(status: string) {
  const s = status?.toUpperCase()
  if (s === 'ACTIVE' || s === 'DISBURSED') return '#02A36E'
  if (s === 'PENDING' || s === 'PROCESSING') return '#F59E0B'
  if (s === 'DEFAULTED' || s === 'FAILED') return '#EF4444'
  return '#6B7280'
}

export function Loans() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('overview')

  // Data
  const [circles, setCircles] = useState<RoscaCircle[]>([])
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null)
  const [loanHistory, setLoanHistory] = useState<Loan[]>([])
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null)
  const [loadingPage, setLoadingPage] = useState(true)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  // Form
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      listRoscaCircles()
        .then((res) => setCircles(res.filter((c) => (c.status ?? '').toUpperCase() === 'ACTIVE' || (c.status ?? '').toUpperCase() === 'STARTED')))
        .catch(() => {}),
      getLoanStatus().then(setActiveLoan).catch(() => {}),
      getLoanHistory().then(setLoanHistory).catch(() => {}),
    ]).finally(() => setLoadingPage(false))
  }, [])

  const selectedCircle = circles.find((c) => c.id === selectedCircleId)
  const payoutAmount = eligibility?.expectedPayout ?? (selectedCircle ? Number(selectedCircle.contributionAmount) * (selectedCircle.maxSlots ?? 1) : 0)
  const feeRate = eligibility?.feeRate ?? SERVICE_FEE_RATE
  const serviceFee = Math.round(payoutAmount * feeRate)
  const disbursementAmount = payoutAmount - serviceFee

  async function handleCircleSelect(id: string | null) {
    setSelectedCircleId(id)
    setEligibility(null)
    if (!id) return
    setCheckingEligibility(true)
    try {
      const result = await getLoanEligibility(id)
      setEligibility(result)
    } catch {
      setEligibility({ eligible: false, reason: 'Could not check eligibility. Try again.' })
    } finally {
      setCheckingEligibility(false)
    }
  }

  async function submitLoan() {
    if (!selectedCircleId) return
    setStep('processing')
    setError(null)
    try {
      await applyForLoan({ circleId: selectedCircleId })
      setStep('success')
      // refresh status
      getLoanStatus().then(setActiveLoan).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loan application failed. Please try again.')
      setStep('error')
    }
  }

  function handlePinDigit(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => submitLoan(), 300)
      }
    }
  }

  if (loadingPage) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader color="#02A36E" />
      </div>
    )
  }

  // ==================== PROCESSING ====================
  if (step === 'processing') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
        <Text fw={500} className="text-[14px] text-[#6B7280]">Processing your early payout...</Text>
      </div>
    )
  }

  // ==================== SUCCESS ====================
  if (step === 'success') {
    return (
      <div className="mx-auto flex w-full max-w-[500px] flex-col items-center gap-6 px-4 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#02A36E]">
            <IconCheck size={32} color="white" strokeWidth={3} />
          </div>
        </div>
        <div className="text-center">
          <Text fw={700} className="text-[22px] text-[#0F172A]">Early Payout Approved!</Text>
          <Text fw={400} className="mt-2 max-w-[340px] text-[14px] leading-[1.6] text-[#6B7280]">
            ₦{fmt(disbursementAmount)} from <span className="font-medium text-[#0F172A]">{selectedCircle?.name}</span> has been disbursed to your NGN wallet.
          </Text>
        </div>
        {selectedCircle && (
          <div className="w-full max-w-[340px] rounded-xl bg-[#FEF3C7] px-4 py-3">
            <Text fw={500} className="text-center text-[12px] text-[#92400E]">
              Remember to continue your ₦{Number(selectedCircle.contributionAmount).toLocaleString()} {selectedCircle.frequency?.toLowerCase()} contributions.
            </Text>
          </div>
        )}
        <div className="mt-2 flex w-full max-w-[300px] flex-col gap-3">
          <button onClick={() => navigate('/home')} className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]">Done</button>
          <button onClick={() => navigate('/rosca')} className="w-full cursor-pointer rounded-xl border border-[#02A36E] bg-white py-3.5 text-[14px] font-semibold text-[#02A36E] hover:bg-[#F0FDF4]">View My Groups</button>
        </div>
      </div>
    )
  }

  // ==================== ERROR ====================
  if (step === 'error') {
    return (
      <div className="mx-auto flex w-full max-w-[500px] flex-col items-center gap-6 px-4 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500">
            <IconAlertTriangle size={32} color="white" />
          </div>
        </div>
        <div className="text-center">
          <Text fw={700} className="text-[22px] text-[#0F172A]">Application Failed</Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-[14px] text-[#6B7280]">{error}</Text>
        </div>
        <div className="flex w-full max-w-[300px] flex-col gap-3">
          <button onClick={() => { setPin(''); setStep('pin') }} className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white">Try Again</button>
          <button onClick={() => { setPin(''); setStep('form') }} className="w-full cursor-pointer rounded-xl border border-[#E5E7EB] py-3.5 text-[14px] font-semibold text-[#374151]">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-8">

      {/* ==================== OVERVIEW ==================== */}
      {step === 'overview' && (
        <div className="flex flex-col gap-6">
          <button onClick={() => navigate(-1)} className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
            <IconArrowLeft size={18} /> Back
          </button>

          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">Early Payout (Loans)</Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Get your ROSCA payout before your turn arrives</Text>
          </div>

          {/* Active loan banner */}
          {activeLoan && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <IconClock size={16} color="#F59E0B" />
                <Text fw={600} className="text-[14px] text-[#0F172A]">Active Loan</Text>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <Text fw={400} className="text-[13px] text-[#6B7280]">Amount</Text>
                  <Text fw={600} className="text-[13px] text-[#0F172A]">₦{fmt(Number(activeLoan.disbursedAmount ?? activeLoan.amount))}</Text>
                </div>
                <div className="flex justify-between">
                  <Text fw={400} className="text-[13px] text-[#6B7280]">Status</Text>
                  <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold" style={{ background: `${loanStatusColor(activeLoan.status)}15`, color: loanStatusColor(activeLoan.status) }}>
                    {activeLoan.status}
                  </span>
                </div>
                {activeLoan.dueDate && (
                  <div className="flex justify-between">
                    <Text fw={400} className="text-[13px] text-[#6B7280]">Due Date</Text>
                    <Text fw={500} className="text-[13px] text-[#0F172A]">{new Date(activeLoan.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Apply button */}
          {!activeLoan && circles.length > 0 && (
            <button
              onClick={() => setStep('form')}
              className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
            >
              Request Early Payout
            </button>
          )}

          {!activeLoan && circles.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7]">
                <IconAlertTriangle size={24} color="#F59E0B" />
              </div>
              <Text fw={600} className="text-[16px] text-[#0F172A]">No Active Groups</Text>
              <Text fw={400} className="max-w-[280px] text-[13px] text-[#6B7280]">You need to be in an active ROSCA group to request an early payout.</Text>
              <button onClick={() => navigate('/rosca')} className="cursor-pointer rounded-xl bg-[#02A36E] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#028a5b]">Browse Groups</button>
            </div>
          )}

          {/* Loan History */}
          {loanHistory.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <IconHistory size={16} color="#6B7280" />
                <Text fw={600} className="text-[14px] text-[#374151]">Loan History</Text>
              </div>
              <div className="flex flex-col gap-2">
                {loanHistory.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between rounded-xl border border-[#F3F4F6] bg-white px-4 py-3">
                    <div>
                      <Text fw={500} className="text-[13px] text-[#0F172A]">{loan.circleName ?? `Loan ${loan.id.slice(0, 8)}`}</Text>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">{new Date(loan.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Text fw={600} className="text-[13px] text-[#02A36E]">₦{fmt(Number(loan.disbursedAmount ?? loan.amount))}</Text>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${loanStatusColor(loan.status)}15`, color: loanStatusColor(loan.status) }}>
                        {loan.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#0F172A]">How Early Payout Works</Text>
            <div className="flex flex-col gap-3">
              {[
                'Choose one of your active ROSCA groups',
                'Receive your payout amount now instead of waiting for your turn',
                'Continue making your regular contributions as scheduled',
                'A small service fee applies on the payout amount',
              ].map((tip, i) => (
                <div key={tip} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#02A36E] text-[11px] font-bold text-white">{i + 1}</div>
                  <Text fw={400} className="text-[13px] text-[#6B7280]">{tip}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SELECT GROUP ==================== */}
      {step === 'form' && (
        <div className="flex flex-col gap-6">
          <button onClick={() => setStep('overview')} className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
            <IconArrowLeft size={18} /> Back
          </button>

          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">Request Early Payout</Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Select an active ROSCA group</Text>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">Select ROSCA Group</Text>
            <Select
              data={circles.map((c) => ({ value: c.id, label: c.name }))}
              value={selectedCircleId}
              onChange={handleCircleSelect}
              placeholder="Choose a group"
              radius="md" size="md"
              styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 } }}
            />
            {checkingEligibility && (
              <div className="mt-3 flex items-center gap-2">
                <Loader size={14} color="#02A36E" />
                <Text fw={400} className="text-[12px] text-[#6B7280]">Checking eligibility...</Text>
              </div>
            )}
          </div>

          {/* Eligibility result */}
          {eligibility && !checkingEligibility && (
            <>
              {!eligibility.eligible ? (
                <div className="flex items-start gap-3 rounded-xl bg-[#FEF2F2] px-4 py-3">
                  <IconAlertTriangle size={16} color="#EF4444" className="mt-0.5" />
                  <Text fw={400} className="text-[13px] text-red-600">{eligibility.reason ?? 'You are not eligible for a loan on this group.'}</Text>
                </div>
              ) : (
                <>
                  {selectedCircle && (
                    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                      <Text fw={600} className="mb-4 text-[14px] text-[#0F172A]">{selectedCircle.name}</Text>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
                          <IconUsers size={18} color="#6B7280" />
                          <div>
                            <Text fw={400} className="text-[11px] text-[#9CA3AF]">Members</Text>
                            <Text fw={600} className="text-[14px] text-[#0F172A]">{selectedCircle.filledSlots}/{selectedCircle.maxSlots}</Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
                          <IconCalendar size={18} color="#6B7280" />
                          <div>
                            <Text fw={400} className="text-[11px] text-[#9CA3AF]">Frequency</Text>
                            <Text fw={600} className="text-[14px] text-[#0F172A]">{selectedCircle.frequency}</Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
                          <IconCash size={18} color="#6B7280" />
                          <div>
                            <Text fw={400} className="text-[11px] text-[#9CA3AF]">Contribution</Text>
                            <Text fw={600} className="text-[14px] text-[#0F172A]">₦{Number(selectedCircle.contributionAmount).toLocaleString()}</Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
                          <IconShieldCheck size={18} color="#02A36E" />
                          <div>
                            <Text fw={400} className="text-[11px] text-[#9CA3AF]">Eligible</Text>
                            <Text fw={600} className="text-[14px] text-[#02A36E]">Yes</Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#E5E7EB] bg-[#F0FDF4] p-5">
                    <Text fw={600} className="mb-3 text-[14px] text-[#374151]">Early Payout Breakdown</Text>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between">
                        <Text fw={400} className="text-[13px] text-[#6B7280]">Payout Amount</Text>
                        <Text fw={600} className="text-[13px] text-[#0F172A]">₦{fmt(payoutAmount)}</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text fw={400} className="text-[13px] text-[#6B7280]">Service Fee ({(feeRate * 100).toFixed(0)}%)</Text>
                        <Text fw={600} className="text-[13px] text-[#EF4444]">-₦{fmt(serviceFee)}</Text>
                      </div>
                      <div className="flex justify-between border-t border-[#D1FAE5] pt-3">
                        <Text fw={600} className="text-[14px] text-[#0F172A]">You'll Receive</Text>
                        <Text fw={700} className="text-[16px] text-[#02A36E]">₦{fmt(disbursementAmount)}</Text>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#FEF3C7] px-4 py-3">
                    <Text fw={500} className="text-[12px] text-[#92400E]">
                      You'll continue making your regular contributions. Your payout turn will be skipped since you're receiving it early.
                    </Text>
                  </div>
                </>
              )}
            </>
          )}

          <button
            onClick={() => setStep('confirm')}
            disabled={!selectedCircleId || !eligibility?.eligible || checkingEligibility}
            className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${
              selectedCircleId && eligibility?.eligible && !checkingEligibility
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            Proceed
          </button>
        </div>
      )}

      {/* ==================== CONFIRMATION ==================== */}
      {step === 'confirm' && selectedCircle && (
        <div className="flex flex-col gap-6">
          <button onClick={() => setStep('form')} className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
            <IconArrowLeft size={18} /> Back
          </button>

          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">Confirm Early Payout</Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Review the details below before proceeding</Text>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex flex-col gap-4">
              {[
                { label: 'ROSCA Group', value: selectedCircle.name },
                { label: 'Payout Amount', value: `₦${fmt(payoutAmount)}`, bold: true },
                { label: `Service Fee (${(feeRate * 100).toFixed(0)}%)`, value: `-₦${fmt(serviceFee)}`, red: true },
                { label: 'Ongoing Contribution', value: `₦${Number(selectedCircle.contributionAmount).toLocaleString()} / ${(selectedCircle.frequency ?? '').toLowerCase()}` },
              ].map(({ label, value, bold, red }, i, arr) => (
                <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'border-b border-[#F3F4F6] pb-4' : ''}`}>
                  <Text fw={400} className="text-[14px] text-[#6B7280]">{label}</Text>
                  <Text fw={bold ? 700 : 500} className={`text-[14px] ${red ? 'text-[#EF4444]' : bold ? 'text-[18px] text-[#0F172A]' : 'text-[#0F172A]'}`}>{value}</Text>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-4">
                <Text fw={600} className="text-[14px] text-[#0F172A]">You'll Receive Now</Text>
                <Text fw={700} className="text-[18px] text-[#02A36E]">₦{fmt(disbursementAmount)}</Text>
              </div>
            </div>
          </div>

          <button onClick={() => setStep('pin')} className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]">
            Confirm Early Payout
          </button>
        </div>
      )}

      {/* ==================== PIN ENTRY ==================== */}
      {step === 'pin' && (
        <div className="flex flex-col items-center gap-8 pt-8">
          <button onClick={() => { setStep('confirm'); setPin('') }} className="mr-auto flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
            <IconArrowLeft size={18} /> Back
          </button>

          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">Enter Your PIN</Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Enter your 4-digit transaction PIN</Text>
          </div>

          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 ${i < pin.length ? 'border-[#02A36E] bg-[#F0FDF4]' : 'border-[#E5E7EB] bg-white'}`}>
                {i < pin.length && <div className="h-3 w-3 rounded-full bg-[#02A36E]" />}
              </div>
            ))}
          </div>

          <div className="grid w-[280px] grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) => {
              if (key === '') return <div key="empty" />
              if (key === 'back') return (
                <button key="back" onClick={() => setPin((p) => p.slice(0, -1))} className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB]">
                  <IconBackspace size={22} color="#374151" />
                </button>
              )
              return (
                <button key={key} onClick={() => handlePinDigit(key)} className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F9FAFB] text-[20px] font-semibold text-[#0F172A] hover:bg-[#E5E7EB]">
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
