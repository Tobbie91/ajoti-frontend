import { useState, useRef, useEffect } from 'react'
import { Text, TextInput, Textarea, Progress, Alert, Loader, Select, Badge } from '@mantine/core'
import {
  IconArrowLeft,
  IconUpload,
  IconCheck,
  IconFile,
  IconX,
  IconUser,
  IconPhone,
  IconHome,
  IconFileText,
  IconId,
  IconBuildingBank,
  IconShieldCheck,
  IconCamera,
  IconAlertCircle,
  IconLock,
  IconArrowRight,
  IconClock,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  verifyNin as verifyNinApi,
  verifyBvn as verifyBvnApi,
  submitNok,
  getKycStatus,
  resubmitKyc,
  submitPhoto,
  submitProofOfAddress,
  type KycStatus,
} from '@/utils/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type OnboardingStep = 1 | 2 | 3   // NIN → BVN → NOK

// Which top-level view to render
type PageView =
  | 'loading'
  | 'onboarding'       // Level 0: 3-step NIN/BVN/NOK flow
  | 'onboarding-done'  // Just completed Level 1 (auto-approved)
  | 'upgrade-l2'       // Level 1 approved, ready to upgrade
  | 'pending-l2'       // Level 2 docs submitted, under review
  | 'rejected-l2'      // Level 2 docs rejected
  | 'upgrade-l3'       // Level 2 approved, ready to upgrade
  | 'pending-l3'       // Level 3 docs submitted, under review
  | 'rejected-l3'      // Level 3 docs rejected
  | 'fully-verified'   // Level 3 approved

