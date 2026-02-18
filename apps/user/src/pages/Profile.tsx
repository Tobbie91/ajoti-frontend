import { useState } from 'react'
import { Text, TextInput, Select, Avatar } from '@mantine/core'
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
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

// Mock user data
const MOCK_USER = {
  firstName: 'Osho',
  lastName: 'Michael',
  email: 'osho.michael@email.com',
  phone: '+234 801 234 5678',
  address: '12 Marina Road, Lagos Island',
  city: 'Lagos',
  state: 'Lagos',
  nin: '12345678901',
  bvn: '22345678901',
  kycVerified: true,
  joinDate: 'January 2026',
  avatarUrl: '',
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

  const [firstName, setFirstName] = useState(MOCK_USER.firstName)
  const [lastName, setLastName] = useState(MOCK_USER.lastName)
  const [email, setEmail] = useState(MOCK_USER.email)
  const [phone, setPhone] = useState(MOCK_USER.phone)
  const [address, setAddress] = useState(MOCK_USER.address)
  const [city, setCity] = useState(MOCK_USER.city)
  const [state, setState] = useState<string | null>(MOCK_USER.state)

  function handleSave() {
    setEditing(false)
  }

  function handleLogout() {
    localStorage.removeItem('kyc_completed')
    navigate('/login')
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
            Member since {MOCK_USER.joinDate}
          </Text>
          {MOCK_USER.kycVerified && (
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
          Verification Details
        </Text>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3">
            <div className="flex items-center gap-3">
              <IconId size={18} color="#6B7280" />
              <div>
                <Text fw={500} className="text-[13px] text-[#0F172A]">
                  NIN
                </Text>
                <Text fw={400} className="text-[12px] text-[#9CA3AF]">
                  {MOCK_USER.nin.slice(0, 3)}****{MOCK_USER.nin.slice(-4)}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <IconCheck size={14} color="#02A36E" />
              <Text fw={500} className="text-[12px] text-[#02A36E]">
                Verified
              </Text>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3">
            <div className="flex items-center gap-3">
              <IconBuildingBank size={18} color="#6B7280" />
              <div>
                <Text fw={500} className="text-[13px] text-[#0F172A]">
                  BVN
                </Text>
                <Text fw={400} className="text-[12px] text-[#9CA3AF]">
                  {MOCK_USER.bvn.slice(0, 3)}****{MOCK_USER.bvn.slice(-4)}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <IconCheck size={14} color="#02A36E" />
              <Text fw={500} className="text-[12px] text-[#02A36E]">
                Verified
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Save button when editing */}
      {editing && (
        <button
          onClick={handleSave}
          className="mb-6 w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
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
