import { useState } from 'react'
import { Text, TextInput, Badge, Avatar, Tabs, Progress, Textarea, Loader } from '@mantine/core'
import { IconSearch, IconMessageCircle, IconCalendar, IconCheck, IconFilter, IconAlertTriangle, IconX, IconCircleCheck } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

const TABS = ['All Groups', 'Open Groups', 'Invite-Only', 'Joined'] as const

type GroupStatus = 'Open' | 'Invite Only'

interface RoscaGroup {
  id: string
  name: string
  duration: string
  slots: string
  status: GroupStatus
  admin: string
}

interface JoinedGroup {
  id: string
  name: string
  completionRate: number
  completedCycles: number
  totalCycles: number
  nextContribution: string
  admin: string
}

const MOCK_GROUPS: RoscaGroup[] = [
  { id: '1', name: 'Monthly 50K Squad', duration: '6 months', slots: '4 Slots', status: 'Open', admin: 'Abimbola Micheal' },
  { id: '2', name: 'Hustle, Grind & Win', duration: '10 months', slots: '7 Slots', status: 'Invite Only', admin: 'Abimbola Micheal' },
  { id: '3', name: 'Monthly 50K Squad', duration: '6 months', slots: '4 Slots', status: 'Open', admin: 'Abimbola Micheal' },
  { id: '4', name: 'Hustle, Grind & Win', duration: '10 months', slots: '7 Slots', status: 'Invite Only', admin: 'Abimbola Micheal' },
  { id: '5', name: 'Monthly 50K Squad', duration: '6 months', slots: '4 Slots', status: 'Open', admin: 'Abimbola Micheal' },
  { id: '6', name: 'Hustle, Grind & Win', duration: '10 months', slots: '7 Slots', status: 'Invite Only', admin: 'Abimbola Micheal' },
]

const MOCK_JOINED: JoinedGroup[] = [
  {
    id: 'j1',
    name: 'Smart Savers',
    completionRate: 90,
    completedCycles: 3,
    totalCycles: 6,
    nextContribution: 'May 10, 2026',
    admin: 'Abimbola Micheal',
  },
  {
    id: 'j2',
    name: '50K Monthly Squad',
    completionRate: 90,
    completedCycles: 0,
    totalCycles: 6,
    nextContribution: 'Feb 2, 2026',
    admin: 'Abimbola Micheal',
  },
]

const statusBadge: Record<GroupStatus, { bg: string }> = {
  Open: { bg: '#02A36E' },
  'Invite Only': { bg: '#F97316' },
}

