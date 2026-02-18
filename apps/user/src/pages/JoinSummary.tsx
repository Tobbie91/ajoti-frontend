import { useState } from 'react'
import { Text, Loader } from '@mantine/core'
import { IconArrowLeft, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

export function JoinSummary() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Mock wallet balance — change to 0 to test insufficient funds flow
  const walletBalance = 120000
  const savingsAmount = 50000
  const hasInsufficientBalance = walletBalance < savingsAmount

  const handleProceed = () => {
    setLoading(true)
    setTimeout(() => {
      navigate('/rosca/requests')
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-5">
        <Loader size={48} color="#02A36E" />
        <div className="text-center">
          <Text fw={700} className="text-[20px] text-[#0F172A]">
            Processing payment...
          </Text>
          <Text fw={400} className="mt-2 text-[14px] text-[#6B7280]">
            Please wait
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back button + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Payment Summary
          </Text>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#02A36E]">
            <IconCheck size={32} color="white" stroke={3} />
          </div>
        </div>

        {/* Savings Details Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
            Savings Details
          </Text>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Savings Amount</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">
                ₦{savingsAmount.toLocaleString()}.00
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Total Amount to Raise</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">₦300,000.00</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">First Payment Date</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">January 15, 2025</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Last Payment Date</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">June 15, 2025</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">ROSCA Duration</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">6 months</Text>
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
            Account Details
          </Text>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Payment Method</Text>
              <Text fw={600} className="text-[14px] text-[#0F172A]">Wallet</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Wallet Balance</Text>
              <Text
                fw={600}
                className={`text-[14px] ${hasInsufficientBalance ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}
              >
                ₦{walletBalance.toLocaleString()}.00
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
              onClick={() => navigate('/create-wallet')}
              className="w-full rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white"
            >
              Fund Wallet
            </button>
            <button
              disabled
              className="w-full rounded-xl bg-[#D1D5DB] py-4 text-[15px] font-semibold text-white cursor-not-allowed"
            >
              Proceed
            </button>
          </div>
        ) : (
          <button
            onClick={handleProceed}
            className="w-full rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white"
          >
            Proceed
          </button>
        )}
      </div>
    </div>
  )
}
