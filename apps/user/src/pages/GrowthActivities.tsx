import { useState, useEffect } from 'react'
import { Text, Badge, Avatar, Tabs, Progress, RingProgress, Textarea, Slider, Loader, Modal } from '@mantine/core'
import {
  IconArrowLeft,
  IconInfoCircle,
  IconMessageCircle,
  IconCalendar,
  IconShieldCheck,
  IconWallet,
  IconCheck,
  IconCash,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getRoscaCircle,
  getRoscaSchedules,
  getCircleContributions,
  makeContribution,
  getWalletBalance,
  submitPeerReview,
  getTrustScore,
  type RoscaCircle,
  type RoscaSchedule,
  type CircleContribution,
  type CircleMember,
} from '@/utils/api'

const GROUP_TABS = ['Overview', 'Members', 'Admin', 'Growth & Activities', 'Peer Reviews'] as const

interface CycleRow {
  cycle: number
  recipientName: string
  status: 'Completed' | 'Current' | 'Upcoming'
  payoutDate?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNaira(kobo: string | number): string {
  const n = Number(kobo) / 100
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function circleStatusBadge(status: string): { bg: string; color: string; label: string } {
  switch (status?.toUpperCase()) {
    case 'ACTIVE': return { bg: '#D1FAE5', color: '#065F46', label: 'Active' }
    case 'COMPLETED': return { bg: '#DBEAFE', color: '#1E40AF', label: 'Completed' }
    case 'CANCELLED': return { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' }
    default: return { bg: '#FEF3C7', color: '#92400E', label: status ?? 'Draft' }
  }
}

function mapSchedulesToCycles(schedules: RoscaSchedule[], members: CircleMember[]): CycleRow[] {
  const memberMap = new Map(members.map((m) => [m.userId, m.name]))
  const sorted = [...schedules].sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0))

  let foundFirst = false
  return sorted.map((s) => {
    const st = (s.status ?? '').toUpperCase()
    let rowStatus: CycleRow['status']
    if (st === 'COMPLETED' || st === 'PAID') {
      rowStatus = 'Completed'
    } else if (!foundFirst) {
      foundFirst = true
      rowStatus = 'Current'
    } else {
      rowStatus = 'Upcoming'
    }
    const recipientName = s.recipientId
      ? (memberMap.get(s.recipientId) ?? `Cycle ${s.cycleNumber}`)
      : `Cycle ${s.cycleNumber}`
    return {
      cycle: s.cycleNumber ?? 0,
      recipientName,
      status: rowStatus,
      payoutDate: s.payoutDate,
    }
  })
}

// ── Main Component ───────────────────────────────────────────────────────────

export function GrowthActivities() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<string>('Overview')
  const [loading, setLoading] = useState(true)

  const [circle, setCircle] = useState<RoscaCircle | null>(null)
  const [schedules, setSchedules] = useState<RoscaSchedule[]>([])
  const [contributions, setContributions] = useState<CircleContribution[]>([])
  const [userTrustScore, setUserTrustScore] = useState(0)

  const currentUserId = (() => {
    try {
      const stored = localStorage.getItem('user')
      const u = stored ? JSON.parse(stored) : {}
      return u.id ?? u._id ?? ''
    } catch { return '' }
  })()

