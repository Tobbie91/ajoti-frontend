import { useState } from 'react'
import { Text, Badge, Avatar, Tabs, Progress, RingProgress, Textarea, Slider } from '@mantine/core'
import {
  IconArrowLeft,
  IconInfoCircle,
  IconMessageCircle,
  IconCalendar,
  IconShieldCheck,
  IconWallet,
  IconStar,
  IconStarFilled,
  IconCheck,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'

const GROUP_TABS = ['Overview', 'Members', 'Admin', 'Growth & Activities', 'Peer Reviews'] as const

interface PayoutCycle {
  cycle: number
  user: string
  status: 'Completed' | 'Upcoming' | 'Current'
}

interface Member {
  name: string
  joinDate: string
  position: number
  lastPayment: string
  paymentStatus: 'paid' | 'due'
}

interface PaymentHistory {
  round: number
  date: string
  amount: string
  status: 'Paid' | 'Pending'
  onTimeRate: string
  trustImpact: string
}

const MOCK_CYCLES: PayoutCycle[] = [
  { cycle: 1, user: 'User A', status: 'Completed' },
  { cycle: 2, user: 'User B', status: 'Completed' },
  { cycle: 3, user: 'User C', status: 'Completed' },
  { cycle: 4, user: 'User D', status: 'Current' },
  { cycle: 5, user: 'User E', status: 'Upcoming' },
  { cycle: 6, user: 'User F', status: 'Upcoming' },
]

const MOCK_MEMBERS: Member[] = [
  { name: 'Abimbola Micheal', joinDate: 'Jan 05, 2026', position: 1, lastPayment: 'Feb 01', paymentStatus: 'paid' },
  { name: 'Tunde Bakare', joinDate: 'Jan 05, 2026', position: 2, lastPayment: 'Due', paymentStatus: 'due' },
  { name: 'Chioma Eze', joinDate: 'Jan 06, 2026', position: 3, lastPayment: 'Feb 01', paymentStatus: 'paid' },
  { name: 'Fatima Yusuf', joinDate: 'Jan 07, 2026', position: 4, lastPayment: 'Due', paymentStatus: 'due' },
  { name: 'Emeka Okafor', joinDate: 'Jan 08, 2026', position: 5, lastPayment: 'Feb 01', paymentStatus: 'paid' },
  { name: 'Kemi Adeyemi', joinDate: 'Jan 09, 2026', position: 6, lastPayment: 'Feb 01', paymentStatus: 'paid' },
]

const MOCK_PAYMENTS: PaymentHistory[] = [
  { round: 1, date: 'Jan 05, 2026', amount: '₦50,000', status: 'Paid', onTimeRate: '100%', trustImpact: '+5' },
  { round: 2, date: 'Feb 05, 2026', amount: '₦50,000', status: 'Paid', onTimeRate: '100%', trustImpact: '+5' },
  { round: 3, date: 'Mar 05, 2026', amount: '₦50,000', status: 'Paid', onTimeRate: '100%', trustImpact: '+5' },
  { round: 4, date: 'Apr 05, 2026', amount: '₦50,000', status: 'Pending', onTimeRate: '-', trustImpact: '-' },
]

export function GrowthActivities() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<string>('Overview')

  const completedCycles = MOCK_CYCLES.filter((c) => c.status === 'Completed').length
  const totalCycles = MOCK_CYCLES.length
  const progressPercent = (completedCycles / totalCycles) * 100

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-6">
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
            Growth & Activities
          </Text>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(v || 'Overview')}
          variant="default"
          styles={{
            list: {
              display: 'flex',
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
            {GROUP_TABS.map((tab) => (
              <Tabs.Tab key={tab} value={tab}>
                {tab}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <OverviewTab
            completedCycles={completedCycles}
            totalCycles={totalCycles}
            progressPercent={progressPercent}
          />
        )}
        {activeTab === 'Members' && <MembersTab />}
        {activeTab === 'Admin' && <AdminTab />}
        {activeTab === 'Growth & Activities' && <GrowthTab />}
        {activeTab === 'Peer Reviews' && <PeerReviewsTab />}
      </div>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab({
  completedCycles,
  totalCycles,
  progressPercent,
}: {
  completedCycles: number
  totalCycles: number
  progressPercent: number
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Group Header */}
      <div className="flex items-center gap-3">
        <Text fw={700} className="text-[20px] text-[#0F172A]">
          Monthly 50K Squad
        </Text>
        <Badge
          size="md"
          radius="xl"
          styles={{
            root: {
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 12,
            },
          }}
        >
          Active
        </Badge>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4">
        <IconInfoCircle size={20} color="#0284C7" className="mt-0.5 flex-shrink-0" />
        <Text fw={500} className="text-[13px] leading-relaxed text-[#0C4A6E]">
          You're halfway through your ROSCA cycle! Keep up the great work. Your next payout is
          scheduled for April 2026.
        </Text>
      </div>

      {/* Contribution Details */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Contribution', value: '₦300,000' },
          { label: 'Monthly Due', value: '₦50,000' },
          { label: 'Payment Frequency', value: 'Monthly' },
          { label: 'Your Status', value: 'Active', isGreen: true },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <Text fw={500} className="text-[12px] text-[#6B7280]">
              {item.label}
            </Text>
            <Text
              fw={700}
              className={`mt-1 text-[18px] ${item.isGreen ? 'text-[#02A36E]' : 'text-[#0F172A]'}`}
            >
              {item.value}
            </Text>
          </div>
        ))}
      </div>

      {/* Payout Timeline + Cycles */}
      <div className="grid grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
            Payout Timeline
          </Text>
          <RingProgress
            size={180}
            thickness={16}
            roundCaps
            sections={[{ value: progressPercent, color: '#02A36E' }]}
            label={
              <div className="flex flex-col items-center">
                <Text fw={800} className="text-[28px] text-[#0F172A]">
                  {Math.round(progressPercent)}%
                </Text>
                <Text fw={500} className="text-[12px] text-[#6B7280]">
                  Complete
                </Text>
              </div>
            }
          />
          <Text fw={500} className="mt-4 text-[13px] text-[#6B7280]">
            {completedCycles} of {totalCycles} cycles completed
          </Text>
        </div>

        {/* Cycle Indicators */}
        <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
            Cycle Progress
          </Text>
          <div className="flex flex-1 flex-col justify-center gap-3">
            {MOCK_CYCLES.map((cycle) => (
              <div key={cycle.cycle} className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold ${
                    cycle.status === 'Completed'
                      ? 'bg-[#02A36E] text-white'
                      : cycle.status === 'Current'
                        ? 'border-2 border-[#02A36E] bg-white text-[#02A36E]'
                        : 'bg-[#F3F4F6] text-[#9CA3AF]'
                  }`}
                >
                  {cycle.cycle}
                </div>
                <div className="flex-1">
                  <Text fw={600} className="text-[13px] text-[#0F172A]">
                    {cycle.user}
                  </Text>
                </div>
                <Badge
                  size="sm"
                  radius="xl"
                  styles={{
                    root: {
                      backgroundColor:
                        cycle.status === 'Completed'
                          ? '#D1FAE5'
                          : cycle.status === 'Current'
                            ? '#FEF3C7'
                            : '#F3F4F6',
                      color:
                        cycle.status === 'Completed'
                          ? '#065F46'
                          : cycle.status === 'Current'
                            ? '#92400E'
                            : '#6B7280',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: 11,
                    },
                  }}
                >
                  {cycle.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Members Tab ─── */
function MembersTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Group Header */}
      <div>
        <div className="flex items-center gap-3">
          <Text fw={700} className="text-[20px] text-[#0F172A]">
            Monthly 50K Squad
          </Text>
          <Badge
            size="md"
            radius="xl"
            styles={{
              root: {
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 12,
              },
            }}
          >
            Active
          </Badge>
        </div>
        <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
          Active &middot; {MOCK_MEMBERS.length} Members
        </Text>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Name</th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Join Date</th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Payout Position</th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MEMBERS.map((member, idx) => (
              <tr key={idx} className="border-b border-[#F3F4F6] last:border-b-0">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar size={32} radius="xl" color="dark" variant="filled">
                      {member.name.charAt(0)}
                    </Avatar>
                    <Text fw={600} className="text-[13px] text-[#0F172A]">
                      {member.name}
                    </Text>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Text fw={500} className="text-[13px] text-[#6B7280]">
                    {member.joinDate}
                  </Text>
                </td>
                <td className="px-5 py-3.5">
                  <Text fw={600} className="text-[13px] text-[#0F172A]">
                    #{member.position}
                  </Text>
                </td>
                <td className="px-5 py-3.5">
                  <Text
                    fw={600}
                    className={`text-[13px] ${member.paymentStatus === 'due' ? 'text-[#EF4444]' : 'text-[#02A36E]'}`}
                  >
                    {member.lastPayment}
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Admin Tab ─── */
function AdminTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Text fw={700} className="text-[20px] text-[#0F172A]">
            Admin
          </Text>
          <Badge
            size="md"
            radius="xl"
            styles={{
              root: {
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 12,
              },
            }}
          >
            Active
          </Badge>
        </div>
        <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
          Active &middot; 1 Member
        </Text>
      </div>

      {/* Admin Card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-start gap-4">
          <Avatar size={56} radius="xl" color="dark" variant="filled">
            A
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Text fw={700} className="text-[18px] text-[#0F172A]">
                Abimbola Micheal
              </Text>
              <Badge
                size="sm"
                radius="xl"
                styles={{
                  root: {
                    backgroundColor: '#02A36E',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: 11,
                  },
                }}
              >
                Admin
              </Badge>
            </div>
            <Text fw={500} className="mt-2 leading-relaxed text-[13px] text-[#6B7280]">
              Experienced ROSCA group admin with over 5 years of managing savings groups.
              Dedicated to ensuring fair and transparent processes for all members.
            </Text>
            <button className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white">
              <IconMessageCircle size={16} />
              Message Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Growth & Activities Tab ─── */
function GrowthTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Cards */}
      <div className="grid grid-cols-2 gap-5">
        {/* Trust Score */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D1FAE5]">
            <IconShieldCheck size={28} color="#02A36E" />
          </div>
          <Text fw={800} className="mt-3 text-[32px] text-[#02A36E]">
            90%
          </Text>
          <Text fw={600} className="text-[14px] text-[#0F172A]">
            Trust Score
          </Text>
          <Text fw={500} className="mt-1 text-[12px] text-[#6B7280]">
            Satisfactory
          </Text>
        </div>

        {/* Next Payment */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7]">
            <IconCalendar size={28} color="#F59E0B" />
          </div>
          <Text fw={700} className="mt-3 text-[18px] text-[#0F172A]">
            April 05, 2026
          </Text>
          <Text fw={600} className="text-[14px] text-[#0F172A]">
            Next Payment
          </Text>
          <button className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white">
            <IconWallet size={16} />
            Fund Wallet
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4">
        <IconInfoCircle size={20} color="#0284C7" className="mt-0.5 flex-shrink-0" />
        <Text fw={500} className="text-[13px] leading-relaxed text-[#0C4A6E]">
          Your trust score is based on your payment history. Consistent on-time payments increase your
          score. Late or missed payments reduce it.
        </Text>
      </div>

      {/* Payment History Table */}
      <div>
        <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
          Monthly Payment History
        </Text>
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Round</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Date</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Amount</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Status</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">On Time Rate</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-[#6B7280]">Trust Impact</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PAYMENTS.map((payment) => (
                <tr key={payment.round} className="border-b border-[#F3F4F6] last:border-b-0">
                  <td className="px-5 py-3.5">
                    <Text fw={600} className="text-[13px] text-[#0F172A]">
                      {payment.round}
                    </Text>
                  </td>
                  <td className="px-5 py-3.5">
                    <Text fw={500} className="text-[13px] text-[#6B7280]">
                      {payment.date}
                    </Text>
                  </td>
                  <td className="px-5 py-3.5">
                    <Text fw={600} className="text-[13px] text-[#0F172A]">
                      {payment.amount}
                    </Text>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      size="sm"
                      radius="xl"
                      styles={{
                        root: {
                          backgroundColor: payment.status === 'Paid' ? '#D1FAE5' : '#FEF3C7',
                          color: payment.status === 'Paid' ? '#065F46' : '#92400E',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: 11,
                        },
                      }}
                    >
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Text fw={500} className="text-[13px] text-[#6B7280]">
                      {payment.onTimeRate}
                    </Text>
                  </td>
                  <td className="px-5 py-3.5">
                    <Text
                      fw={600}
                      className={`text-[13px] ${payment.trustImpact === '-' ? 'text-[#6B7280]' : 'text-[#02A36E]'}`}
                    >
                      {payment.trustImpact}
                    </Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── Peer Reviews Tab ─── */

interface PeerReview {
  reviewerName: string
  rating: number
  message: string
  date: string
}

interface MemberReviewData {
  name: string
  avatar: string
  averageRating: number
  reviews: PeerReview[]
}

const CURRENT_USER = 'Osho Michael'

const MOCK_EXISTING_REVIEWS: MemberReviewData[] = [
  {
    name: 'Abimbola Micheal',
    avatar: 'A',
    averageRating: 92,
    reviews: [
      { reviewerName: 'Tunde Bakare', rating: 95, message: 'Always pays on time. Very reliable member.', date: 'Jan 20, 2026' },
      { reviewerName: 'Chioma Eze', rating: 90, message: 'Great group admin. Keeps everyone accountable.', date: 'Jan 21, 2026' },
      { reviewerName: 'Osho Michael', rating: 90, message: 'Solid contributor, never missed a payment.', date: 'Jan 22, 2026' },
    ],
  },
  {
    name: 'Tunde Bakare',
    avatar: 'T',
    averageRating: 78,
    reviews: [
      { reviewerName: 'Abimbola Micheal', rating: 75, message: 'Paid on time mostly, one late payment.', date: 'Jan 20, 2026' },
      { reviewerName: 'Chioma Eze', rating: 80, message: 'Good member overall.', date: 'Jan 21, 2026' },
    ],
  },
  {
    name: 'Chioma Eze',
    avatar: 'C',
    averageRating: 96,
    reviews: [
      { reviewerName: 'Abimbola Micheal', rating: 98, message: 'Excellent member. Never late, very communicative.', date: 'Jan 20, 2026' },
      { reviewerName: 'Tunde Bakare', rating: 95, message: 'One of the best in the group.', date: 'Jan 21, 2026' },
      { reviewerName: 'Osho Michael', rating: 95, message: 'Always ahead of schedule with payments.', date: 'Jan 22, 2026' },
    ],
  },
  {
    name: 'Fatima Yusuf',
    avatar: 'F',
    averageRating: 85,
    reviews: [
      { reviewerName: 'Abimbola Micheal', rating: 85, message: 'Consistent contributor.', date: 'Jan 20, 2026' },
    ],
  },
  {
    name: 'Emeka Okafor',
    avatar: 'E',
    averageRating: 88,
    reviews: [
      { reviewerName: 'Chioma Eze', rating: 88, message: 'Reliable and friendly.', date: 'Jan 21, 2026' },
    ],
  },
]

// Members the current user hasn't reviewed yet
const PENDING_REVIEWS = ['Tunde Bakare', 'Fatima Yusuf', 'Emeka Okafor']

function getRatingColor(rating: number) {
  if (rating >= 80) return '#02A36E'
  if (rating >= 60) return '#10B981'
  if (rating >= 40) return '#F59E0B'
  return '#EF4444'
}

function getRatingLabel(rating: number) {
  if (rating >= 80) return 'Excellent'
  if (rating >= 60) return 'Good'
  if (rating >= 40) return 'Fair'
  return 'Poor'
}

function PeerReviewsTab() {
  const [view, setView] = useState<'overview' | 'submit'>('overview')
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [rating, setRating] = useState(70)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState<string[]>([])

  const pendingCount = PENDING_REVIEWS.filter((m) => !submitted.includes(m)).length
  const cycleComplete = true // mock: the cycle is complete

  function handleSubmitReview() {
    if (!selectedMember) return
    setSubmitted((prev) => [...prev, selectedMember])
    setSelectedMember(null)
    setRating(70)
    setMessage('')
    setView('overview')
  }

  if (view === 'submit' && selectedMember) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView('overview'); setSelectedMember(null) }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[18px] text-[#0F172A]">
            Review {selectedMember}
          </Text>
        </div>

        {/* Review Form */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="mb-6 flex items-center gap-4">
            <Avatar size={52} radius="xl" color="dark" variant="filled">
              {selectedMember.charAt(0)}
            </Avatar>
            <div>
              <Text fw={700} className="text-[16px] text-[#0F172A]">{selectedMember}</Text>
              <Text fw={400} className="text-[13px] text-[#6B7280]">Rate their performance this cycle</Text>
            </div>
          </div>

          {/* Rating Slider */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <Text fw={600} className="text-[14px] text-[#0F172A]">Performance Rating</Text>
              <div className="flex items-center gap-2">
                <Text fw={800} className="text-[24px]" style={{ color: getRatingColor(rating) }}>
                  {rating}%
                </Text>
                <Badge
                  size="sm"
                  radius="xl"
                  styles={{
                    root: {
                      backgroundColor: `${getRatingColor(rating)}15`,
                      color: getRatingColor(rating),
                      border: `1px solid ${getRatingColor(rating)}30`,
                      textTransform: 'none',
                      fontWeight: 600,
                    },
                  }}
                >
                  {getRatingLabel(rating)}
                </Badge>
              </div>
            </div>
            <Slider
              value={rating}
              onChange={setRating}
              min={0}
              max={100}
              step={5}
              color="#02A36E"
              size="lg"
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' },
              ]}
              styles={{
                markLabel: { fontSize: 11, color: '#9CA3AF' },
                bar: { backgroundColor: getRatingColor(rating) },
                thumb: { borderColor: getRatingColor(rating) },
              }}
            />
          </div>

          {/* Quick ratings */}
          <div className="mb-6">
            <Text fw={500} className="mb-2 text-[13px] text-[#6B7280]">Quick select</Text>
            <div className="flex gap-2">
              {[40, 60, 75, 85, 95].map((val) => (
                <button
                  key={val}
                  onClick={() => setRating(val)}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
                    rating === val
                      ? 'bg-[#02A36E] text-white'
                      : 'border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <Text fw={600} className="mb-2 text-[14px] text-[#0F172A]">
              Leave a message <span className="font-normal text-[#9CA3AF]">(optional)</span>
            </Text>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              placeholder="Share your experience with this member..."
              radius="md"
              minRows={3}
              maxRows={5}
              styles={{
                input: { borderColor: '#E5E7EB', fontSize: 14 },
              }}
            />
          </div>

          <button
            onClick={handleSubmitReview}
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Submit Review
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Text fw={700} className="text-[20px] text-[#0F172A]">
            Peer Reviews
          </Text>
          <Badge
            size="md"
            radius="xl"
            styles={{
              root: {
                backgroundColor: cycleComplete ? '#D1FAE5' : '#FEF3C7',
                color: cycleComplete ? '#065F46' : '#92400E',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 12,
              },
            }}
          >
            {cycleComplete ? 'Cycle Complete' : 'In Progress'}
          </Badge>
        </div>
        <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
          Rate your group members after each completed cycle
        </Text>
      </div>

      {/* Pending Reviews Banner */}
      {cycleComplete && pendingCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[#FBBF24] bg-[#FFFBEB] px-5 py-4">
          <IconStar size={20} color="#F59E0B" className="mt-0.5 flex-shrink-0" />
          <div>
            <Text fw={600} className="text-[14px] text-[#92400E]">
              You have {pendingCount} pending review{pendingCount > 1 ? 's' : ''}
            </Text>
            <Text fw={500} className="mt-0.5 text-[13px] text-[#B45309]">
              Reviews are mandatory after each cycle and contribute to the trust score formula.
            </Text>
          </div>
        </div>
      )}

      {/* Submit Reviews Section */}
      {cycleComplete && pendingCount > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
            Submit Your Reviews
          </Text>
          <div className="flex flex-col gap-3">
            {PENDING_REVIEWS.map((memberName) => {
              const isSubmitted = submitted.includes(memberName)
              return (
                <div
                  key={memberName}
                  className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar size={38} radius="xl" color="dark" variant="filled">
                      {memberName.charAt(0)}
                    </Avatar>
                    <Text fw={600} className="text-[14px] text-[#0F172A]">
                      {memberName}
                    </Text>
                  </div>
                  {isSubmitted ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-[#D1FAE5] px-3 py-1.5">
                      <IconCheck size={14} color="#02A36E" />
                      <Text fw={600} className="text-[12px] text-[#02A36E]">
                        Reviewed
                      </Text>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSelectedMember(memberName); setView('submit') }}
                      className="cursor-pointer rounded-lg bg-[#02A36E] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#028a5b]"
                    >
                      Review
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Team Reviews Overview */}
      <div>
        <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
          Team Reviews
        </Text>
        <div className="flex flex-col gap-4">
          {MOCK_EXISTING_REVIEWS.map((member) => (
            <MemberReviewCard key={member.name} member={member} />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4">
        <IconInfoCircle size={20} color="#0284C7" className="mt-0.5 flex-shrink-0" />
        <Text fw={500} className="text-[13px] leading-relaxed text-[#0C4A6E]">
          Peer reviews are anonymous to the person being reviewed but visible to all group members.
          Average ratings contribute to each member's trust score.
        </Text>
      </div>
    </div>
  )
}

function MemberReviewCard({ member }: { member: MemberReviewData }) {
  const [expanded, setExpanded] = useState(false)
  const color = getRatingColor(member.averageRating)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      {/* Summary Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 hover:bg-[#F9FAFB]"
      >
        <div className="flex items-center gap-3">
          <Avatar size={40} radius="xl" color="dark" variant="filled">
            {member.avatar}
          </Avatar>
          <div className="text-left">
            <Text fw={600} className="text-[14px] text-[#0F172A]">
              {member.name}
            </Text>
            <Text fw={400} className="text-[12px] text-[#9CA3AF]">
              {member.reviews.length} review{member.reviews.length !== 1 ? 's' : ''}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <IconStarFilled size={16} color={color} />
            <Text fw={700} className="text-[18px]" style={{ color }}>
              {member.averageRating}%
            </Text>
          </div>
          <Badge
            size="sm"
            radius="xl"
            styles={{
              root: {
                backgroundColor: `${color}15`,
                color,
                border: `1px solid ${color}30`,
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            {getRatingLabel(member.averageRating)}
          </Badge>
        </div>
      </button>

      {/* Expanded Reviews */}
      {expanded && (
        <div className="border-t border-[#E5E7EB] px-5 py-4">
          <div className="flex flex-col gap-3">
            {member.reviews.map((review, idx) => (
              <div key={idx} className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                <div className="mb-1 flex items-center justify-between">
                  <Text fw={600} className="text-[13px] text-[#0F172A]">
                    {review.reviewerName}
                  </Text>
                  <div className="flex items-center gap-2">
                    <Text fw={700} className="text-[13px]" style={{ color: getRatingColor(review.rating) }}>
                      {review.rating}%
                    </Text>
                    <Text fw={400} className="text-[11px] text-[#9CA3AF]">
                      {review.date}
                    </Text>
                  </div>
                </div>
                {review.message && (
                  <Text fw={400} className="text-[13px] text-[#6B7280]">
                    "{review.message}"
                  </Text>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
