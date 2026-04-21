import { useState, useEffect } from 'react'
import { Text } from '@mantine/core'
import { IconArrowLeft, IconCheck, IconAlertCircle, IconBackspace, IconLock } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getPinStatus, setTransactionPin } from '@/utils/api'

type Step = 'loading' | 'enter-current' | 'enter-new' | 'confirm' | 'processing' | 'success' | 'error'

function PinDots({ value, error: hasError }: { value: string; error?: boolean }) {
  return (
    <div className="flex gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 transition-all ${
            i < value.length
              ? hasError
                ? 'border-red-400 bg-red-50'
                : 'border-[#02A36E] bg-[#F0FDF4]'
              : 'border-[#E5E7EB] bg-white'
          }`}
        >
          {i < value.length && (
            <div className={`h-3 w-3 rounded-full ${hasError ? 'bg-red-400' : 'bg-[#02A36E]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function PinKeypad({ onDigit, onBackspace }: { onDigit: (d: string) => void; onBackspace: () => void }) {
  return (
    <div className="grid w-[280px] grid-cols-3 gap-3">
      {['1','2','3','4','5','6','7','8','9','','0','back'].map((key) => {
        if (key === '') return <div key="empty" />
        if (key === 'back') {
          return (
            <button key="back" onClick={onBackspace}
              className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB]">
              <IconBackspace size={22} color="#374151" />
            </button>
          )
        }
        return (
          <button key={key} onClick={() => onDigit(key)}
            className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F9FAFB] text-[20px] font-semibold text-[#0F172A] hover:bg-[#E5E7EB]">
            {key}
          </button>
        )
      })}
    </div>
  )
}

export function SetPin() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('loading')
  const [hasPin, setHasPin] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPinStatus()
      .then((res) => {
        setHasPin(res.hasPin)
        setStep(res.hasPin ? 'enter-current' : 'enter-new')
      })
      .catch(() => setStep('enter-new'))
  }, [])

  async function submit(pin: string, existing?: string) {
    setStep('processing')
    setError(null)
    try {
      await setTransactionPin(pin, existing)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set PIN. Please try again.')
      setStep('error')
    }
  }

  function onCurrentDigit(d: string) {
    if (currentPin.length >= 4) return
    const next = currentPin + d
    setCurrentPin(next)
    if (next.length === 4) setTimeout(() => setStep('enter-new'), 300)
  }

  function onNewDigit(d: string) {
    if (newPin.length >= 4) return
    const next = newPin + d
    setNewPin(next)
    if (next.length === 4) setTimeout(() => { setMismatch(false); setStep('confirm') }, 300)
  }

  function onConfirmDigit(d: string) {
    if (confirmPin.length >= 4) return
    const next = confirmPin + d
    setConfirmPin(next)
    if (next.length === 4) {
      setTimeout(() => {
        if (next !== newPin) {
          setMismatch(true)
          setTimeout(() => { setConfirmPin(''); setMismatch(false) }, 800)
        } else {
          submit(newPin, hasPin ? currentPin : undefined)
        }
      }, 300)
    }
  }

  if (step === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
        <Text fw={500} className="text-[14px] text-[#6B7280]">Setting your PIN...</Text>
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
          <Text fw={700} className="text-[22px] text-[#0F172A]">PIN {hasPin ? 'Changed' : 'Set'} Successfully</Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]">
            Your transaction PIN has been {hasPin ? 'updated' : 'created'}. Use it to confirm withdrawals.
          </Text>
        </div>
        <button onClick={() => navigate('/my-profile')}
          className="w-full max-w-[300px] cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]">
          Back to Profile
        </button>
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
          <Text fw={700} className="text-[22px] text-[#0F172A]">Failed to Set PIN</Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]">{error}</Text>
        </div>
        <div className="flex w-full max-w-[300px] flex-col gap-3">
          <button
            onClick={() => { setCurrentPin(''); setNewPin(''); setConfirmPin(''); setStep(hasPin ? 'enter-current' : 'enter-new') }}
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white">
            Try Again
          </button>
          <button onClick={() => navigate('/my-profile')}
            className="w-full cursor-pointer rounded-xl border border-[#E5E7EB] py-3.5 text-[14px] font-semibold text-[#374151]">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[500px] px-4 py-6">
      <button onClick={() => navigate('/my-profile')}
        className="mb-8 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
        <IconArrowLeft size={18} /> Back
      </button>

      <div className="flex flex-col items-center gap-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0FDF4]">
          <IconLock size={28} color="#02A36E" />
        </div>

        {step === 'enter-current' && (
          <>
            <div className="text-center">
              <Text fw={700} className="text-[22px] text-[#0F172A]">Enter Current PIN</Text>
              <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Enter your existing 4-digit transaction PIN</Text>
            </div>
            <PinDots value={currentPin} />
            <PinKeypad onDigit={onCurrentDigit} onBackspace={() => setCurrentPin((p) => p.slice(0, -1))} />
          </>
        )}

        {step === 'enter-new' && (
          <>
            <div className="text-center">
              <Text fw={700} className="text-[22px] text-[#0F172A]">{hasPin ? 'Enter New PIN' : 'Create Your PIN'}</Text>
              <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Choose a 4-digit transaction PIN</Text>
            </div>
            <PinDots value={newPin} />
            <PinKeypad onDigit={onNewDigit} onBackspace={() => setNewPin((p) => p.slice(0, -1))} />
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="text-center">
              <Text fw={700} className="text-[22px] text-[#0F172A]">Confirm Your PIN</Text>
              <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Re-enter your PIN to confirm</Text>
            </div>
            {mismatch && (
              <div className="rounded-xl bg-red-50 px-4 py-2 text-center">
                <Text fw={500} className="text-[13px] text-red-600">PINs do not match. Please try again.</Text>
              </div>
            )}
            <PinDots value={confirmPin} error={mismatch} />
            <PinKeypad onDigit={onConfirmDigit} onBackspace={() => setConfirmPin((p) => p.slice(0, -1))} />
            <button
              onClick={() => { setNewPin(''); setConfirmPin(''); setMismatch(false); setStep('enter-new') }}
              className="text-[13px] text-[#6B7280] underline">
              Change new PIN
            </button>
          </>
        )}
      </div>
    </div>
  )
}