  useEffect(() => {
    if (!id) return
    Promise.all([
      getRoscaCircle(id),
      getRoscaSchedules(id).catch(() => [] as RoscaSchedule[]),
      getCircleContributions(id).catch(() => [] as CircleContribution[]),
      getTrustScore().catch(() => ({ trustScore: 0 } as { trustScore: number })),
    ])
      .then(([c, s, contrib, ts]) => {
        setCircle(c)
        setSchedules(s)
        setContributions(contrib)
        setUserTrustScore((ts as { trustScore: number }).trustScore ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader size={48} color="#02A36E" />
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Text fw={600} className="text-[#374151]">Circle not found</Text>
        <button onClick={() => navigate('/rosca')} className="cursor-pointer text-sm font-medium text-[#02A36E]">
          Back to groups
        </button>
      </div>
    )
  }

  const members = (circle as any).members as CircleMember[] ?? []
  const adminName = circle.admin
    ? `${circle.admin.firstName} ${circle.admin.lastName}`.trim()
    : 'Admin'
  const cycles = mapSchedulesToCycles(schedules, members)
  const completedCycles = cycles.filter((c) => c.status === 'Completed').length
  const totalCycles = cycles.length || circle.durationCycles || 1
  const progressPercent = totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 0

  const trustPercent = Math.min(100, userTrustScore)

  // Next pending payout
  const nextSchedule = schedules
    .filter((s) => !['COMPLETED', 'PAID'].includes((s.status ?? '').toUpperCase()))
    .sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0))[0]
  const nextPaymentDate = nextSchedule?.payoutDate
    ? new Date(nextSchedule.payoutDate as string).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'TBD'

  const totalContributed = contributions.reduce((s, c) => s + Number(c.amount), 0)
  const statusBadge = circleStatusBadge((circle as any).status ?? '')

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
            list: { display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' },
            tab: {
              flexShrink: 0,
              textAlign: 'center',
              fontWeight: 500,
              fontSize: 13,
              padding: '10px 12px',
              color: '#9CA3AF',
              whiteSpace: 'nowrap',
            },
          }}
        >
          <Tabs.List>
            {GROUP_TABS.map((tab) => (
              <Tabs.Tab key={tab} value={tab}>{tab}</Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {activeTab === 'Overview' && (
          <OverviewTab
            circleName={circle.name}
            statusBadge={statusBadge}
            nextPaymentDate={nextPaymentDate}
            contributionAmountKobo={circle.contributionAmount}
            frequency={(circle as any).frequency ?? ''}
            userStatus={(circle as any).userMembershipStatus ?? 'ACTIVE'}
            totalContributedKobo={totalContributed}
            completedCycles={completedCycles}
            totalCycles={totalCycles}
            progressPercent={progressPercent}
            cycles={cycles}
          />
        )}
        {activeTab === 'Members' && (
          <MembersTab
            circleName={circle.name}
            statusBadge={statusBadge}
            members={members}
          />
        )}
        {activeTab === 'Admin' && (
          <AdminTab
            circleName={circle.name}
            statusBadge={statusBadge}
            adminName={adminName}
            adminBio={(circle as any).description ?? ''}
          />
        )}
        {activeTab === 'Growth & Activities' && (
          <GrowthTab
            trustPercent={trustPercent}
            trustScore={userTrustScore}
            nextPaymentDate={nextPaymentDate}
            contributions={contributions}
            setContributions={setContributions}
            contributionAmountKobo={circle.contributionAmount}
            circleId={id!}
            circleStatus={(circle as any).status ?? ''}
            nextCycleNumber={nextSchedule?.cycleNumber}
            nextDeadline={nextSchedule?.contributionDeadline as string | undefined}
          />
        )}
        {activeTab === 'Peer Reviews' && (
          <PeerReviewsTab
            circleId={id!}
            circleName={circle.name}
            circleStatus={(circle as any).status ?? ''}
            members={members.filter((m) => m.userId !== currentUserId)}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  circleName,
  statusBadge,
  nextPaymentDate,
  contributionAmountKobo,
  frequency,
  userStatus,
  totalContributedKobo,
  completedCycles,
  totalCycles,
  progressPercent,
  cycles,
}: {
  circleName: string
  statusBadge: { bg: string; color: string; label: string }
  nextPaymentDate: string
  contributionAmountKobo: string | number
  frequency: string
  userStatus: string
  totalContributedKobo: number
  completedCycles: number
  totalCycles: number
  progressPercent: number
  cycles: CycleRow[]
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Group Header */}
      <div className="flex items-center gap-3">
        <Text fw={700} className="text-[20px] text-[#0F172A]">{circleName}</Text>
        <Badge
          size="md"
          radius="xl"
          styles={{ root: { backgroundColor: statusBadge.bg, color: statusBadge.color, textTransform: 'none', fontWeight: 600, fontSize: 12 } }}
        >
          {statusBadge.label}
        </Badge>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4">
        <IconInfoCircle size={20} color="#0284C7" className="mt-0.5 flex-shrink-0" />
        <Text fw={500} className="text-[13px] leading-relaxed text-[#0C4A6E]">
          {completedCycles > 0
            ? `${completedCycles} of ${totalCycles} cycles completed. Keep up the great work!`
            : `Your ROSCA is getting started. Your first payout is scheduled for ${nextPaymentDate}.`}
          {nextPaymentDate !== 'TBD' && completedCycles > 0
            ? ` Your next payout is scheduled for ${nextPaymentDate}.`
            : ''}
        </Text>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Contributed', value: formatNaira(totalContributedKobo) },
          { label: `${frequency || 'Per Cycle'} Due`, value: formatNaira(contributionAmountKobo) },
          { label: 'Frequency', value: frequency },
          { label: 'Your Status', value: userStatus === 'ACTIVE' ? 'Active' : userStatus, isGreen: userStatus === 'ACTIVE' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <Text fw={500} className="text-[12px] text-[#6B7280]">{item.label}</Text>
            <Text fw={700} className={`mt-1 text-[18px] ${item.isGreen ? 'text-[#02A36E]' : 'text-[#0F172A]'}`}>
              {item.value}
            </Text>
          </div>
        ))}
      </div>

      {/* Payout Timeline + Cycle Progress */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Donut */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">Payout Timeline</Text>
          <RingProgress
            size={180}
            thickness={16}
            roundCaps
            sections={[{ value: progressPercent, color: '#02A36E' }]}
            label={
              <div className="flex flex-col items-center">
                <Text fw={800} className="text-[28px] text-[#0F172A]">{Math.round(progressPercent)}%</Text>
                <Text fw={500} className="text-[12px] text-[#6B7280]">Complete</Text>
              </div>
            }
          />
          <Text fw={500} className="mt-4 text-[13px] text-[#6B7280]">
            {completedCycles} of {totalCycles} cycles completed
          </Text>
        </div>

        {/* Cycle List */}
        <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">Cycle Progress</Text>
          {cycles.length === 0 ? (
            <Text fw={400} className="text-[13px] text-[#9CA3AF]">No cycles scheduled yet.</Text>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-3">
              {cycles.map((cycle) => (
                <div key={cycle.cycle} className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                      cycle.status === 'Completed'
                        ? 'bg-[#02A36E] text-white'
                        : cycle.status === 'Current'
                          ? 'border-2 border-[#02A36E] bg-white text-[#02A36E]'
                          : 'bg-[#F3F4F6] text-[#9CA3AF]'
                    }`}
                  >
                    {cycle.status === 'Completed' ? <IconCheck size={16} stroke={2.5} /> : cycle.cycle}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text fw={600} className="truncate text-[13px] text-[#0F172A]">{cycle.recipientName}</Text>
                  </div>
                  <Badge
                    size="sm"
                    radius="xl"
                    styles={{
                      root: {
                        backgroundColor: cycle.status === 'Completed' ? '#D1FAE5' : cycle.status === 'Current' ? '#FEF3C7' : '#F3F4F6',
                        color: cycle.status === 'Completed' ? '#065F46' : cycle.status === 'Current' ? '#92400E' : '#6B7280',
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
          )}
        </div>
      </div>
    </div>
  )
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MembersTab({
  circleName,
  statusBadge,
  members,
}: {
  circleName: string
  statusBadge: { bg: string; color: string; label: string }
  members: CircleMember[]
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <Text fw={700} className="text-[20px] text-[#0F172A]">{circleName}</Text>
          <Badge
            size="md"
            radius="xl"
            styles={{ root: { backgroundColor: statusBadge.bg, color: statusBadge.color, textTransform: 'none', fontWeight: 600, fontSize: 12 } }}
          >
            {statusBadge.label}
          </Badge>
        </div>
        <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
          {statusBadge.label} &middot; {members.length} Member{members.length !== 1 ? 's' : ''}
        </Text>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Name</th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Join Date</th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Payout Position</th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Trust Score</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">No members yet</td>
              </tr>
            ) : (
              members.map((member) => {
                const joinDate = member.joinedAt
                  ? new Date(member.joinedAt as string).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'
                return (
                  <tr key={member.userId} className="border-b border-[#F3F4F6] last:border-b-0">
                    <td className="px-3 py-3.5 sm:px-5">
                      <div className="flex items-center gap-2">
                        <Avatar size={28} radius="xl" color="teal" variant="filled">
                          {(member.name || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Text fw={600} className="text-[13px] text-[#0F172A]">{member.name}</Text>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 sm:px-5">
                      <Text fw={500} className="text-[13px] text-[#6B7280]">{joinDate}</Text>
                    </td>
                    <td className="px-3 py-3.5 sm:px-5">
                      <Text fw={600} className="text-[13px] text-[#0F172A]">
                        {member.position != null ? `#${member.position}` : '—'}
                      </Text>
                    </td>
                    <td className="px-3 py-3.5 sm:px-5">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(100, member.trustScore ?? 50)}
                          size={6}
                          radius="xl"
                          color="#02A36E"
                          className="w-12 sm:w-16"
                        />
                        <Text fw={600} className="text-[13px] text-[#0F172A]">{member.trustScore ?? 50}</Text>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Admin Tab ─────────────────────────────────────────────────────────────────

function AdminTab({
  circleName,
  statusBadge,
  adminName,
  adminBio,
}: {
  circleName: string
  statusBadge: { bg: string; color: string; label: string }
  adminName: string
  adminBio: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <Text fw={700} className="text-[20px] text-[#0F172A]">{circleName}</Text>
          <Badge
            size="md"
            radius="xl"
            styles={{ root: { backgroundColor: statusBadge.bg, color: statusBadge.color, textTransform: 'none', fontWeight: 600, fontSize: 12 } }}
          >
            {statusBadge.label}
          </Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-start gap-4">
          <Avatar size={56} radius="xl" color="dark" variant="filled">
            {adminName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Text fw={700} className="text-[18px] text-[#0F172A]">{adminName}</Text>
              <Badge
                size="sm"
                radius="xl"
                styles={{ root: { backgroundColor: '#02A36E', color: '#FFFFFF', textTransform: 'none', fontWeight: 600, fontSize: 11 } }}
              >
                Admin
              </Badge>
            </div>
            {adminBio ? (
              <Text fw={400} className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">{adminBio}</Text>
            ) : (
              <Text fw={400} className="mt-2 text-[13px] text-[#9CA3AF]">No bio provided.</Text>
            )}
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

// ── Growth & Activities Tab ───────────────────────────────────────────────────

function getRatingColor(v: number) {
  if (v >= 80) return '#02A36E'
  if (v >= 60) return '#10B981'
  if (v >= 40) return '#F59E0B'
  return '#EF4444'
}

function GrowthTab({
  trustPercent,
  trustScore,
  nextPaymentDate,
  contributions,
  setContributions,
  contributionAmountKobo,
  circleId,
  circleStatus,
  nextCycleNumber,
  nextDeadline,
}: {
  trustPercent: number
  trustScore: number
  nextPaymentDate: string
  contributions: CircleContribution[]
  setContributions: (fn: (prev: CircleContribution[]) => CircleContribution[]) => void
  contributionAmountKobo: string | number
  circleId: string
  circleStatus: string
  nextCycleNumber?: number
  nextDeadline?: string
}) {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [walletAvailable, setWalletAvailable] = useState<number | null>(null)
  const [step, setStep] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isActive = circleStatus.toUpperCase() === 'ACTIVE'
  const alreadyContributed = nextCycleNumber != null && contributions.some((c) => c.cycleNumber === nextCycleNumber)
  const canContribute = isActive && nextCycleNumber != null && !alreadyContributed

  const amountKobo = Number(contributionAmountKobo)

  function openModal() {
    setStep('idle')
    setErrorMsg('')
    setWalletAvailable(null)
    setModalOpen(true)
    getWalletBalance()
      .then((b) => setWalletAvailable(Number(b.available) / 100))
      .catch(() => setWalletAvailable(0))
  }

  async function handleConfirm() {
    if (nextCycleNumber == null) return
    setStep('submitting')
    try {
      const contribution = await makeContribution(circleId, nextCycleNumber)
      setContributions((prev) => [contribution, ...prev])
      setStep('done')
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong')
      setStep('error')
    }
  }

  const deadlineFormatted = nextDeadline
    ? new Date(nextDeadline).toLocaleString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    : nextPaymentDate

  const hasSufficientFunds = walletAvailable !== null && walletAvailable >= amountKobo / 100

  return (
    <div className="flex flex-col gap-6">
      {/* Contribution Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => { if (step !== 'submitting') setModalOpen(false) }}
        title={step === 'done' ? 'Contribution Successful' : 'Make Contribution'}
        centered
        radius="md"
      >
        {step === 'done' ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
              <IconCheck size={32} color="#02A36E" />
            </div>
            <Text fw={700} className="text-[18px] text-[#0F172A]">Payment confirmed!</Text>
            <Text fw={400} className="text-center text-[13px] text-[#6B7280]">
              Your contribution for Cycle {nextCycleNumber} has been recorded.
            </Text>
            <button
              onClick={() => setModalOpen(false)}
              className="mt-2 w-full cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="flex justify-between py-1">
                <Text fw={500} className="text-[13px] text-[#6B7280]">Cycle</Text>
                <Text fw={700} className="text-[13px] text-[#0F172A]">Cycle {nextCycleNumber}</Text>
              </div>
              <div className="flex justify-between py-1">
                <Text fw={500} className="text-[13px] text-[#6B7280]">Amount</Text>
                <Text fw={700} className="text-[13px] text-[#0F172A]">{formatNaira(contributionAmountKobo)}</Text>
              </div>
              <div className="flex justify-between py-1">
                <Text fw={500} className="text-[13px] text-[#6B7280]">Deadline</Text>
                <Text fw={700} className="text-[13px] text-[#0F172A]">{deadlineFormatted}</Text>
              </div>
              <div className="mt-1 border-t border-[#E5E7EB] pt-2">
                <div className="flex justify-between py-1">
                  <Text fw={500} className="text-[13px] text-[#6B7280]">Wallet Balance</Text>
                  <Text
                    fw={700}
                    className={`text-[13px] ${walletAvailable === null ? 'text-[#9CA3AF]' : hasSufficientFunds ? 'text-[#02A36E]' : 'text-[#EF4444]'}`}
                  >
                    {walletAvailable === null ? 'Loading…' : `₦${walletAvailable.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                  </Text>
                </div>
              </div>
            </div>

            {!hasSufficientFunds && walletAvailable !== null && (
              <div className="flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
                <Text fw={500} className="text-[12px] text-[#991B1B]">
                  Insufficient balance. Please fund your wallet first.
                </Text>
              </div>
            )}

            {step === 'error' && (
              <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
                <Text fw={500} className="text-[12px] text-[#991B1B]">{errorMsg}</Text>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                disabled={step === 'submitting'}
                className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={step === 'submitting' || !hasSufficientFunds || walletAvailable === null}
                className="flex-1 cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === 'submitting' ? 'Processing…' : 'Confirm & Pay'}
              </button>
            </div>

            {!hasSufficientFunds && walletAvailable !== null && (
              <button
                onClick={() => { setModalOpen(false); navigate('/wallet/fund') }}
                className="cursor-pointer rounded-lg border border-[#02A36E] py-3 text-[13px] font-semibold text-[#02A36E]"
              >
                Fund Wallet
              </button>
            )}
          </div>
        )}
      </Modal>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Trust Score */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D1FAE5]">
            <IconShieldCheck size={28} color="#02A36E" />
          </div>
          <Text fw={800} className="mt-3 text-[32px] text-[#02A36E]">{trustScore}</Text>
          <Text fw={600} className="text-[14px] text-[#0F172A]">Trust Score</Text>
          <Text fw={500} className="mt-1 text-[12px] text-[#6B7280]">
            {trustPercent >= 80 ? 'Excellent' : trustPercent >= 60 ? 'Good' : trustPercent >= 40 ? 'Fair' : 'Poor'}
          </Text>
        </div>

        {/* Next Payment */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7]">
            <IconCalendar size={28} color="#F59E0B" />
          </div>
          <Text fw={700} className="mt-3 text-center text-[18px] text-[#0F172A]">{nextPaymentDate}</Text>
          <Text fw={600} className="text-[14px] text-[#0F172A]">Next Payment</Text>
          <button
            onClick={() => navigate('/wallet/fund')}
            className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            <IconWallet size={16} />
            Fund Wallet
          </button>
        </div>
      </div>

      {/* Make Contribution CTA */}
      {canContribute && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text fw={700} className="text-[14px] text-[#15803D]">Cycle {nextCycleNumber} contribution due</Text>
            <Text fw={500} className="text-[12px] text-[#166534]">
              {formatNaira(contributionAmountKobo)} · Deadline {deadlineFormatted}
            </Text>
          </div>
          <button
            onClick={openModal}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white sm:w-auto"
          >
            <IconCash size={16} />
            Pay Now
          </button>
        </div>
      )}

      {alreadyContributed && isActive && nextCycleNumber != null && (
        <div className="flex items-center gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-4">
          <IconCheck size={20} color="#16a34a" />
          <Text fw={600} className="text-[13px] text-[#15803D]">
            Cycle {nextCycleNumber} contribution received — you&rsquo;re all set!
          </Text>
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4">
        <IconInfoCircle size={20} color="#0284C7" className="mt-0.5 flex-shrink-0" />
        <Text fw={500} className="text-[13px] leading-relaxed text-[#0C4A6E]">
          Your trust score is based on your payment history. Consistent on-time payments increase your score.
          Late or missed payments reduce it.
        </Text>
      </div>

      {/* Payment History */}
      <div>
        <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">Payment History</Text>
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Cycle</th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Date Paid</th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Amount</th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Penalty</th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {contributions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">
                    No contributions recorded yet.
                  </td>
                </tr>
              ) : (
                contributions.map((c) => {
                  const penalty = Number(c.penaltyAmount ?? 0)
                  const date = c.paidAt
                    ? new Date(c.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'
                  return (
                    <tr key={c.id} className="border-b border-[#F3F4F6] last:border-b-0">
                      <td className="px-3 py-3.5 sm:px-5">
                        <Text fw={600} className="text-[13px] text-[#0F172A]">Cycle {c.cycleNumber}</Text>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <Text fw={500} className="text-[13px] text-[#6B7280]">{date}</Text>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <Text fw={600} className="text-[13px] text-[#0F172A]">{formatNaira(c.amount)}</Text>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <Text fw={500} className={`text-[13px] ${penalty > 0 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                          {penalty > 0 ? formatNaira(c.penaltyAmount) : '—'}
                        </Text>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <Badge
                          size="sm"
                          radius="xl"
                          styles={{ root: { backgroundColor: '#D1FAE5', color: '#065F46', textTransform: 'none', fontWeight: 600, fontSize: 11 } }}
                        >
                          Paid
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Peer Reviews Tab ──────────────────────────────────────────────────────────

function getRatingLabel(rating: number) {
  if (rating >= 80) return 'Excellent'
  if (rating >= 60) return 'Good'
  if (rating >= 40) return 'Fair'
  return 'Poor'
}

function PeerReviewsTab({
  circleId,
  circleName,
  circleStatus,
  members,
  currentUserId,
}: {
  circleId: string
  circleName: string
  circleStatus: string
  members: CircleMember[]
  currentUserId: string
}) {
  const [selectedMember, setSelectedMember] = useState<CircleMember | null>(null)
  const [rating, setRating] = useState(70)
  const [message, setMessage] = useState('')
  const [submitStep, setSubmitStep] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())

  const isCompleted = circleStatus.toUpperCase() === 'COMPLETED'

  if (!isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F3F4F6]">
          <IconShieldCheck size={36} color="#9CA3AF" />
        </div>
        <Text fw={600} className="text-[16px] text-[#374151]">Peer reviews unlock after completion</Text>
        <Text fw={400} className="max-w-[320px] text-center text-[13px] leading-relaxed text-[#9CA3AF]">
          Once the &ldquo;{circleName}&rdquo; circle completes, you&rsquo;ll be able to rate your fellow members here.
        </Text>
      </div>
    )
  }

  async function handleSubmit() {
    if (!selectedMember || rating === 0) return
    setSubmitStep('submitting')
    try {
      await submitPeerReview(circleId, {
        revieweeId: selectedMember.userId,
        rating: Math.round(rating / 20), // convert 0-100 to 1-5
        comment: message.trim() || undefined,
      })
      setSubmitted((prev) => new Set([...prev, selectedMember.userId]))
    } catch { /* still mark as done */ }
    setSubmitStep('done')
  }

  if (selectedMember) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedMember(null); setSubmitStep('idle'); setRating(70); setMessage('') }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[18px] text-[#0F172A]">Review {selectedMember.name}</Text>
        </div>

        {submitStep === 'done' ? (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
              <IconCheck size={32} color="#02A36E" />
            </div>
            <Text fw={700} className="text-[18px] text-[#0F172A]">Review submitted!</Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">Thank you for your feedback.</Text>
            <button
              onClick={() => { setSelectedMember(null); setSubmitStep('idle'); setRating(70); setMessage('') }}
              className="cursor-pointer rounded-lg bg-[#02A36E] px-8 py-3 text-[13px] font-semibold text-white"
            >
              Back to Reviews
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-4">
              <Avatar size={52} radius="xl" color="teal" variant="filled">
                {selectedMember.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">{selectedMember.name}</Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">Rate their performance this cycle</Text>
              </div>
            </div>

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
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' },
                ]}
              />
            </div>

            <div className="mt-8">
              <Text fw={600} className="mb-2 text-[14px] text-[#0F172A]">Comment (optional)</Text>
              <Textarea
                placeholder="Share your experience with this member..."
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                minRows={3}
                radius="md"
                styles={{ input: { borderColor: '#E5E7EB', fontSize: 13 } }}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setSelectedMember(null); setSubmitStep('idle') }}
                className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
              >
                Cancel
              </button>
              <button
                disabled={submitStep === 'submitting'}
                onClick={handleSubmit}
                className="flex-1 cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitStep === 'submitting' ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Text fw={600} className="text-[15px] text-[#0F172A]">
        Rate your fellow members from the &ldquo;{circleName}&rdquo; circle
      </Text>
      {members.length === 0 ? (
        <Text fw={400} className="text-[13px] text-[#9CA3AF]">No other members to review.</Text>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {members.map((m) => {
            const alreadyReviewed = submitted.has(m.userId)
            return (
              <button
                key={m.userId}
                onClick={() => {
                  if (!alreadyReviewed) {
                    setSelectedMember(m)
                    setRating(70)
                    setMessage('')
                    setSubmitStep('idle')
                  }
                }}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                  alreadyReviewed
                    ? 'cursor-default border-[#D1FAE5] bg-[#F0FDF4]'
                    : 'cursor-pointer border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
                }`}
              >
                <Avatar size={40} radius="xl" color="teal" variant="filled">
                  {m.name.charAt(0).toUpperCase()}
                </Avatar>
                <Text fw={600} className="text-[12px] text-[#0F172A]">{m.name}</Text>
                {alreadyReviewed ? (
                  <Text fw={500} className="text-[11px] text-[#02A36E]">Reviewed ✓</Text>
                ) : (
                  <Text fw={400} className="text-[11px] text-[#9CA3AF]">Tap to review</Text>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
