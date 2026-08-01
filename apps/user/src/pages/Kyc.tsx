import { useState, useEffect } from 'react'
import { Text, TextInput, Progress, Alert, Loader, Badge, Checkbox } from '@mantine/core'
import {
  IconArrowLeft,
  IconCheck,
  IconUser,
  IconPhone,
  IconShieldCheck,
  IconAlertCircle,
  IconLock,
  IconArrowRight,
  IconClock,
  IconFingerprint,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  proveInitiate,
  submitNok,
  getKycStatus,
  resubmitKyc,
  type KycStatus,
} from '@/utils/api'
import { PhoneInputField } from '@/components'

// ── Types ─────────────────────────────────────────────────────────────────────

type OnboardingStep = 1 | 2   // Prove (NIN+BVN) → NOK

type PageView =
  | 'loading'
  | 'onboarding'       // Level 0: Prove widget → NOK flow
  | 'prove-pending'    // Mono widget opened, waiting for webhook (any level)
  | 'onboarding-done'  // Just completed Level 1 (auto-approved)
  | 'upgrade-l2'       // Level 1 approved, ready to upgrade
  | 'pending-l2'       // Level 2 under superadmin review
  | 'rejected-l2'      // Level 2 rejected
  | 'upgrade-l3'       // Level 2 approved, ready to upgrade
  | 'pending-l3'       // Level 3 under superadmin review
  | 'rejected-l3'      // Level 3 rejected
  | 'fully-verified'   // Level 3 approved

const PROVE_PENDING_STEPS = new Set(['PROVE_PENDING', 'PROVE_PENDING_L2', 'PROVE_PENDING_L3'])

function resolveView(kyc: KycStatus | null): PageView {
  if (!kyc) return 'onboarding'
  const { kycLevel, status, step } = kyc

  if (kycLevel === 0) {
    if (step && PROVE_PENDING_STEPS.has(step)) return 'prove-pending'
    return 'onboarding'
  }

  if (kycLevel >= 3) return 'fully-verified'

  if (kycLevel === 2) {
    if (step && PROVE_PENDING_STEPS.has(step)) return 'prove-pending'
    if (step === 'PROOF_OF_ADDRESS_REQUIRED' && status === 'REJECTED') return 'rejected-l3'
    if (step === 'PROOF_OF_ADDRESS_REQUIRED') return 'pending-l3'
    return 'upgrade-l3'
  }

  // kycLevel === 1
  if (step && PROVE_PENDING_STEPS.has(step)) return 'prove-pending'
  if (step === 'PHOTO_REQUIRED' && status === 'REJECTED') return 'rejected-l2'
  if (step === 'PHOTO_REQUIRED') return 'pending-l2'
  return 'upgrade-l2'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyles = {
  input: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  label: { fontWeight: 500, fontSize: 14, color: '#374151', marginBottom: 4 },
}

// ── Level badge ───────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: number }) {
  const colors = ['gray', 'teal', 'blue', 'green']
  const labels = ['Unverified', 'Level 1', 'Level 2', 'Level 3']
  return (
    <Badge color={colors[level] ?? 'gray'} variant="filled" size="md">
      {labels[level] ?? `Level ${level}`}
    </Badge>
  )
}

function LimitCard({ level }: { level: number }) {
  const limits: Record<number, { single: string; daily: string }> = {
    0: { single: '₦0', daily: '₦0' },
    1: { single: '₦50,000', daily: '₦300,000' },
    2: { single: '₦100,000', daily: '₦500,000' },
    3: { single: '₦5,000,000', daily: '₦25,000,000' },
  }
  const l = limits[level] ?? limits[0]
  return (
    <div className="rounded-xl bg-[#F9FAFB] p-4">
      <div className="flex items-center gap-2 mb-3">
        <LevelBadge level={level} />
        <Text fw={500} className="text-[13px] text-[#6B7280]">— Your current KYC tier</Text>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Text fw={400} className="text-[11px] text-[#9CA3AF]">Single transaction limit</Text>
          <Text fw={700} className="text-[15px] text-[#0F172A]">{l.single}</Text>
        </div>
        <div>
          <Text fw={400} className="text-[11px] text-[#9CA3AF]">Daily limit</Text>
          <Text fw={700} className="text-[15px] text-[#0F172A]">{l.daily}</Text>
        </div>
      </div>
    </div>
  )
}

