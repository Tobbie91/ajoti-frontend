import { useEffect, useState, type ReactNode } from 'react'
import { Text, Loader } from '@mantine/core'
import { IconShieldOff, IconClock, IconShieldX } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getKycStatus } from '@/utils/api'

interface KycGateProps {
  children: ReactNode
  action?: string
}

type GateState = 'loading' | 'approved' | 'pending' | 'rejected' | 'incomplete'

export function KycGate({ children, action = 'perform this action' }: KycGateProps) {
  const navigate = useNavigate()
  const [state, setState] = useState<GateState>('loading')

  useEffect(() => {
    getKycStatus()
      .then((kyc) => {
        if (kyc.status === 'APPROVED') setState('approved')
        else if (kyc.status === 'PENDING') setState('pending')
        else if (kyc.status === 'REJECTED') setState('rejected')
        else setState('incomplete')
      })
      .catch(() => setState('incomplete'))
  }, [])

  if (state === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader color="#0b6b55" size="md" />
      </div>
    )
  }

  if (state === 'approved') {
    return <>{children}</>
  }

  if (state === 'pending') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEF9C3]">
          <IconClock size={38} color="#CA8A04" stroke={1.5} />
        </div>
        <Text fw={700} className="mt-6 text-[22px] text-[#0F172A]">
          Verification Under Review
        </Text>
        <Text fw={400} className="mt-2 max-w-[340px] text-[14px] leading-relaxed text-[#6B7280]">
          Your identity documents have been submitted and are being reviewed. You'll be able to {action} once approved — this usually takes less than 24 hours.
        </Text>
        <button
          onClick={() => navigate(-1)}
          className="mt-8 cursor-pointer rounded-xl bg-[#0b6b55] px-10 py-3.5 text-[14px] font-semibold text-white"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (state === 'rejected') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]">
          <IconShieldX size={38} color="#EF4444" stroke={1.5} />
        </div>
        <Text fw={700} className="mt-6 text-[22px] text-[#0F172A]">
          Verification Unsuccessful
        </Text>
        <Text fw={400} className="mt-2 max-w-[340px] text-[14px] leading-relaxed text-[#6B7280]">
          Your verification was not approved. Please resubmit with valid documents to {action}.
        </Text>
        <button
          onClick={() => navigate('/kyc')}
          className="mt-8 cursor-pointer rounded-xl bg-[#0b6b55] px-10 py-3.5 text-[14px] font-semibold text-white"
        >
          Resubmit Verification
        </button>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 cursor-pointer text-[13px] font-medium text-[#6B7280] underline-offset-2 hover:underline"
        >
          Go back
        </button>
      </div>
    )
  }

  // incomplete — NOT_SUBMITTED or in progress
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEF3C7]">
        <IconShieldOff size={38} color="#F59E0B" stroke={1.5} />
      </div>
      <Text fw={700} className="mt-6 text-[22px] text-[#0F172A]">
        Identity Verification Required
      </Text>
      <Text fw={400} className="mt-2 max-w-[340px] text-[14px] leading-relaxed text-[#6B7280]">
        You need to complete KYC verification before you can {action}. It only takes a few minutes.
      </Text>
      <button
        onClick={() => navigate('/kyc')}
        className="mt-8 cursor-pointer rounded-xl bg-[#0b6b55] px-10 py-3.5 text-[14px] font-semibold text-white"
      >
        Verify My Identity
      </button>
      <button
        onClick={() => navigate(-1)}
        className="mt-3 cursor-pointer text-[13px] font-medium text-[#6B7280] underline-offset-2 hover:underline"
      >
        Go back
      </button>
    </div>
  )
}
