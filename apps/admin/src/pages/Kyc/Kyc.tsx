import { useState, useEffect } from 'react'
import { Text, TextInput, Progress, Alert, Loader } from '@mantine/core'
import {
  IconArrowLeft,
  IconCheck,
  IconUser,
  IconPhone,
  IconId,
  IconBuildingBank,
  IconShieldCheck,
  IconAlertCircle,
  IconExternalLink,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { verifyNin, verifyBvn, submitNok, getKycStatus, resubmitKyc, getUserProfile, type UserProfile } from '@/utils/api'

type KycStep = 1 | 2 | 3
type KycPhase = 'loading' | 'flow' | 'pending' | 'submitted'

const STEP_LABELS = ['NIN', 'BVN', 'Next of Kin']

const USER_APP_URL = import.meta.env.VITE_USER_APP_URL ?? 'http://localhost:5173'

export function Kyc() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<KycPhase>('loading')
  const [step, setStep] = useState<KycStep>(1)
  const [kycError, setKycError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Step 1 — NIN
  const [nin, setNin] = useState('')
  const [ninVerified, setNinVerified] = useState(false)
  const [ninVerifying, setNinVerifying] = useState(false)

  // Step 2 — BVN
  const [bvn, setBvn] = useState('')
  const [bvnVerified, setBvnVerified] = useState(false)
  const [bvnVerifying, setBvnVerifying] = useState(false)

  // Step 3 — Next of Kin
  const [kinFullName, setKinFullName] = useState('')
  const [kinRelationship, setKinRelationship] = useState('')
  const [kinPhone, setKinPhone] = useState('')
  const [kinEmail, setKinEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // On mount: check existing KYC status + fetch user profile for NIN/BVN verification
  useEffect(() => {
    Promise.all([
      getKycStatus(),
      getUserProfile().catch(() => null),
    ]).then(async ([kyc, profile]) => {
      if (profile) setUserProfile(profile)

      if (kyc.kycLevel >= 1) {
        // Already verified — go straight to dashboard
        navigate('/dashboard', { replace: true })
        return
      }
      if (kyc.status === 'PENDING') {
        // Submitted but awaiting superadmin approval
        setPhase('pending')
        return
      }
      if (kyc.status === 'REJECTED') {
        // Reset so they can resubmit from NOK
        try { await resubmitKyc() } catch { /* ignore */ }
        setNinVerified(true)
        setBvnVerified(true)
        setStep(3)
      }
      setPhase('flow')
    }).catch(() => setPhase('flow'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const progressValue = (step / 3) * 100

  function canProceed() {
    if (step === 1) return ninVerified
    if (step === 2) return bvnVerified
    if (step === 3) return !!(kinFullName.trim() && kinPhone.trim() && kinRelationship.trim())
    return false
  }

  async function handleVerifyNin() {
    if (nin.trim().length !== 11) return
    setKycError(null)
    setNinVerifying(true)
    try {
      // Prefer API-fetched profile (has dob); fall back to localStorage
      const stored = localStorage.getItem('admin_user')
      const local = stored ? JSON.parse(stored) : {}
      const p = userProfile ?? local
      await verifyNin({
        nin: nin.trim(),
        firstName: p.firstName || p.firstname || '',
        lastName: p.lastName || p.lastname || '',
        dob: p.dob || p.DOB || '',
      })
      setNinVerified(true)
    } catch (err) {
      setKycError(err instanceof Error ? err.message : 'NIN verification failed')
    } finally {
      setNinVerifying(false)
    }
  }

  async function handleVerifyBvn() {
    if (bvn.trim().length !== 11) return
    setKycError(null)
    setBvnVerifying(true)
    try {
      const stored = localStorage.getItem('admin_user')
      const local = stored ? JSON.parse(stored) : {}
      const p = userProfile ?? local
      await verifyBvn({
        bvn: bvn.trim(),
        firstName: p.firstName || p.firstname || '',
        lastName: p.lastName || p.lastname || '',
        dob: p.dob || p.DOB || '',
      })
      setBvnVerified(true)
    } catch (err) {
      setKycError(err instanceof Error ? err.message : 'BVN verification failed')
    } finally {
      setBvnVerifying(false)
    }
  }

  async function handleNext() {
    setKycError(null)
    if (step === 3) {
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
        setKycError(err instanceof Error ? err.message : 'Failed to submit next of kin')
      } finally {
        setSubmitting(false)
      }
      return
    }
    setStep((step + 1) as KycStep)
  }

  const inputStyles = {
    input: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
    label: { fontWeight: 500, fontSize: 14, color: '#374151', marginBottom: 4 },
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader color="#02A36E" size="md" />
      </div>
    )
  }

  // ── Submitted but pending superadmin approval ─────────────────────────────────
  if (phase === 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
        <div className="w-full max-w-[460px] rounded-3xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEF3C7]">
            <IconShieldCheck size={40} color="#D97706" stroke={1.5} />
          </div>
          <Text fw={700} className="text-[22px] text-[#0F172A]">Verification Submitted</Text>
          <Text fw={400} className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Your KYC documents are under review. You'll be notified once your admin account is approved — this usually takes less than 24 hours.
          </Text>
          <a
            href={USER_APP_URL}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B6B55] py-3.5 text-[14px] font-semibold text-white no-underline hover:bg-[#095C49]"
          >
            Go to Member App
            <IconExternalLink size={16} />
          </a>
        </div>
      </div>
    )
  }

  // ── Submitted — Level 1 auto-approved ────────────────────────────────────────
  if (phase === 'submitted') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
        <div className="w-full max-w-[460px] rounded-3xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F0FDF4]">
            <IconShieldCheck size={40} color="#02A36E" stroke={1.5} />
          </div>
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Identity Verified!
          </Text>
          <Text fw={400} className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Your identity has been verified (KYC Level 1). Your admin account is now pending
            review — you'll be notified once it's approved.
          </Text>

          <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4 text-left">
            <Text fw={600} className="text-[13px] text-[#0F172A]">What happens next?</Text>
            <ul className="mt-2 space-y-1.5 text-[13px] text-[#6B7280]">
              <li>• Our team will review and activate your admin account</li>
              <li>• You'll receive an email once your account is approved</li>
              <li>• To increase your transaction limits, upgrade your KYC in the member app</li>
            </ul>
          </div>

          <a
            href={USER_APP_URL}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B6B55] py-3.5 text-[14px] font-semibold text-white no-underline hover:bg-[#095C49]"
          >
            Go to Member App
            <IconExternalLink size={16} />
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

  // ── 3-step onboarding flow ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as KycStep)}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2 hover:bg-[#F9FAFB]"
            >
              <IconArrowLeft size={18} color="#374151" />
            </button>
          ) : (
            <div className="w-[34px]" />
          )}
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">Admin Identity Verification</Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              Step {step} of 3 — {STEP_LABELS[step - 1]}
            </Text>
          </div>
          <div className="w-[34px]" />
        </div>
        <div className="mx-auto max-w-[600px] px-6 pb-4">
          <Progress value={progressValue} size="sm" radius="xl" color="#02A36E" />
        </div>
      </div>

      <div className="mx-auto max-w-[600px] px-6 py-8">
        {kycError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" className="mb-4" withCloseButton onClose={() => setKycError(null)}>
            {kycError}
          </Alert>
        )}

        {/* Notice banner */}
        <div className="mb-6 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4">
          <Text fw={600} className="text-[13px] text-[#065F46]">
            KYC is required to activate your admin account
          </Text>
          <Text fw={400} className="mt-1 text-[12px] text-[#6B7280]">
            Complete all 3 steps to gain access to the admin dashboard and group management tools.
          </Text>
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
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

        {/* Step 1: NIN */}
        {step === 1 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                <IconId size={20} color="#3B82F6" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">NIN Verification</Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">Enter your 11-digit National Identification Number</Text>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <TextInput
                label="National Identification Number (NIN)"
                placeholder="Enter your 11-digit NIN"
                radius="md"
                value={nin}
                onChange={(e) => { setNin(e.currentTarget.value.replace(/\D/g, '').slice(0, 11)); setNinVerified(false) }}
                styles={inputStyles}
                maxLength={11}
                required
              />
              {ninVerified ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#02A36E]">
                    <IconShieldCheck size={20} color="white" />
                  </div>
                  <div>
                    <Text fw={600} className="text-[14px] text-[#065F46]">NIN Verified Successfully</Text>
                    <Text fw={400} className="text-[12px] text-[#6B7280]">Your identity has been confirmed</Text>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleVerifyNin}
                  disabled={nin.length !== 11 || ninVerifying}
                  className={`w-full rounded-xl px-6 py-3 text-[14px] font-semibold text-white ${
                    nin.length === 11 && !ninVerifying
                      ? 'cursor-pointer bg-[#3B82F6] hover:bg-[#2563EB]'
                      : 'cursor-not-allowed bg-[#9CA3AF]'
                  }`}
                >
                  {ninVerifying ? 'Verifying...' : 'Verify NIN'}
                </button>
              )}
            </div>
            <div className="mt-6 rounded-xl bg-[#F9FAFB] p-4">
              <Text fw={500} className="mb-1 text-[12px] text-[#374151]">Where to find your NIN?</Text>
              <Text fw={400} className="text-[12px] leading-[1.6] text-[#6B7280]">
                Your NIN is on your National ID card, or dial *346# on your registered phone number.
              </Text>
            </div>
          </div>
        )}

        {/* Step 2: BVN */}
        {step === 2 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDF4]">
                <IconBuildingBank size={20} color="#02A36E" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">BVN Verification</Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">Enter your 11-digit Bank Verification Number</Text>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <TextInput
                label="Bank Verification Number (BVN)"
                placeholder="Enter your 11-digit BVN"
                radius="md"
                value={bvn}
                onChange={(e) => { setBvn(e.currentTarget.value.replace(/\D/g, '').slice(0, 11)); setBvnVerified(false) }}
                styles={inputStyles}
                maxLength={11}
                required
              />
              {bvnVerified ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#02A36E]">
                    <IconShieldCheck size={20} color="white" />
                  </div>
                  <div>
                    <Text fw={600} className="text-[14px] text-[#065F46]">BVN Verified Successfully</Text>
                    <Text fw={400} className="text-[12px] text-[#6B7280]">Your bank identity has been confirmed</Text>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleVerifyBvn}
                  disabled={bvn.length !== 11 || bvnVerifying}
                  className={`w-full rounded-xl px-6 py-3 text-[14px] font-semibold text-white ${
                    bvn.length === 11 && !bvnVerifying
                      ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                      : 'cursor-not-allowed bg-[#9CA3AF]'
                  }`}
                >
                  {bvnVerifying ? 'Verifying...' : 'Verify BVN'}
                </button>
              )}
            </div>
            <div className="mt-6 rounded-xl bg-[#F9FAFB] p-4">
              <Text fw={500} className="mb-1 text-[12px] text-[#374151]">Where to find your BVN?</Text>
              <Text fw={400} className="text-[12px] leading-[1.6] text-[#6B7280]">
                Dial *565*0# on your registered phone number, or check your bank app/statement.
              </Text>
            </div>
          </div>
        )}

        {/* Step 3: Next of Kin */}
        {step === 3 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7]">
                <IconUser size={20} color="#D97706" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">Next of Kin Information</Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">Provide details of your next of kin</Text>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <TextInput label="Full Name" placeholder="Enter next of kin's full name" radius="md" value={kinFullName} onChange={(e) => setKinFullName(e.currentTarget.value)} styles={inputStyles} required />
              <TextInput label="Relationship" placeholder="e.g. Spouse, Parent, Sibling" radius="md" value={kinRelationship} onChange={(e) => setKinRelationship(e.currentTarget.value)} styles={inputStyles} required />
              <TextInput label="Phone Number" placeholder="+234 800 000 0000" radius="md" value={kinPhone} onChange={(e) => setKinPhone(e.currentTarget.value)} styles={inputStyles} leftSection={<IconPhone size={16} color="#9CA3AF" />} required />
              <TextInput label="Email Address (Optional)" placeholder="email@example.com" radius="md" value={kinEmail} onChange={(e) => setKinEmail(e.currentTarget.value)} styles={inputStyles} />
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as KycStep)}
              className="flex-1 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-6 py-3.5 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            className={`flex-1 rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
              canProceed() && !submitting
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            {submitting ? 'Submitting...' : step === 3 ? 'Submit KYC' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
