import { useState, useEffect } from 'react'
import { Text, TextInput, Progress, Alert, Loader, Badge } from '@mantine/core'
import {
  IconArrowLeft,
  IconCheck,
  IconUser,
  IconPhone,
  IconShieldCheck,
  IconAlertCircle,
  IconClock,
  IconExternalLink,
  IconLock,
  IconFingerprint,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  proveInitiate,
  submitNok,
  getKycStatus,
  resubmitKyc,
  getUserProfile,
  type UserProfile,
  type KycStatus,
} from '@/utils/api'

type KycPhase =
  | 'loading'
  | 'flow'
  | 'prove-pending'
  | 'nok'
  | 'pending'
  | 'submitted'
  | 'upgrade-l2'
  | 'pending-l2'
  | 'rejected-l2'
  | 'upgrade-l3'
  | 'pending-l3'
  | 'rejected-l3'
  | 'fully-verified'

const USER_APP_URL = import.meta.env.VITE_USER_APP_URL ?? 'https://user.ajoti.com'

const PROVE_PENDING_STEPS = new Set(['PROVE_PENDING', 'PROVE_PENDING_L2', 'PROVE_PENDING_L3'])

const inputStyles = {
  input: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  label: { fontWeight: 500, fontSize: 14, color: '#374151', marginBottom: 4 },
}

// Resolves the KYC record into a phase once Level 1 (admin onboarding) is done.
// Only covers levels 1-3 — the L0 onboarding phases (flow/nok/pending/submitted)
// are driven by the main component's own state machine, not this resolver.
function resolveUpgradePhase(kyc: KycStatus): KycPhase {
  if (kyc.kycLevel >= 3) return 'fully-verified'

  if (kyc.kycLevel === 2) {
    if (kyc.step && PROVE_PENDING_STEPS.has(kyc.step)) return 'prove-pending'
    if (kyc.step === 'PROOF_OF_ADDRESS_REQUIRED' && kyc.status === 'REJECTED') return 'rejected-l3'
    if (kyc.step === 'PROOF_OF_ADDRESS_REQUIRED') return 'pending-l3'
    return 'upgrade-l3'
  }

  // kycLevel === 1
  if (kyc.step && PROVE_PENDING_STEPS.has(kyc.step)) return 'prove-pending'
  if (kyc.step === 'PHOTO_REQUIRED' && kyc.status === 'REJECTED') return 'rejected-l2'
  if (kyc.step === 'PHOTO_REQUIRED') return 'pending-l2'
  return 'upgrade-l2'
}

// ── Level badge & limits (shared across upgrade views) ───────────────────────

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
      <div className="mb-3 flex items-center gap-2">
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

function VerificationDataCard({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null

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
      <div className="mb-3 flex items-center gap-2">
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
        <button onClick={() => navigate(-1)} className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
          <IconArrowLeft size={18} /> Back
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
        <button onClick={onRefresh} className="mt-6 w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]">
          Check Status
        </button>
      </div>
    </div>
  )
}

function FullyVerifiedScreen() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-[480px]">
        <button onClick={() => navigate(-1)} className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]">
          <IconArrowLeft size={18} /> Back
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
        <button onClick={() => navigate('/dashboard')} className="mt-6 w-full cursor-pointer rounded-xl bg-[#02A36E] px-6 py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]">
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

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

      <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
        <div className="mb-2 flex items-center gap-2">
          <IconLock size={16} color="#2563EB" />
          <Text fw={600} className="text-[14px] text-[#1E40AF]">Upgrade to Level {targetLevel}</Text>
        </div>
        <Text fw={400} className="mb-3 text-[13px] leading-[1.6] text-[#3B82F6]">
          After approval your limits increase to <strong>{nextLimits.single}</strong> per transaction and{' '}
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

      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={400} className="text-[14px] leading-[1.6] text-[#6B7280]">
          To upgrade to Level {targetLevel}, you'll complete a quick identity verification powered
          by Mono. You'll need your {docDescription}.
        </Text>
        <Text fw={400} className="text-[13px] leading-[1.6] text-[#9CA3AF]">
          The verification widget will open in a new tab. Return to this page after completing it —
          your status will update automatically.
        </Text>
        <button
          onClick={handleStart}
          disabled={starting}
          className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${!starting ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]' : 'cursor-not-allowed bg-[#9CA3AF]'}`}
        >
          {starting ? 'Opening verification...' : `Start Level ${targetLevel} Verification`}
        </button>
      </div>
    </div>
  )
}

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
          <button onClick={() => navigate('/dashboard')} className="flex cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2 hover:bg-[#F9FAFB]">
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">KYC Upgrade</Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">Increase your transaction limits</Text>
          </div>
          <div className="w-[34px]" />
        </div>
      </div>
      <div className="mx-auto flex max-w-[600px] flex-col gap-5 px-6 py-8">
        <LimitCard level={kycLevel} />
        <UpgradeSection targetLevel={targetLevel} rejectionReason={rejectionReason} onProvePending={onProvePending} />
      </div>
    </div>
  )
}