function resolveView(kyc: KycStatus | null): PageView {
  if (!kyc) return 'onboarding'
  const { kycLevel, status, step } = kyc

  if (kycLevel === 0) {
    if (status === 'REJECTED') return 'onboarding'  // resubmit resets to step 3 internally
    if (status === 'NOT_SUBMITTED' || !status) return 'onboarding'
    return 'onboarding'
  }

  if (kycLevel >= 3) return 'fully-verified'

  if (kycLevel === 2) {
    if (step === 'PROOF_OF_ADDRESS_REQUIRED' && status === 'REJECTED') return 'rejected-l3'
    if (step === 'PROOF_OF_ADDRESS_REQUIRED') return 'pending-l3'
    return 'upgrade-l3'
  }

  // kycLevel === 1
  if (step === 'PHOTO_REQUIRED' && status === 'REJECTED') return 'rejected-l2'
  if (step === 'PHOTO_REQUIRED') return 'pending-l2'
  return 'upgrade-l2'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyles = {
  input: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  label: { fontWeight: 500, fontSize: 14, color: '#374151', marginBottom: 4 },
}

function FileUploadBox({
  label,
  hint,
  file,
  onFile,
  onClear,
  accept = 'image/jpg,image/jpeg,image/png',
  icon,
  iconColor,
}: {
  label: React.ReactNode
  hint: string
  file: File | null
  onFile: (f: File) => void
  onClear: () => void
  accept?: string
  icon: React.ReactNode
  iconColor: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <Text fw={600} className="mb-2 text-[13px] text-[#374151]">{label}</Text>
      <Text fw={400} className="mb-3 text-[12px] text-[#6B7280]">{hint}</Text>
      <input
        ref={ref}
        type="file"
        accept={accept}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        className="hidden"
      />
      {!file ? (
        <button
          onClick={() => ref.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-6 py-8 transition-colors hover:border-[#02A36E] hover:bg-[#F0FDF4]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5E7EB]">
            <IconUpload size={22} color="#6B7280" />
          </div>
          <div className="text-center">
            <Text fw={600} className="text-[14px] text-[#374151]">Click to upload</Text>
            <Text fw={400} className="mt-1 text-[12px] text-[#9CA3AF]">{accept.includes('pdf') ? 'JPG, PNG or PDF (Max 5MB)' : 'JPG or PNG (Max 5MB)'}</Text>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: iconColor }}>
            {icon}
          </div>
          <div className="flex-1">
            <Text fw={600} className="text-[13px] text-[#0F172A]">{file.name}</Text>
            <Text fw={400} className="text-[12px] text-[#6B7280]">{(file.size / 1024).toFixed(1)} KB</Text>
          </div>
          <button
            onClick={onClear}
            className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 hover:bg-[#FEE2E2]"
          >
            <IconX size={16} color="#EF4444" />
          </button>
        </div>
      )}
    </div>
  )
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

// ── Pending review screen ─────────────────────────────────────────────────────

function PendingReviewScreen({
  forLevel,
  onRefresh,
}: {
  forLevel: 2 | 3
  onRefresh: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3C7]">
          <IconClock size={32} color="#D97706" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">Under Review</Text>
        <Text fw={400} className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]">
          Your Level {forLevel} documents have been submitted and are currently being reviewed by our
          compliance team. This typically takes 24–48 hours.
        </Text>
        <LimitCard level={forLevel - 1} />
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

// ── Upgrade section (Level 2 or Level 3) ────────────────────────────────────

function UpgradeSection({
  targetLevel,
  rejectionReason,
  onSubmitted,
}: {
  targetLevel: 2 | 3
  rejectionReason?: string | null
  onSubmitted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Level 2 fields
  const [govIdType, setGovIdType] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [addrState, setAddrState] = useState<string | null>(null)
  const [lga, setLga] = useState('')
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)

  // Level 3 fields
  const [proofType, setProofType] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)

  const canSubmitL2 = govIdType && address.trim() && city.trim() && addrState && selfieFile && idFrontFile
  const canSubmitL3 = proofType && proofFile

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      if (targetLevel === 2) {
        if (!govIdType || !selfieFile || !idFrontFile || !addrState) return
        await submitPhoto({
          governmentIdType: govIdType,
          address: address.trim(),
          city: city.trim(),
          state: addrState,
          country: 'Nigeria',
          ...(lga.trim() ? { lga: lga.trim() } : {}),
          selfie: selfieFile,
          governmentIdFront: idFrontFile,
          ...(idBackFile ? { governmentIdBack: idBackFile } : {}),
        })
      } else {
        if (!proofType || !proofFile) return
        await submitProofOfAddress({
          proofOfAddressType: proofType,
          proofOfAddress: proofFile,
        })
      }
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const nextLimits = targetLevel === 2
    ? { single: '₦100,000', daily: '₦500,000' }
    : { single: '₦5,000,000', daily: '₦25,000,000' }

  return (
    <div className="flex flex-col gap-5">
      {rejectionReason && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" title="Documents rejected">
          {rejectionReason}. Please re-upload valid documents to try again.
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

      {targetLevel === 2 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
              <IconId size={20} color="#2563EB" />
            </div>
            <div>
              <Text fw={700} className="text-[16px] text-[#0F172A]">Government ID</Text>
              <Text fw={400} className="text-[13px] text-[#6B7280]">Upload a clear photo of your government-issued ID</Text>
            </div>
          </div>

          <Select
            label="ID Type"
            placeholder="Select document type"
            data={[
              { value: 'NIN_SLIP', label: 'NIN Slip' },
              { value: 'NATIONAL_ID', label: 'National ID Card' },
              { value: 'DRIVERS_LICENSE', label: "Driver's Licence" },
              { value: 'PASSPORT', label: 'International Passport' },
              { value: 'VOTERS_CARD', label: "Voter's Card" },
            ]}
            value={govIdType}
            onChange={setGovIdType}
            radius="md"
            styles={inputStyles}
            required
          />

          {/* Address */}
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 flex flex-col gap-3">
            <Text fw={600} className="text-[13px] text-[#374151]">Residential Address</Text>
            <Textarea
              label="House Address"
              placeholder="e.g. 12 Allen Avenue"
              radius="md"
              minRows={2}
              value={address}
              onChange={(e) => setAddress(e.currentTarget.value)}
              styles={inputStyles}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="City"
                placeholder="e.g. Ikeja"
                radius="md"
                value={city}
                onChange={(e) => setCity(e.currentTarget.value)}
                styles={inputStyles}
                required
              />
              <Select
                label="State"
                placeholder="Select state"
                data={['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara']}
                value={addrState}
                onChange={setAddrState}
                radius="md"
                styles={inputStyles}
                searchable
                required
              />
            </div>
            <TextInput
              label="LGA (Optional)"
              placeholder="e.g. Ikeja LGA"
              radius="md"
              value={lga}
              onChange={(e) => setLga(e.currentTarget.value)}
              styles={inputStyles}
            />
          </div>

          <FileUploadBox
            label={<>Selfie / Live Photo <span className="text-red-500">*</span></>}
            hint="Take a clear, well-lit photo of your face. No sunglasses or hats."
            file={selfieFile}
            onFile={setSelfieFile}
            onClear={() => setSelfieFile(null)}
            accept="image/jpg,image/jpeg,image/png"
            icon={<IconCamera size={20} color="white" />}
            iconColor="#0284C7"
          />

          <FileUploadBox
            label={<>ID Front <span className="text-red-500">*</span></>}
            hint="Upload the front of your selected ID document."
            file={idFrontFile}
            onFile={setIdFrontFile}
            onClear={() => setIdFrontFile(null)}
            accept="image/jpg,image/jpeg,image/png"
            icon={<IconId size={20} color="white" />}
            iconColor="#02A36E"
          />

          <FileUploadBox
            label="ID Back (optional)"
            hint="Upload the back of your ID if applicable."
            file={idBackFile}
            onFile={setIdBackFile}
            onClear={() => setIdBackFile(null)}
            accept="image/jpg,image/jpeg,image/png"
            icon={<IconId size={20} color="white" />}
            iconColor="#9333ea"
          />

          <button
            onClick={handleSubmit}
            disabled={!canSubmitL2 || submitting}
            className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
              canSubmitL2 && !submitting
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      )}

      {targetLevel === 3 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED]">
              <IconFileText size={20} color="#F97316" />
            </div>
            <div>
              <Text fw={700} className="text-[16px] text-[#0F172A]">Proof of Address</Text>
              <Text fw={400} className="text-[13px] text-[#6B7280]">Upload a document that verifies your current address</Text>
            </div>
          </div>

          <Select
            label="Document Type"
            placeholder="Select document type"
            data={[
              { value: 'UTILITY_BILL', label: 'Utility Bill (not older than 3 months)' },
              { value: 'BANK_STATEMENT', label: 'Bank Statement' },
              { value: 'TENANCY_AGREEMENT', label: 'Tenancy Agreement' },
              { value: 'GOVERNMENT_LETTER', label: 'Government-issued letter with address' },
            ]}
            value={proofType}
            onChange={setProofType}
            radius="md"
            styles={inputStyles}
            required
          />

          <FileUploadBox
            label={<>Proof Document <span className="text-red-500">*</span></>}
            hint="Upload a clear scan or photo of your proof of address document."
            file={proofFile}
            onFile={setProofFile}
            onClear={() => setProofFile(null)}
            accept=".pdf,image/jpg,image/jpeg,image/png"
            icon={<IconFile size={20} color="white" />}
            iconColor="#F97316"
          />

          <button
            onClick={handleSubmit}
            disabled={!canSubmitL3 || submitting}
            className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
              canSubmitL3 && !submitting
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Onboarding flow (Level 0 → 1) ─────────────────────────────────────────────

const ONBOARDING_LABELS = ['NIN', 'BVN', 'Next of Kin']

function OnboardingFlow({
  rejectionReason,
  onComplete,
  initialNinVerified = false,
  initialBvnVerified = false,
}: {
  rejectionReason?: string | null
  onComplete: () => void
  initialNinVerified?: boolean
  initialBvnVerified?: boolean
}) {
  const [step, setStep] = useState<OnboardingStep>(
    initialNinVerified && initialBvnVerified ? 3 : initialNinVerified ? 2 : 1
  )

  // NIN
  const [nin, setNin] = useState('')
  const [ninVerified, setNinVerified] = useState(initialNinVerified)
  const [ninVerifying, setNinVerifying] = useState(false)

  // BVN
  const [bvn, setBvn] = useState('')
  const [bvnVerified, setBvnVerified] = useState(initialBvnVerified)
  const [bvnVerifying, setBvnVerifying] = useState(false)

  // NOK
  const [kinFullName, setKinFullName] = useState('')
  const [kinRelationship, setKinRelationship] = useState('')
  const [kinPhone, setKinPhone] = useState('')
  const [kinEmail, setKinEmail] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const storedUser = localStorage.getItem('user')
  const userProfile = storedUser ? JSON.parse(storedUser) : null

  const progressValue = (step / 3) * 100

  function canProceed() {
    if (step === 1) return ninVerified
    if (step === 2) return bvnVerified
    if (step === 3) return kinFullName.trim() && kinPhone.trim() && kinRelationship.trim()
    return false
  }

  async function handleVerifyNin() {
    if (nin.trim().length !== 11) return
    setError(null)
    setNinVerifying(true)
    try {
      const p = userProfile ?? {}
      await verifyNinApi({
        nin: nin.trim(),
        firstName: p.firstName || p.firstname || '',
        lastName: p.lastName || p.lastname || '',
        dob: p.dob || (p.DOB ? p.DOB.split('T')[0] : ''),
      })
      setNinVerified(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NIN verification failed')
    } finally {
      setNinVerifying(false)
    }
  }

  async function handleVerifyBvn() {
    if (bvn.trim().length !== 11) return
    setError(null)
    setBvnVerifying(true)
    try {
      const p = userProfile ?? {}
      await verifyBvnApi({
        bvn: bvn.trim(),
        firstName: p.firstName || p.firstname || '',
        lastName: p.lastName || p.lastname || '',
        dob: p.dob || (p.DOB ? p.DOB.split('T')[0] : ''),
      })
      setBvnVerified(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'BVN verification failed')
    } finally {
      setBvnVerifying(false)
    }
  }

  async function handleNext() {
    setError(null)
    if (step === 3) {
      setSubmitting(true)
      try {
        await submitNok({
          nextOfKinName: kinFullName.trim(),
          nextOfKinRelationship: kinRelationship.trim(),
          nextOfKinPhone: kinPhone.trim(),
        })
        onComplete()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit next of kin')
      } finally {
        setSubmitting(false)
      }
      return
    }
    setStep((step + 1) as OnboardingStep)
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as OnboardingStep)}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2 hover:bg-[#F9FAFB]"
            >
              <IconArrowLeft size={18} color="#374151" />
            </button>
          ) : (
            <div className="w-[34px]" />
          )}
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">Identity Verification</Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              Step {step} of 3 — {ONBOARDING_LABELS[step - 1]}
            </Text>
          </div>
          <div className="w-[34px]" />
        </div>
        <div className="mx-auto max-w-[600px] px-6 pb-4">
          <Progress value={progressValue} size="sm" radius="xl" color="#02A36E" />
        </div>
      </div>

      <div className="mx-auto max-w-[600px] px-6 py-8">
        {/* Rejection banner */}
        {rejectionReason && step === 3 && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" mb="lg" title="Previous submission was rejected">
            {rejectionReason}
          </Alert>
        )}

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-between">
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
                Dial *565*0# on your registered phone number, or check your bank app.
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
        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
              canProceed() && !submitting
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            {submitting ? 'Submitting...' : step === 3 ? 'Submit & Complete Level 1' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Onboarding done (Level 1 just approved) ──────────────────────────────────

function OnboardingDoneScreen({ onContinue }: { onContinue: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
          <IconShieldCheck size={32} color="#02A36E" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">Level 1 Verified!</Text>
        <Text fw={400} className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]">
          Your basic identity has been verified. You can now send and receive money on Ajoti.
        </Text>
        <LimitCard level={1} />
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

// ── Level card for upgrade page header ───────────────────────────────────────

function UpgradePage({
  kycLevel,
  rejectionReason,
  onSubmitted,
}: {
  kycLevel: number
  rejectionReason?: string | null
  onSubmitted: () => void
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
          onSubmitted={onSubmitted}
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
      // If rejected, auto-call resubmit for Level 0 so they can redo NOK
      if (kyc.kycLevel === 0 && kyc.status === 'REJECTED') {
        try { await resubmitKyc() } catch { /* ignore */ }
        setView('onboarding')
      } else {
        setView(resolveView(kyc))
      }
    } catch {
      setView('onboarding')  // No KYC record — start fresh
    }
  }

  useEffect(() => { loadStatus() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (view === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader color="#02A36E" size="md" />
      </div>
    )
  }

  if (view === 'onboarding') {
    return (
      <OnboardingFlow
        rejectionReason={kycData?.kycLevel === 0 ? (kycData.rejectionReason ?? null) : null}
        onComplete={() => setView('onboarding-done')}
        initialNinVerified={kycData?.ninVerified ?? false}
        initialBvnVerified={kycData?.bvnVerified ?? false}
      />
    )
  }

  if (view === 'onboarding-done') {
    return <OnboardingDoneScreen onContinue={() => setView('upgrade-l2')} />
  }

  if (view === 'pending-l2') {
    return <PendingReviewScreen forLevel={2} onRefresh={loadStatus} />
  }

  if (view === 'pending-l3') {
    return <PendingReviewScreen forLevel={3} onRefresh={loadStatus} />
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
      onSubmitted={() => {
        if (view === 'upgrade-l2' || view === 'rejected-l2') setView('pending-l2')
        else setView('pending-l3')
      }}
    />
  )
}
