import { useState } from 'react'
import { Text, TextInput, Select } from '@mantine/core'
import { IconArrowLeft, IconCheck, IconBackspace } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type Step = 'form' | 'pin' | 'processing' | 'success'

const NIGERIAN_BANKS = [
  'Access Bank', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank',
  'First Bank of Nigeria', 'First City Monument Bank (FCMB)', 'Globus Bank',
  'Guaranty Trust Bank (GTB)', 'Heritage Bank', 'Keystone Bank', 'Kuda Bank',
  'Opay', 'Palmpay', 'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank',
  'Standard Chartered Bank', 'Sterling Bank', 'SunTrust Bank',
  'Union Bank of Nigeria', 'United Bank for Africa (UBA)', 'Unity Bank',
  'Wema Bank', 'Zenith Bank',
]

const WALLETS = [{ value: 'ngn', label: 'NGN Wallet — ₦10,000.00' }]

export function WithdrawFunds() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')

  const [wallet, setWallet] = useState<string | null>('ngn')
  const [accountNumber, setAccountNumber] = useState('')
  const [bank, setBank] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [accountVerified, setAccountVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [pin, setPin] = useState('')

  const availableBalance = 10000
  const numericAmount = parseInt(amount.replace(/,/g, ''), 10) || 0

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString()
  }

  function handleAccountLookup(accNum: string, selectedBank: string | null) {
    if (accNum.length === 10 && selectedBank) {
      setVerifying(true)
      setAccountVerified(false)
      setTimeout(() => {
        setAccountName('Admin User')
        setAccountVerified(true)
        setVerifying(false)
      }, 1500)
    } else {
      setAccountVerified(false)
      setAccountName('')
    }
  }

  function handleProceed() {
    if (numericAmount > 0 && numericAmount <= availableBalance && accountVerified) {
      setStep('pin')
    }
  }

  function handlePinDigit(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => {
          setStep('processing')
          setTimeout(() => setStep('success'), 2500)
        }, 300)
      }
    }
  }

  function handlePinBackspace() {
    setPin(pin.slice(0, -1))
  }

  const canProceed = numericAmount > 0 && numericAmount <= availableBalance && accountVerified && wallet

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-8">
      {step === 'form' && (
        <div className="flex flex-col gap-6">
          <button onClick={() => navigate(-1)} className="mb-2 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
            <IconArrowLeft size={18} /> Back
          </button>

          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">Withdraw Funds</Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Available: ₦{availableBalance.toLocaleString()}.00</Text>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">Choose a Wallet</Text>
            <Select data={WALLETS} value={wallet} onChange={setWallet} placeholder="Select wallet" radius="md" size="md" styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 } }} />
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">Recipient Account</Text>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <TextInput
                  placeholder="Account Number"
                  radius="md"
                  size="md"
                  value={accountNumber}
                  onChange={(e) => {
                    const digits = e.currentTarget.value.replace(/\D/g, '').slice(0, 10)
                    setAccountNumber(digits)
                    handleAccountLookup(digits, bank)
                  }}
                  styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 }, root: { flex: 1 } }}
                />
                <Select
                  data={NIGERIAN_BANKS}
                  value={bank}
                  onChange={(val) => { setBank(val); handleAccountLookup(accountNumber, val) }}
                  placeholder="Select Bank"
                  radius="md"
                  size="md"
                  searchable
                  styles={{ input: { borderColor: '#E5E7EB', fontSize: 14, height: 48 }, root: { flex: 1 } }}
                />
              </div>
              {verifying && (
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#02A36E]" />
                  <Text fw={400} className="text-[13px] text-[#6B7280]">Verifying account...</Text>
                </div>
              )}
              {accountVerified && !verifying && (
                <div className="flex items-center gap-2 rounded-lg bg-[#F0FDF4] px-3 py-2">
                  <IconCheck size={16} color="#02A36E" />
                  <Text fw={500} className="text-[13px] text-[#02A36E]">{accountName}</Text>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
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
            {numericAmount > availableBalance && (
              <Text fw={400} className="mt-2 text-[12px] text-red-500">Amount exceeds available balance</Text>
            )}
          </div>

          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${canProceed ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]' : 'cursor-not-allowed bg-[#9CA3AF]'}`}
          >
            Proceed
          </button>
        </div>
      )}

      {step === 'pin' && (
        <div className="flex flex-col items-center gap-8 pt-8">
          <button onClick={() => { setStep('form'); setPin('') }} className="mr-auto flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
            <IconArrowLeft size={18} /> Back
          </button>
          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">Enter Your PIN</Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Enter your 4-digit transaction PIN</Text>
          </div>
          <div className="flex gap-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 ${i < pin.length ? 'border-[#02A36E] bg-[#F0FDF4]' : 'border-[#E5E7EB] bg-white'}`}>
                {i < pin.length && <div className="h-3 w-3 rounded-full bg-[#02A36E]" />}
              </div>
            ))}
          </div>
          <button className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline">Forgot PIN?</button>
          <div className="grid w-[280px] grid-cols-3 gap-3">
            {['1','2','3','4','5','6','7','8','9','','0','back'].map((key) => {
              if (key === '') return <div key="empty" />
              if (key === 'back') return <button key="back" onClick={handlePinBackspace} className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB]"><IconBackspace size={22} color="#374151" /></button>
              return <button key={key} onClick={() => handlePinDigit(key)} className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F9FAFB] text-[20px] font-semibold text-[#0F172A] hover:bg-[#E5E7EB]">{key}</button>
            })}
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center gap-4 pt-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
          <Text fw={500} className="text-[14px] text-[#6B7280]">Processing your withdrawal...</Text>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center gap-6 pt-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#02A36E]">
              <IconCheck size={32} color="white" strokeWidth={3} />
            </div>
          </div>
          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">Withdrawal Successful</Text>
            <Text fw={400} className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]">Your withdrawal of ₦{amount} was successful.</Text>
          </div>
          <div className="mt-4 flex w-full max-w-[300px] flex-col gap-3">
            <button onClick={() => navigate('/dashboard')} className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]">Done</button>
            <button className="w-full cursor-pointer rounded-xl border border-[#02A36E] bg-white py-3.5 text-[14px] font-semibold text-[#02A36E] hover:bg-[#F0FDF4]">View Receipt</button>
          </div>
        </div>
      )}
    </div>
  )
}
