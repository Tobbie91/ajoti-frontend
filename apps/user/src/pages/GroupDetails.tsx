import { useState } from 'react'
import { Text, Avatar, Badge, Table, Textarea, Loader } from '@mantine/core'
import {
  IconArrowLeft,
  IconUsers,
  IconLock,
  IconMessageCircle,
  IconCircleCheck,
  IconX,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'

type GroupStatus = 'Open' | 'Invite Only'

interface GroupData {
  id: string
  name: string
  status: GroupStatus
  amount: string
  frequency: string
  duration: string
  slotsLeft: string
  contribution: string
  payoutOrder: string
  penalty: string
  admin: string
  adminBio: string
  completionRate: string
}

const MOCK_GROUPS: Record<string, GroupData> = {
  '1': {
    id: '1',
    name: '50k Monthly Squad',
    status: 'Open',
    amount: '₦50,000',
    frequency: 'Monthly',
    duration: '6 months',
    slotsLeft: '5 Slots left',
    contribution: '₦50,000 monthly',
    payoutOrder: 'Based on slot draw',
    penalty: '₦5,000 for late payment',
    admin: 'Abimbola Michael',
    adminBio: 'Experienced saving group leader. 2 years managing ROSCAs.',
    completionRate: '90%',
  },
  '2': {
    id: '2',
    name: 'Hustle, Grind & Win',
    status: 'Invite Only',
    amount: '₦10,000',
    frequency: 'Monthly',
    duration: '10 months',
    slotsLeft: '4 Slots left',
    contribution: '₦10,000 monthly',
    payoutOrder: 'Based on slot draw',
    penalty: '₦2,000 for late payment',
    admin: 'Abimbola Michael',
    adminBio: 'Experienced saving group leader. 2 years managing ROSCAs.',
    completionRate: '90%',
  },
  '3': {
    id: '3',
    name: '50k Monthly Squad',
    status: 'Open',
    amount: '₦50,000',
    frequency: 'Monthly',
    duration: '6 months',
    slotsLeft: '4 Slots left',
    contribution: '₦50,000 monthly',
    payoutOrder: 'Based on slot draw',
    penalty: '₦5,000 for late payment',
    admin: 'Abimbola Michael',
    adminBio: 'Experienced saving group leader. 2 years managing ROSCAs.',
    completionRate: '90%',
  },
  '4': {
    id: '4',
    name: 'Hustle, Grind & Win',
    status: 'Invite Only',
    amount: '₦10,000',
    frequency: 'Monthly',
    duration: '10 months',
    slotsLeft: '7 Slots left',
    contribution: '₦10,000 monthly',
    payoutOrder: 'Based on slot draw',
    penalty: '₦2,000 for late payment',
    admin: 'Abimbola Michael',
    adminBio: 'Experienced saving group leader. 2 years managing ROSCAs.',
    completionRate: '90%',
  },
}

const DEFAULT_GROUP: GroupData = {
  id: '0',
  name: '50k Monthly Squad',
  status: 'Open',
  amount: '₦50,000',
  frequency: 'Monthly',
  duration: '6 months',
  slotsLeft: '5 Slots left',
  contribution: '₦50,000 monthly',
  payoutOrder: 'Based on slot draw',
  penalty: '₦5,000 for late payment',
  admin: 'Abimbola Michael',
  adminBio: 'Experienced saving group leader. 2 years managing ROSCAs.',
  completionRate: '90%',
}

const PAYOUT_SCHEDULE = [
  { month: 'January', user: 'User A', status: 'Pending' },
  { month: 'February', user: 'User B', status: 'Pending' },
  { month: 'March', user: 'User C', status: 'Pending' },
  { month: 'April', user: 'User D', status: 'Pending' },
  { month: 'May', user: 'User E', status: 'Pending' },
  { month: 'June', user: 'User F', status: 'Pending' },
]

export function GroupDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const group = MOCK_GROUPS[id || ''] || DEFAULT_GROUP
  const isInviteOnly = group.status === 'Invite Only'

  const [messageOpen, setMessageOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messageStep, setMessageStep] = useState<'compose' | 'sending' | 'sent'>('compose')

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back button + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rosca')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Group Details
          </Text>
        </div>

        {/* Group Header */}
        <div className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-8 py-6">
          <div className="flex items-center gap-5">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: isInviteOnly ? '#F97316' : '#02A36E' }}
            >
              <IconUsers size={28} color="white" />
            </div>
            <div>
              <Text fw={700} className="text-[20px] text-[#0F172A]">
                {group.name}
              </Text>
              <div className="mt-1 flex items-center gap-3">
                <Badge
                  size="md"
                  radius="xl"
                  styles={{
                    root: {
                      backgroundColor: isInviteOnly ? '#F97316' : '#02A36E',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: 12,
                    },
                  }}
                >
                  {group.completionRate} Completion Rate
                </Badge>
              </div>
            </div>
          </div>

          {/* Member Avatars */}
          <div className="flex items-center">
            <Avatar.Group>
              <Avatar size={40} radius="xl" color="blue" variant="filled">A</Avatar>
              <Avatar size={40} radius="xl" color="grape" variant="filled">B</Avatar>
              <Avatar size={40} radius="xl" color="teal" variant="filled">C</Avatar>
              <Avatar size={40} radius="xl" color="orange" variant="filled">D</Avatar>
              <Avatar size={40} radius="xl" color="gray" variant="filled">+1</Avatar>
            </Avatar.Group>
          </div>
        </div>

        {/* Invite-Only Notice */}
        {isInviteOnly && (
          <div className="flex items-start gap-3 rounded-xl border border-[#FBBF24] bg-[#FFFBEB] px-5 py-4">
            <IconLock size={20} color="#F59E0B" className="mt-0.5 flex-shrink-0" />
            <div>
              <Text fw={600} className="text-[14px] text-[#92400E]">
                This group is private and requires an invite to join.
              </Text>
              <Text fw={500} className="mt-0.5 text-[13px] text-[#B45309]">
                Contact the admin for access.
              </Text>
            </div>
          </div>
        )}

        {/* Three Info Cards Row */}
        <div className="grid grid-cols-3 gap-5">
          {/* Group Info Card */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <Text fw={700} className="text-[28px] text-[#0F172A]">
              {group.amount}
            </Text>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Text fw={500} className="text-[13px] text-[#6B7280]">Frequency</Text>
                <Text fw={600} className="text-[13px] text-[#0F172A]">{group.frequency}</Text>
              </div>
              <div className="flex items-center justify-between">
                <Text fw={500} className="text-[13px] text-[#6B7280]">Duration</Text>
                <Text fw={600} className="text-[13px] text-[#0F172A]">{group.duration}</Text>
              </div>
              <div className="flex items-center justify-between">
                <Text fw={500} className="text-[13px] text-[#6B7280]">Slots left</Text>
                <Text fw={600} className="text-[13px] text-[#0F172A]">{group.slotsLeft}</Text>
              </div>
            </div>
          </div>

          {/* Group Rules Card */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <Text fw={700} className="text-[16px] text-[#0F172A]">
              Group Rules
            </Text>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <Text fw={500} className="text-[12px] text-[#6B7280]">Contribution</Text>
                <Text fw={600} className="text-[13px] text-[#0F172A]">{group.contribution}</Text>
              </div>
              <div>
                <Text fw={500} className="text-[12px] text-[#6B7280]">Payout Order</Text>
                <Text fw={600} className="text-[13px] text-[#0F172A]">{group.payoutOrder}</Text>
              </div>
              <div>
                <Text fw={500} className="text-[12px] text-[#6B7280]">Penalty</Text>
                <Text fw={600} className="text-[13px] text-[#0F172A]">{group.penalty}</Text>
              </div>
            </div>
          </div>

          {/* Admin Card */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex items-center gap-3">
              <Avatar size={44} radius="xl" color="dark" variant="filled">
                {group.admin.charAt(0)}
              </Avatar>
              <div>
                <Text fw={700} className="text-[15px] text-[#0F172A]">
                  {group.admin}
                </Text>
                <Badge
                  size="sm"
                  radius="xl"
                  styles={{
                    root: {
                      backgroundColor: '#02A36E',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: 11,
                    },
                  }}
                >
                  Admin
                </Badge>
              </div>
            </div>
            <Text fw={400} className="mt-4 text-[13px] leading-relaxed text-[#6B7280]">
              {group.adminBio}
            </Text>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-[1fr_280px_280px] items-start gap-5">
          {/* Payout Timeline */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
              Payout Timeline
            </Text>
            <Table
              verticalSpacing="sm"
              styles={{
                th: { fontSize: 12, fontWeight: 600, color: '#6B7280' },
                td: { fontSize: 13 },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Month</Table.Th>
                  <Table.Th>Recipient</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {PAYOUT_SCHEDULE.map((row) => (
                  <Table.Tr key={row.month}>
                    <Table.Td>
                      <Text fw={500} className="text-[#0F172A]">{row.month}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500} className="text-[#0F172A]">{row.user}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        radius="xl"
                        variant="light"
                        color="yellow"
                        styles={{
                          root: { textTransform: 'none', fontWeight: 500 },
                        }}
                      >
                        {row.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            {isInviteOnly ? (
              <button
                onClick={() => {
                  setMessageOpen(true)
                  setMessage('')
                  setMessageStep('compose')
                }}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white"
              >
                <IconMessageCircle size={18} />
                Message Admin
              </button>
            ) : (
              <button
                onClick={() => navigate(`/rosca/${id}/join`)}
                className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white"
              >
                Request to Join
              </button>
            )}
            <button className="w-full cursor-pointer rounded-xl border-2 border-[#EF4444] py-4 text-[15px] font-semibold text-[#EF4444]">
              Report Group
            </button>
          </div>

          {/* Promo Card */}
          <div className="rounded-2xl bg-[#FCBC00] p-6">
            <Text fw={700} className="text-[18px] leading-snug text-white">
              Want easy PAYOUT in your first cycle?
            </Text>
            <Text fw={400} className="mt-2 text-[13px] leading-relaxed text-white/90">
              Bid for the first slot and get your payout early.
            </Text>
            <button className="mt-4 cursor-pointer rounded-lg bg-white px-6 py-2.5 text-[13px] font-semibold text-[#FCBC00]">
              Try Now
            </button>
          </div>
        </div>
      </div>

      {/* Message Admin Modal */}
      {messageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-[420px] rounded-2xl bg-white p-8">
            {messageStep === 'compose' && (
              <>
                <div className="flex items-center justify-between">
                  <Text fw={700} className="text-[18px] text-[#0F172A]">
                    Message Admin
                  </Text>
                  <button
                    onClick={() => setMessageOpen(false)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-[#F3F4F6]"
                  >
                    <IconX size={18} color="#6B7280" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <Avatar size={40} radius="xl" color="dark" variant="filled">
                    {group.admin.charAt(0)}
                  </Avatar>
                  <div>
                    <Text fw={600} className="text-[14px] text-[#0F172A]">{group.admin}</Text>
                    <Text fw={400} className="text-[12px] text-[#6B7280]">Admin of {group.name}</Text>
                  </div>
                </div>

                <Textarea
                  placeholder="Hi, I'd like to request an invite to join this group..."
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  minRows={5}
                  radius="md"
                  className="mt-5"
                  styles={{
                    input: { borderColor: '#E5E7EB', fontSize: 13 },
                  }}
                />

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setMessageOpen(false)}
                    className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!message.trim()}
                    onClick={() => {
                      setMessageStep('sending')
                      setTimeout(() => setMessageStep('sent'), 2000)
                    }}
                    className={`flex-1 cursor-pointer rounded-lg py-3 text-[13px] font-semibold text-white ${
                      message.trim() ? 'bg-[#02A36E]' : 'cursor-not-allowed bg-[#9CA3AF]'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </>
            )}

            {messageStep === 'sending' && (
              <div className="flex flex-col items-center py-8">
                <Loader color="#02A36E" size="lg" />
                <Text fw={700} className="mt-5 text-[18px] text-[#0F172A]">
                  Sending your message
                </Text>
                <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
                  Please wait...
                </Text>
              </div>
            )}

            {messageStep === 'sent' && (
              <div className="flex flex-col items-center py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
                  <IconCircleCheck size={36} color="#02A36E" />
                </div>
                <Text fw={700} className="mt-5 text-[18px] text-[#0F172A]">
                  Message sent
                </Text>
                <Text fw={500} className="mt-1 text-center text-[13px] text-[#6B7280]">
                  Your request has been sent to {group.admin}. You'll be notified when they respond.
                </Text>
                <button
                  onClick={() => {
                    setMessageOpen(false)
                    setMessage('')
                    setMessageStep('compose')
                  }}
                  className="mt-6 cursor-pointer rounded-lg bg-[#02A36E] px-8 py-3 text-[13px] font-semibold text-white"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
