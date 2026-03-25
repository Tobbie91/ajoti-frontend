import { useState } from 'react'
import { Text, TextInput, Select, Avatar, Badge } from '@mantine/core'
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
  IconCamera,
  IconFileText,
  IconLogout,
  IconUserCircle,
  IconCalendar,
  IconUsers,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { logout as logoutApi } from '@/utils/api'

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

  const user = getUserFromStorage()
  const kycCompleted = localStorage.getItem('admin_kyc_completed') === 'true'

  const [firstName, setFirstName] = useState(user.firstName || user.firstname || '')
  const [lastName, setLastName] = useState(user.lastName || user.lastname || '')
  const fullName = `${firstName} ${lastName}`.trim()
  const [email, setEmail] = useState(user.email || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [address, setAddress] = useState(user.address || '')
  const [city, setCity] = useState(user.city || '')
  const [state, setState] = useState<string | null>(user.state || null)
  const [lga, setLga] = useState(user.lga || '')

  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

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

  return (
    <div className="mx-auto w-full max-w-[720px] py-2">

      {/* Profile header */}
      <div className="mb-6 flex items-center gap-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Avatar size={72} radius="xl" style={{ background: '#0B6B55', color: 'white', fontWeight: 700, fontSize: 22 }}>
          {initials}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Text fw={700} className="text-[22px] text-[#0F172A]">{fullName}</Text>
            <Badge color="green" variant="light" size="sm">Admin</Badge>
          </div>
          <Text fw={400} className="mt-0.5 text-[13px] text-[#6B7280]">
            {email}
          </Text>
          <div className="mt-2 flex gap-2">
            {kycCompleted && (
              <div className="flex w-fit items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1">
                <IconShieldCheck size={13} color="#02A36E" />
                <Text fw={500} className="text-[11px] text-[#02A36E]">KYC Verified</Text>
              </div>
            )}
            <div className="flex w-fit items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1">
              <IconUserCircle size={13} color="#3B82F6" />
              <Text fw={500} className="text-[11px] text-[#3B82F6]">Active Admin</Text>
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
        >
          <IconEdit size={15} />
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Personal Information */}
      <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <Text fw={700} className="mb-5 text-[15px] text-[#0F172A]">Personal Information</Text>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">First Name</Text>
              {editing ? (
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
              {editing ? (
                <TextInput value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} radius="md" size="sm" leftSection={<IconUser size={16} color="#9CA3AF" />} styles={inputStyles} />
              ) : (
                <div className="flex items-center gap-2">
                  <IconUser size={15} color="#9CA3AF" />
                  <Text fw={500} className="text-[14px] text-[#0F172A]">{lastName}</Text>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Email Address</Text>
              {editing ? (
                <TextInput value={email} onChange={(e) => setEmail(e.currentTarget.value)} radius="md" size="sm" leftSection={<IconMail size={16} color="#9CA3AF" />} styles={inputStyles} />
              ) : (
                <div className="flex items-center gap-2">
                  <IconMail size={15} color="#9CA3AF" />
                  <Text fw={500} className="text-[14px] text-[#0F172A]">{email}</Text>
                </div>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">Phone Number</Text>
              {editing ? (
                <TextInput value={phone} onChange={(e) => setPhone(e.currentTarget.value)} radius="md" size="sm" leftSection={<IconPhone size={16} color="#9CA3AF" />} styles={inputStyles} />
              ) : (
                <div className="flex items-center gap-2">
                  <IconPhone size={15} color="#9CA3AF" />
                  <Text fw={500} className="text-[14px] text-[#0F172A]">{phone}</Text>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Date of Birth" value={user.dob || ''} icon={IconCalendar} />
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
              <TextInput value={address} onChange={(e) => setAddress(e.currentTarget.value)} radius="md" size="sm" leftSection={<IconMapPin size={16} color="#9CA3AF" />} styles={inputStyles} />
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
                <TextInput value={city} onChange={(e) => setCity(e.currentTarget.value)} radius="md" size="sm" styles={inputStyles} />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">{city || '—'}</Text>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">State</Text>
              {editing ? (
                <Select data={NIGERIAN_STATES} value={state} onChange={setState} radius="md" size="sm" searchable styles={inputStyles} />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">{state || '—'}</Text>
              )}
            </div>
            <div>
              <Text fw={500} className="mb-1.5 text-[12px] text-[#6B7280]">LGA</Text>
              {editing ? (
                <TextInput value={lga} onChange={(e) => setLga(e.currentTarget.value)} radius="md" size="sm" styles={inputStyles} />
              ) : (
                <Text fw={500} className="text-[14px] text-[#0F172A]">{lga || '—'}</Text>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC Verification */}
      <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <Text fw={700} className="text-[15px] text-[#0F172A]">Identity Verification</Text>
          {kycCompleted && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1">
              <IconShieldCheck size={13} color="#02A36E" />
              <Text fw={500} className="text-[11px] text-[#02A36E]">All Verified</Text>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF]">
                <IconId size={18} color="#3B82F6" />
              </div>
              <Text fw={600} className="text-[13px] text-[#0F172A]">NIN Verification</Text>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0FDF4]">
                <IconBuildingBank size={18} color="#02A36E" />
              </div>
              <Text fw={600} className="text-[13px] text-[#0F172A]">BVN Verification</Text>
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

      {/* Save button */}
      {editing && (
        <button
          onClick={() => setEditing(false)}
          className="mb-4 w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
        >
          Save Changes
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
