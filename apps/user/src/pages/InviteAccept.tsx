import { useState, useEffect } from 'react'
import { Text, Loader } from '@mantine/core'
import { IconArrowLeft, IconUsers, IconCircleCheck, IconAlertTriangle, IconClock } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getInvitePreview, joinByInvite } from '@/utils/api'
import type { InvitePreview } from '@/utils/api'

type PageState = 'loading-preview' | 'confirm' | 'submitting' | 'success' | 'error'

const PRIMARY = '#02A36E'

function formatNaira(kobo: string | number) {
  return `₦${(Number(kobo) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

function formatFreq(f: string) {
  return f.charAt(0) + f.slice(1).toLowerCase()
}

export function InviteAccept() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<PageState>('loading-preview')
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    const isLoggedIn = Boolean(localStorage.getItem('access_token'))
    if (!isLoggedIn && token) {
      localStorage.setItem('pending_redirect', `/rosca/invite/${token}`)
      navigate('/login', { replace: true })
      return
    }
    if (!token) return
    getInvitePreview(token)
      .then((data) => {
        setPreview(data)
        setState('confirm')
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'This invite is invalid or has expired.')
        setState('error')
      })
  }, [token, navigate])

  async function handleAccept() {
    if (!token) return
    setState('submitting')
    try {
      await joinByInvite(token)
      setState('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  const expiresAt = preview ? new Date(preview.expiresAt) : null
  const expiryStr = expiresAt
    ? expiresAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="mx-auto w-full max-w-[480px] px-6 py-12">
      <button
        onClick={() => navigate('/rosca')}
        className="mb-6 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
      >
        <IconArrowLeft size={18} color="#374151" />
      </button>

      {state === 'loading-preview' && (
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-8 py-16">
          <Loader color={PRIMARY} size="lg" />
          <Text fw={500} className="mt-4 text-[14px] text-[#6B7280]">Loading invite details…</Text>
        </div>
      )}

      {state === 'confirm' && preview && (
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-8 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
            <IconUsers size={36} color={PRIMARY} />
          </div>

          <Text fw={700} className="mt-6 text-center text-[22px] text-[#0F172A]">
            You've been invited!
          </Text>
          <Text fw={400} className="mt-1 text-center text-[13px] text-[#6B7280]">
            <span className="font-semibold text-[#0F172A]">{preview.circle.adminName}</span> invited you to join their savings circle
          </Text>

          {/* Circle detail card */}
          <div className="mt-6 w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4">
            <Text fw={700} className="text-[17px] text-[#0F172A]">{preview.circle.name}</Text>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Text fz={13} c="dimmed">Contribution</Text>
                <Text fz={13} fw={600} style={{ color: PRIMARY }}>{formatNaira(preview.circle.contributionAmount)}</Text>
              </div>
              <div className="flex items-center justify-between">
                <Text fz={13} c="dimmed">Frequency</Text>
                <Text fz={13} fw={500}>{formatFreq(preview.circle.frequency)}</Text>
              </div>
              <div className="flex items-center justify-between">
                <Text fz={13} c="dimmed">Duration</Text>
                <Text fz={13} fw={500}>{preview.circle.durationCycles} cycles</Text>
              </div>
              <div className="flex items-center justify-between">
                <Text fz={13} c="dimmed">Slots</Text>
                <Text fz={13} fw={500}>{preview.circle.filledSlots} / {preview.circle.maxSlots} filled</Text>
              </div>
            </div>
          </div>

          {/* Expiry notice */}
          <div className="mt-3 flex w-full items-center gap-2 rounded-lg bg-[#FFFBEB] px-4 py-2.5">
            <IconClock size={14} color="#F59E0B" style={{ flexShrink: 0 }} />
            <Text fz={12} style={{ color: '#92400E' }}>Invite expires on <strong>{expiryStr}</strong></Text>
          </div>

          {/* Before you accept */}
          <div className="mt-4 w-full rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-5 py-4">
            <Text fw={600} className="text-[13px] text-[#92400E]">Before you accept</Text>
            <ul className="mt-2 flex flex-col gap-1.5">
              {[
                'A collateral amount will be reserved from your wallet',
                'This invite link is single-use and personal to you',
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
              className="flex-1 cursor-pointer rounded-xl py-3.5 text-[14px] font-semibold text-white"
              style={{ background: PRIMARY }}
            >
              Accept Invite
            </button>
          </div>
        </div>
      )}

      {state === 'submitting' && (
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-8 py-16">
          <Loader color={PRIMARY} size="lg" />
          <Text fw={700} className="mt-6 text-[18px] text-[#0F172A]">Accepting invite…</Text>
          <Text fw={400} className="mt-1 text-[13px] text-[#6B7280]">Reserving your collateral</Text>
        </div>
      )}

      {state === 'success' && (
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-8 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
            <IconCircleCheck size={40} color={PRIMARY} />
          </div>
          <Text fw={700} className="mt-6 text-center text-[22px] text-[#0F172A]">
            You've joined!
          </Text>
          {preview && (
            <Text fw={400} className="mt-2 text-center text-[14px] text-[#6B7280]">
              You're now a member of <span className="font-semibold text-[#0F172A]">{preview.circle.name}</span>.
            </Text>
          )}
          <Text fw={400} className="mt-1 max-w-[300px] text-center text-[13px] text-[#9CA3AF]">
            Your collateral has been reserved. You'll be notified once the circle starts.
          </Text>
          <button
            onClick={() => navigate('/rosca')}
            className="mt-8 w-full cursor-pointer rounded-xl py-3.5 text-[14px] font-semibold text-white"
            style={{ background: PRIMARY }}
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
              className="flex-1 cursor-pointer rounded-xl py-3.5 text-[14px] font-semibold text-white"
              style={{ background: PRIMARY }}
            >
              Back to Groups
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
