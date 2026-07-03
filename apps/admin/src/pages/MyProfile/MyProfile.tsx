import { useState, useEffect } from 'react'
import { Text, TextInput, Select, Avatar, Badge, Loader, Modal, Button, PinInput, PasswordInput, Checkbox } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconShieldCheck,
  IconEdit,
  IconCheck,
  IconId,
  IconBuildingBank,
  IconLogout,
  IconUserCircle,
  IconCalendar,
  IconUsers,
  IconLock,
  IconChevronRight,
  IconPlus,
  IconStar,
  IconTrash,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  logout as logoutApi,
  getUserProfile,
  updateUserProfile,
  verifyPendingEmailChange,
  deleteMyAccount,
  freezeMyAccount,
  getKycStatus,
  listBankAccounts,
  removeBankAccount,
  setDefaultBankAccount,
  type KycStatus,
  type SavedBankAccount,
} from '@/utils/api'
import { PhoneInputField, AddBankAccountModal } from '@/components'

function getUserFromStorage() {
  const stored = localStorage.getItem('admin_user')
  return stored ? JSON.parse(stored) : {}
}

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau',
  'Rivers','Sokoto','Taraba','Yobe','Zamfara',
]

const inputStyles = {
  input: { borderColor: '#E5E7EB', fontSize: 14 },
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div>
      <Text fw={500} className="mb-1 text-[12px] text-[#6B7280]">{label}</Text>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} color="#9CA3AF" />}
        <Text fw={500} className="text-[14px] text-[#0F172A]">{value}</Text>
      </div>
    </div>
  )
}

