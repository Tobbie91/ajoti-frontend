import { useState, useEffect } from 'react'
import { Text, Loader } from '@mantine/core'
import { IconArrowLeft, IconUsers, IconCircleCheck, IconAlertTriangle } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { joinByInvite } from '@/utils/api'

type PageState = 'confirm' | 'loading' | 'success' | 'error'

export function InviteAccept() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<PageState>('confirm')
  const [errorMessage, setErrorMessage] = useState('')

  // Auto-scroll to top
  useEffect(() => { window.scrollTo(0, 0) }, [])

  async function handleAccept() {
    if (!token) return
    setState('loading')
    try {
      await joinByInvite(token)
      setState('success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setErrorMessage(msg)
      setState('error')
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-6 py-12">
      {/* Back */}
      <button
        onClick={() => navigate('/rosca')}
        className="mb-6 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
      >
        <IconArrowLeft size={18} color="#374151" />
      </button>

      {state === 'confirm' && (
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-8 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
            <IconUsers size={36} color="#02A36E" />
          </div>

          <Text fw={700} className="mt-6 text-center text-[22px] text-[#0F172A]">
            You've been invited!
          </Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-center text-[14px] leading-relaxed text-[#6B7280]">
            You have a private invitation to join a ROSCA savings circle. Accepting will reserve your
            collateral and submit your join request to the admin.
          </Text>

          <div className="mt-6 w-full rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-5 py-4">
            <Text fw={600} className="text-[13px] text-[#92400E]">Before you accept</Text>
            <ul className="mt-2 flex flex-col gap-1.5">
              {[
                'A collateral amount will be reserved from your wallet',
                'Your request still needs admin approval',
                'This invite link is single-use and expires in 7 days',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 text-[#F59E0B]">•</span>
                  <Text fw={400} className="text-[12px] leading-relaxed text-[#92400E]">{item}</Text>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 flex w-full gap-3">
            <button
              onClick={() => navigate('/rosca')}
              className="flex-1 cursor-pointer rounded-xl border border-[#E5E7EB] py-3.5 text-[14px] font-semibold text-[#374151]"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white"
            >
              Accept Invite
            </button>
          </div>
        </div>
      )}

      {state === 'loading' && (
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-8 py-16">
          <Loader color="#02A36E" size="lg" />
          <Text fw={700} className="mt-6 text-[18px] text-[#0F172A]">Accepting invite...</Text>
          <Text fw={400} className="mt-1 text-[13px] text-[#6B7280]">Reserving your collateral</Text>
        </div>
      )}

      {state === 'success' && (
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-8 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
            <IconCircleCheck size={40} color="#02A36E" />
          </div>
          <Text fw={700} className="mt-6 text-center text-[22px] text-[#0F172A]">
            Request submitted!
          </Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-center text-[14px] leading-relaxed text-[#6B7280]">
            Your join request has been sent to the group admin. You'll be notified once they review it.
          </Text>
          <button
            onClick={() => navigate('/rosca')}
            className="mt-8 w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white"
          >
            Back to Groups
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-8 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]">
            <IconAlertTriangle size={40} color="#EF4444" />
          </div>
          <Text fw={700} className="mt-6 text-center text-[22px] text-[#0F172A]">
            Invite failed
          </Text>
          <Text fw={400} className="mt-2 max-w-[320px] text-center text-[14px] leading-relaxed text-[#6B7280]">
            {errorMessage || 'This invite may have expired, already been used, or was sent to a different email.'}
          </Text>
          <div className="mt-8 flex w-full gap-3">
            <button
              onClick={() => setState('confirm')}
              className="flex-1 cursor-pointer rounded-xl border border-[#E5E7EB] py-3.5 text-[14px] font-semibold text-[#374151]"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/rosca')}
              className="flex-1 cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white"
            >
              Back to Groups
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
