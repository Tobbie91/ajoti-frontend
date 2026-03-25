import { useState, useEffect } from 'react'
import { Text, TextInput, Loader } from '@mantine/core'
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconCreditCard,
  IconBuildingBank,
  IconCheck,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getVirtualAccount, getFundingMethods, initializeFunding } from '@/utils/api'
import type { VirtualAccount, FundingMethod } from '@/utils/api'

type Step = 'form' | 'processing' | 'success'

export function FundWallet() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')

  const [amount, setAmount] = useState('')
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [showCardOptions, setShowCardOptions] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null)
  const [fundingMethods, setFundingMethods] = useState<FundingMethod[]>([])

  const numericAmount = parseInt(amount.replace(/,/g, ''), 10) || 0

  useEffect(() => {
    getVirtualAccount()
      .then(setVirtualAccount)
      .catch(() => {})
    getFundingMethods()
      .then(setFundingMethods)
      .catch(() => {})
  }, [])

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString()
  }

  async function handleProceed() {
    if (numericAmount <= 0) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await initializeFunding({
        amount: numericAmount,
        redirectUrl: `${window.location.origin}/fund-wallet/callback`,
        paymentMethod: selectedMethod || 'CARD',
        currency: 'NGN',
      })
      const link = res.paymentLink ?? res.paymentUrl
      if (link) {
        window.location.href = link as string
      } else {
        setStep('success')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment')
      setSubmitting(false)
    }
  }

  if (step === 'processing') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader size={40} color="#02A36E" />
        <Text fw={500} className="text-[14px] text-[#6B7280]">Processing your payment...</Text>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="mx-auto flex w-full max-w-[500px] flex-col items-center gap-6 px-4 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#02A36E]">
            <IconCheck size={32} color="white" strokeWidth={3} />
          </div>
        </div>
        <div className="text-center">
          <Text fw={700} className="text-[22px] text-[#0F172A]">Payment Initiated</Text>
          <Text fw={400} className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-[#6B7280]">
            Your funding request for ₦{amount} has been submitted.
          </Text>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="w-full max-w-[300px] cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-6 sm:px-6 sm:py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
      >
        <IconArrowLeft size={18} />
        Back
      </button>

      <div className="flex flex-col gap-5">
        <div>
          <Text fw={700} className="text-[22px] text-[#0F172A]">Fund Wallet</Text>
          <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Add funds to your NGN wallet</Text>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
            {error}
          </div>
        )}

        {/* Amount */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
          <Text fw={600} className="mb-3 text-[14px] text-[#374151]">Enter Amount</Text>
          <TextInput
            placeholder="0"
            radius="md"
            size="lg"
            value={amount}
            onChange={(e) => setAmount(formatAmount(e.currentTarget.value))}
            leftSection={<Text fw={600} className="text-[16px] text-[#0F172A]">₦</Text>}
            styles={{ input: { borderColor: '#E5E7EB', fontSize: 20, fontWeight: 600, height: 52 } }}
          />
          {/* Quick amounts — wrap on mobile */}
          <div className="mt-3 flex flex-wrap gap-2">
            {['5,000', '10,000', '50,000', '100,000'].map((val) => (
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

        {/* Via Bank Transfer */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white">
          <button
            onClick={() => { setShowBankDetails(!showBankDetails); setShowCardOptions(false) }}
            className="flex w-full cursor-pointer items-center justify-between p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF]">
                <IconBuildingBank size={20} color="#3B82F6" />
              </div>
              <div className="text-left">
                <Text fw={600} className="text-[14px] text-[#0F172A]">Via Bank Transfer</Text>
                <Text fw={400} className="text-[12px] text-[#6B7280]">Transfer to your dedicated account</Text>
              </div>
            </div>
            {showBankDetails ? <IconChevronUp size={18} color="#9CA3AF" /> : <IconChevronDown size={18} color="#9CA3AF" />}
          </button>

          {showBankDetails && (
            <div className="border-t border-[#E5E7EB] px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              <div className="rounded-xl bg-[#F9FAFB] p-4">
                {virtualAccount ? (
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Bank Name', value: virtualAccount.bankName },
                      { label: 'Account Number', value: virtualAccount.accountNumber },
                      { label: 'Account Name', value: virtualAccount.accountName },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between gap-4">
                        <Text fw={400} className="text-[13px] text-[#6B7280]">{label}</Text>
                        <Text fw={600} className="text-right text-[13px] text-[#0F172A]">{value}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center py-2">
                    <Loader size="sm" color="#02A36E" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pay with Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white">
          <button
            onClick={() => { setShowCardOptions(!showCardOptions); setShowBankDetails(false) }}
            className="flex w-full cursor-pointer items-center justify-between p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4]">
                <IconCreditCard size={20} color="#02A36E" />
              </div>
              <div className="text-left">
                <Text fw={600} className="text-[14px] text-[#0F172A]">Pay with Card</Text>
                <Text fw={400} className="text-[12px] text-[#6B7280]">
                  {selectedMethod ? `Selected: ${selectedMethod}` : 'Pay securely via card'}
                </Text>
              </div>
            </div>
            {showCardOptions ? <IconChevronUp size={18} color="#9CA3AF" /> : <IconChevronDown size={18} color="#9CA3AF" />}
          </button>

          {showCardOptions && (
            <div className="border-t border-[#E5E7EB] px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              {fundingMethods.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {fundingMethods.map((m) => (
                    <button
                      key={m.method}
                      onClick={() => { setSelectedMethod(m.method); setShowCardOptions(false) }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                        selectedMethod === m.method
                          ? 'border-[#02A36E] bg-[#F0FDF4]'
                          : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <IconCreditCard size={16} color={selectedMethod === m.method ? '#02A36E' : '#374151'} />
                      <Text fw={500} className="flex-1 text-left text-[13px] text-[#0F172A]">
                        {m.label || m.method}
                      </Text>
                      {selectedMethod === m.method && <IconCheck size={16} color="#02A36E" />}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => { setSelectedMethod('CARD'); setShowCardOptions(false) }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                    selectedMethod === 'CARD' ? 'border-[#02A36E] bg-[#F0FDF4]' : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <IconCreditCard size={16} color={selectedMethod === 'CARD' ? '#02A36E' : '#374151'} />
                  <Text fw={500} className="flex-1 text-left text-[13px] text-[#0F172A]">Card Payment</Text>
                  {selectedMethod === 'CARD' && <IconCheck size={16} color="#02A36E" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Proceed */}
        <button
          onClick={handleProceed}
          disabled={numericAmount <= 0 || submitting}
          className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${
            numericAmount > 0 && !submitting
              ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
              : 'cursor-not-allowed bg-[#9CA3AF]'
          }`}
        >
          {submitting ? 'Please wait...' : 'Proceed'}
        </button>
      </div>
    </div>
  )
}
