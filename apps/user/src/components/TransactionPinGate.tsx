import { useEffect, useState, type ReactNode } from 'react'
import { Loader, Text } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getPinStatus } from '@/utils/api'

interface TransactionPinGateProps {
  children: ReactNode
}

type PinState = 'checking' | 'ready' | 'missing' | 'error'

export function TransactionPinGate({ children }: TransactionPinGateProps) {
  const navigate = useNavigate()
  const [state, setState] = useState<PinState>('checking')

  function checkPin() {
    setState('checking')
    getPinStatus()
      .then(({ hasPin }) => setState(hasPin ? 'ready' : 'missing'))
      .catch(() => setState('error'))
  }

  useEffect(() => {
    checkPin()
  }, [])

  if (state === 'ready') return <>{children}</>

  if (state === 'checking') {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Loader size="sm" color="#02A36E" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[45vh] w-full max-w-[440px] items-center px-4">
      <div className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FDF4]">
          <IconLock size={22} color="#02A36E" />
        </div>
        <Text fw={700} className="text-[18px] text-[#0F172A]">
          {state === 'missing' ? 'Transaction PIN required' : 'Unable to check transaction PIN'}
        </Text>
        <Text fw={400} className="mx-auto mt-2 max-w-[340px] text-[13px] leading-[1.6] text-[#6B7280]">
          {state === 'missing'
            ? 'You need to set a transaction PIN before you can withdraw funds.'
            : 'We could not confirm your transaction PIN status. Please try again.'}
        </Text>

        {state === 'missing' ? (
          <button
            onClick={() => navigate('/set-pin')}
            className="mt-5 w-full cursor-pointer rounded-xl bg-[#02A36E] py-3 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Set Transaction PIN
          </button>
        ) : (
          <button
            onClick={checkPin}
            className="mt-5 w-full cursor-pointer rounded-xl bg-[#02A36E] py-3 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