export function Kyc() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<KycPhase>('loading')
  const [kycData, setKycData] = useState<KycStatus | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Step 1 — NIN + BVN (Level 0 → 1 onboarding)
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

  async function loadStatus() {
    try {
      const kyc = await getKycStatus()
      setKycData(kyc)

      if (kyc.kycLevel === 0) {
        if (kyc.status === 'REJECTED') {
          try { await resubmitKyc() } catch { /* ignore */ }
          setPhase('flow')
          return
        }
        if (kyc.step === 'PROVE_PENDING') {
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
        return
      }

      // kycLevel >= 1 — resolve into the appropriate upgrade view instead of
      // bouncing to /dashboard. ProtectedRoute already lets kycLevel >= 1
      // admins through to every other route; this page is only reached now
      // if they navigated here directly (e.g. Profile's "Upgrade Now").
      const resolved = resolveUpgradePhase(kyc)
      if (resolved === 'prove-pending' && sessionStorage.getItem('kyc_widget_opened') !== 'true') {
        setPhase(kyc.kycLevel === 1 ? 'upgrade-l2' : 'upgrade-l3')
        return
      }
      setPhase(resolved)
    } catch {
      setPhase('flow')
    }
  }

  // Poll while waiting for Mono webhook to fire (prove-pending phase, any level).
  useEffect(() => {
    if (phase !== 'prove-pending') return

    async function check() {
      if (document.hidden) return
      try {
        const kyc = await getKycStatus()
        if (!kyc.step || !PROVE_PENDING_STEPS.has(kyc.step)) {
          sessionStorage.removeItem('kyc_widget_opened')
          loadStatus()
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

    getUserProfile().then(setUserProfile).catch(() => {})
    loadStatus()
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

  function handleRestartProvePending() {
    sessionStorage.removeItem('kyc_widget_opened')
    if ((kycData?.kycLevel ?? 0) === 0) {
      setPhase('flow')
    } else {
      setPhase(kycData?.kycLevel === 1 ? 'upgrade-l2' : 'upgrade-l3')
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

  // ── Level 2/3 upgrade views ───────────────────────────────────────────────
  if (phase === 'fully-verified') {
    return <FullyVerifiedScreen />
  }

  if (phase === 'pending-l2') {
    return <PendingReviewScreen forLevel={2} onRefresh={loadStatus} verificationData={kycData?.verificationData} />
  }

  if (phase === 'pending-l3') {
    return <PendingReviewScreen forLevel={3} onRefresh={loadStatus} verificationData={kycData?.verificationData} />
  }

  if (phase === 'upgrade-l2' || phase === 'upgrade-l3' || phase === 'rejected-l2' || phase === 'rejected-l3') {
    const kycLevel = kycData?.kycLevel ?? 1
    const rejectionReason =
      (phase === 'rejected-l2' || phase === 'rejected-l3') ? (kycData?.rejectionReason ?? null) : null
    return (
      <UpgradePage
        kycLevel={kycLevel}
        rejectionReason={rejectionReason}
        onProvePending={() => setPhase('prove-pending')}
      />
    )
  }

  // ── Pending superadmin approval (Level 0 → 1) ────────────────────────────
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
          <a href={USER_APP_URL} className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B6B55] py-3.5 text-[14px] font-semibold text-white no-underline hover:bg-[#095C49]">
            Go to Member App <IconExternalLink size={16} />
          </a>
        </div>
      </div>
    )
  }

  // ── Submitted & auto-approved (Level 0 → 1) ──────────────────────────────
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
          <a href={USER_APP_URL} className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B6B55] py-3.5 text-[14px] font-semibold text-white no-underline hover:bg-[#095C49]">
            Go to Member App <IconExternalLink size={16} />
          </a>
          <button onClick={() => navigate('/login')} className="mt-3 cursor-pointer text-[13px] text-[#6B7280] underline-offset-2 hover:underline">
            Sign in to admin portal
          </button>
        </div>
      </div>
    )
  }

  // ── Prove pending (any level) ─────────────────────────────────────────────
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
            <button onClick={handleRestartProvePending} className="cursor-pointer text-[#02A36E] underline">
              Restart
            </button>
          </Text>
        </div>
      </div>
    )
  }

  // ── NOK step (Level 0 → 1) ────────────────────────────────────────────────
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

  // ── Main flow: NIN + BVN (Level 0 → 1) ────────────────────────────────────
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

        <div className="flex flex-col gap-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
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

          <div className="flex flex-col gap-1 rounded-xl bg-[#F9FAFB] p-4">
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