export function Rosca() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All Groups')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null)
  const [messageAdmin, setMessageAdmin] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageStep, setMessageStep] = useState<'compose' | 'sending' | 'sent'>('compose')

  const filtered = MOCK_GROUPS.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.admin.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'All Groups') return matchesSearch
    if (activeTab === 'Open Groups') return g.status === 'Open' && matchesSearch
    if (activeTab === 'Invite-Only') return g.status === 'Invite Only' && matchesSearch
    return matchesSearch
  })

  const displayed = showAll ? filtered : filtered.slice(0, 6)
  const isJoinedTab = activeTab === 'Joined'

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#02A36E] to-[#00C853] px-10 py-10 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <div className="max-w-[480px]">
              <Text fw={700} className="text-[28px] leading-tight">
                Welcome to ROSCA
              </Text>
              <Text size="sm" className="mt-3 text-white/90 leading-relaxed">
                Join trusted savings groups and grow your money together with others.
              </Text>
            </div>
            <button
              onClick={() => navigate('/rosca/how-it-works')}
              className="flex-shrink-0 cursor-pointer rounded-lg bg-white px-7 py-3 text-sm font-semibold text-[#02A36E] shadow-sm"
            >
              How it Works
            </button>
          </div>
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 right-28 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute right-48 top-2 h-24 w-24 rounded-full bg-white/5" />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(v) => {
            setActiveTab(v || 'All Groups')
            setShowAll(false)
          }}
          variant="default"
          styles={{
            list: {
              display: 'flex',
              justifyContent: 'space-between',
            },
            tab: {
              flex: 1,
              textAlign: 'center',
              fontWeight: 500,
              fontSize: 14,
              padding: '10px 0',
              color: '#9CA3AF',
              '&[data-active]': {
                color: '#02A36E',
                borderBottomColor: '#02A36E',
                fontWeight: 600,
              },
            },
          }}
        >
          <Tabs.List grow>
            {TABS.map((tab) => (
              <Tabs.Tab key={tab} value={tab}>
                {tab}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {/* Become Admin Banner */}
        <div className="flex items-center justify-between rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-6 py-4">
            <div>
              <Text fw={600} size="sm" className="text-[#0F172A]">
                Become a ROSCA Admin
              </Text>
              <Text size="xs" className="text-[#6B7280]">
                Manage your own savings group. Apply in 2 mins.
              </Text>
            </div>
            <button
              onClick={() => navigate('/rosca/become-admin')}
              className="cursor-pointer rounded-lg bg-[#02A36E] px-5 py-2.5 text-sm font-medium text-white"
            >
              Request Access
            </button>
          </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3">
          <TextInput
            placeholder="Search groups or admins..."
            leftSection={<IconSearch size={18} color="#9CA3AF" />}
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="flex-1"
            styles={{
              input: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
            }}
          />
          <button className="flex h-[42px] items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] font-medium text-[#374151]">
            <IconFilter size={16} color="#6B7280" />
            Filter
          </button>
        </div>

        {/* Joined Tab Content */}
        {isJoinedTab ? (
          <>
          <div className="grid grid-cols-2 gap-5">
            {MOCK_JOINED.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#02A36E]">
                    <IconCheck size={22} color="white" stroke={2.5} />
                  </div>
                  <div>
                    <Text fw={700} className="text-[15px] text-[#0F172A]">
                      {group.name}
                    </Text>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-[#02A36E]" />
                      <Text fw={500} className="text-[12px] text-[#6B7280]">
                        {group.completionRate}% complete rate
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-5 flex items-center gap-3">
                  <Progress
                    value={(group.completedCycles / group.totalCycles) * 100}
                    size={8}
                    radius="xl"
                    color="#02A36E"
                    className="flex-1"
                    styles={{
                      root: { backgroundColor: '#E5E7EB' },
                    }}
                  />
                  <Text fw={500} className="flex-shrink-0 text-[11px] text-[#6B7280]">
                    ({group.completedCycles} of {group.totalCycles} complete)
                  </Text>
                </div>

                {/* Next Contribution */}
                <div className="mt-4 flex items-center gap-2">
                  <IconCalendar size={15} color="#6B7280" />
                  <Text fw={500} className="text-[12px] text-[#6B7280]">
                    Next contribution{' '}
                    <Text component="span" fw={600} className="text-[#0F172A]">
                      {group.nextContribution}
                    </Text>
                  </Text>
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-3">
                  {group.completedCycles > 0 ? (
                    <button
                      onClick={() => navigate(`/rosca/${group.id}/activities`)}
                      className="w-full cursor-pointer rounded-lg border border-[#02A36E] py-3 text-[13px] font-semibold text-[#02A36E]"
                    >
                      View Activities
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setMessageAdmin(group.admin)
                          setMessage('')
                          setMessageStep('compose')
                        }}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white"
                      >
                        <IconMessageCircle size={16} />
                        Message Admin
                      </button>
                      <button
                        onClick={() => setLeaveGroupId(group.id)}
                        className="flex-1 cursor-pointer rounded-lg border border-[#EF4444] py-3 text-[13px] font-semibold text-[#EF4444]"
                      >
                        Leave Group
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show More */}
          {!showAll && MOCK_JOINED.length > 6 && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAll(true)}
                className="cursor-pointer rounded-lg border border-[#02A36E] px-8 py-2.5 text-sm font-medium text-[#02A36E]"
              >
                Show More
              </button>
            </div>
          )}
          </>
        ) : (
          <>
            {/* Groups Grid */}
            {displayed.length > 0 ? (
              <div className="grid grid-cols-3 gap-5">
                {displayed.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => navigate(`/rosca/${group.id}`)}
                    className="flex cursor-pointer flex-col overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md"
                    style={{ backgroundColor: 'rgba(0, 200, 83, 0.3)' }}
                  >
                    {/* Card body */}
                    <div className="flex-1 px-6 pt-6 pb-5">
                      <Text fw={700} className="text-[18px] leading-snug text-[#0F172A]">
                        {group.name}
                      </Text>

                      <Text fw={500} className="mt-2 text-[13px] text-[#1F2937]">
                        {group.duration} - {group.slots}
                      </Text>

                      <div className="mt-4">
                        <Badge
                          size="md"
                          radius="xl"
                          styles={{
                            root: {
                              backgroundColor: statusBadge[group.status].bg,
                              color: '#FFFFFF',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: 12,
                              paddingLeft: 14,
                              paddingRight: 14,
                              height: 28,
                            },
                          }}
                        >
                          {group.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Card footer - deeper green */}
                    <div
                      className="flex items-center justify-between px-6 py-4"
                      style={{ backgroundColor: 'rgba(0, 200, 83, 0.5)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar size={36} radius="xl" color="dark" variant="filled">
                          {group.admin.charAt(0)}
                        </Avatar>
                        <div>
                          <Text fw={600} className="text-[13px] leading-tight text-[#0F172A]">
                            {group.admin}
                          </Text>
                          <Text fw={500} className="text-[11px] text-[#166534]">
                            Admin
                          </Text>
                        </div>
                      </div>
                      <button className="rounded-lg bg-white px-6 py-2.5 text-[13px] font-semibold text-[#0F172A] shadow-sm">
                        {group.status === 'Open' ? 'Join' : 'View'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Text fw={600} className="text-[#374151]">
                  No groups found
                </Text>
                <Text size="sm" className="mt-1 text-[#9CA3AF]">
                  Try adjusting your search or filter.
                </Text>
              </div>
            )}

            {/* Show More */}
            {!showAll && filtered.length > 6 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="rounded-lg border border-[#02A36E] px-8 py-2.5 text-sm font-medium text-[#02A36E]"
                >
                  Show More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Leave Group Modal */}
      {leaveGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-[420px] rounded-2xl bg-white p-8">
            {/* Warning Icon */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3C7]">
                <IconAlertTriangle size={32} color="#F59E0B" stroke={2} />
              </div>
            </div>

            {/* Title */}
            <Text fw={700} className="mt-5 text-center text-[20px] text-[#0F172A]">
              Leave Group?
            </Text>

            {/* Warnings */}
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[12px] font-bold text-[#92400E]">
                  1
                </div>
                <Text fw={500} className="text-[13px] leading-relaxed text-[#374151]">
                  Once you leave, <Text component="span" fw={700}>you forfeit your slot</Text> in the payout order.
                </Text>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[12px] font-bold text-[#92400E]">
                  2
                </div>
                <Text fw={500} className="text-[13px] leading-relaxed text-[#374151]">
                  You <Text component="span" fw={700}>cannot rejoin</Text> the group once you leave.
                </Text>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[12px] font-bold text-[#92400E]">
                  3
                </div>
                <Text fw={500} className="text-[13px] leading-relaxed text-[#374151]">
                  Leaving the group may affect your <Text component="span" fw={700}>Trust Score</Text>.
                </Text>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setLeaveGroupId(null)}
                className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle leave group logic here
                  setLeaveGroupId(null)
                }}
                className="flex-1 cursor-pointer rounded-lg bg-[#EF4444] py-3 text-[13px] font-semibold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Admin Modal */}
      {messageAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-[420px] rounded-2xl bg-white p-8">
            {messageStep === 'compose' && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <Text fw={700} className="text-[18px] text-[#0F172A]">
                    Message admin
                  </Text>
                  <button
                    onClick={() => setMessageAdmin(null)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-[#F3F4F6]"
                  >
                    <IconX size={18} color="#6B7280" />
                  </button>
                </div>

                {/* Admin Name */}
                <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
                  {messageAdmin}
                </Text>

                {/* Message Input */}
                <Textarea
                  placeholder="Type message"
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  minRows={5}
                  radius="md"
                  className="mt-5"
                  styles={{
                    input: {
                      borderColor: '#E5E7EB',
                      fontSize: 13,
                    },
                  }}
                />

                {/* Buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setMessageAdmin(null)}
                    className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!message.trim()}
                    onClick={() => {
                      setMessageStep('sending')
                      setTimeout(() => {
                        setMessageStep('sent')
                      }, 2000)
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
                <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
                  Your message has been delivered to the admin.
                </Text>
                <button
                  onClick={() => {
                    setMessageAdmin(null)
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
