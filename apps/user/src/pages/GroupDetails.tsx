import { useState, useEffect } from 'react'
import { Text, Avatar, Badge, Table, Textarea, Loader } from '@mantine/core'
import {
  IconArrowLeft,
  IconUsers,
  IconLock,
  IconMessageCircle,
  IconCircleCheck,
  IconX,
  IconStar,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  listRoscaCircles,
  getRoscaSchedules,
  getCircleMembers,
  submitPeerReview,
  getCirclePeerReviews,
  type RoscaCircle,
  type RoscaSchedule,
  type CircleMember,
  type PeerReview,
} from '@/utils/api'

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

interface ScheduleRow {
  month: string
  user: string
  status: string
}

export function GroupDetails() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [group, setGroup] = useState<GroupData | null>(null)
  const [schedule, setSchedule] = useState<ScheduleRow[]>([])
  const [loading, setLoading] = useState(true)

  const [messageOpen, setMessageOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messageStep, setMessageStep] = useState<'compose' | 'sending' | 'sent'>('compose')

  // Peer review state
  const [members, setMembers] = useState<CircleMember[]>([])
  const [membersLoaded, setMembersLoaded] = useState(false)
  const [existingReviews, setExistingReviews] = useState<PeerReview[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<CircleMember | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewStep, setReviewStep] = useState<'form' | 'submitting' | 'done'>('form')

  const currentUserId = (() => {
    try {
      const stored = localStorage.getItem('user')
      const u = stored ? JSON.parse(stored) : {}
      return u.id ?? u._id ?? ''
    } catch { return '' }
  })()

  useEffect(() => {
    async function fetchData() {
      try {
        const [circles, schedules] = await Promise.all([
          listRoscaCircles(),
          getRoscaSchedules(id!).catch(() => [] as RoscaSchedule[]),
        ])
        // Fetch members and existing reviews in background
        getCircleMembers(id!).then((m) => { setMembers(m); setMembersLoaded(true) }).catch(() => setMembersLoaded(true))
        getCirclePeerReviews(id!).then(setExistingReviews).catch(() => {})
        const circle = (Array.isArray(circles) ? circles : []).find((c: RoscaCircle) => c.id === id)
        if (circle) {
          const slotsLeft = (circle.maxSlots ?? 0) - (circle.filledSlots ?? 0)
          const adminName = circle.admin
            ? `${circle.admin.firstName ?? ''} ${circle.admin.lastName ?? ''}`.trim()
            : 'Unknown'
          const amountNaira = Number(circle.contributionAmount ?? 0) / 100
          const formattedAmount = `₦${amountNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
          const payoutLogicLabel: Record<string, string> = {
            SEQUENTIAL: 'Sequential',
            RANDOM_DRAW: 'Random Draw',
            TRUST_SCORE: 'Trust Score',
            COMBINED: 'Combined',
            ADMIN_ASSIGNED: 'Admin Assigned',
          }
          setGroup({
            id: circle.id,
            name: circle.name,
            status: (circle.visibility === 'PRIVATE' ? 'Invite Only' : 'Open') as GroupStatus,
            amount: formattedAmount,
            frequency: circle.frequency ?? '',
            duration: `${circle.durationCycles ?? ''} cycles`,
            slotsLeft: `${slotsLeft} Slots left`,
            contribution: `${formattedAmount} ${(circle.frequency ?? '').toLowerCase()}`,
            payoutOrder: payoutLogicLabel[(circle.payoutLogic as string) ?? ''] ?? String(circle.payoutLogic ?? '—'),
            penalty: '—',
            admin: adminName,
            adminBio: String((circle as Record<string, unknown>).adminBio ?? ''),
            completionRate: `${(circle as Record<string, unknown>).completionRate ?? 0}%`,
          })
        }
        setSchedule(
          (Array.isArray(schedules) ? schedules : []).map((s: RoscaSchedule) => ({
            month: s.month ?? '',
            user: s.recipient ?? '',
            status: s.status ?? 'Pending',
          }))
        )
      } catch (err) {
        console.error('Failed to fetch group details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader size={48} color="#02A36E" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Text fw={600} className="text-[#374151]">Group not found</Text>
        <button onClick={() => navigate('/rosca')} className="text-[#02A36E] cursor-pointer text-sm font-medium">
          Back to groups
        </button>
      </div>
    )
  }

  const isInviteOnly = group.status === 'Invite Only'
  const isMember = membersLoaded && members.some((m) => m.userId === currentUserId)

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
          {members.length > 0 && (
            <div className="flex items-center">
              <Avatar.Group>
                {members.slice(0, 4).map((m) => {
                  const name = m.name || `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || `U`
                  const initials = name.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
                  return (
                    <Avatar key={m.userId} size={40} radius="xl" color="teal" variant="filled">
                      {initials}
                    </Avatar>
                  )
                })}
                {members.length > 4 && (
                  <Avatar size={40} radius="xl" color="gray" variant="filled">
                    +{members.length - 4}
                  </Avatar>
                )}
              </Avatar.Group>
            </div>
          )}
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
                {schedule.map((row) => (
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
            {isMember ? (
              <button
                onClick={() => navigate(`/rosca/${id}/activities`)}
                className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white"
              >
                View Activities
              </button>
            ) : isInviteOnly ? (
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
            {!isMember && (
              <button className="w-full cursor-pointer rounded-xl border-2 border-[#EF4444] py-4 text-[15px] font-semibold text-[#EF4444]">
                Report Group
              </button>
            )}
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

      {/* Peer Reviews Section */}
      {members.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
            Peer Reviews
          </Text>
          <Text fw={400} className="mb-5 text-[13px] text-[#6B7280]">
            Rate your fellow members after completing a cycle together.
          </Text>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {members
              .filter((m) => m.userId !== currentUserId)
              .map((m) => {
                const alreadyReviewed = existingReviews.some((r) => r.revieweeId === m.userId)
                const displayName = m.name || `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || `User ${m.userId.slice(0, 6)}`
                const initials = displayName.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
                return (
                  <button
                    key={m.userId}
                    onClick={() => {
                      if (!alreadyReviewed) {
                        setReviewTarget(m)
                        setReviewRating(0)
                        setReviewComment('')
                        setReviewStep('form')
                        setReviewOpen(true)
                      }
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                      alreadyReviewed
                        ? 'cursor-default border-[#D1FAE5] bg-[#F0FDF4]'
                        : 'cursor-pointer border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <Avatar size={40} radius="xl" color="teal" variant="filled">
                      {initials}
                    </Avatar>
                    <Text fw={600} className="text-[12px] text-[#0F172A]">{displayName}</Text>
                    {alreadyReviewed ? (
                      <div className="flex items-center gap-1">
                        <IconCircleCheck size={14} color="#02A36E" />
                        <Text fw={500} className="text-[11px] text-[#02A36E]">Reviewed</Text>
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <IconStar key={s} size={12} color="#D1D5DB" />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
          </div>

          {/* Received reviews */}
          {existingReviews.length > 0 && (
            <div className="mt-6">
              <Text fw={600} className="mb-3 text-[14px] text-[#0F172A]">Reviews you've submitted</Text>
              <div className="flex flex-col gap-2">
                {existingReviews
                  .filter((r) => r.reviewerId === currentUserId)
                  .map((r) => {
                    const reviewee = r.reviewee
                    const name = reviewee
                      ? `${reviewee.firstName ?? ''} ${reviewee.lastName ?? ''}`.trim()
                      : `User ${r.revieweeId.slice(0, 6)}`
                    return (
                      <div key={r.id} className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3">
                        <Text fw={500} className="text-[13px] text-[#0F172A]">{name}</Text>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map((s) => (
                            <IconStar key={s} size={14} fill={s <= r.rating ? '#FBBF24' : 'none'} color={s <= r.rating ? '#FBBF24' : '#D1D5DB'} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Peer Review Modal */}
      {reviewOpen && reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-[420px] rounded-2xl bg-white p-8">
            {reviewStep === 'form' && (
              <>
                <div className="flex items-center justify-between">
                  <Text fw={700} className="text-[18px] text-[#0F172A]">Rate Member</Text>
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-[#F3F4F6]"
                  >
                    <IconX size={18} color="#6B7280" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Avatar size={44} radius="xl" color="teal" variant="filled">
                    {(reviewTarget.name || `${reviewTarget.firstName ?? ''} ${reviewTarget.lastName ?? ''}`.trim()).slice(0, 2).toUpperCase()}
                  </Avatar>
                  <div>
                    <Text fw={600} className="text-[15px] text-[#0F172A]">
                      {reviewTarget.name || `${reviewTarget.firstName ?? ''} ${reviewTarget.lastName ?? ''}`.trim() || `User ${reviewTarget.userId.slice(0, 6)}`}
                    </Text>
                    <Text fw={400} className="text-[12px] text-[#6B7280]">Member of {group?.name}</Text>
                  </div>
                </div>

                <div className="mt-6">
                  <Text fw={600} className="mb-3 text-[14px] text-[#0F172A]">Your Rating</Text>
                  <div className="flex justify-center gap-3">
                    {[1,2,3,4,5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setReviewRating(s)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <IconStar
                          size={36}
                          fill={s <= reviewRating ? '#FBBF24' : 'none'}
                          color={s <= reviewRating ? '#FBBF24' : '#D1D5DB'}
                        />
                      </button>
                    ))}
                  </div>
                  {reviewRating > 0 && (
                    <Text fw={500} className="mt-2 text-center text-[12px] text-[#6B7280]">
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                    </Text>
                  )}
                </div>

                <div className="mt-5">
                  <Text fw={600} className="mb-2 text-[14px] text-[#0F172A]">Comment (optional)</Text>
                  <Textarea
                    placeholder="Share your experience with this member..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.currentTarget.value)}
                    minRows={3}
                    radius="md"
                    styles={{ input: { borderColor: '#E5E7EB', fontSize: 13 } }}
                  />
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={reviewRating === 0}
                    onClick={async () => {
                      setReviewStep('submitting')
                      try {
                        await submitPeerReview(id!, {
                          revieweeId: reviewTarget.userId,
                          rating: reviewRating,
                          comment: reviewComment.trim() || undefined,
                        })
                        // Update existing reviews list optimistically
                        setExistingReviews((prev) => [
                          ...prev,
                          {
                            id: Date.now().toString(),
                            circleId: id!,
                            reviewerId: currentUserId,
                            revieweeId: reviewTarget.userId,
                            rating: reviewRating,
                            comment: reviewComment.trim() || undefined,
                            createdAt: new Date().toISOString(),
                          },
                        ])
                        setReviewStep('done')
                      } catch {
                        setReviewStep('done')
                      }
                    }}
                    className={`flex-1 rounded-lg py-3 text-[13px] font-semibold text-white ${reviewRating > 0 ? 'cursor-pointer bg-[#02A36E]' : 'cursor-not-allowed bg-[#9CA3AF]'}`}
                  >
                    Submit Review
                  </button>
                </div>
              </>
            )}

            {reviewStep === 'submitting' && (
              <div className="flex flex-col items-center py-8">
                <Loader color="#02A36E" size="lg" />
                <Text fw={700} className="mt-5 text-[18px] text-[#0F172A]">Submitting review...</Text>
              </div>
            )}

            {reviewStep === 'done' && (
              <div className="flex flex-col items-center py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
                  <IconCircleCheck size={36} color="#02A36E" />
                </div>
                <Text fw={700} className="mt-5 text-[18px] text-[#0F172A]">Review submitted!</Text>
                <Text fw={500} className="mt-1 text-center text-[13px] text-[#6B7280]">
                  Your review has been recorded. Thank you for your feedback.
                </Text>
                <button
                  onClick={() => setReviewOpen(false)}
                  className="mt-6 cursor-pointer rounded-lg bg-[#02A36E] px-8 py-3 text-[13px] font-semibold text-white"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