// ── Mono verification result card ────────────────────────────────────────────

function VerificationDataCard({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null

  // Mono stores the full webhook body: { event, data: { customer, kyc_level, ... } }
  const inner = (data.data ?? data) as Record<string, any>
  const customer = inner?.customer as Record<string, any> | undefined
  const name: string | undefined = customer?.name
  const phone: string | undefined = customer?.phone
  const identityType: string | undefined = customer?.identity?.type?.toUpperCase()
  const tier: string | undefined = (inner?.kyc_level as string)?.replace('_', ' ')
  const verifiedAt: string | undefined = inner?.updated_at ?? inner?.created_at ?? inner?.verified_at

  const rows: { label: string; value: string }[] = [
    ...(name ? [{ label: 'Verified Name', value: name }] : []),
    ...(phone ? [{ label: 'Phone', value: phone }] : []),
    ...(identityType ? [{ label: 'Identity Type', value: identityType }] : []),
    ...(tier ? [{ label: 'KYC Tier', value: tier.charAt(0).toUpperCase() + tier.slice(1) }] : []),
    ...(verifiedAt ? [{ label: 'Verified At', value: new Date(verifiedAt).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }] : []),
  ]

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4 text-left">
      <div className="flex items-center gap-2 mb-3">
        <IconFingerprint size={16} color="#02A36E" />
        <Text fw={600} className="text-[13px] text-[#065F46]">Verified by Mono</Text>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <Text fw={400} className="text-[11px] text-[#6B7280]">{label}</Text>
            <Text fw={600} className="text-[13px] text-[#0F172A]">{value}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pending review screen ─────────────────────────────────────────────────────

function PendingReviewScreen({
  forLevel,
  onRefresh,
  verificationData,
}: {
  forLevel: 2 | 3
  onRefresh: () => void
  verificationData?: Record<string, unknown> | null
}) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-[480px]">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
        >
          <IconArrowLeft size={18} />
          Back
        </button>
      </div>
      <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3C7]">
          <IconClock size={32} color="#D97706" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">Under Review</Text>
        <Text fw={400} className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]">
          Your Level {forLevel} verification has been submitted and is currently being reviewed by our
          compliance team. This typically takes 24–48 hours.
        </Text>
        <LimitCard level={forLevel - 1} />
        <VerificationDataCard data={verificationData} />
        <Text fw={400} className="mt-4 text-[13px] text-[#9CA3AF]">
          You can continue using the app with your current Level {forLevel - 1} limits while we
          complete the review.
        </Text>
        <button
          onClick={onRefresh}
          className="mt-6 w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
        >
          Check Status
        </button>
      </div>
    </div>
  )
}

// ── Fully verified screen ────────────────────────────────────────────────────

function FullyVerifiedScreen() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-[480px]">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
        >
          <IconArrowLeft size={18} />
          Back
        </button>
      </div>
      <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
          <IconShieldCheck size={32} color="#02A36E" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">Fully Verified</Text>
        <Text fw={400} className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]">
          Your identity has been fully verified at Level 3. You have access to the highest
          transaction limits on Ajoti.
        </Text>
        <LimitCard level={3} />
        <button
          onClick={() => navigate('/home')}
          className="mt-6 w-full cursor-pointer rounded-xl bg-[#02A36E] px-6 py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
        >
          Go to Home
        </button>
      </div>
    </div>
  )
}

// ── Upgrade section (Level 2 or Level 3 via Mono Prove) ──────────────────────

