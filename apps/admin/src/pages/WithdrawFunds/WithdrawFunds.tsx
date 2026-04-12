import { useState, useEffect } from 'react'
import { Text, TextInput, Select } from '@mantine/core'
import { IconArrowLeft, IconCheck, IconBackspace, IconAlertCircle } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getAdminWalletBalance, initializeWithdrawal } from '@/utils/api'

type Step = 'form' | 'pin' | 'processing' | 'success' | 'error'

const NIGERIAN_BANKS: { label: string; value: string }[] = [
  { label: 'Access Bank', value: '044' },
  { label: 'Citibank Nigeria', value: '023' },
  { label: 'Ecobank Nigeria', value: '050' },
  { label: 'Fidelity Bank', value: '070' },
  { label: 'First Bank of Nigeria', value: '011' },
  { label: 'First City Monument Bank (FCMB)', value: '214' },
  { label: 'Globus Bank', value: '00103' },
  { label: 'Guaranty Trust Bank (GTB)', value: '058' },
  { label: 'Heritage Bank', value: '030' },
  { label: 'Keystone Bank', value: '082' },
  { label: 'Kuda Bank', value: '50211' },
  { label: 'Moniepoint MFB', value: '50515' },
  { label: 'Opay', value: '999992' },
  { label: 'Palmpay', value: '999991' },
  { label: 'Polaris Bank', value: '076' },
  { label: 'Providus Bank', value: '101' },
  { label: 'Stanbic IBTC Bank', value: '221' },
  { label: 'Standard Chartered Bank', value: '068' },
  { label: 'Sterling Bank', value: '232' },
  { label: 'Union Bank of Nigeria', value: '032' },
  { label: 'United Bank for Africa (UBA)', value: '033' },
  { label: 'Unity Bank', value: '215' },
  { label: 'Wema Bank', value: '035' },
  { label: 'Zenith Bank', value: '057' },
]