export function MyProfile() {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null)
  const kycApproved = (kycStatus?.kycLevel ?? 0) >= 1
  // Mirrors the backend name-lock: names are immutable once identity is Mono-verified
  const nameLocked = Boolean(kycStatus?.ninVerified || kycStatus?.bvnVerified)

  const [deleteExpanded, setDeleteExpanded] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [accountStatus, setAccountStatus] = useState<string>(getUserFromStorage().status || 'ACTIVE')
  const [freezeExpanded, setFreezeExpanded] = useState(false)
  const [freezePassword, setFreezePassword] = useState('')
  const [freezeReason, setFreezeReason] = useState('')
  const [freezeAcknowledged, setFreezeAcknowledged] = useState(false)
  const [freezing, setFreezing] = useState(false)
  const [freezeError, setFreezeError] = useState<string | null>(null)

  const [bankAccounts, setBankAccounts] = useState<SavedBankAccount[]>([])
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(true)
  const [addBankModalOpen, setAddBankModalOpen] = useState(false)
  const [removingBank, setRemovingBank] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailModalStep, setEmailModalStep] = useState<'password' | 'otp'>('password')
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null)
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState<string | null>(null)
  const [lga, setLga] = useState('')
  const [dob, setDob] = useState('')

  const fullName = `${firstName} ${lastName}`.trim()
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

  useEffect(() => {
    // Seed from localStorage immediately for fast render
    const stored = getUserFromStorage()
    setFirstName(stored.firstName || stored.firstname || '')
    setLastName(stored.lastName || stored.lastname || '')
    setEmail(stored.email || '')
    setOriginalEmail(stored.email || '')
    setPhone(stored.phone || '')
    setDob(stored.dob || '')

    // Fetch fresh from API
    getUserProfile()
      .then((profile) => {
        setFirstName(profile.firstName || '')
        setLastName(profile.lastName || '')
        setEmail(profile.email || '')
        setOriginalEmail(profile.email || '')
        setPhone(profile.phone || '')
        setDob((profile.dob as string) || '')
        if (profile.status) setAccountStatus(profile.status)
        // Update localStorage with fresh data
        localStorage.setItem('admin_user', JSON.stringify(profile))
      })
      .catch(() => {}) // fallback to localStorage values already set
      .finally(() => setProfileLoading(false))

    getKycStatus().then(setKycStatus).catch(() => {})
  }, [])

  useEffect(() => {
    if (kycStatus) {
      setAddress(kycStatus.address || '')
      setCity(kycStatus.city || '')
      setState(kycStatus.state || null)
      setLga(kycStatus.lga || '')
    }
  }, [kycStatus])

  useEffect(() => {
    listBankAccounts()
      .then((res) => setBankAccounts(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingBankAccounts(false))
  }, [])

  async function handleRemoveBankAccount(id: string) {
    setRemovingBank(id)
    try {
      await removeBankAccount(id)
      setBankAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      notifications.show({
        message: err instanceof Error ? err.message : 'Failed to remove account',
        color: 'red',
        autoClose: 4000,
      })
    } finally {
      setRemovingBank(null)
    }
  }

  async function handleSetDefaultBankAccount(id: string) {
    setSettingDefault(id)
    try {
      await setDefaultBankAccount(id)
      setBankAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
      notifications.show({
        message: 'Default account updated',
        color: 'green',
        autoClose: 3000,
      })
    } catch (err) {
      notifications.show({
        message: err instanceof Error ? err.message : 'Failed to update default',
        color: 'red',
        autoClose: 4000,
      })
    } finally {
      setSettingDefault(null)
    }
  }

  async function handleSendEmailOtp() {
    if (!currentPasswordForEmail) {
      setEmailVerificationError('Password is required')
      return
    }
    setEmailVerificationError(null)
    setEmailVerificationLoading(true)
    try {
      await updateUserProfile({
        firstName,
        lastName,
        phone,
        email,
        currentPassword: currentPasswordForEmail,
      })
      setEmailModalStep('otp')
    } catch (err) {
      setEmailVerificationError(err instanceof Error ? err.message : 'Failed to send verification code')
    } finally {
      setEmailVerificationLoading(false)
    }
  }

  async function handleVerifyEmailOtp() {
    if (emailOtp.length !== 6) {
      setEmailVerificationError('Please enter a 6-digit code')
      return
    }
    setEmailVerificationError(null)
    setEmailVerificationLoading(true)
    try {
      await verifyPendingEmailChange(emailOtp)
      const updatedUser = { ...getUserFromStorage(), email }
      localStorage.setItem('admin_user', JSON.stringify(updatedUser))
      setOriginalEmail(email)
      
      notifications.show({
        message: 'Email address updated successfully',
        color: 'green',
        autoClose: 3000,
      })
      setEmailModalOpen(false)
      setEditing(false)
    } catch (err) {
      setEmailVerificationError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setEmailVerificationLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      if (email !== originalEmail) {
        setEmailModalOpen(true)
        setEmailModalStep('password')
        setCurrentPasswordForEmail('')
        setEmailOtp('')
        setEmailVerificationError(null)
        setSaving(false)
        return
      }

      const res = await updateUserProfile({
        firstName,
        lastName,
        phone,
        address,
        city,
        lga,
        ...(state ? { state } : {}),
      })
      if (res.data) localStorage.setItem('admin_user', JSON.stringify(res.data))
      setSaveSuccess(true)
      setEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token')
      if (refreshToken) await logoutApi(refreshToken)
    } catch {
      // ignore logout API errors
    }
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_kyc_completed')
    navigate('/login')
  }

  async function handleFreezeAccount() {
    setFreezing(true)
    setFreezeError(null)
    try {
      await freezeMyAccount(freezePassword, freezeReason || undefined)
      setAccountStatus('FROZEN')
      localStorage.setItem('admin_user', JSON.stringify({ ...getUserFromStorage(), status: 'FROZEN' }))
      setFreezeExpanded(false)
      setFreezePassword('')
      setFreezeReason('')
      setFreezeAcknowledged(false)
      notifications.show({
        message: 'Your account has been frozen. Contact support to unlock it once your identity is verified.',
        color: 'orange',
        autoClose: 6000,
      })
    } catch (err) {
      setFreezeError(err instanceof Error ? err.message : 'Failed to freeze account')
    } finally {
      setFreezing(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteMyAccount(deletePassword, deleteReason || undefined)
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_kyc_completed')
      navigate('/login')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[720px] py-2">
      {profileLoading && (
        <div className="mb-4 flex items-center gap-2 text-[#6B7280]">
          <Loader size="xs" color="#02A36E" />
          <Text fz="xs">Loading profile...</Text>
        </div>
      )}

      {accountStatus === 'FROZEN' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-4">
          <IconLock size={18} color="#F97316" className="mt-0.5 flex-shrink-0" />
          <div>
            <Text fw={600} className="text-[13px] text-[#9A3412]">Account Frozen</Text>
            <Text fw={400} className="mt-0.5 text-[12px] text-[#9A3412]">
              Withdrawals, bank account changes, and security setting changes are blocked. Contact
              support and verify your identity to unlock your account — this cannot be undone from
              within the app.
            </Text>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-center gap-4">
          <Avatar size={64} radius="xl" style={{ background: '#0B6B55', color: 'white', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
            {initials}
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Text fw={700} className="truncate text-[18px] text-[#0F172A]">{fullName}</Text>
              <Badge color="green" variant="light" size="sm" style={{ flexShrink: 0 }}>Admin</Badge>
            </div>
            <Text fw={400} className="mt-0.5 truncate text-[13px] text-[#6B7280]">
              {email}
            </Text>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            <IconEdit size={14} />
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {kycApproved ? (
            <div className="flex w-fit items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1">
              <IconShieldCheck size={13} color="#02A36E" />
              <Text fw={500} className="text-[11px] text-[#02A36E]">KYC Verified</Text>
            </div>
          ) : (
            <button
              onClick={() => navigate('/kyc')}
              className="flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1 hover:bg-[#FDE68A]"
            >
              <IconShieldCheck size={13} color="#F59E0B" />
              <Text fw={500} className="text-[11px] text-[#92400E]">Complete Verification</Text>
            </button>
          )}
          <div className="flex w-fit items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1">
            <IconUserCircle size={13} color="#3B82F6" />
            <Text fw={500} className="text-[11px] text-[#3B82F6]">Active Admin</Text>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={700} className="mb-5 text-[15px] text-[#0F172A]">Personal Information</Text>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">First Name</Text>
              {editing && !nameLocked ? (
                <TextInput value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} radius="md" size="sm" leftSection={<IconUser size={16} color="#9CA3AF" />} styles={inputStyles} />
              ) : (
                <div className="flex items-center gap-2">
                  <IconUser size={15} color="#9CA3AF" />
                  <Text fw={500} className="text-[14px] text-[#0F172A]">{firstName}</Text>
                </div>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Last Name</Text>
              {editing && !nameLocked ? (
                <TextInput value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} radius="md" size="sm" leftSection={<IconUser size={16} color="#9CA3AF" />} styles={inputStyles} />
              ) : (
                <div className="flex items-center gap-2">
                  <IconUser size={15} color="#9CA3AF" />
                  <Text fw={500} className="text-[14px] text-[#0F172A]">{lastName}</Text>
                </div>
              )}
            </div>
          </div>
          {editing && nameLocked && (
            <Text fw={400} className="-mt-2 text-[11px] text-[#9CA3AF]">
              Your name is verified with your BVN/NIN and can no longer be changed here. Contact
              support if it needs correcting.
            </Text>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Email Address</Text>
              {editing ? (
                <TextInput value={email} onChange={(e) => setEmail(e.currentTarget.value)} radius="md" size="sm" leftSection={<IconMail size={16} color="#9CA3AF" />} styles={inputStyles} />
              ) : (
                <div className="flex items-start gap-2">
                  <IconMail size={15} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Text fw={500} className="text-[14px] text-[#0F172A]" style={{ wordBreak: 'break-all' }}>{email}</Text>
                </div>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Phone Number</Text>
              {editing ? (
                <PhoneInputField value={phone} onChange={setPhone} size="sm" styles={inputStyles} />
              ) : (
                <div className="flex items-center gap-2">
                  <IconPhone size={15} color="#9CA3AF" style={{ flexShrink: 0 }} />
                  <Text fw={500} className="text-[14px] text-[#0F172A]" style={{ wordBreak: 'break-all' }}>{phone}</Text>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Date of Birth" value={dob || '—'} icon={IconCalendar} />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[#F0FDF4] px-4 py-3">
            <IconUsers size={16} color="#02A36E" />
            <div>
              <Text fw={500} className="text-[12px] text-[#6B7280]">Account Role</Text>
              <Text fw={600} className="text-[14px] text-[#0B6B55]">Admin</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Residential Address */}
      <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={700} className="mb-5 text-[15px] text-[#0F172A]">Residential Address</Text>
        <div className="flex flex-col gap-4">
          <div>
            <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">House Address</Text>
            {editing ? (
              <TextInput
                value={address}
                onChange={(e) => setAddress(e.currentTarget.value)}
                radius="md"
                size="sm"
                placeholder="Street address"
                leftSection={<IconMapPin size={15} color="#9CA3AF" />}
                styles={inputStyles}
              />
            ) : (
              <div className="flex items-center gap-2">
                <IconMapPin size={15} color="#9CA3AF" />
                <Text fw={500} className="text-[14px] text-[#0F172A]">{address || '—'}</Text>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">City</Text>
              {editing ? (
                <TextInput value={city} onChange={(e) => setCity(e.currentTarget.value)} radius="md" size="sm" placeholder="City" styles={inputStyles} />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">{city || '—'}</Text>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">State</Text>
              {editing ? (
                <Select data={NIGERIAN_STATES} value={state} onChange={setState} radius="md" size="sm" placeholder="State" searchable styles={inputStyles} />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">{state || '—'}</Text>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">LGA</Text>
              {editing ? (
                <TextInput value={lga} onChange={(e) => setLga(e.currentTarget.value)} radius="md" size="sm" placeholder="LGA" styles={inputStyles} />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">{lga || '—'}</Text>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC / Verification */}
      <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={700} className="mb-4 text-[15px] text-[#0F172A]">Verification Status</Text>

        {(() => {
          const level = kycStatus?.kycLevel ?? 0
          const step = kycStatus?.step

          const tierLabel = ['Unverified', 'Level 1', 'Level 2', 'Level 3'][level] ?? `Level ${level}`
          const tierColor = ['#F59E0B', '#02A36E', '#2563EB', '#7C3AED'][level] ?? '#02A36E'
          const tierBg = ['#FEF3C7', '#F0FDF4', '#EFF6FF', '#EDE9FE'][level] ?? '#F0FDF4'

          const limits: Record<number, { single: string; daily: string }> = {
            0: { single: '₦0', daily: '₦0' },
            1: { single: '₦50,000', daily: '₦300,000' },
            2: { single: '₦100,000', daily: '₦500,000' },
            3: { single: '₦5,000,000', daily: '₦25,000,000' },
          }
          const nextLimits: Record<number, { single: string; daily: string }> = {
            1: { single: '₦100,000', daily: '₦500,000' },
            2: { single: '₦5,000,000', daily: '₦25,000,000' },
          }

          return (
            <div className="flex flex-col gap-4">
              {/* Current tier badge + limits */}
              <div className="rounded-xl p-4" style={{ background: tierBg }}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconShieldCheck size={16} color={tierColor} />
                    <Text fw={700} className="text-[14px]" style={{ color: tierColor }}>{tierLabel}</Text>
                  </div>
                  {level > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: tierColor }}>
                      Active
                    </span>
                  )}
                </div>
                {level > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">Single transaction</Text>
                      <Text fw={700} className="text-[15px] text-[#0F172A]">{limits[level].single}</Text>
                    </div>
                    <div>
                      <Text fw={400} className="text-[11px] text-[#9CA3AF]">Daily limit</Text>
                      <Text fw={700} className="text-[15px] text-[#0F172A]">{limits[level].daily}</Text>
                    </div>
                  </div>
                ) : (
                  <Text fw={400} className="text-[12px] text-[#6B7280]">
                    Complete identity verification to activate your admin account.
                  </Text>
                )}
              </div>

              {/* NIN / BVN rows — only shown while at Level 0 */}
              {level === 0 && (
                <>
                  <div className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <IconId size={18} color="#6B7280" />
                      <Text fw={500} className="text-[13px] text-[#0F172A]">NIN Verification</Text>
                    </div>
                    {kycStatus?.ninVerified ? (
                      <div className="flex items-center gap-1.5">
                        <IconCheck size={14} color="#02A36E" />
                        <Text fw={500} className="text-[12px] text-[#02A36E]">Verified</Text>
                      </div>
                    ) : (
                      <Text fw={500} className="text-[12px] text-[#F59E0B]">Pending</Text>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <IconBuildingBank size={18} color="#6B7280" />
                      <Text fw={500} className="text-[13px] text-[#0F172A]">BVN Verification</Text>
                    </div>
                    {kycStatus?.bvnVerified ? (
                      <div className="flex items-center gap-1.5">
                        <IconCheck size={14} color="#02A36E" />
                        <Text fw={500} className="text-[12px] text-[#02A36E]">Verified</Text>
                      </div>
                    ) : (
                      <Text fw={500} className="text-[12px] text-[#F59E0B]">Pending</Text>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/kyc')}
                    className="mt-1 w-full cursor-pointer rounded-xl bg-[#0b6b55] py-3 text-[13px] font-semibold text-white hover:bg-[#094f3e]"
                  >
                    {kycStatus?.ninVerified || kycStatus?.bvnVerified ? 'Resume Verification' : 'Start Verification'}
                  </button>
                </>
              )}

              {/* Pending review */}
              {(step === 'PHOTO_REQUIRED' || step === 'PROOF_OF_ADDRESS_REQUIRED') && kycStatus?.status === 'PENDING' && (
                <div className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3">
                  <Text fw={500} className="text-[13px] text-[#D97706]">
                    Level {level + 1} upgrade under review — usually approved within 24–48 hours.
                  </Text>
                </div>
              )}

              {/* Upgrade prompt — Level 1 or Level 2 */}
              {level >= 1 && level < 3 && step !== 'PHOTO_REQUIRED' && step !== 'PROOF_OF_ADDRESS_REQUIRED' && (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <Text fw={600} className="mb-1 text-[13px] text-[#0F172A]">Upgrade to Level {level + 1}</Text>
                  <Text fw={400} className="mb-3 text-[12px] text-[#6B7280]">
                    Increase your limits to <strong>{nextLimits[level]?.single}</strong> per transaction
                    and <strong>{nextLimits[level]?.daily}</strong> daily.
                  </Text>
                  <button
                    onClick={() => navigate('/kyc')}
                    className="w-full cursor-pointer rounded-xl bg-[#0F172A] py-2.5 text-[13px] font-semibold text-white hover:bg-[#1E293B]"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}

              {/* Fully verified */}
              {level >= 3 && (
                <div className="flex items-center gap-2 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-3">
                  <IconShieldCheck size={16} color="#02A36E" />
                  <Text fw={500} className="text-[13px] text-[#065F46]">
                    Your identity is fully verified. Maximum limits unlocked.
                  </Text>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Security */}
      <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={700} className="mb-5 text-[15px] text-[#0F172A]">Security</Text>
        <button
          onClick={() => navigate('/set-pin')}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3 hover:bg-[#F3F4F6]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0FDF4]">
              <IconLock size={18} color="#02A36E" />
            </div>
            <div>
              <Text fw={600} className="text-[13px] text-[#0F172A]">Transaction PIN</Text>
              <Text fw={400} className="text-[12px] text-[#6B7280]">Set or change your withdrawal PIN</Text>
            </div>
          </div>
          <IconChevronRight size={16} color="#9CA3AF" />
        </button>
      </div>

      {/* Bank Accounts */}
      <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <Text fw={600} className="text-[16px] text-[#0F172A]">Bank Accounts</Text>
          <button
            onClick={() => setAddBankModalOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#F0FDF4] px-3 py-1.5 text-[12px] font-medium text-[#02A36E] hover:bg-[#dcfce7]"
          >
            <IconPlus size={13} /> Add
          </button>
        </div>

        {loadingBankAccounts ? (
          <div className="flex items-center gap-2 py-3">
            <Loader size={14} color="#02A36E" />
            <Text fw={400} className="text-[13px] text-[#6B7280]">Loading...</Text>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-4 py-6 text-center">
            <IconBuildingBank size={24} color="#9CA3AF" className="mx-auto mb-2" />
            <Text fw={400} className="text-[13px] text-[#6B7280]">No bank accounts saved yet.</Text>
            <Text fw={400} className="text-[12px] text-[#9CA3AF]">
              Add one to speed up future withdrawals.
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Text fw={600} className="text-[14px] text-[#0F172A]">{acc.accountName}</Text>
                    {acc.isDefault && (
                      <span className="rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-medium text-[#02A36E]">
                        Default
                      </span>
                    )}
                  </div>
                  <Text fw={400} className="text-[12px] text-[#6B7280]">
                    {acc.accountNumber} · {acc.bankName}
                  </Text>
                </div>
                <div className="flex items-center gap-1">
                  {!acc.isDefault && (
                    <button
                      onClick={() => handleSetDefaultBankAccount(acc.id)}
                      disabled={settingDefault === acc.id}
                      title="Set as default"
                      className="cursor-pointer rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F0FDF4] hover:text-[#02A36E] disabled:opacity-40"
                    >
                      {settingDefault === acc.id ? (
                        <Loader size={14} color="#02A36E" />
                      ) : (
                        <IconStar size={15} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveBankAccount(acc.id)}
                    disabled={removingBank === acc.id}
                    className="cursor-pointer rounded-lg p-1.5 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                  >
                    {removingBank === acc.id ? (
                      <Loader size={14} color="#9CA3AF" />
                    ) : (
                      <IconTrash size={15} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddBankAccountModal
        opened={addBankModalOpen}
        onClose={() => setAddBankModalOpen(false)}
        onSuccess={(acc) => {
          setBankAccounts((prev) => [...prev, acc])
          setAddBankModalOpen(false)
        }}
      />

      {/* Save button */}
      {editing && (
        <>
          {saveError && (
            <div className="mb-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
              <Text fw={500} className="text-[13px] text-[#EF4444]">{saveError}</Text>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b] disabled:opacity-60"
          >
            {saving ? <Loader size="xs" color="white" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      )}

      {/* Save success */}
      {saveSuccess && !editing && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#F0FDF4] px-4 py-3">
          <IconCheck size={16} color="#02A36E" />
          <Text fw={500} className="text-[13px] text-[#02A36E]">Profile updated successfully</Text>
        </div>
      )}

      <Modal
        opened={emailModalOpen}
        onClose={() => {
          if (!emailVerificationLoading) setEmailModalOpen(false)
        }}
        title={<Text fw={700} className="text-[16px] text-[#0F172A]">Verify Email Change</Text>}
        centered
        radius="md"
        size="sm"
        withCloseButton={!emailVerificationLoading}
      >
        {emailModalStep === 'password' ? (
          <div className="flex flex-col gap-4">
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              To update your email address to <strong>{email}</strong>, please enter your current account password.
            </Text>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Current Password</Text>
              <PasswordInput
                placeholder="Enter password"
                value={currentPasswordForEmail}
                onChange={(e) => setCurrentPasswordForEmail(e.currentTarget.value)}
                radius="md"
                size="sm"
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
              />
            </div>
            {emailVerificationError && (
              <Text fw={500} className="text-[12px] text-red-600">
                {emailVerificationError}
              </Text>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="subtle"
                color="gray"
                onClick={() => setEmailModalOpen(false)}
                disabled={emailVerificationLoading}
                size="xs"
              >
                Cancel
              </Button>
              <Button
                bg="#02A36E"
                onClick={handleSendEmailOtp}
                loading={emailVerificationLoading}
                size="xs"
              >
                Send Code
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              We've sent a 6-digit verification code to <strong>{email}</strong>. Enter it below to complete the change.
            </Text>
            <div className="flex justify-center my-2">
              <PinInput
                length={6}
                value={emailOtp}
                onChange={setEmailOtp}
                type="number"
                oneTimeCode
                autoFocus
              />
            </div>
            {emailVerificationError && (
              <Text fw={500} className="text-[12px] text-red-600 text-center">
                {emailVerificationError}
              </Text>
            )}
            <div className="flex flex-col gap-2 mt-2">
              <Button
                bg="#02A36E"
                onClick={handleVerifyEmailOtp}
                loading={emailVerificationLoading}
                size="sm"
                fullWidth
              >
                Verify & Update Email
              </Button>
              <Button
                variant="subtle"
                color="gray"
                onClick={() => setEmailModalStep('password')}
                disabled={emailVerificationLoading}
                size="xs"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#EF4444] bg-white py-3.5 text-[14px] font-semibold text-[#EF4444] hover:bg-[#FEF2F2]"
      >
        <IconLogout size={18} />
        Log Out
      </button>

      {/* Freeze My Account */}
      {accountStatus !== 'FROZEN' && (
        <div className="mb-4 rounded-2xl border border-[#FED7AA] bg-white p-5">
          <button
            onClick={() => setFreezeExpanded(!freezeExpanded)}
            className="flex w-full cursor-pointer items-center justify-between"
          >
            <div className="text-left">
              <Text fw={600} className="text-[14px] text-[#EA580C]">Freeze My Account</Text>
              <Text fw={400} className="text-[12px] text-[#9CA3AF]">
                Temporarily lock down sensitive actions if you suspect your account is compromised.
              </Text>
            </div>
            <span className="text-[#EA580C] text-[18px] flex-shrink-0">{freezeExpanded ? '−' : '+'}</span>
          </button>

          {freezeExpanded && (
            <div className="mt-4 flex flex-col gap-4">
              <div className="rounded-xl bg-[#FFF7ED] px-4 py-3">
                <Text fw={400} className="text-[12px] text-[#9A3412]">
                  Freezing is a security measure — not the same as deleting your account, and it's
                  reversible once support verifies your identity.
                </Text>
                <Text fw={600} className="mt-3 text-[12px] text-[#9A3412]">While frozen, you can still:</Text>
                <ul className="mt-1 list-disc pl-4 text-[12px] text-[#9A3412]">
                  <li>Log in and view your account, balances, and transaction history</li>
                  <li>Receive ROSCA payouts into your wallet</li>
                  <li>Make contributions to your ROSCA circles</li>
                </ul>
                <Text fw={600} className="mt-3 text-[12px] text-[#9A3412]">While frozen, you cannot:</Text>
                <ul className="mt-1 list-disc pl-4 text-[12px] text-[#9A3412]">
                  <li>Withdraw money to your bank account</li>
                  <li>Add, remove, or change saved bank accounts</li>
                  <li>Change your email, phone number, password, or transaction PIN</li>
                </ul>
                <Text fw={400} className="mt-3 text-[12px] text-[#9A3412]">
                  <strong>To unfreeze:</strong> contact support and verify your identity. There's no way
                  to unfreeze your account yourself in-app — this is intentional, so a compromised
                  account can't be un-frozen by whoever compromised it either.
                </Text>
              </div>

              {freezeError && (
                <div className="rounded-xl bg-red-50 px-4 py-3">
                  <Text fw={500} className="text-[12px] text-red-600">{freezeError}</Text>
                </div>
              )}

              <div>
                <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Reason (optional)</Text>
                <TextInput
                  placeholder="Why are you freezing your account? (helps support verify you faster)"
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.currentTarget.value)}
                  radius="md"
                  size="sm"
                  styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
                />
              </div>

              <div>
                <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Current Password</Text>
                <PasswordInput
                  placeholder="Enter your password"
                  value={freezePassword}
                  onChange={(e) => setFreezePassword(e.currentTarget.value)}
                  radius="md"
                  size="sm"
                  leftSection={<IconLock size={16} color="#9CA3AF" />}
                  styles={{ input: { borderColor: '#FED7AA', fontSize: 14 } }}
                />
              </div>

              <Checkbox
                checked={freezeAcknowledged}
                onChange={(e) => setFreezeAcknowledged(e.currentTarget.checked)}
                label="I understand my account will be locked out of withdrawals, bank account changes, and security settings until support unlocks it"
                size="sm"
                color="orange"
                styles={{ label: { fontSize: 12, color: '#374151' } }}
              />

              <button
                onClick={handleFreezeAccount}
                disabled={freezing || !freezeAcknowledged || freezePassword.length < 8}
                className={`w-full rounded-xl py-3 text-[13px] font-semibold text-white ${
                  freezing || !freezeAcknowledged || freezePassword.length < 8
                    ? 'cursor-not-allowed bg-[#FDBA74]'
                    : 'cursor-pointer bg-[#F97316] hover:bg-[#EA580C]'
                }`}
              >
                {freezing ? 'Freezing...' : 'Freeze My Account'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Account */}
      <div className="rounded-2xl border border-[#FCA5A5] bg-white p-5">
        <button
          onClick={() => setDeleteExpanded(!deleteExpanded)}
          className="flex w-full cursor-pointer items-center justify-between"
        >
          <Text fw={600} className="text-[14px] text-[#EF4444]">Delete Account</Text>
          <span className="text-[#EF4444] text-[18px]">{deleteExpanded ? '−' : '+'}</span>
        </button>

        {deleteExpanded && (
          <div className="mt-4 flex flex-col gap-4">
            <Text fw={400} className="text-[12px] text-[#6B7280]">
              This permanently closes your account, deletes your data, and cannot be undone.
              Make sure your wallet balance is zero and you have no active circle memberships before proceeding.
            </Text>

            {deleteError && (
              <div className="rounded-xl bg-red-50 px-4 py-3">
                <Text fw={500} className="text-[12px] text-red-600">{deleteError}</Text>
              </div>
            )}

            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Current Password</Text>
              <PasswordInput
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.currentTarget.value)}
                radius="md"
                size="sm"
                leftSection={<IconLock size={16} color="#9CA3AF" />}
                styles={{ input: { borderColor: '#FCA5A5', fontSize: 14 } }}
              />
            </div>

            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Reason (optional)</Text>
              <TextInput
                placeholder="Why are you leaving?"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.currentTarget.value)}
                radius="md"
                size="sm"
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
              />
            </div>

            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">
                Type <strong>DELETE</strong> to confirm
              </Text>
              <TextInput
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.currentTarget.value)}
                radius="md"
                size="sm"
                styles={{ input: { borderColor: '#FCA5A5', fontSize: 14 } }}
              />
            </div>

            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== 'DELETE' || deletePassword.length < 8}
              className={`w-full rounded-xl py-3 text-[13px] font-semibold text-white ${
                deleting || deleteConfirm !== 'DELETE' || deletePassword.length < 8
                  ? 'cursor-not-allowed bg-[#FCA5A5]'
                  : 'cursor-pointer bg-[#EF4444] hover:bg-[#DC2626]'
              }`}
            >
              {deleting ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
