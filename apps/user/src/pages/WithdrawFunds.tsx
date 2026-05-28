import { useState, useEffect, useRef } from 'react'
import { Text, TextInput, Select, Loader } from '@mantine/core'
import {
  IconArrowLeft,
  IconCheck,
  IconBackspace,
  IconAlertCircle,
  IconX,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getWalletBalance, getBanks, resolveAccount, initializeWithdrawal } from '@/utils/api'
import type { BankOption } from '@/utils/api'

type Step = 'form' | 'pin' | 'processing' | 'success' | 'error'
type ResolveState = 'idle' | 'loading' | 'success' | 'error'

const WALLETS_STATIC = [{ value: 'ngn', label: 'NGN Wallet' }]

export function WithdrawFunds() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')

  // Form
  const [wallet, setWallet] = useState<string | null>('ngn')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState<string | null>(null)
  const [amount, setAmount] = useState('')

  // Account resolution
  const [resolveState, setResolveState] = useState<ResolveState>('idle')
  const [resolvedName, setResolvedName] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const resolveAbortRef = useRef<AbortController | null>(null)

  // Banks list
  const [banks, setBanks] = useState<{ label: string; value: string }[]>([])

  // PIN
  const [pin, setPin] = useState('')

  // State
  const [availableBalance, setAvailableBalance] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getWalletBalance()
      .then((data) => setAvailableBalance(Number(data.available ?? data.total ?? 0) / 100))
      .catch(() => setAvailableBalance(0))

    getBanks()
      .then((list) => {
        const seen = new Set<string>()
        const unique = list.filter((b: BankOption) => {
          if (seen.has(b.code)) return false
          seen.add(b.code)
          return true
        })
        setBanks(unique.map((b: BankOption) => ({ label: b.name, value: b.code })))
      })
      .catch(() => {})
  }, [])

  // Auto-resolve when both account number (10 digits) and bank are set
  useEffect(() => {
    // Reset resolved state whenever inputs change
    setResolvedName(null)
    setResolveError(null)

    if (accountNumber.length !== 10 || !bankCode) {
      setResolveState('idle')
      return
    }

    // Cancel any in-flight request
    resolveAbortRef.current?.abort()
    const controller = new AbortController()
    resolveAbortRef.current = controller

    setResolveState('loading')

    resolveAccount(accountNumber, bankCode)
      .then((data) => {
        if (controller.signal.aborted) return
        setResolvedName(data.account_name)
        setResolveState('success')
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setResolveError(err instanceof Error ? err.message : 'Could not verify account')
        setResolveState('error')
      })

    return () => controller.abort()
  }, [accountNumber, bankCode])

  const numericAmount = parseInt(amount.replace(/,/g, ''), 10) || 0

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString()
  }

  const canProceed =
    numericAmount > 0 &&
    numericAmount <= availableBalance &&
    resolveState === 'success' &&
    resolvedName !== null &&
    wallet !== null

  function handleProceed() {
    if (canProceed) setStep('pin')
  }

  async function submitWithdrawal(enteredPin: string) {
    setStep('processing')
    setError(null)

    const selectedBank = banks.find((b) => b.value === bankCode)

    try {
      await initializeWithdrawal({
        amount: numericAmount,
        accountNumber,
        accountName: resolvedName!,
        bankCode: bankCode!,
        bankName: selectedBank?.label,
        narration: `Withdrawal of NGN ${amount}`,
        transactionPin: enteredPin,
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
        setTimeout(() => submitWithdrawal(newPin), 300)
      }
    }
  }

  function handlePinBackspace() {
    setPin((p) => p.slice(0, -1))
  }

  // ==================== PROCESSING ====================
  if (step === 'processing') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
        <Text fw={500} className="text-[14px] text-[#6B7280]">
          Processing your withdrawal...
        </Text>
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
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Withdrawal Successful
          </Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]">
            Your withdrawal of ₦{amount} has been initiated successfully.
          </Text>
        </div>

        <div className="mt-4 flex w-full max-w-[300px] flex-col gap-3">
          <button
            onClick={() => navigate('/home')}
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Done
          </button>
          <button
            onClick={() => navigate('/transactions')}
            className="w-full cursor-pointer rounded-xl border border-[#02A36E] bg-white py-3.5 text-[14px] font-semibold text-[#02A36E] hover:bg-[#F0FDF4]"
          >
            View Transactions
          </button>
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
            <IconAlertCircle size={32} color="white" />
          </div>
        </div>

        <div className="text-center">
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Withdrawal Failed
          </Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]">
            {error}
          </Text>
        </div>

        <div className="flex w-full max-w-[300px] flex-col gap-3">
          <button
            onClick={() => {
              setPin('')
              setStep('pin')
            }}
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              setPin('')
              setStep('form')
            }}
            className="w-full cursor-pointer rounded-xl border border-[#E5E7EB] py-3.5 text-[14px] font-semibold text-[#374151]"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-6 sm:px-6 sm:py-8">
      {/* ==================== STEP 1: FORM ==================== */}
      {step === 'form' && (
        <div className="flex flex-col gap-5">
          <button
            onClick={() => navigate(-1)}
            className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
          >
            <IconArrowLeft size={18} />
            Back
          </button>

          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">
              Withdraw Funds
            </Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Available: ₦{availableBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
          </div>

          {/* Choose Wallet */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">
              Choose a Wallet
            </Text>
            <Select
              data={WALLETS_STATIC.map((w) => ({
                ...w,
                label: `${w.label} — ₦${availableBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
              }))}
              value={wallet}
              onChange={setWallet}
              placeholder="Select wallet"
              radius="md"
              size="md"
              styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 } }}
            />
          </div>

          {/* Recipient Account */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">
              Recipient Account
            </Text>
            <div className="flex flex-col gap-3">
              <Select
                data={banks}
                value={bankCode}
                onChange={(val) => { setBankCode(val) }}
                placeholder="Select Bank"
                radius="md"
                size="md"
                searchable
                nothingFoundMessage="No bank found"
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 } }}
              />
              <TextInput
                placeholder="Account Number (10 digits)"
                radius="md"
                size="md"
                value={accountNumber}
                onChange={(e) => {
                  const digits = e.currentTarget.value.replace(/\D/g, '').slice(0, 10)
                  setAccountNumber(digits)
                }}
                maxLength={10}
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 } }}
              />

              {/* Resolution state */}
              {resolveState === 'loading' && (
                <div className="flex items-center gap-2 rounded-lg bg-[#F9FAFB] px-3 py-2.5">
                  <Loader size={14} color="#02A36E" />
                  <Text fw={400} className="text-[13px] text-[#6B7280]">
                    Verifying account...
                  </Text>
                </div>
              )}
              {resolveState === 'success' && resolvedName && (
                <div className="flex items-center gap-2 rounded-lg bg-[#F0FDF4] px-3 py-2.5">
                  <IconCheck size={16} color="#02A36E" />
                  <div>
                    <Text fw={600} className="text-[13px] text-[#02A36E]">
                      {resolvedName}
                    </Text>
                    <Text fw={400} className="text-[11px] text-[#6B7280]">
                      Account verified
                    </Text>
                  </div>
                </div>
              )}
              {resolveState === 'error' && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5">
                  <IconX size={16} color="#EF4444" />
                  <Text fw={400} className="text-[13px] text-red-500">
                    {resolveError ?? 'Could not verify account. Check the details and try again.'}
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* Enter Amount */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">
              Enter Amount
            </Text>
            <TextInput
              placeholder="0"
              radius="md"
              size="lg"
              value={amount}
              onChange={(e) => setAmount(formatAmount(e.currentTarget.value))}
              leftSection={
                <Text fw={600} className="text-[16px] text-[#0F172A]">
                  ₦
                </Text>
              }
              styles={{
                input: { borderColor: '#E5E7EB', fontSize: 20, fontWeight: 600, height: 52 },
              }}
            />
            {numericAmount > availableBalance && numericAmount > 0 && (
              <Text fw={400} className="mt-2 text-[12px] text-red-500">
                Amount exceeds available balance
              </Text>
            )}
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

          {/* Proceed */}
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${
              canProceed
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            Proceed
          </button>
        </div>
      )}

      {/* ==================== STEP 2: PIN ENTRY ==================== */}
      {step === 'pin' && (
        <div className="flex flex-col items-center gap-8 pt-8">
          <button
            onClick={() => {
              setStep('form')
              setPin('')
            }}
            className="mr-auto flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
          >
            <IconArrowLeft size={18} />
            Back
          </button>

          {/* Summary */}
          <div className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-center">
            <Text fw={400} className="text-[13px] text-[#6B7280]">Withdrawing</Text>
            <Text fw={700} className="mt-1 text-[28px] text-[#0F172A]">₦{amount}</Text>
            <Text fw={600} className="mt-1 text-[14px] text-[#0F172A]">{resolvedName}</Text>
            <Text fw={400} className="text-[12px] text-[#9CA3AF]">
              {accountNumber} · {banks.find((b) => b.value === bankCode)?.label}
            </Text>
          </div>

          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">
              Enter Your PIN
            </Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Enter your 4-digit transaction PIN to confirm
            </Text>
          </div>

          {/* PIN dots */}
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
                {i < pin.length && <div className="h-3 w-3 rounded-full bg-[#02A36E]" />}
              </div>
            ))}
          </div>

          <button className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline">
            Forgot PIN?
          </button>

          {/* Number pad */}
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
    </div>
  )
}