function UpgradeSection({
  targetLevel,
  rejectionReason,
  onProvePending,
}: {
  targetLevel: 2 | 3
  rejectionReason?: string | null
  onProvePending: () => void
}) {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  if (targetLevel === 3) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <IconLock size={16} color="#9CA3AF" />
          <Text fw={600} className="text-[14px] text-[#374151]">
            Level 3 verification unavailable
          </Text>
        </div>
        <Text fw={400} className="text-[13px] leading-[1.6] text-[#6B7280]">
          Level 3 identity verification isn't available right now. Your Level 2 limits stay in
          effect in the meantime.
        </Text>
      </div>
    )
  }

  const nextLimits = targetLevel === 2
    ? { single: '₦100,000', daily: '₦500,000' }
    : { single: '₦5,000,000', daily: '₦25,000,000' }

  const docDescription = targetLevel === 2
    ? 'government-issued photo ID and a short liveness check'
    : 'proof of address document and a liveness check'

  async function handleStart() {
    setError(null)
    setStarting(true)
    try {
      // No payload needed — backend reads NIN/BVN from DB for level upgrades
      const result = await proveInitiate({})

      if (result.monoUrl) {
        sessionStorage.setItem('kyc_widget_opened', 'true')
        window.open(result.monoUrl, '_blank', 'noopener,noreferrer')
        onProvePending()
      } else {
        // Test bypass — skip widget
        onProvePending()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {rejectionReason && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" title="Previous verification rejected">
          {rejectionReason}. Please start the verification again.
        </Alert>
      )}

      {/* Info card */}
      <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
        <div className="flex items-center gap-2 mb-2">
          <IconLock size={16} color="#2563EB" />
          <Text fw={600} className="text-[14px] text-[#1E40AF]">
            Upgrade to Level {targetLevel}
          </Text>
        </div>
        <Text fw={400} className="mb-3 text-[13px] leading-[1.6] text-[#3B82F6]">
          After approval your limits increase to{' '}
          <strong>{nextLimits.single}</strong> per transaction and{' '}
          <strong>{nextLimits.daily}</strong> daily.
        </Text>
        <div className="flex items-center gap-1 text-[12px] text-[#3B82F6]">
          <IconClock size={14} />
          <span>Review typically takes 24–48 hours</span>
        </div>
      </div>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-4">
        <Text fw={400} className="text-[14px] leading-[1.6] text-[#6B7280]">
          To upgrade to Level {targetLevel}, you'll complete a quick identity verification powered
          by Mono. You'll need your {docDescription}.
        </Text>
        <Text fw={400} className="text-[13px] leading-[1.6] text-[#9CA3AF]">
          The verification widget will open in a new tab. Return to this page after completing it —
          your status will update automatically.
        </Text>

        <Checkbox
          checked={confirmed}
          onChange={(e) => setConfirmed(e.currentTarget.checked)}
          label={
            <Text fw={400} className="text-[12px] leading-normal text-[#374151]">
              I'm ready to complete this now — I understand starting the check can't be
              refunded if I don't finish it.
            </Text>
          }
          styles={{ input: { borderColor: '#D1D5DB' } }}
        />

        <button
          onClick={handleStart}
          disabled={starting || !confirmed}
          className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
            !starting && confirmed
              ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
              : 'cursor-not-allowed bg-[#9CA3AF]'
          }`}
        >
          {starting ? 'Opening verification...' : `Start Level ${targetLevel} Verification`}
        </button>
      </div>
    </div>
  )
}

// ── Prove pending screen ─────────────────────────────────────────────────────
// Shown after user opens Mono widget (any level). Polls until step leaves PROVE_PENDING*.

function ProvePendingScreen({
  onVerified,
  onRestart,
}: {
  onVerified: () => void
  onRestart: () => void
}) {
  const navigate = useNavigate()

  useEffect(() => {
    async function check() {
      if (document.hidden) return
      try {
        const kyc = await getKycStatus()
        if (!kyc.step || !PROVE_PENDING_STEPS.has(kyc.step)) {
          onVerified()
        }
      } catch { /* ignore */ }
    }

    const id = setInterval(check, 10_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [onVerified])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-[480px]">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
        >
          <IconArrowLeft size={18} />
          Back
        </button>
      </div>
      <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
          <IconClock size={32} color="#3B82F6" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">Verification in Progress</Text>
        <Text fw={400} className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]">
          Complete the identity check in the Mono window you just opened. This page will
          update automatically once your verification is confirmed.
        </Text>
        <Loader color="#02A36E" size="sm" className="mx-auto" />
        <Text fw={400} className="mt-4 text-[12px] text-[#9CA3AF]">
          Closed the window by mistake?{' '}
          <button
            onClick={onRestart}
            className="cursor-pointer text-[#02A36E] underline"
          >
            Refresh to restart
          </button>
        </Text>
      </div>
    </div>
  )
}

// ── Onboarding flow (Level 0 → 1) ─────────────────────────────────────────────

const ONBOARDING_LABELS = ['Identity', 'Next of Kin']

function OnboardingFlow({
  rejectionReason,
  onComplete,
  onProvePending,
  identityVerified = false,
}: {
  rejectionReason?: string | null
  onComplete: () => void
  onProvePending: () => void
  identityVerified?: boolean
}) {
  const navigate = useNavigate()
  const [step, setStep] = useState<OnboardingStep>(identityVerified ? 2 : 1)

  const [nin, setNin] = useState('')
  const [bvn, setBvn] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [initiating, setInitiating] = useState(false)

  const [kinFullName, setKinFullName] = useState('')
  const [kinRelationship, setKinRelationship] = useState('')
  const [kinPhone, setKinPhone] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const storedUser = localStorage.getItem('user')
  const userProfile = storedUser ? JSON.parse(storedUser) : null

  const progressValue = (step / 2) * 100

  function canProceed() {
    if (step === 1) return nin.length === 11 && bvn.length === 11 && confirmed
    return kinFullName.trim() !== '' && kinPhone.replace(/\D/g, '').length >= 9 && kinRelationship.trim() !== ''
  }

  async function handleProveInitiate() {
    setError(null)
    setInitiating(true)
    try {
      const p = userProfile ?? {}
      const result = await proveInitiate({
        nin: nin.trim(),
        bvn: bvn.trim(),
        firstName: p.firstName || p.firstname || '',
        lastName: p.lastName || p.lastname || '',
        phone: p.phone || p.phoneNumber || '',
        ...(p.email ? { email: p.email } : {}),
      })

      if (result.monoUrl) {
        sessionStorage.setItem('kyc_widget_opened', 'true')
        window.open(result.monoUrl, '_blank', 'noopener,noreferrer')
        onProvePending()
      } else {
        // Test bypass — already verified, go straight to NOK
        setStep(2)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification. Please try again.')
    } finally {
      setInitiating(false)
    }
  }

  async function handleSubmitNok() {
    setError(null)
    setSubmitting(true)
    try {
      await submitNok({
        nextOfKinName: kinFullName.trim(),
        nextOfKinRelationship: kinRelationship.trim(),
        nextOfKinPhone: kinPhone.trim(),
      })
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as OnboardingStep) : navigate(-1)}
            className="flex cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2 hover:bg-[#F9FAFB]"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">Identity Verification</Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              Step {step} of 2 — {ONBOARDING_LABELS[step - 1]}
            </Text>
          </div>
          <div className="w-[34px]" />
        </div>
        <div className="mx-auto max-w-[600px] px-6 pb-4">
          <Progress value={progressValue} size="sm" radius="xl" color="#02A36E" />
        </div>
      </div>

      <div className="mx-auto max-w-[600px] px-6 py-8">
        {rejectionReason && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" mb="lg" title="Previous submission was rejected">
            {rejectionReason}
          </Alert>
        )}

        <div className="mb-8 flex items-center justify-center gap-12">
          {ONBOARDING_LABELS.map((label, i) => {
            const n = i + 1
            const isActive = n === step
            const isDone = n < step
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold ${
                  isDone
                    ? 'bg-[#02A36E] text-white'
                    : isActive
                      ? 'border-2 border-[#02A36E] bg-[#F0FDF4] text-[#02A36E]'
                      : 'border-2 border-[#E5E7EB] bg-white text-[#9CA3AF]'
                }`}>
                  {isDone ? <IconCheck size={16} /> : n}
                </div>
                <Text fw={isActive ? 600 : 400} className={`text-[10px] ${isActive ? 'text-[#02A36E]' : 'text-[#9CA3AF]'}`}>
                  {label}
                </Text>
              </div>
            )
          })}
        </div>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" className="mb-4" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {step === 1 && (
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

            <Checkbox
              checked={confirmed}
              onChange={(e) => setConfirmed(e.currentTarget.checked)}
              label={
                <Text fw={400} className="text-[12px] leading-normal text-[#374151]">
                  I'm ready to complete this now — I understand starting the check can't be
                  refunded if I don't finish it.
                </Text>
              }
              styles={{ input: { borderColor: '#D1D5DB' } }}
            />

            <button
              onClick={handleProveInitiate}
              disabled={!canProceed() || initiating}
              className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
                canProceed() && !initiating
                  ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                  : 'cursor-not-allowed bg-[#9CA3AF]'
              }`}
            >
              {initiating ? 'Opening verification...' : 'Start Identity Check'}
            </button>
          </div>
        )}

        {step === 2 && (
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
              <PhoneInputField value={kinPhone} onChange={setKinPhone} label="Phone Number" required styles={inputStyles} />
            </div>

            <button
              onClick={handleSubmitNok}
              disabled={!canProceed() || submitting}
              className={`mt-6 w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
                canProceed() && !submitting
                  ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                  : 'cursor-not-allowed bg-[#9CA3AF]'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit & Complete Level 1'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Onboarding done (Level 1 just approved) ──────────────────────────────────

