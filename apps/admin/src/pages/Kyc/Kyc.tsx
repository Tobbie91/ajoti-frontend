import { useState, useEffect } from 'react'
import { Text, TextInput, Progress, Alert, Loader } from '@mantine/core'
import {
  IconArrowLeft,
  IconCheck,
  IconUser,
  IconPhone,
  IconShieldCheck,
  IconAlertCircle,
  IconClock,
  IconExternalLink,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  proveInitiate,
  submitNok,
  getKycStatus,
  resubmitKyc,
  getUserProfile,
  type UserProfile,
} from '@/utils/api'

type KycPhase = 'loading' | 'flow' | 'prove-pending' | 'nok' | 'pending' | 'submitted'

const USER_APP_URL = import.meta.env.VITE_USER_APP_URL ?? 'https://user.ajoti.com'

const inputStyles = {
  input: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  label: { fontWeight: 500, fontSize: 14, color: '#374151', marginBottom: 4 },
}

export function Kyc() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<KycPhase>('loading')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Step 1 — NIN + BVN
  const [nin, setNin] = useState('')
  const [bvn, setBvn] = useState('')
  const [initiating, setInitiating] = useState(false)
  const [initiateError, setInitiateError] = useState<string | null>(null)

  // Step 2 — Next of Kin
  const [kinFullName, setKinFullName] = useState('')
  const [kinRelationship, setKinRelationship] = useState('')
  const [kinPhone, setKinPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [nokError, setNokError] = useState<string | null>(null)

  // Poll while waiting for Mono webhook to fire (prove-pending phase).
  // visibilitychange fires immediately when the user returns to the tab after completing the widget.
  useEffect(() => {
    if (phase !== 'prove-pending') return

    async function check() {
      if (document.hidden) return
      try {
        const kyc = await getKycStatus()
        if (kyc.step !== 'PROVE_PENDING') {
          if (kyc.kycLevel >= 1) {
            navigate('/dashboard', { replace: true })
          } else if (kyc.step === 'NOK_REQUIRED' || (kyc.ninVerified && kyc.bvnVerified)) {
            setPhase('nok')
          } else {
            setPhase('flow')
          }
        }
      } catch { /* ignore */ }
    }

    const id = setInterval(check, 10_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('status') === 'success') {
      sessionStorage.setItem('kyc_widget_opened', 'true')
      window.history.replaceState({}, '', '/kyc')
    }

    Promise.all([getKycStatus(), getUserProfile().catch(() => null)])
      .then(async ([kyc, profile]) => {
        if (profile) setUserProfile(profile)

        if (kyc.kycLevel >= 1) {
          navigate('/dashboard', { replace: true })
          return
        }
        if (kyc.status === 'REJECTED') {
          try { await resubmitKyc() } catch { /* ignore */ }
        }
        if (kyc.step === 'PROVE_PENDING') {
          // Only show pending screen if the widget was actually opened this session.
          // Without this, returning to /kyc after calling initiate (but before opening
          // the widget) incorrectly lands on the blocking pending screen.
          if (sessionStorage.getItem('kyc_widget_opened') === 'true') {
            setPhase('prove-pending')
          } else {
            setPhase('flow')
          }
          return
        }
        if (kyc.step === 'NOK_REQUIRED' || (kyc.ninVerified && kyc.bvnVerified)) {
          setPhase('nok')
          return
        }
        if (kyc.status === 'PENDING') {
          setPhase('pending')
          return
        }
        setPhase('flow')
      })
      .catch(() => setPhase('flow'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleProveInitiate() {
    setInitiateError(null)
    setInitiating(true)
    try {
      const p = userProfile
      const result = await proveInitiate({
        nin: nin.trim(),
        bvn: bvn.trim(),
        firstName: p?.firstName || '',
        lastName: p?.lastName || '',
        phone: (p?.phone as string) || '',
        ...(p?.email ? { email: p.email as string } : {}),
      })
      if (result.monoUrl) {
        sessionStorage.setItem('kyc_widget_opened', 'true')
        window.open(result.monoUrl, '_blank', 'noopener,noreferrer')
        setPhase('prove-pending')
      } else {
        setPhase('nok')
      }
    } catch (err) {
      setInitiateError(err instanceof Error ? err.message : 'Failed to start verification. Please try again.')
    } finally {
      setInitiating(false)
    }
  }

  async function handleSubmitNok() {
    setNokError(null)
    setSubmitting(true)
    try {
      await submitNok({
        nextOfKinName: kinFullName.trim(),
        nextOfKinRelationship: kinRelationship.trim(),
        nextOfKinPhone: kinPhone.trim(),
      })
      localStorage.setItem('admin_kyc_completed', 'true')
      setPhase('submitted')
    } catch (err) {
      setNokError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader color="#02A36E" size="md" />
      </div>
    )
  }

  // ── Pending superadmin approval ───────────────────────────────────────────
  if (phase === 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
        <div className="w-full max-w-[460px] rounded-3xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEF3C7]">
            <IconShieldCheck size={40} color="#D97706" stroke={1.5} />
          </div>
          <Text fw={700} className="text-[22px] text-[#0F172A]">Verification Submitted</Text>
          <Text fw={400} className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Your KYC documents are under review. You'll be notified once your admin account is approved.
          </Text>
          <a
            href={USER_APP_URL}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B6B55] py-3.5 text-[14px] font-semibold text-white no-underline hover:bg-[#095C49]"
          >
            Go to Member App <IconExternalLink size={16} />
          </a>
        </div>
      </div>
    )
  }

  // ── Submitted & auto-approved ─────────────────────────────────────────────
  if (phase === 'submitted') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
        <div className="w-full max-w-[460px] rounded-3xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F0FDF4]">
            <IconShieldCheck size={40} color="#02A36E" stroke={1.5} />
          </div>
          <Text fw={700} className="text-[22px] text-[#0F172A]">Identity Verified!</Text>
          <Text fw={400} className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Your identity has been verified (KYC Level 1). Your admin account is now pending review.
          </Text>
          <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4 text-left">
            <Text fw={600} className="text-[13px] text-[#0F172A]">What happens next?</Text>
            <ul className="mt-2 space-y-1.5 text-[13px] text-[#6B7280]">
              <li>• Our team will review and activate your admin account</li>
              <li>• You'll receive an email once your account is approved</li>
            </ul>
          </div>
          <a
            href={USER_APP_URL}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B6B55] py-3.5 text-[14px] font-semibold text-white no-underline hover:bg-[#095C49]"
          >
            Go to Member App <IconExternalLink size={16} />
          </a>
          <button
            onClick={() => navigate('/login')}
            className="mt-3 cursor-pointer text-[13px] text-[#6B7280] underline-offset-2 hover:underline"
          >
            Sign in to admin portal
          </button>
        </div>
      </div>
    )
  }

  // ── Prove pending ─────────────────────────────────────────────────────────
  if (phase === 'prove-pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
        <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
            <IconClock size={32} color="#3B82F6" />
          </div>
          <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">Verification in Progress</Text>
          <Text fw={400} className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]">
            Complete the identity check in the Mono window you just opened. This page will update
            automatically once your verification is confirmed.
          </Text>
          <Loader color="#02A36E" size="sm" className="mx-auto" />
          <Text fw={400} className="mt-4 text-[12px] text-[#9CA3AF]">
            Closed the window by mistake?{' '}
            <button onClick={() => { sessionStorage.removeItem('kyc_widget_opened'); setPhase('flow') }} className="cursor-pointer text-[#02A36E] underline">
              Restart
            </button>
          </Text>
        </div>
      </div>
    )
  }

  // ── NOK step ──────────────────────────────────────────────────────────────
  if (phase === 'nok') {
    const canSubmit = kinFullName.trim() && kinPhone.trim() && kinRelationship.trim()
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
            <div className="flex-1 text-center">
              <Text fw={700} className="text-[18px] text-[#0F172A]">Admin Identity Verification</Text>
              <Text fw={400} className="text-[13px] text-[#6B7280]">Step 2 of 2 — Next of Kin</Text>
            </div>
          </div>
          <div className="mx-auto max-w-[600px] px-6 pb-4">
            <Progress value={100} size="sm" radius="xl" color="#02A36E" />
          </div>
        </div>
        <div className="mx-auto max-w-[600px] px-6 py-8">
          {nokError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" className="mb-4" withCloseButton onClose={() => setNokError(null)}>
              {nokError}
            </Alert>
          )}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7]">
                <IconUser size={20} color="#D97706" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">Next of Kin</Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">Provide details of your next of kin</Text>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <TextInput label="Full Name" placeholder="Enter next of kin's full name" radius="md" value={kinFullName} onChange={(e) => setKinFullName(e.currentTarget.value)} styles={inputStyles} required />
              <TextInput label="Relationship" placeholder="e.g. Spouse, Parent, Sibling" radius="md" value={kinRelationship} onChange={(e) => setKinRelationship(e.currentTarget.value)} styles={inputStyles} required />
              <TextInput label="Phone Number" placeholder="+234 800 000 0000" radius="md" value={kinPhone} onChange={(e) => setKinPhone(e.currentTarget.value)} styles={inputStyles} leftSection={<IconPhone size={16} color="#9CA3AF" />} required />
            </div>
          </div>
          <button
            onClick={handleSubmitNok}
            disabled={!canSubmit || submitting}
            className={`mt-6 w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${canSubmit && !submitting ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]' : 'cursor-not-allowed bg-[#9CA3AF]'}`}
          >
            {submitting ? 'Submitting...' : 'Submit & Complete KYC'}
          </button>
        </div>
      </div>
    )
  }

  // ── Main flow: NIN + BVN ──────────────────────────────────────────────────
  const canInitiate = nin.length === 11 && bvn.length === 11

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">Admin Identity Verification</Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">Step 1 of 2 — Identity</Text>
          </div>
        </div>
        <div className="mx-auto max-w-[600px] px-6 pb-4">
          <Progress value={50} size="sm" radius="xl" color="#02A36E" />
        </div>
      </div>

      <div className="mx-auto max-w-[600px] px-6 py-8">
        <div className="mb-6 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4">
          <Text fw={600} className="text-[13px] text-[#065F46]">KYC is required to activate your admin account</Text>
          <Text fw={400} className="mt-1 text-[12px] text-[#6B7280]">
            Complete identity verification to gain access to the admin dashboard.
          </Text>
        </div>

        {initiateError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" className="mb-4" withCloseButton onClose={() => setInitiateError(null)}>
            {initiateError}
          </Alert>
        )}

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
              <IconShieldCheck size={20} color="#3B82F6" />
            </div>
            <div>
              <Text fw={700} className="text-[16px] text-[#0F172A]">Verify Your Identity</Text>
              <Text fw={400} className="text-[13px] text-[#6B7280]">Enter your NIN and BVN to begin</Text>
            </div>
          </div>

          <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
            <Text fw={400} className="text-[13px] leading-[1.6] text-[#1E40AF]">
              After submitting, a secure Mono identity verification window will open. Complete the
              short liveness check there — it takes under a minute.
            </Text>
          </div>

          <TextInput
            label="National Identification Number (NIN)"
            placeholder="11-digit NIN"
            radius="md"
            value={nin}
            onChange={(e) => setNin(e.currentTarget.value.replace(/\D/g, '').slice(0, 11))}
            styles={inputStyles}
            maxLength={11}
            required
            rightSection={nin.length === 11 ? <IconCheck size={16} color="#02A36E" /> : null}
          />

          <TextInput
            label="Bank Verification Number (BVN)"
            placeholder="11-digit BVN"
            radius="md"
            value={bvn}
            onChange={(e) => setBvn(e.currentTarget.value.replace(/\D/g, '').slice(0, 11))}
            styles={inputStyles}
            maxLength={11}
            required
            rightSection={bvn.length === 11 ? <IconCheck size={16} color="#02A36E" /> : null}
          />

          <div className="rounded-xl bg-[#F9FAFB] p-4 flex flex-col gap-1">
            <Text fw={500} className="text-[12px] text-[#374151]">Where to find these?</Text>
            <Text fw={400} className="text-[12px] leading-[1.6] text-[#6B7280]">
              <strong>NIN:</strong> on your National ID card or dial *346#
            </Text>
            <Text fw={400} className="text-[12px] leading-[1.6] text-[#6B7280]">
              <strong>BVN:</strong> dial *565*0# or check your bank app
            </Text>
          </div>

          <button
            onClick={handleProveInitiate}
            disabled={!canInitiate || initiating}
            className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${canInitiate && !initiating ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]' : 'cursor-not-allowed bg-[#9CA3AF]'}`}
          >
            {initiating ? 'Opening verification...' : 'Start Identity Check'}
          </button>
        </div>

        {/* Step indicators */}
        <div className="mt-8 flex items-center justify-center gap-12">
          {['Identity', 'Next of Kin'].map((label, i) => {
            const isDone = false
            const isActive = i === 0
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold ${isDone ? 'bg-[#02A36E] text-white' : isActive ? 'border-2 border-[#02A36E] bg-[#F0FDF4] text-[#02A36E]' : 'border-2 border-[#E5E7EB] bg-white text-[#9CA3AF]'}`}>
                  {isDone ? <IconCheck size={16} /> : i + 1}
                </div>
                <Text fw={isActive ? 600 : 400} className={`text-[10px] ${isActive ? 'text-[#02A36E]' : 'text-[#9CA3AF]'}`}>
                  {label}
                </Text>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
