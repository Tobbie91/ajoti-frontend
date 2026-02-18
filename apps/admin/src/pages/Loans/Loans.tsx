import { useState } from 'react'
import { Text, Select } from '@mantine/core'
import {
  IconArrowLeft,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconBackspace,
  IconUsers,
  IconCalendar,
  IconCash,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type Step = 'eligibility' | 'form' | 'confirm' | 'pin' | 'processing' | 'success'

const MOCK_TRUST_SCORE = 72
const TRUST_THRESHOLD = 60
const SERVICE_FEE_RATE = 0.02

const ACTIVE_GROUPS = [
  {
    id: '1',
    name: 'Mamagoals',
    contribution: 50_000,
    frequency: 'Monthly',
    totalMembers: 10,
    payoutAmount: 500_000,
    currentRound: 3,
    yourPosition: 7,
    nextPayoutDate: 'Jul 2026',
  },
  {
    id: '2',
    name: 'Men Thrive',
    contribution: 30_000,
    frequency: 'Monthly',
    totalMembers: 6,
    payoutAmount: 180_000,
    currentRound: 5,
    yourPosition: 6,
    nextPayoutDate: 'Jun 2026',
  },
]

export function Loans() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('eligibility')

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [pin, setPin] = useState('')

  const isEligible = MOCK_TRUST_SCORE >= TRUST_THRESHOLD
  const hasActiveGroups = ACTIVE_GROUPS.length > 0
  const canApply = isEligible && hasActiveGroups

  const selectedGroup = ACTIVE_GROUPS.find((g) => g.id === selectedGroupId)
  const serviceFee = selectedGroup ? Math.round(selectedGroup.payoutAmount * SERVICE_FEE_RATE) : 0
  const disbursementAmount = selectedGroup ? selectedGroup.payoutAmount - serviceFee : 0

  function handlePinDigit(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => {
          setStep('processing')
          setTimeout(() => {
            setStep('success')
          }, 2500)
        }, 300)
      }
    }
  }

  function handlePinBackspace() {
    setPin(pin.slice(0, -1))
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-8">
      {/* ==================== ELIGIBILITY CHECK ==================== */}
      {step === 'eligibility' && (
        <div className="flex flex-col gap-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-2 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
          >
            <IconArrowLeft size={18} />
            Back
          </button>

          {canApply ? (
            <div className="flex flex-col items-center gap-6 pt-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#02A36E]">
                  <IconShieldCheck size={32} color="white" strokeWidth={2} />
                </div>
              </div>

              <div className="text-center">
                <Text fw={700} className="text-[24px] text-[#0F172A]">
                  You're Eligible!
                </Text>
                <Text fw={400} className="mt-2 max-w-[380px] text-[14px] text-[#6B7280]">
                  Your trust score qualifies you for an early ROSCA payout. Get your payout before your turn arrives.
                </Text>
              </div>

              <div className="w-full max-w-[440px] rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Text fw={400} className="text-[14px] text-[#6B7280]">
                      Trust Score
                    </Text>
                    <Text fw={700} className="text-[18px] text-[#02A36E]">
                      {MOCK_TRUST_SCORE}/100
                    </Text>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div
                      className="h-full rounded-full bg-[#02A36E]"
                      style={{ width: `${MOCK_TRUST_SCORE}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-4">
                    <Text fw={400} className="text-[14px] text-[#6B7280]">
                      Active ROSCA Groups
                    </Text>
                    <Text fw={700} className="text-[16px] text-[#0F172A]">
                      {ACTIVE_GROUPS.length}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text fw={400} className="text-[14px] text-[#6B7280]">
                      Service Fee
                    </Text>
                    <Text fw={600} className="text-[14px] text-[#0F172A]">
                      2% of payout
                    </Text>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[440px] rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                <Text fw={600} className="mb-3 text-[14px] text-[#0F172A]">
                  How Early Payout Works
                </Text>
                <div className="flex flex-col gap-3">
                  {[
                    'Choose one of your active ROSCA groups',
                    'Receive your payout amount now instead of waiting for your turn',
                    'Continue making your regular contributions as scheduled',
                    'A small 2% service fee applies on the payout amount',
                  ].map((tip, i) => (
                    <div key={tip} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#02A36E] text-[11px] font-bold text-white">
                        {i + 1}
                      </div>
                      <Text fw={400} className="text-[13px] text-[#6B7280]">
                        {tip}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('form')}
                className="mt-2 w-full max-w-[440px] cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
              >
                Request Early Payout
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 pt-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEF3C7]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B]">
                  <IconAlertTriangle size={32} color="white" strokeWidth={2} />
                </div>
              </div>

              <div className="text-center">
                <Text fw={700} className="text-[24px] text-[#0F172A]">
                  {!isEligible ? 'Not Yet Eligible' : 'No Active Groups'}
                </Text>
                <Text fw={400} className="mt-2 max-w-[380px] text-[14px] text-[#6B7280]">
                  {!isEligible
                    ? `Your trust score is ${MOCK_TRUST_SCORE}/100. You need at least ${TRUST_THRESHOLD} to qualify for an early payout.`
                    : 'You need to be in an active ROSCA group to request an early payout.'}
                </Text>
              </div>

              <div className="w-full max-w-[400px] rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <Text fw={600} className="mb-4 text-[14px] text-[#0F172A]">
                  {!isEligible ? 'How to improve your score' : 'What you can do'}
                </Text>
                <div className="flex flex-col gap-3">
                  {(!isEligible
                    ? [
                        'Join a ROSCA group and participate actively',
                        'Make regular and timely contributions',
                        'Complete your KYC profile',
                        'Maintain a positive transaction history',
                      ]
                    : [
                        'Browse and join an active ROSCA group',
                        'Start making contributions to build trust',
                        'Once active, early payout becomes available',
                      ]
                  ).map((tip) => (
                    <div key={tip} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F0FDF4]">
                        <IconCheck size={12} color="#02A36E" />
                      </div>
                      <Text fw={400} className="text-[13px] text-[#6B7280]">
                        {tip}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full max-w-[400px] cursor-pointer rounded-xl bg-[#9CA3AF] py-3.5 text-[14px] font-semibold text-white hover:bg-[#6B7280]"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== SELECT ROSCA GROUP ==================== */}
      {step === 'form' && (
        <div className="flex flex-col gap-6">
          <button
            onClick={() => setStep('eligibility')}
            className="mb-2 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
          >
            <IconArrowLeft size={18} />
            Back
          </button>

          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">
              Request Early Payout
            </Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Select a ROSCA group to receive your payout early
            </Text>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">
              Select ROSCA Group
            </Text>
            <Select
              data={ACTIVE_GROUPS.map((g) => ({
                value: g.id,
                label: `${g.name} — ₦${g.payoutAmount.toLocaleString()} payout`,
              }))}
              value={selectedGroupId}
              onChange={setSelectedGroupId}
              placeholder="Choose a group"
              radius="md"
              size="md"
              styles={{
                input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 },
              }}
            />
          </div>

          {selectedGroup && (
            <>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                <Text fw={600} className="mb-4 text-[14px] text-[#0F172A]">
                  {selectedGroup.name}
                </Text>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
                    <IconUsers size={18} color="#6B7280" />
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">
                        Members
                      </Text>
                      <Text fw={600} className="text-[14px] text-[#0F172A]">
                        {selectedGroup.totalMembers}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
                    <IconCalendar size={18} color="#6B7280" />
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">
                        Frequency
                      </Text>
                      <Text fw={600} className="text-[14px] text-[#0F172A]">
                        {selectedGroup.frequency}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
                    <IconCash size={18} color="#6B7280" />
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">
                        Contribution
                      </Text>
                      <Text fw={600} className="text-[14px] text-[#0F172A]">
                        ₦{selectedGroup.contribution.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
                    <IconCalendar size={18} color="#6B7280" />
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">
                        Your Turn
                      </Text>
                      <Text fw={600} className="text-[14px] text-[#0F172A]">
                        Position {selectedGroup.yourPosition} — {selectedGroup.nextPayoutDate}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F0FDF4] p-5">
                <Text fw={600} className="mb-3 text-[14px] text-[#374151]">
                  Early Payout Breakdown
                </Text>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <Text fw={400} className="text-[13px] text-[#6B7280]">
                      Payout Amount
                    </Text>
                    <Text fw={600} className="text-[13px] text-[#0F172A]">
                      ₦{selectedGroup.payoutAmount.toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text fw={400} className="text-[13px] text-[#6B7280]">
                      Service Fee (2%)
                    </Text>
                    <Text fw={600} className="text-[13px] text-[#EF4444]">
                      -₦{serviceFee.toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex justify-between border-t border-[#D1FAE5] pt-3">
                    <Text fw={600} className="text-[14px] text-[#0F172A]">
                      You'll Receive
                    </Text>
                    <Text fw={700} className="text-[16px] text-[#02A36E]">
                      ₦{disbursementAmount.toLocaleString()}
                    </Text>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#FEF3C7] px-4 py-3">
                <Text fw={500} className="text-[12px] text-[#92400E]">
                  You'll continue making your ₦{selectedGroup.contribution.toLocaleString()}{' '}
                  {selectedGroup.frequency.toLowerCase()} contributions as usual. Your payout turn
                  will be skipped since you're receiving it early.
                </Text>
              </div>
            </>
          )}

          <button
            onClick={() => setStep('confirm')}
            disabled={!selectedGroupId}
            className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${
              selectedGroupId
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            Proceed
          </button>
        </div>
      )}

      {/* ==================== CONFIRMATION ==================== */}
      {step === 'confirm' && selectedGroup && (
        <div className="flex flex-col gap-6">
          <button
            onClick={() => setStep('form')}
            className="mb-2 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
          >
            <IconArrowLeft size={18} />
            Back
          </button>

          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">
              Confirm Early Payout
            </Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Review the details below before proceeding
            </Text>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <Text fw={400} className="text-[14px] text-[#6B7280]">
                  ROSCA Group
                </Text>
                <Text fw={600} className="text-[14px] text-[#0F172A]">
                  {selectedGroup.name}
                </Text>
              </div>
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <Text fw={400} className="text-[14px] text-[#6B7280]">
                  Payout Amount
                </Text>
                <Text fw={700} className="text-[18px] text-[#0F172A]">
                  ₦{selectedGroup.payoutAmount.toLocaleString()}
                </Text>
              </div>
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <Text fw={400} className="text-[14px] text-[#6B7280]">
                  Service Fee (2%)
                </Text>
                <Text fw={500} className="text-[14px] text-[#EF4444]">
                  -₦{serviceFee.toLocaleString()}
                </Text>
              </div>
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <Text fw={400} className="text-[14px] text-[#6B7280]">
                  Original Payout Date
                </Text>
                <Text fw={500} className="text-[14px] text-[#0F172A]">
                  {selectedGroup.nextPayoutDate}
                </Text>
              </div>
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <Text fw={400} className="text-[14px] text-[#6B7280]">
                  Ongoing Contribution
                </Text>
                <Text fw={500} className="text-[14px] text-[#0F172A]">
                  ₦{selectedGroup.contribution.toLocaleString()} / {selectedGroup.frequency.toLowerCase()}
                </Text>
              </div>
              <div className="flex items-center justify-between">
                <Text fw={600} className="text-[14px] text-[#0F172A]">
                  You'll Receive Now
                </Text>
                <Text fw={700} className="text-[18px] text-[#02A36E]">
                  ₦{disbursementAmount.toLocaleString()}
                </Text>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('pin')}
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Confirm Early Payout
          </button>
        </div>
      )}

      {/* ==================== PIN ENTRY ==================== */}
      {step === 'pin' && (
        <div className="flex flex-col items-center gap-8 pt-8">
          <button
            onClick={() => {
              setStep('confirm')
              setPin('')
            }}
            className="mr-auto flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
          >
            <IconArrowLeft size={18} />
            Back
          </button>

          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">
              Enter Your PIN
            </Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Enter your 4-digit transaction PIN
            </Text>
          </div>

          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 ${
                  i < pin.length
                    ? 'border-[#02A36E] bg-[#F0FDF4]'
                    : 'border-[#E5E7EB] bg-white'
                }`}
              >
                {i < pin.length && (
                  <div className="h-3 w-3 rounded-full bg-[#02A36E]" />
                )}
              </div>
            ))}
          </div>

          <button className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline">
            Forgot PIN?
          </button>

          <div className="grid w-[280px] grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) => {
              if (key === '') return <div key="empty" />
              if (key === 'back') {
                return (
                  <button
                    key="back"
                    onClick={handlePinBackspace}
                    className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB]"
                  >
                    <IconBackspace size={22} color="#374151" />
                  </button>
                )
              }
              return (
                <button
                  key={key}
                  onClick={() => handlePinDigit(key)}
                  className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F9FAFB] text-[20px] font-semibold text-[#0F172A] hover:bg-[#E5E7EB]"
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================== PROCESSING ==================== */}
      {step === 'processing' && (
        <div className="flex flex-col items-center gap-4 pt-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
          <Text fw={500} className="text-[14px] text-[#6B7280]">
            Processing your early payout...
          </Text>
        </div>
      )}

      {/* ==================== SUCCESS ==================== */}
      {step === 'success' && selectedGroup && (
        <div className="flex flex-col items-center gap-6 pt-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#02A36E]">
              <IconCheck size={32} color="white" strokeWidth={3} />
            </div>
          </div>

          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">
              Early Payout Approved!
            </Text>
            <Text fw={400} className="mt-2 max-w-[340px] text-[14px] leading-[1.6] text-[#6B7280]">
              ₦{disbursementAmount.toLocaleString()} from{' '}
              <span className="font-medium text-[#0F172A]">{selectedGroup.name}</span> has been
              disbursed to your wallet.
            </Text>
          </div>

          <div className="w-full max-w-[340px] rounded-xl bg-[#FEF3C7] px-4 py-3">
            <Text fw={500} className="text-center text-[12px] text-[#92400E]">
              Remember to continue your ₦{selectedGroup.contribution.toLocaleString()}{' '}
              {selectedGroup.frequency.toLowerCase()} contributions.
            </Text>
          </div>

          <div className="mt-2 flex w-full max-w-[300px] flex-col gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
            >
              Done
            </button>
            <button
              onClick={() => navigate('/rosca/groups')}
              className="w-full cursor-pointer rounded-xl border border-[#02A36E] bg-white py-3.5 text-[14px] font-semibold text-[#02A36E] hover:bg-[#F0FDF4]"
            >
              View My Groups
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