function OnboardingDoneScreen({ onContinue, verificationData }: { onContinue: () => void; verificationData?: Record<string, unknown> | null }) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-[480px]">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
        >
          <IconArrowLeft size={18} />
          Back
        </button>
      </div>
      <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
          <IconShieldCheck size={32} color="#02A36E" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">Level 1 Verified!</Text>
        <Text fw={400} className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]">
          Your basic identity has been verified. You can now send and receive money on Ajoti.
        </Text>
        <LimitCard level={1} />
        <VerificationDataCard data={verificationData} />
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#02A36E] px-6 py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Upgrade to Level 2
            <IconArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/home')}
            className="w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Upgrade page (Level 2 or Level 3) ────────────────────────────────────────

function UpgradePage({
  kycLevel,
  rejectionReason,
  onProvePending,
}: {
  kycLevel: number
  rejectionReason?: string | null
  onProvePending: () => void
}) {
  const navigate = useNavigate()
  const targetLevel = (kycLevel + 1) as 2 | 3

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
          <button
            onClick={() => navigate('/home')}
            className="flex cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2 hover:bg-[#F9FAFB]"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">KYC Upgrade</Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">Increase your transaction limits</Text>
          </div>
          <div className="w-[34px]" />
        </div>
      </div>

      <div className="mx-auto max-w-[600px] px-6 py-8 flex flex-col gap-5">
        <LimitCard level={kycLevel} />
        <UpgradeSection
          targetLevel={targetLevel}
          rejectionReason={rejectionReason}
          onProvePending={onProvePending}
        />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Kyc() {
  const [view, setView] = useState<PageView>('loading')
  const [kycData, setKycData] = useState<KycStatus | null>(null)

  async function loadStatus() {
    try {
      const kyc = await getKycStatus()
      setKycData(kyc)
      if (kyc.kycLevel === 0 && kyc.status === 'REJECTED') {
        try { await resubmitKyc() } catch { /* ignore */ }
        setView('onboarding')
        return
      }
      const resolved = resolveView(kyc)
      // Only show the pending screen if the widget was actually opened this session.
      // Without this, navigating back to /kyc after calling initiate (but before opening
      // the widget) lands on the blocking pending screen instead of the form.
      if (resolved === 'prove-pending' && sessionStorage.getItem('kyc_widget_opened') !== 'true') {
        setView(kyc.kycLevel === 0 ? 'onboarding' : kyc.kycLevel === 1 ? 'upgrade-l2' : 'upgrade-l3')
        return
      }
      setView(resolved)
    } catch {
      setView('onboarding')
    }
  }

  useEffect(() => {
    // Mono redirects back to /kyc?status=success&reason=... after widget completion.
    // This can land in a new tab (since we open the widget with window.open), so
    // sessionStorage won't carry the flag from the original tab. Set it here so
    // loadStatus() correctly shows the pending screen instead of the form.
    const params = new URLSearchParams(window.location.search)
    if (params.get('status') === 'success') {
      sessionStorage.setItem('kyc_widget_opened', 'true')
      window.history.replaceState({}, '', '/kyc')
    }
    loadStatus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (view === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader color="#02A36E" size="md" />
      </div>
    )
  }

  if (view === 'prove-pending') {
    const isUpgrade = (kycData?.kycLevel ?? 0) >= 1

    async function handleRestart() {
      sessionStorage.removeItem('kyc_widget_opened')
      if (!isUpgrade) {
        // Level 0: go back to onboarding form so user can re-enter NIN/BVN
        setView('onboarding')
        return
      }
      // Level upgrade: re-call initiate and reopen the widget
      try {
        const result = await proveInitiate({})
        if (result.monoUrl) {
          sessionStorage.setItem('kyc_widget_opened', 'true')
          window.open(result.monoUrl, '_blank', 'noopener,noreferrer')
        }
      } catch { /* ignore, stay on pending */ }
    }

    return (
      <ProvePendingScreen
        onVerified={() => { sessionStorage.removeItem('kyc_widget_opened'); loadStatus() }}
        onRestart={handleRestart}
      />
    )
  }

  if (view === 'onboarding') {
    return (
      <OnboardingFlow
        rejectionReason={kycData?.kycLevel === 0 ? (kycData.rejectionReason ?? null) : null}
        onComplete={() => setView('onboarding-done')}
        onProvePending={() => setView('prove-pending')}
        identityVerified={(kycData?.ninVerified && kycData?.bvnVerified) ?? false}
      />
    )
  }

  if (view === 'onboarding-done') {
    return <OnboardingDoneScreen onContinue={() => setView('upgrade-l2')} verificationData={kycData?.verificationData} />
  }

  if (view === 'pending-l2') {
    return <PendingReviewScreen forLevel={2} onRefresh={loadStatus} verificationData={kycData?.verificationData} />
  }

  if (view === 'pending-l3') {
    return <PendingReviewScreen forLevel={3} onRefresh={loadStatus} verificationData={kycData?.verificationData} />
  }

  if (view === 'fully-verified') {
    return <FullyVerifiedScreen />
  }

  // upgrade-l2, upgrade-l3, rejected-l2, rejected-l3
  const kycLevel = kycData?.kycLevel ?? 1
  const rejectionReason =
    (view === 'rejected-l2' || view === 'rejected-l3') ? (kycData?.rejectionReason ?? null) : null

  return (
    <UpgradePage
      kycLevel={kycLevel}
      rejectionReason={rejectionReason}
      onProvePending={() => setView('prove-pending')}
    />
  )
}
