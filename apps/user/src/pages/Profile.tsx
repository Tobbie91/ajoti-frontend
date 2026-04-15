import { useState, useEffect } from 'react'
import { Text, TextInput, Select, Avatar, Loader } from '@mantine/core'
import {
  IconArrowLeft,
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
  IconLock,
  IconChevronRight,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { logout as logoutApi, getUserProfile, updateUserProfile } from '@/utils/api'

function getUserFromStorage() {
  const stored = localStorage.getItem('user')
  return stored ? JSON.parse(stored) : {}
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

export function Profile() {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const user = getUserFromStorage()
  const [firstName, setFirstName] = useState(user.firstName || user.firstname || '')
  const [lastName, setLastName] = useState(user.lastName || user.lastname || '')
  const [email, setEmail] = useState(user.email || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [address, setAddress] = useState(user.address || '')
  const [city, setCity] = useState(user.city || '')
  const [state, setState] = useState<string | null>(user.state || null)
  const kycCompleted = localStorage.getItem('kyc_completed') === 'true'

  useEffect(() => {
    getUserProfile()
      .then((u) => {
        setFirstName(u.firstName || '')
        setLastName(u.lastName || '')
        setEmail(u.email || '')
        setPhone((u.phone as string) || '')
        setAddress((u.address as string) || '')
        setCity((u.city as string) || '')
        setState((u.state as string) || null)
        localStorage.setItem('user', JSON.stringify({ ...getUserFromStorage(), ...u }))
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateUserProfile({ firstName, lastName, phone, address, city, state: state ?? undefined })
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
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) await logoutApi(refreshToken)
    } catch {
      // ignore logout API errors
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('kyc_completed')
    navigate('/')
  }

  return (
    <div className="mx-auto w-full max-w-[700px] px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
      >
        <IconArrowLeft size={18} />
        Back
      </button>

      {/* Profile header */}
      <div className="mb-8 flex items-center gap-5">
        <Avatar size={80} radius="xl" color="green" variant="filled">
          {firstName[0]}{lastName[0]}
        </Avatar>
        <div className="flex-1">
          <Text fw={700} className="text-[24px] text-[#0F172A]">
            {firstName} {lastName}
          </Text>
          <Text fw={400} className="text-[14px] text-[#6B7280]">
            {email}
          </Text>
          {kycCompleted && (
            <div className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1">
              <IconShieldCheck size={14} color="#02A36E" />
              <Text fw={500} className="text-[12px] text-[#02A36E]">
                KYC Verified
              </Text>
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
        >
          <IconEdit size={16} />
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Personal Information */}
      <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={600} className="mb-5 text-[16px] text-[#0F172A]">
          Personal Information
        </Text>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">
                First Name
              </Text>
              {editing ? (
                <TextInput
                  value={firstName}
                  onChange={(e) => setFirstName(e.currentTarget.value)}
                  radius="md"
                  size="sm"
                  leftSection={<IconUser size={16} color="#9CA3AF" />}
                  styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
                />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">
                  {firstName}
                </Text>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">
                Last Name
              </Text>
              {editing ? (
                <TextInput
                  value={lastName}
                  onChange={(e) => setLastName(e.currentTarget.value)}
                  radius="md"
                  size="sm"
                  leftSection={<IconUser size={16} color="#9CA3AF" />}
                  styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
                />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">
                  {lastName}
                </Text>
              )}
            </div>
          </div>

          <div>
            <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">
              Email Address
            </Text>
            {editing ? (
              <TextInput
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                radius="md"
                size="sm"
                leftSection={<IconMail size={16} color="#9CA3AF" />}
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
              />
            ) : (
              <Text fw={500} className="text-[14px] text-[#0F172A]">
                {email}
              </Text>
            )}
          </div>

          <div>
            <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">
              Phone Number
            </Text>
            {editing ? (
              <TextInput
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                radius="md"
                size="sm"
                leftSection={<IconPhone size={16} color="#9CA3AF" />}
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
              />
            ) : (
              <Text fw={500} className="text-[14px] text-[#0F172A]">
                {phone}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={600} className="mb-5 text-[16px] text-[#0F172A]">
          Residential Address
        </Text>
        <div className="flex flex-col gap-4">
          <div>
            <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">
              Address
            </Text>
            {editing ? (
              <TextInput
                value={address}
                onChange={(e) => setAddress(e.currentTarget.value)}
                radius="md"
                size="sm"
                leftSection={<IconMapPin size={16} color="#9CA3AF" />}
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
              />
            ) : (
              <Text fw={500} className="text-[14px] text-[#0F172A]">
                {address}
              </Text>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">
                City
              </Text>
              {editing ? (
                <TextInput
                  value={city}
                  onChange={(e) => setCity(e.currentTarget.value)}
                  radius="md"
                  size="sm"
                  styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
                />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">
                  {city}
                </Text>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">
                State
              </Text>
              {editing ? (
                <Select
                  data={NIGERIAN_STATES}
                  value={state}
                  onChange={setState}
                  radius="md"
                  size="sm"
                  searchable
                  styles={{ input: { borderColor: '#E5E7EB', fontSize: 14 } }}
                />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">
                  {state}
                </Text>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC / Verification */}
      <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={600} className="mb-5 text-[16px] text-[#0F172A]">
          Verification Status
        </Text>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3">
            <div className="flex items-center gap-3">
              <IconId size={18} color="#6B7280" />
              <Text fw={500} className="text-[13px] text-[#0F172A]">
                NIN Verification
              </Text>
            </div>
            <div className="flex items-center gap-1.5">
              {kycCompleted ? (
                <>
                  <IconCheck size={14} color="#02A36E" />
                  <Text fw={500} className="text-[12px] text-[#02A36E]">Verified</Text>
                </>
              ) : (
                <Text fw={500} className="text-[12px] text-[#F59E0B]">Pending</Text>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3">
            <div className="flex items-center gap-3">
              <IconBuildingBank size={18} color="#6B7280" />
              <Text fw={500} className="text-[13px] text-[#0F172A]">
                BVN Verification
              </Text>
            </div>
            <div className="flex items-center gap-1.5">
              {kycCompleted ? (
                <>
                  <IconCheck size={14} color="#02A36E" />
                  <Text fw={500} className="text-[12px] text-[#02A36E]">Verified</Text>
                </>
              ) : (
                <Text fw={500} className="text-[12px] text-[#F59E0B]">Pending</Text>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction PIN */}
      <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={600} className="mb-5 text-[16px] text-[#0F172A]">
          Security
        </Text>
        <button
          onClick={() => navigate('/set-pin')}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3 hover:bg-[#F3F4F6]"
        >
          <div className="flex items-center gap-3">
            <IconLock size={18} color="#02A36E" />
            <Text fw={500} className="text-[13px] text-[#0F172A]">Transaction PIN</Text>
          </div>
          <IconChevronRight size={16} color="#9CA3AF" />
        </button>
      </div>

      {saveSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-3">
          <IconCheck size={16} color="#02A36E" />
          <Text fw={500} className="text-[13px] text-[#02A36E]">Profile updated successfully</Text>
        </div>
      )}
      {saveError && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3">
          <Text fw={500} className="text-[13px] text-red-600">{saveError}</Text>
        </div>
      )}

      {/* Save button when editing */}
      {editing && (
        <button
          onClick={handleSave}
          disabled={saving}
          className={`mb-6 w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${saving ? 'cursor-not-allowed bg-[#9CA3AF]' : 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'}`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader size={16} color="white" />
              Saving...
            </span>
          ) : 'Save Changes'}
        </button>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#EF4444] bg-white py-3.5 text-[14px] font-semibold text-[#EF4444] hover:bg-[#FEF2F2]"
      >
        <IconLogout size={18} />
        Log Out
      </button>
    </div>
  )
}