export function WithdrawFunds() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [availableBalance, setAvailableBalance] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const storedUser = JSON.parse(localStorage.getItem('admin_user') ?? '{}')
  const userId = storedUser.id ?? storedUser._id ?? ''

  useEffect(() => {
    if (!userId) return
    getAdminWalletBalance(userId)
      .then((data) => setAvailableBalance(data.available ?? data.total ?? 0))
      .catch(() => setAvailableBalance(0))
  }, [userId])

  const numericAmount = parseInt(amount.replace(/,/g, ''), 10) || 0

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString()
  }

  const canProceed =
    numericAmount > 0 &&
    numericAmount <= availableBalance &&
    accountNumber.length === 10 &&
    bankCode !== null

  async function submitWithdrawal() {
    setStep('processing')
    setError(null)
    const selectedBank = NIGERIAN_BANKS.find((b) => b.value === bankCode)
    try {
      await initializeWithdrawal({
        amount: numericAmount,
        accountNumber,
        bankCode: bankCode!,
        bankName: selectedBank?.label,
        narration: `Withdrawal of NGN ${amount}`,
      })
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed. Please try again.')
      setStep('error')
    }
  }

  function handlePinDigit(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => submitWithdrawal(), 300)
      }
    }
  }

  if (step === 'processing') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
        <Text fw={500} className="text-[14px] text-[#6B7280]">Processing your withdrawal...</Text>
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
          <Text fw={700} className="text-[22px] text-[#0F172A]">Withdrawal Successful</Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]">
            Your withdrawal of ₦{amount} has been initiated successfully.
          </Text>
        </div>
        <div className="mt-4 flex w-full max-w-[300px] flex-col gap-3">
          <button onClick={() => navigate('/dashboard')} className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]">Done</button>
          <button onClick={() => navigate('/transactions')} className="w-full cursor-pointer rounded-xl border border-[#02A36E] bg-white py-3.5 text-[14px] font-semibold text-[#02A36E] hover:bg-[#F0FDF4]">View Transactions</button>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="mx-auto flex w-full max-w-[500px] flex-col items-center gap-6 px-4 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500">
            <IconAlertCircle size={32} color="white" />
          </div>
        </div>
        <div className="text-center">
          <Text fw={700} className="text-[22px] text-[#0F172A]">Withdrawal Failed</Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]">{error}</Text>
        </div>
        <div className="flex w-full max-w-[300px] flex-col gap-3">
          <button onClick={() => { setPin(''); setStep('pin') }} className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white">Try Again</button>
          <button onClick={() => { setPin(''); setStep('form') }} className="w-full cursor-pointer rounded-xl border border-[#E5E7EB] py-3.5 text-[14px] font-semibold text-[#374151]">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-6 sm:px-6 sm:py-8">
      {step === 'form' && (
        <div className="flex flex-col gap-5">
          <button onClick={() => navigate(-1)} className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
            <IconArrowLeft size={18} /> Back
          </button>
          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">Withdraw Funds</Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Available: ₦{availableBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">Recipient Account</Text>
            <div className="flex flex-col gap-3">
              <TextInput
                placeholder="Account Number (10 digits)"
                radius="md" size="md"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.currentTarget.value.replace(/\D/g, '').slice(0, 10))}
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 } }}
              />
              <Select
                data={NIGERIAN_BANKS}
                value={bankCode}
                onChange={setBankCode}
                placeholder="Select Bank"
                radius="md" size="md" searchable
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 } }}
              />
              {accountNumber.length === 10 && bankCode && (
                <div className="flex items-center gap-2 rounded-lg bg-[#F0FDF4] px-3 py-2">
                  <IconCheck size={16} color="#02A36E" />
                  <Text fw={500} className="text-[13px] text-[#02A36E]">
                    Ready to withdraw to {NIGERIAN_BANKS.find((b) => b.value === bankCode)?.label}
                  </Text>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">Enter Amount</Text>
            <TextInput
              placeholder="0" radius="md" size="lg"
              value={amount}
              onChange={(e) => setAmount(formatAmount(e.currentTarget.value))}
              leftSection={<Text fw={600} className="text-[16px] text-[#0F172A]">₦</Text>}
              styles={{ input: { borderColor: '#E5E7EB', fontSize: 20, fontWeight: 600, height: 52 } }}
            />
            {numericAmount > availableBalance && numericAmount > 0 && (
              <Text fw={400} className="mt-2 text-[12px] text-red-500">Amount exceeds available balance</Text>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {['5,000', '10,000', '50,000', '100,000'].map((val) => (
                <button key={val} onClick={() => setAmount(val)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${amount === val ? 'border-[#02A36E] bg-[#F0FDF4] text-[#02A36E]' : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]'}`}>
                  ₦{val}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => canProceed && setStep('pin')} disabled={!canProceed}
            className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${canProceed ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]' : 'cursor-not-allowed bg-[#9CA3AF]'}`}>
            Proceed
          </button>
        </div>
      )}

      {step === 'pin' && (
        <div className="flex flex-col items-center gap-8 pt-8">
          <button onClick={() => { setStep('form'); setPin('') }} className="mr-auto flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
            <IconArrowLeft size={18} /> Back
          </button>
          <div className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-center">
            <Text fw={400} className="text-[13px] text-[#6B7280]">Withdrawing</Text>
            <Text fw={700} className="mt-1 text-[28px] text-[#0F172A]">₦{amount}</Text>
            <Text fw={400} className="mt-1 text-[12px] text-[#9CA3AF]">
              to {accountNumber} · {NIGERIAN_BANKS.find((b) => b.value === bankCode)?.label}
            </Text>
          </div>
          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">Enter Your PIN</Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Enter your 4-digit transaction PIN to confirm</Text>
          </div>
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 ${i < pin.length ? 'border-[#02A36E] bg-[#F0FDF4]' : 'border-[#E5E7EB] bg-white'}`}>
                {i < pin.length && <div className="h-3 w-3 rounded-full bg-[#02A36E]" />}
              </div>
            ))}
          </div>
          <div className="grid w-[280px] grid-cols-3 gap-3">
            {['1','2','3','4','5','6','7','8','9','','0','back'].map((key) => {
              if (key === '') return <div key="empty" />
              if (key === 'back') return <button key="back" onClick={() => setPin((p) => p.slice(0, -1))} className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB]"><IconBackspace size={22} color="#374151" /></button>
              return <button key={key} onClick={() => handlePinDigit(key)} className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F9FAFB] text-[20px] font-semibold text-[#0F172A] hover:bg-[#E5E7EB]">{key}</button>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
