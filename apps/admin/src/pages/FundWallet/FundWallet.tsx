import { useState } from 'react'
import { Text, TextInput, Loader } from '@mantine/core'
import { IconArrowLeft, IconChevronRight, IconAlertCircle } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { initializeFunding } from '@/utils/api'

const QUICK_AMOUNTS = ['1,000', '5,000', '10,000', '50,000']

export function FundWallet() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericAmount = parseInt(amount.replace(/,/g, ''), 10) || 0
  const canProceed = numericAmount >= 100 && !submitting

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString()
  }

  async function handleProceed() {
    if (!canProceed) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await initializeFunding({
        amount: numericAmount * 100, // convert naira → kobo
        redirectUrl: `${window.location.origin}/fund-wallet/callback`,
        currency: 'NGN',
      })
      const link = res.authorizationUrl ?? res.paymentLink ?? res.paymentUrl ?? res.link
      if (link) {
        window.location.href = link as string
      } else {
        setError('Could not get payment link. Please try again.')
        setSubmitting(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
      >
        <IconArrowLeft size={18} />
        Back
      </button>

      <div className="mb-6">
        <Text fw={700} className="text-[24px] text-[#0F172A]">Fund Wallet</Text>
        <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Add money to your NGN wallet</Text>
      </div>

      <div className="flex flex-col gap-5">
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3">
            <IconAlertCircle size={16} color="#EF4444" className="mt-0.5 flex-shrink-0" />
            <Text fw={400} className="text-[13px] text-red-600">{error}</Text>
          </div>
        )}

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <Text fw={600} className="mb-3 text-[14px] text-[#374151]">Enter Amount</Text>
          <TextInput
            placeholder="0"
            radius="md"
            size="lg"
            value={amount}
            onChange={(e) => setAmount(formatAmount(e.currentTarget.value))}
            leftSection={<Text fw={600} className="text-[16px] text-[#0F172A]">₦</Text>}
            styles={{
              input: { borderColor: '#E5E7EB', fontSize: 20, fontWeight: 600, height: 52 },
            }}
          />
          {numericAmount > 0 && numericAmount < 100 && (
            <Text fw={400} className="mt-2 text-[12px] text-red-500">Minimum amount is ₦100</Text>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  amount === val
                    ? 'border-[#02A36E] bg-[#F0FDF4] text-[#02A36E]'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]'
                }`}
              >
                ₦{val}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleProceed}
          disabled={!canProceed}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-semibold text-white transition-colors ${
            canProceed
              ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
              : 'cursor-not-allowed bg-[#9CA3AF]'
          }`}
        >
          {submitting ? (
            <>
              <Loader size={16} color="white" />
              <span>Redirecting...</span>
            </>
          ) : (
            <>
              <span>Pay ₦{numericAmount > 0 ? numericAmount.toLocaleString() : '0'}</span>
              <IconChevronRight size={16} />
            </>
          )}
        </button>

        <Text fw={400} className="text-center text-[11px] text-[#9CA3AF]">
          Secured by Flutterwave · 256-bit SSL encryption
        </Text>
      </div>
    </div>
  )
}
