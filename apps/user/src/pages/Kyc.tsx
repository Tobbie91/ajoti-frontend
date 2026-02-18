import { useState, useRef } from 'react'
import { Text, TextInput, Textarea, Progress } from '@mantine/core'
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
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type KycStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

const STEP_LABELS = ['NIN', 'BVN', 'Next of Kin', 'Address', 'Photos', 'Proof', 'Review']

export function Kyc() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const idPhotoInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<KycStep>(1)

  // Step 1 - NIN
  const [nin, setNin] = useState('')
  const [ninVerified, setNinVerified] = useState(false)
  const [ninVerifying, setNinVerifying] = useState(false)

  // Step 2 - BVN
  const [bvn, setBvn] = useState('')
  const [bvnVerified, setBvnVerified] = useState(false)
  const [bvnVerifying, setBvnVerifying] = useState(false)

  // Step 3 - Next of Kin
  const [kinFullName, setKinFullName] = useState('')
  const [kinRelationship, setKinRelationship] = useState('')
  const [kinPhone, setKinPhone] = useState('')
  const [kinEmail, setKinEmail] = useState('')

  // Step 4 - Address
  const [houseAddress, setHouseAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [lga, setLga] = useState('')

  // Step 5 - Photos
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null)

  // Step 6 - Proof of Address
  const [proofFile, setProofFile] = useState<File | null>(null)

  const progressValue = (step / 7) * 100

  function canProceed() {
    switch (step) {
      case 1: return ninVerified
      case 2: return bvnVerified
      case 3: return kinFullName.trim() && kinPhone.trim() && kinRelationship.trim()
      case 4: return houseAddress.trim() && city.trim() && state.trim()
      case 5: return selfieFile !== null && idPhotoFile !== null
      case 6: return proofFile !== null
      case 7: return true
      default: return false
    }
  }

  function handleVerifyNin() {
    if (nin.trim().length !== 11) return
    setNinVerifying(true)
    setTimeout(() => {
      setNinVerifying(false)
      setNinVerified(true)
    }, 2000)
  }

  function handleVerifyBvn() {
    if (bvn.trim().length !== 11) return
    setBvnVerifying(true)
    setTimeout(() => {
      setBvnVerifying(false)
      setBvnVerified(true)
    }, 2000)
  }

  function handleNext() {
    if (step < 7) {
      setStep((step + 1) as KycStep)
    } else {
      localStorage.setItem('kyc_completed', 'true')
      navigate('/home')
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((step - 1) as KycStep)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setProofFile(file)
  }

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelfieFile(file)
  }

  function handleIdPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setIdPhotoFile(file)
  }

  const inputStyles = {
    input: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
    label: { fontWeight: 500, fontSize: 14, color: '#374151', marginBottom: 4 },
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2 hover:bg-[#F9FAFB]"
            >
              <IconArrowLeft size={18} color="#374151" />
            </button>
          ) : (
            <div className="w-[34px]" />
          )}
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">
              Complete Your KYC
            </Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              Step {step} of 7 — {STEP_LABELS[step - 1]}
            </Text>
          </div>
          <div className="w-[34px]" />
        </div>
        <div className="mx-auto max-w-[600px] px-6 pb-4">
          <Progress
            value={progressValue}
            size="sm"
            radius="xl"
            color="#02A36E"
            className="bg-[#E5E7EB]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[600px] px-6 py-8">
        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1
            const isActive = stepNum === step
            const isCompleted = stepNum < step
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold ${
                    isCompleted
                      ? 'bg-[#02A36E] text-white'
                      : isActive
                        ? 'border-2 border-[#02A36E] bg-[#F0FDF4] text-[#02A36E]'
                        : 'border-2 border-[#E5E7EB] bg-white text-[#9CA3AF]'
                  }`}
                >
                  {isCompleted ? <IconCheck size={16} /> : stepNum}
                </div>
                <Text
                  fw={isActive ? 600 : 400}
                  className={`text-[10px] ${isActive ? 'text-[#02A36E]' : 'text-[#9CA3AF]'}`}
                >
                  {label}
                </Text>
              </div>
            )
          })}
        </div>

        {/* Step 1: NIN Verification */}
        {step === 1 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                <IconId size={20} color="#3B82F6" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  NIN Verification
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Enter your 11-digit National Identification Number
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <TextInput
                label="National Identification Number (NIN)"
                placeholder="Enter your 11-digit NIN"
                radius="md"
                value={nin}
                onChange={(e) => {
                  const val = e.currentTarget.value.replace(/\D/g, '').slice(0, 11)
                  setNin(val)
                  setNinVerified(false)
                }}
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
                    <Text fw={600} className="text-[14px] text-[#065F46]">
                      NIN Verified Successfully
                    </Text>
                    <Text fw={400} className="text-[12px] text-[#6B7280]">
                      Your identity has been confirmed
                    </Text>
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
              <Text fw={500} className="mb-1 text-[12px] text-[#374151]">
                Where to find your NIN?
              </Text>
              <Text fw={400} className="text-[12px] leading-[1.6] text-[#6B7280]">
                Your NIN is on your National ID card, or you can dial *346# on your registered phone
                number to retrieve it.
              </Text>
            </div>
          </div>
        )}

        {/* Step 2: BVN Verification */}
        {step === 2 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDF4]">
                <IconBuildingBank size={20} color="#02A36E" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  BVN Verification
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Enter your 11-digit Bank Verification Number
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <TextInput
                label="Bank Verification Number (BVN)"
                placeholder="Enter your 11-digit BVN"
                radius="md"
                value={bvn}
                onChange={(e) => {
                  const val = e.currentTarget.value.replace(/\D/g, '').slice(0, 11)
                  setBvn(val)
                  setBvnVerified(false)
                }}
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
                    <Text fw={600} className="text-[14px] text-[#065F46]">
                      BVN Verified Successfully
                    </Text>
                    <Text fw={400} className="text-[12px] text-[#6B7280]">
                      Your bank identity has been confirmed
                    </Text>
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
              <Text fw={500} className="mb-1 text-[12px] text-[#374151]">
                Where to find your BVN?
              </Text>
              <Text fw={400} className="text-[12px] leading-[1.6] text-[#6B7280]">
                Dial *565*0# on your registered phone number to get your BVN, or check your bank
                app/statement.
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
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  Next of Kin Information
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Provide details of your next of kin
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <TextInput
                label="Full Name"
                placeholder="Enter next of kin's full name"
                radius="md"
                value={kinFullName}
                onChange={(e) => setKinFullName(e.currentTarget.value)}
                styles={inputStyles}
                required
              />
              <TextInput
                label="Relationship"
                placeholder="e.g. Spouse, Parent, Sibling"
                radius="md"
                value={kinRelationship}
                onChange={(e) => setKinRelationship(e.currentTarget.value)}
                styles={inputStyles}
                required
              />
              <TextInput
                label="Phone Number"
                placeholder="+234 800 000 0000"
                radius="md"
                value={kinPhone}
                onChange={(e) => setKinPhone(e.currentTarget.value)}
                styles={inputStyles}
                leftSection={<IconPhone size={16} color="#9CA3AF" />}
                required
              />
              <TextInput
                label="Email Address (Optional)"
                placeholder="email@example.com"
                radius="md"
                value={kinEmail}
                onChange={(e) => setKinEmail(e.currentTarget.value)}
                styles={inputStyles}
              />
            </div>
          </div>
        )}

        {/* Step 4: House Address */}
        {step === 4 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE9FE]">
                <IconHome size={20} color="#7C3AED" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  Residential Address
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Provide your current house address
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Textarea
                label="House Address"
                placeholder="Enter your full house address (e.g. 12, Allen Avenue)"
                radius="md"
                minRows={3}
                value={houseAddress}
                onChange={(e) => setHouseAddress(e.currentTarget.value)}
                styles={inputStyles}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="City"
                  placeholder="e.g. Ikeja"
                  radius="md"
                  value={city}
                  onChange={(e) => setCity(e.currentTarget.value)}
                  styles={inputStyles}
                  required
                />
                <TextInput
                  label="State"
                  placeholder="e.g. Lagos"
                  radius="md"
                  value={state}
                  onChange={(e) => setState(e.currentTarget.value)}
                  styles={inputStyles}
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
          </div>
        )}

        {/* Step 5: Photo Upload */}
        {step === 5 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F9FF]">
                <IconCamera size={20} color="#0284C7" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  Photo Verification
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Upload a clear selfie and a photo of your government-issued ID
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {/* Selfie upload */}
              <div>
                <Text fw={600} className="mb-2 text-[13px] text-[#374151]">
                  Selfie / Profile Photo <span className="text-red-500">*</span>
                </Text>
                <Text fw={400} className="mb-3 text-[12px] text-[#6B7280]">
                  Take a clear, well-lit photo of your face. No sunglasses or hats.
                </Text>
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/jpg,image/jpeg,image/png"
                  onChange={handleSelfieChange}
                  className="hidden"
                />
                {!selfieFile ? (
                  <button
                    onClick={() => selfieInputRef.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-6 py-8 transition-colors hover:border-[#0284C7] hover:bg-[#F0F9FF]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5E7EB]">
                      <IconCamera size={22} color="#6B7280" />
                    </div>
                    <div className="text-center">
                      <Text fw={600} className="text-[14px] text-[#374151]">
                        Upload selfie
                      </Text>
                      <Text fw={400} className="mt-1 text-[12px] text-[#9CA3AF]">
                        JPG or PNG (Max 5MB)
                      </Text>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0284C7]">
                      <IconCamera size={20} color="white" />
                    </div>
                    <div className="flex-1">
                      <Text fw={600} className="text-[13px] text-[#0F172A]">
                        {selfieFile.name}
                      </Text>
                      <Text fw={400} className="text-[12px] text-[#6B7280]">
                        {(selfieFile.size / 1024).toFixed(1)} KB
                      </Text>
                    </div>
                    <button
                      onClick={() => setSelfieFile(null)}
                      className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 hover:bg-[#FEE2E2]"
                    >
                      <IconX size={16} color="#EF4444" />
                    </button>
                  </div>
                )}
              </div>

              {/* ID Photo upload */}
              <div>
                <Text fw={600} className="mb-2 text-[13px] text-[#374151]">
                  Government-Issued ID Photo <span className="text-red-500">*</span>
                </Text>
                <Text fw={400} className="mb-3 text-[12px] text-[#6B7280]">
                  Upload a clear photo of your NIN slip, National ID card, passport, or driver's licence.
                </Text>
                <input
                  ref={idPhotoInputRef}
                  type="file"
                  accept="image/jpg,image/jpeg,image/png,.pdf"
                  onChange={handleIdPhotoChange}
                  className="hidden"
                />
                {!idPhotoFile ? (
                  <button
                    onClick={() => idPhotoInputRef.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-6 py-8 transition-colors hover:border-[#02A36E] hover:bg-[#F0FDF4]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5E7EB]">
                      <IconUpload size={22} color="#6B7280" />
                    </div>
                    <div className="text-center">
                      <Text fw={600} className="text-[14px] text-[#374151]">
                        Upload ID document
                      </Text>
                      <Text fw={400} className="mt-1 text-[12px] text-[#9CA3AF]">
                        JPG, PNG or PDF (Max 5MB)
                      </Text>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#02A36E]">
                      <IconId size={20} color="white" />
                    </div>
                    <div className="flex-1">
                      <Text fw={600} className="text-[13px] text-[#0F172A]">
                        {idPhotoFile.name}
                      </Text>
                      <Text fw={400} className="text-[12px] text-[#6B7280]">
                        {(idPhotoFile.size / 1024).toFixed(1)} KB
                      </Text>
                    </div>
                    <button
                      onClick={() => setIdPhotoFile(null)}
                      className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 hover:bg-[#FEE2E2]"
                    >
                      <IconX size={16} color="#EF4444" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Proof of Address */}
        {step === 6 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED]">
                <IconFileText size={20} color="#F97316" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  Proof of Address
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Upload a document that verifies your address
                </Text>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-[#F9FAFB] p-4">
              <Text fw={600} className="mb-2 text-[13px] text-[#374151]">
                Accepted documents:
              </Text>
              <div className="flex flex-col gap-1.5">
                {[
                  'Utility bill (not older than 3 months)',
                  'Bank statement',
                  'Tenancy agreement',
                  'Government-issued document with address',
                ].map((doc) => (
                  <div key={doc} className="flex items-center gap-2">
                    <IconCheck size={14} color="#02A36E" />
                    <Text fw={400} className="text-[13px] text-[#6B7280]">
                      {doc}
                    </Text>
                  </div>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            {!proofFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-6 py-10 transition-colors hover:border-[#02A36E] hover:bg-[#F0FDF4]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5E7EB]">
                  <IconUpload size={22} color="#6B7280" />
                </div>
                <div className="text-center">
                  <Text fw={600} className="text-[14px] text-[#374151]">
                    Click to upload
                  </Text>
                  <Text fw={400} className="mt-1 text-[12px] text-[#9CA3AF]">
                    PDF, JPG, or PNG (Max 5MB)
                  </Text>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#02A36E]">
                  <IconFile size={20} color="white" />
                </div>
                <div className="flex-1">
                  <Text fw={600} className="text-[13px] text-[#0F172A]">
                    {proofFile.name}
                  </Text>
                  <Text fw={400} className="text-[12px] text-[#6B7280]">
                    {(proofFile.size / 1024).toFixed(1)} KB
                  </Text>
                </div>
                <button
                  onClick={() => setProofFile(null)}
                  className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 hover:bg-[#FEE2E2]"
                >
                  <IconX size={16} color="#EF4444" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 7: Review */}
        {step === 7 && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
                Review Your Information
              </Text>
              <Text fw={400} className="mb-6 text-[13px] text-[#6B7280]">
                Please review the details below before submitting
              </Text>

              {/* NIN & BVN summary */}
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <IconShieldCheck size={16} color="#02A36E" />
                  <Text fw={600} className="text-[14px] text-[#0F172A]">
                    Identity Verification
                  </Text>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F9FAFB] p-4">
                  <div>
                    <Text fw={400} className="text-[11px] text-[#9CA3AF]">NIN</Text>
                    <div className="flex items-center gap-2">
                      <Text fw={500} className="text-[13px] text-[#0F172A]">
                        {nin.slice(0, 3)}****{nin.slice(-4)}
                      </Text>
                      <IconCheck size={14} color="#02A36E" />
                    </div>
                  </div>
                  <div>
                    <Text fw={400} className="text-[11px] text-[#9CA3AF]">BVN</Text>
                    <div className="flex items-center gap-2">
                      <Text fw={500} className="text-[13px] text-[#0F172A]">
                        {bvn.slice(0, 3)}****{bvn.slice(-4)}
                      </Text>
                      <IconCheck size={14} color="#02A36E" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Next of Kin summary */}
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <IconUser size={16} color="#D97706" />
                  <Text fw={600} className="text-[14px] text-[#0F172A]">
                    Next of Kin
                  </Text>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F9FAFB] p-4">
                  <div>
                    <Text fw={400} className="text-[11px] text-[#9CA3AF]">Full Name</Text>
                    <Text fw={500} className="text-[13px] text-[#0F172A]">{kinFullName}</Text>
                  </div>
                  <div>
                    <Text fw={400} className="text-[11px] text-[#9CA3AF]">Relationship</Text>
                    <Text fw={500} className="text-[13px] text-[#0F172A]">{kinRelationship}</Text>
                  </div>
                  <div>
                    <Text fw={400} className="text-[11px] text-[#9CA3AF]">Phone Number</Text>
                    <Text fw={500} className="text-[13px] text-[#0F172A]">{kinPhone}</Text>
                  </div>
                  {kinEmail && (
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">Email</Text>
                      <Text fw={500} className="text-[13px] text-[#0F172A]">{kinEmail}</Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Address summary */}
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <IconHome size={16} color="#7C3AED" />
                  <Text fw={600} className="text-[14px] text-[#0F172A]">
                    Residential Address
                  </Text>
                </div>
                <div className="rounded-xl bg-[#F9FAFB] p-4">
                  <Text fw={500} className="text-[13px] text-[#0F172A]">{houseAddress}</Text>
                  <Text fw={400} className="mt-1 text-[13px] text-[#6B7280]">
                    {city}, {state}{lga ? `, ${lga}` : ''}
                  </Text>
                </div>
              </div>

              {/* Photos summary */}
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <IconCamera size={16} color="#0284C7" />
                  <Text fw={600} className="text-[14px] text-[#0F172A]">
                    Photo Verification
                  </Text>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F9FAFB] p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0284C7]">
                      <IconCamera size={14} color="white" />
                    </div>
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">Selfie</Text>
                      <div className="flex items-center gap-1">
                        <Text fw={500} className="text-[12px] text-[#0F172A]">Uploaded</Text>
                        <IconCheck size={12} color="#02A36E" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#02A36E]">
                      <IconId size={14} color="white" />
                    </div>
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">ID Document</Text>
                      <div className="flex items-center gap-1">
                        <Text fw={500} className="text-[12px] text-[#0F172A]">Uploaded</Text>
                        <IconCheck size={12} color="#02A36E" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proof of Address summary */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <IconFileText size={16} color="#F97316" />
                  <Text fw={600} className="text-[14px] text-[#0F172A]">
                    Proof of Address
                  </Text>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#02A36E]">
                    <IconFile size={16} color="white" />
                  </div>
                  <div>
                    <Text fw={500} className="text-[13px] text-[#0F172A]">{proofFile?.name}</Text>
                    <Text fw={400} className="text-[12px] text-[#6B7280]">
                      {proofFile ? (proofFile.size / 1024).toFixed(1) : 0} KB
                    </Text>
                  </div>
                  <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#D1FAE5]">
                    <IconCheck size={14} color="#02A36E" />
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-4">
              <Text fw={500} className="text-[13px] leading-[1.6] text-[#0C4A6E]">
                By submitting, you confirm that all the information provided is accurate and up to
                date. Your details will be verified within 24-48 hours.
              </Text>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-6 py-3.5 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex-1 rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
              canProceed()
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            {step === 7 ? 'Submit KYC' : 'Continue'}
          </button>
        </div>

        {/* Skip for now (only on step 1) */}
        {step === 1 && (
          <button
            onClick={() => {
              localStorage.setItem('kyc_completed', 'true')
              navigate('/home')
            }}
            className="mt-4 w-full cursor-pointer text-center text-[13px] font-medium text-[#9CA3AF] hover:text-[#6B7280]"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
