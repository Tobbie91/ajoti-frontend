import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Stack,
  Text,
  Box,
  Group,
  Button,
  Paper,
  Badge,
  TextInput,
  Textarea,
  Select,
  Table,
  Avatar,
  Tabs,
  RingProgress,
  ThemeIcon,
  Modal,
  Checkbox,
  Loader,
  SimpleGrid,
  Switch,
} from '@mantine/core'
import {
  IconTopologyRing,
  IconSearch,
  IconChevronDown,
  IconDownload,
  IconFilter,
  IconX,
  IconCheck,
  IconBell,
  IconTrash,
  IconRefresh,
  IconArrowBackUp,
  IconPlayerPlay,
} from '@tabler/icons-react'
import {
  getPayoutHistory,
  processPayout,
  retryPayout,
  reversePayout,
  getCircleContributions,
  getAdminCircleContributions,
  getAdminDisbursements,
  type Disbursement as ApiDisbursement,
  getAdminCircleDetail,
  activateRoscaCircle,
  updatePayoutConfig,
  getPayoutConfig,
  sendCircleInvite,
  getCircleInvites,
  revokeCircleInvite,
  getMemberProgress,
  notifyMissingContributors,
  getFinancialHealth,
  getCircleJoinRequests,
  type Payout,
  type Contribution as ApiContribution,
  type RoscaCircle,
  type PayoutAssignment,
  type CircleInvite,
  type MemberProgress,
  type FinancialHealth,
} from '@/utils/api'

const PRIMARY = '#0b6b55'

interface GroupInfo {
  id: string
  name: string
  tagline: string
  status: 'Active' | 'Pending' | 'Completed'
  balance: string
}

const mockGroups: GroupInfo[] = [
  { id: '1', name: 'Mamagoals', tagline: 'Grow Together, Save Smarter', status: 'Active', balance: '₦350,000.00' },
  { id: '2', name: 'Men Thrive', tagline: 'Building Wealth Together', status: 'Active', balance: '₦180,000.00' },
  { id: '5', name: 'Hustle Squad', tagline: 'Hustle Hard, Save Smart', status: 'Pending', balance: '₦0.00' },
  { id: '10', name: 'Legacy Builders', tagline: 'Building a Legacy of Savings', status: 'Pending', balance: '₦0.00' },
  { id: '22', name: 'Golden Circle', tagline: 'The Golden Path to Wealth', status: 'Pending', balance: '₦0.00' },
  { id: '7', name: 'Family Fund', tagline: 'Family First Savings', status: 'Completed', balance: '₦600,000.00' },
  { id: '23', name: 'Power Savers', tagline: 'Power in Saving Together', status: 'Completed', balance: '₦440,000.00' },
]

const defaultGroup: GroupInfo = { id: '0', name: 'Monthly 50k Squad', tagline: 'Grow Together, Save Smarter', status: 'Active', balance: '₦0.00' }

function getStatusBadge(status: string) {
  if (status === 'Active') return { bg: '#e6f5f1', color: PRIMARY }
  if (status === 'Pending') return { bg: '#fdf3e7', color: '#e67e22' }
  return { bg: '#e7f5ff', color: '#228be6' }
}




const roundOptions = [
  { value: '4', label: 'Round 4' },
  { value: '3', label: 'Round 3' },
  { value: '2', label: 'Round 2' },
  { value: '1', label: 'Round 1' },
]

// Restart group mock members
interface RestartMember {
  id: string
  name: string
  email: string
}

const defaultRestartMembers: RestartMember[] = [
  { id: '1', name: 'Jane Doe', email: 'jane@domain.com' },
  { id: '2', name: 'Charlie Daves', email: 'chard@domain.com' },
  { id: '3', name: 'John Smith', email: 'johns@domain.com' },
  { id: '4', name: 'Emma Wilson', email: 'emmaw@domain.com' },
  { id: '5', name: 'Alice Johnson', email: 'ajohn@domain.com' },
  { id: '6', name: 'Bob Brown', email: 'bobb@domain.com' },
]

// ── Group Notifications & Peer Review ────────────────────────────────────────

type ApiMemberBasic = { userId: string; name: string; status: string; position: number | null; joinedAt: string }

function GroupNotificationsTab({ circleId, members }: { circleId: string; members: ApiMemberBasic[] }) {
  const activeMembers = members.filter((m) => m.status === 'ACTIVE')

  // Notifications
  const [notifMessage, setNotifMessage] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [sendingAll, setSendingAll] = useState(false)
  const [sendingOne, setSendingOne] = useState<string | null>(null)
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null)
  const [notifError, setNotifError] = useState<string | null>(null)

  // Member progress
  const [progress, setProgress] = useState<MemberProgress[]>([])
  const [progressLoading, setProgressLoading] = useState(false)

  useEffect(() => {
    if (!circleId) return
    setProgressLoading(true)
    getMemberProgress(circleId).then((data) => setProgress(Array.isArray(data) ? data : (data as any)?.data ?? [])).catch(() => {}).finally(() => setProgressLoading(false))
  }, [circleId])

  function toggleMember(userId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  async function handleRemindAll() {
    if (!notifMessage.trim()) return
    setSendingAll(true)
    setNotifError(null)
    try {
      const res = await notifyMissingContributors(circleId, { message: notifMessage.trim() })
      const count = res.notified ?? activeMembers.length
      setNotifSuccess(`Reminder sent to ${count} member${count !== 1 ? 's' : ''}`)
      setNotifMessage('')
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : 'Failed to send reminder')
    } finally {
      setSendingAll(false)
      setTimeout(() => { setNotifSuccess(null); setNotifError(null) }, 4000)
    }
  }

  async function handleRemindSelected() {
    if (!notifMessage.trim() || selectedMemberIds.length === 0) return
    setSendingOne('selected')
    setNotifError(null)
    try {
      const res = await notifyMissingContributors(circleId, { memberIds: selectedMemberIds, message: notifMessage.trim() })
      const count = res.notified ?? selectedMemberIds.length
      setNotifSuccess(`Reminder sent to ${count} member${count !== 1 ? 's' : ''}`)
      setNotifMessage('')
      setSelectedMemberIds([])
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : 'Failed to send reminder')
    } finally {
      setSendingOne(null)
      setTimeout(() => { setNotifSuccess(null); setNotifError(null) }, 4000)
    }
  }

  // Peer Review
  const [reviews, setReviews] = useState<{ userId: string; name: string; rating: number; comment: string }[]>([])
  const [adminReviewMember, setAdminReviewMember] = useState<ApiMemberBasic | null>(null)
  const [adminRating, setAdminRating] = useState(0)
  const [adminComment, setAdminComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  async function handleSubmitReview() {
    if (!adminReviewMember || adminRating === 0) return
    setSubmittingReview(true)
    await new Promise((r) => setTimeout(r, 1000))
    setReviews((prev) => [
      ...prev.filter((r) => r.userId !== adminReviewMember.userId),
      { userId: adminReviewMember.userId, name: adminReviewMember.name, rating: adminRating, comment: adminComment },
    ])
    setSubmittingReview(false)
    setReviewSuccess(true)
    setAdminReviewMember(null)
    setAdminRating(0)
    setAdminComment('')
    setTimeout(() => setReviewSuccess(false), 3000)
  }

  return (
    <Stack gap="lg">
      {/* ── Notifications Section ── */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" mb="md">
          <Box>
            <Text fw={700} fz="md">Send Reminder</Text>
            <Text fz="xs" c="dimmed" mt={2}>Notify all members or select specific ones</Text>
          </Box>
        </Group>

        <Textarea
          placeholder="Type your reminder message..."
          radius="md"
          minRows={3}
          value={notifMessage}
          onChange={(e) => setNotifMessage(e.currentTarget.value)}
          styles={{ input: { border: '1px solid #dee2e6' } }}
          mb="md"
        />

        {notifSuccess && (
          <Paper p="sm" radius="md" mb="md" style={{ background: '#e6f5f1', border: '1px solid #b2dfdb' }}>
            <Group gap="xs">
              <IconCheck size={16} color={PRIMARY} />
              <Text fz="sm" fw={500} style={{ color: PRIMARY }}>{notifSuccess}</Text>
            </Group>
          </Paper>
        )}
        {notifError && (
          <Paper p="sm" radius="md" mb="md" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
            <Text fz="sm" fw={500} c="red">{notifError}</Text>
          </Paper>
        )}

        {/* Member selection */}
        <Text fz="xs" fw={600} c="dimmed" mb="xs">SELECT MEMBERS (optional — leave empty to remind all)</Text>
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
          {activeMembers.map((m) => (
            <Box
              key={m.userId}
              onClick={() => toggleMember(m.userId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${selectedMemberIds.includes(m.userId) ? PRIMARY : '#dee2e6'}`,
                background: selectedMemberIds.includes(m.userId) ? '#e6f5f1' : 'white',
                cursor: 'pointer',
              }}
            >
              <Avatar size={28} radius="xl" color="gray">{(m.name || '?').charAt(0)}</Avatar>
              <Text fz="sm" fw={500} style={{ color: selectedMemberIds.includes(m.userId) ? PRIMARY : '#0F172A' }}>
                {m.name}
              </Text>
            </Box>
          ))}
          {activeMembers.length === 0 && (
            <Text fz="sm" c="dimmed">No active members</Text>
          )}
        </Box>

        <Group gap="sm">
          <Button
            size="sm"
            radius="md"
            style={{ background: PRIMARY }}
            loading={sendingAll}
            disabled={!notifMessage.trim() || sendingOne !== null}
            onClick={handleRemindAll}
          >
            Remind All
          </Button>
          {selectedMemberIds.length > 0 && (
            <Button
              size="sm"
              radius="md"
              variant="outline"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
              loading={sendingOne === 'selected'}
              disabled={!notifMessage.trim() || sendingAll}
              onClick={handleRemindSelected}
            >
              Remind Selected ({selectedMemberIds.length})
            </Button>
          )}
        </Group>
      </Paper>

      {/* ── Member Progress ── */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
        <Group justify="space-between" align="center" px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Box>
            <Text fw={700} fz="md">Member Lifecycle Progress</Text>
            <Text fz="xs" c="dimmed" mt={2}>Contribution status per member across all rounds</Text>
          </Box>
          {progressLoading && <Loader size="xs" color={PRIMARY} />}
        </Group>
        <Table verticalSpacing="sm" horizontalSpacing="lg">
          <Table.Thead>
            <Table.Tr style={{ background: '#f8f9fa' }}>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Member</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Rounds Paid</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Contributed</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Expected</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Missed</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Status</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Payout Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {progress.length === 0 && !progressLoading && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="xl" fz="sm">No progress data available</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {progress.map((p) => {
              const isPaid = (p.status ?? '').toUpperCase() === 'PAID' || (p.status ?? '').toUpperCase() === 'COMPLETED'
              const hasMissed = Number(p.missedPayments ?? 0) > 0
              return (
                <Table.Tr key={p.userId}>
                  <Table.Td>
                    <Group gap="sm" align="center">
                      <Avatar size={28} radius="xl" color="gray">{(p.name || '?').charAt(0)}</Avatar>
                      <Text fz="sm" fw={500}>{p.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">{p.roundsPaid ?? 0} / {p.totalRounds ?? '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" style={{ color: PRIMARY }} fw={600}>
                      ₦{Number(p.amountContributed ?? 0).toLocaleString('en-NG')}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">₦{Number(p.expectedAmount ?? 0).toLocaleString('en-NG')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c={hasMissed ? 'red' : 'dimmed'}>{p.missedPayments ?? 0}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      radius="sm"
                      style={{
                        background: isPaid ? '#e6f5f1' : '#fdf3e7',
                        color: isPaid ? PRIMARY : '#e67e22',
                        border: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {isPaid ? 'Paid' : p.status ?? 'Pending'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="dimmed">
                      {p.payoutDate ? new Date(p.payoutDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* ── Peer Review Section ── */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
        <Group justify="space-between" align="center" px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Box>
            <Text fw={700} fz="md">Peer Reviews</Text>
            <Text fz="xs" c="dimmed" mt={2}>Member reviews after each cycle — admin can also submit</Text>
          </Box>
          {reviewSuccess && (
            <Group gap="xs">
              <IconCheck size={14} color={PRIMARY} />
              <Text fz="xs" fw={500} style={{ color: PRIMARY }}>Review submitted</Text>
            </Group>
          )}
        </Group>

        <Table verticalSpacing="sm" horizontalSpacing="lg">
          <Table.Thead>
            <Table.Tr style={{ background: '#f8f9fa' }}>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Member</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Rating</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Comment</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {activeMembers.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" py="xl" fz="sm">No active members to review</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {activeMembers.map((m) => {
              const review = reviews.find((r) => r.userId === m.userId)
              return (
                <Table.Tr key={m.userId}>
                  <Table.Td>
                    <Group gap="sm" align="center">
                      <Avatar size={28} radius="xl" color="gray">{(m.name || '?').charAt(0)}</Avatar>
                      <Text fz="sm" fw={500}>{m.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {review ? (
                      <Group gap={2}>
                        {[1,2,3,4,5].map((s) => (
                          <span key={s} style={{ color: s <= review.rating ? '#F59E0B' : '#D1D5DB', fontSize: 16 }}>★</span>
                        ))}
                      </Group>
                    ) : (
                      <Text fz="xs" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="dimmed">{review?.comment || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      variant="subtle"
                      size="xs"
                      style={{ color: PRIMARY }}
                      px="xs"
                      onClick={() => {
                        setAdminReviewMember(m)
                        setAdminRating(review?.rating ?? 0)
                        setAdminComment(review?.comment ?? '')
                      }}
                    >
                      {review ? 'Edit Review' : 'Add Review'}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Review Modal */}
      {adminReviewMember && (
        <Modal
          opened={!!adminReviewMember}
          onClose={() => setAdminReviewMember(null)}
          centered
          radius="md"
          size="sm"
          title={<Text fw={700} fz="md">Review: {adminReviewMember.name}</Text>}
        >
          <Stack gap="md">
            <Box>
              <Text fz="sm" fw={500} mb={8}>Rating</Text>
              <Group gap={8}>
                {[1,2,3,4,5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setAdminRating(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: s <= adminRating ? '#F59E0B' : '#D1D5DB', padding: 0 }}
                  >
                    ★
                  </button>
                ))}
              </Group>
            </Box>
            <Textarea
              label="Comment (optional)"
              placeholder="e.g. Consistently paid on time, great group member..."
              radius="md"
              minRows={3}
              value={adminComment}
              onChange={(e) => setAdminComment(e.currentTarget.value)}
              styles={{ input: { border: '1px solid #dee2e6' } }}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="default" radius="md" size="sm" onClick={() => setAdminReviewMember(null)}>Cancel</Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY }}
                loading={submittingReview}
                disabled={adminRating === 0}
                onClick={handleSubmitReview}
              >
                Submit Review
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Stack>
  )
}

export function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [circleData, setCircleData] = useState<RoscaCircle | null>(null)
  const [circleLoading, setCircleLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getAdminCircleDetail(id)
      .then(setCircleData)
      .catch(() => {})
      .finally(() => setCircleLoading(false))
    // Fetch financial health early so the balance card is populated immediately
    getFinancialHealth(id)
      .then(setFinancialHealth)
      .catch(() => {})
    // Fetch pending join request count
    getCircleJoinRequests(id)
      .then((requests) => setPendingJoinCount(requests.length))
      .catch(() => {})
  }, [id])

  const mockFallback = mockGroups.find((g) => g.id === id) || defaultGroup
  const groupName = circleData?.name ?? mockFallback.name
  const groupStatus = (circleData?.status ?? mockFallback.status) as string
  const isPending = groupStatus === 'PENDING' || groupStatus === 'Pending' || groupStatus === 'DRAFT'
  const isCompleted = groupStatus === 'COMPLETED' || groupStatus === 'Completed'
  const slotsAreFull = circleData != null && circleData.filledSlots >= circleData.maxSlots
  const badge = getStatusBadge(isPending ? 'Pending' : isCompleted ? 'Completed' : 'Active')

  const [activeTab, setActiveTab] = useState<string | null>(isCompleted ? 'overview' : 'members')
  const [memberSearch, setMemberSearch] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteContact, setInviteContact] = useState('')
  const [inviteBy, setInviteBy] = useState<string | null>('email')

  // Payment Oversight state
  const [selectedRound, setSelectedRound] = useState<string | null>('4')

  // Restart group modal state
  const [restartModal, setRestartModal] = useState(false)
  const [restartStep, setRestartStep] = useState<'form' | 'restarting'>('form')
  const [keepMembers, setKeepMembers] = useState(false)
  const [restartGroupSize, setRestartGroupSize] = useState('6')
  const [restartContribution, setRestartContribution] = useState('20,000')
  const [restartStartDate, setRestartStartDate] = useState('01/06/2026')
  const [restartMembers, setRestartMembers] = useState<RestartMember[]>(defaultRestartMembers)

  const groupSizeNum = parseInt(restartGroupSize) || 0
  const memberShortfall = groupSizeNum - restartMembers.length

  function handleRestartGroup() {
    setRestartStep('restarting')
    setTimeout(() => {
      setRestartModal(false)
      setRestartStep('form')
    }, 2000)
  }

  function openRestartModal() {
    setRestartStep('form')
    setRestartModal(true)
  }

  // Remove member modal state
  const [removeMemberModal, setRemoveMemberModal] = useState(false)
  const [removeMemberStep, setRemoveMemberStep] = useState<'confirm' | 'removing'>('confirm')
  const [removeMember, setRemoveMember] = useState<RestartMember | null>(null)

  function openRemoveMemberModal(member: RestartMember) {
    setRemoveMember(member)
    setRemoveMemberStep('confirm')
    setRemoveMemberModal(true)
  }

  function handleRemoveMember() {
    setRemoveMemberStep('removing')
    setTimeout(() => {
      if (removeMember) {
        setRestartMembers((prev) => prev.filter((m) => m.id !== removeMember.id))
      }
      setRemoveMemberModal(false)
    }, 1500)
  }

  // Send invite modal state
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<'confirm' | 'sending' | 'success' | 'error'>('confirm')
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Sent invites list
  const [invites, setInvites] = useState<CircleInvite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  function loadInvites() {
    if (!id) return
    setInvitesLoading(true)
    getCircleInvites(id).then(setInvites).catch(() => {}).finally(() => setInvitesLoading(false))
  }

  async function handleSendInvite() {
    if (!id) return
    setInviteStep('sending')
    setInviteError(null)
    try {
      await sendCircleInvite(id, { email: inviteContact })
      setInviteStep('success')
      loadInvites()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite')
      setInviteStep('error')
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!id) return
    setRevokingId(inviteId)
    try {
      await revokeCircleInvite(id, inviteId)
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
    } catch { /* ignore */ } finally {
      setRevokingId(null)
    }
  }

  function openInviteModal() {
    setInviteStep('confirm')
    setInviteError(null)
    setInviteModal(true)
  }

  // Financial health state
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null)
  const [financialHealthLoading, setFinancialHealthLoading] = useState(false)
  const [pendingJoinCount, setPendingJoinCount] = useState<number>(0)

  const totalCollectedKobo = financialHealth?.cycles
    ? (financialHealth.cycles as Array<{ collected?: string | number }>)
        .reduce((sum, c) => sum + Number(c.collected ?? 0), 0)
    : null
  const groupBalance = totalCollectedKobo !== null
    ? `₦${(totalCollectedKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
    : circleLoading ? '...' : '₦0.00'
  const group = { ...mockFallback, name: groupName, status: groupStatus as GroupInfo['status'], balance: groupBalance }

  // Debit filter modal state
  const [debitFilterModal, setDebitFilterModal] = useState(false)
  const [filterRound, setFilterRound] = useState<string | null>('4')
  const [retryAttempt, setRetryAttempt] = useState('all')
  const [failureReasons, setFailureReasons] = useState<string[]>([])

  function toggleFailureReason(reason: string) {
    setFailureReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    )
  }

  // Activate circle modal state
  const [activateModal, setActivateModal] = useState(false)
  const [activateStartDate, setActivateStartDate] = useState('')
  const [activateLoading, setActivateLoading] = useState(false)
  const [activateError, setActivateError] = useState<string | null>(null)
  const [activateSuccess, setActivateSuccess] = useState(false)

  async function handleActivateCircle() {
    if (!id || !activateStartDate) return
    setActivateLoading(true)
    setActivateError(null)
    try {
      await activateRoscaCircle(id, activateStartDate)
      setActivateSuccess(true)
      setTimeout(() => {
        setActivateModal(false)
        setActivateSuccess(false)
        // Refresh circle data
        getAdminCircleDetail(id).then(setCircleData).catch(() => {})
      }, 1500)
    } catch (err) {
      setActivateError(err instanceof Error ? err.message : 'Failed to activate circle')
    } finally {
      setActivateLoading(false)
    }
  }

  // Assign position modal state
  const [assignModal, setAssignModal] = useState(false)
  const [assignMember, setAssignMember] = useState<{ userId: string; name: string } | null>(null)
  const [assignPosition, setAssignPosition] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState(false)
  const [existingAssignments, setExistingAssignments] = useState<PayoutAssignment[]>([])

  function openAssignModal(member: { userId: string; name: string }) {
    setAssignMember(member)
    setAssignPosition('')
    setAssignError(null)
    setAssignSuccess(false)
    setAssignModal(true)
    // Load current assignments to show context
    if (id) {
      getPayoutConfig(id)
        .then((cfg) => setExistingAssignments(cfg.assignments ?? []))
        .catch(() => {})
    }
  }

  async function handleAssignPosition() {
    if (!id || !assignMember || !assignPosition) return
    const pos = parseInt(assignPosition)
    if (!pos || pos < 1) { setAssignError('Enter a valid position number'); return }
    setAssignLoading(true)
    setAssignError(null)
    try {
      await updatePayoutConfig(id, {
        payoutLogic: 'ADMIN_ASSIGNED',
        assignments: [{ userId: assignMember.userId, position: pos }],
      })
      setAssignSuccess(true)
      setTimeout(() => {
        setAssignModal(false)
        setAssignSuccess(false)
        getAdminCircleDetail(id).then(setCircleData).catch(() => {})
      }, 1500)
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign position')
    } finally {
      setAssignLoading(false)
    }
  }

  // Payouts state
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [processingCycle, setProcessingCycle] = useState<number | null>(null)
  const [processCycleInput, setProcessCycleInput] = useState('')
  const [reverseModal, setReverseModal] = useState(false)
  const [reversePayout_, setReversePayout_] = useState<Payout | null>(null)
  const [reverseReason, setReverseReason] = useState('')
  const [reverseLoading, setReverseLoading] = useState(false)

  // Contributions state
  const [contributions, setContributions] = useState<ApiContribution[]>([])
  const [contribLoading, setContribLoading] = useState(false)

  // Payment Oversight state
  const [paymentContribs, setPaymentContribs] = useState<ApiContribution[]>([])
  const [paymentContribsLoading, setPaymentContribsLoading] = useState(false)
  const [disbursements, setDisbursements] = useState<ApiDisbursement[]>([])
  const [disbursementsLoading, setDisbursementsLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'payouts' && id) {
      setPayoutsLoading(true)
      getPayoutHistory(id)
        .then(setPayouts)
        .catch(() => setPayouts([]))
        .finally(() => setPayoutsLoading(false))
    }
    if (activeTab === 'contributions' && id) {
      setContribLoading(true)
      getCircleContributions(id)
        .then((data) => setContributions(data))
        .catch(() => setContributions([]))
        .finally(() => setContribLoading(false))
    }
    if (activeTab === 'payments' && id) {
      setPaymentContribsLoading(true)
      getAdminCircleContributions(id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : ((data as Record<string, unknown>)?.data ?? []) as ApiContribution[]
          setPaymentContribs(arr)
        })
        .catch(() => setPaymentContribs([]))
        .finally(() => setPaymentContribsLoading(false))

      setDisbursementsLoading(true)
      getAdminDisbursements(id)
        .then(setDisbursements)
        .catch(() => setDisbursements([]))
        .finally(() => setDisbursementsLoading(false))

      setFinancialHealthLoading(true)
      getFinancialHealth(id)
        .then(setFinancialHealth)
        .catch(() => {})
        .finally(() => setFinancialHealthLoading(false))
    }
    if (activeTab === 'members' && id) {
      loadInvites()
    }
  }, [activeTab, id])

  async function handleProcessPayout() {
    const cycleNum = parseInt(processCycleInput)
    if (!id || !cycleNum) return
    setProcessingCycle(cycleNum)
    setPayoutError(null)
    try {
      await processPayout(id, cycleNum)
      setProcessCycleInput('')
      const updated = await getPayoutHistory(id)
      setPayouts(updated)
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Failed to process payout')
    } finally {
      setProcessingCycle(null)
    }
  }

  async function handleRetryPayout(payoutId: string) {
    try {
      await retryPayout(payoutId)
      if (id) {
        const updated = await getPayoutHistory(id)
        setPayouts(updated)
      }
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Failed to retry payout')
    }
  }

  async function handleReversePayout() {
    if (!reversePayout_) return
    setReverseLoading(true)
    try {
      await reversePayout({
        originalPayoutId: reversePayout_.id,
        recipientId: String(reversePayout_.recipientId ?? ''),
        scheduleId: String(reversePayout_.scheduleId ?? ''),
        amount: String(reversePayout_.amount),
        reason: reverseReason,
      })
      setReverseModal(false)
      setReversePayout_(null)
      setReverseReason('')
      if (id) {
        const updated = await getPayoutHistory(id)
        setPayouts(updated)
      }
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Failed to reverse payout')
    } finally {
      setReverseLoading(false)
    }
  }

  type ApiMember = { userId: string; name: string; status: string; position: number | null; joinedAt: string }
  const apiMembers: ApiMember[] = ((circleData as Record<string, unknown>)?.members as ApiMember[]) ?? []
  const filteredMembers = apiMembers.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()),
  )

  return (
    <Stack gap="lg">
      {circleLoading && (
        <Group justify="center" py="xl">
          <Loader size="md" color={PRIMARY} />
        </Group>
      )}
      {/* Group Header */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="lg" align="center">
            <ThemeIcon
              size={72}
              radius="xl"
              style={{ background: PRIMARY }}
            >
              <IconTopologyRing size={36} stroke={1.5} color="white" />
            </ThemeIcon>
            <Box>
              <Group gap="sm" align="center" mb={4}>
                <Text fz={22} fw={700}>{group.name}</Text>
                <Badge
                  size="sm"
                  radius="sm"
                  style={{
                    background: badge.bg,
                    color: badge.color,
                    border: 'none',
                    fontWeight: 600,
                  }}
                >
                  {group.status}
                </Badge>
              </Group>
              <Text fz="sm" c="dimmed" mb="md">
                {circleData
                  ? (() => {
                      const freqLabel: Record<string, string> = { WEEKLY: 'Weekly', BI_WEEKLY: 'Bi-weekly', MONTHLY: 'Monthly' }
                      const freq = freqLabel[(circleData.frequency as string) ?? ''] ?? circleData.frequency ?? ''
                      const amount = (Number(circleData.contributionAmount ?? 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
                      return `${freq} · ₦${amount} · ${circleData.filledSlots ?? 0}/${circleData.maxSlots ?? 0} members`
                    })()
                  : group.tagline}
              </Text>
              <Group gap="sm">
                {isPending && (
                  <>
                    <Button
                      size="xs"
                      radius="md"
                      style={{ background: slotsAreFull ? PRIMARY : '#adb5bd' }}
                      leftSection={<IconPlayerPlay size={14} />}
                      disabled={!slotsAreFull}
                      title={!slotsAreFull ? 'All slots must be filled before activating' : undefined}
                      onClick={() => { setActivateStartDate(''); setActivateError(null); setActivateModal(true) }}
                    >
                      {slotsAreFull ? 'Start Circle' : 'Waiting for members…'}
                    </Button>
                    <Button
                      size="xs"
                      radius="md"
                      variant="outline"
                      style={{ borderColor: PRIMARY, color: PRIMARY }}
                      onClick={() => navigate(`/rosca/groups/${id}/edit`)}
                    >
                      Edit Group
                    </Button>
                    <Button
                      size="xs"
                      radius="md"
                      variant="outline"
                      color="red"
                    >
                      Close Group
                    </Button>
                  </>
                )}
                {isCompleted && (
                  <>
                    <Button
                      size="xs"
                      radius="md"
                      style={{ background: PRIMARY }}
                      onClick={openRestartModal}
                    >
                      Restart Group
                    </Button>
                    <Button
                      size="xs"
                      radius="md"
                      variant="outline"
                      color="red"
                    >
                      Close Group
                    </Button>
                  </>
                )}
              </Group>
            </Box>
          </Group>

          {/* Total Group Balance */}
          <Paper
            p="md"
            radius="md"
            style={{ background: PRIMARY, minWidth: 180 }}
          >
            <Text fz="xs" c="white" style={{ opacity: 0.8 }}>Total Group Balance</Text>
            <Text fz={24} fw={700} c="white" mt={4}>{group.balance}</Text>
          </Paper>
        </Group>
      </Paper>

      {/* Tabs */}
      {isCompleted ? (
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          color={PRIMARY}
          styles={{
            tab: { fontWeight: 500, fontSize: 14, paddingBottom: 12 },
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Panel value="overview" pt="lg">
            <Stack gap="lg">
              <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
                <Group grow gap="lg">
                  <Box ta="center">
                    <Text fz="xs" c="dimmed" mb={4}>Total Members</Text>
                    <Text fz="xl" fw={700}>6</Text>
                  </Box>
                  <Box ta="center">
                    <Text fz="xs" c="dimmed" mb={4}>Total Rounds</Text>
                    <Text fz="xl" fw={700}>6</Text>
                  </Box>
                  <Box ta="center">
                    <Text fz="xs" c="dimmed" mb={4}>Total Contribution</Text>
                    <Text fz="xl" fw={700}>₦10,000</Text>
                  </Box>
                  <Box ta="center">
                    <Text fz="xs" c="dimmed" mb={4}>Contribution Rate</Text>
                    <Text fz="xl" fw={700} style={{ color: PRIMARY }}>100%</Text>
                  </Box>
                </Group>
              </Paper>

              <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
                <Group grow gap="lg">
                  <Box ta="center">
                    <Text fz="xs" c="dimmed" mb={4}>Start</Text>
                    <Text fz="md" fw={600}>Nov 2024</Text>
                  </Box>
                  <Box ta="center">
                    <Text fz="xs" c="dimmed" mb={4}>End</Text>
                    <Text fz="md" fw={600}>Apr 2025</Text>
                  </Box>
                  <Box ta="center">
                    <Text fz="xs" c="dimmed" mb={4}>Contribution Frequency</Text>
                    <Text fz="md" fw={600}>Monthly</Text>
                  </Box>
                  <Box ta="center">
                    <Text fz="xs" c="dimmed" mb={4}>Disbursement Amount</Text>
                    <Text fz="md" fw={600}>₦60,000</Text>
                  </Box>
                </Group>
              </Paper>

              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY, alignSelf: 'flex-start' }}
                onClick={openRestartModal}
              >
                Start New Cycle With Members
              </Button>
            </Stack>
          </Tabs.Panel>

          {/* History Tab */}
          <Tabs.Panel value="history" pt="lg">
            <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <Group px="lg" py="md">
                <Text fw={600} fz="md">History</Text>
              </Group>

              <Table verticalSpacing="sm" horizontalSpacing="lg">
                <Table.Thead>
                  <Table.Tr style={{ background: PRIMARY }}>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Cycle</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Rounds</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Disbursed Amount</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Start Date</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>End Date</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td><Text fz="sm">Cycle 1</Text></Table.Td>
                    <Table.Td><Text fz="sm">6</Text></Table.Td>
                    <Table.Td><Text fz="sm">₦60,000</Text></Table.Td>
                    <Table.Td><Text fz="sm">Nov 2024</Text></Table.Td>
                    <Table.Td><Text fz="sm">Apr 2025</Text></Table.Td>
                    <Table.Td>
                      <Button
                        variant="outline"
                        size="xs"
                        radius="md"
                        style={{ borderColor: '#dee2e6', color: '#495057' }}
                      >
                        View Details
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      ) : (
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        color={PRIMARY}
        styles={{
          tab: { fontWeight: 500, fontSize: 14, paddingBottom: 12 },
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="members">Member Management</Tabs.Tab>
          <Tabs.Tab value="payments">Payment Oversight</Tabs.Tab>
          <Tabs.Tab value="progress">Notifications & Reviews</Tabs.Tab>
          <Tabs.Tab value="payouts">Payouts</Tabs.Tab>
          <Tabs.Tab value="contributions">Contributions</Tabs.Tab>
        </Tabs.List>

        {/* Member Management Tab */}
        <Tabs.Panel value="members" pt="lg">
          <Stack gap="lg">
            {/* Invite Member + Pending Requests */}
            {!isCompleted && (
              <Group align="flex-start" gap="lg" wrap="nowrap">
                <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef', flex: 1 }}>
                  <Text fw={600} fz="md" mb="md">Invite Member</Text>
                  <Stack gap="sm">
                    <TextInput
                      label="Name"
                      placeholder="Enter name"
                      size="sm"
                      radius="md"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.currentTarget.value)}
                      styles={{ input: { border: '1px solid #dee2e6' } }}
                    />
                    <Group gap="sm" grow>
                      <TextInput
                        label="Email / Phone"
                        placeholder="Enter email or phone"
                        size="sm"
                        radius="md"
                        value={inviteContact}
                        onChange={(e) => setInviteContact(e.currentTarget.value)}
                        styles={{ input: { border: '1px solid #dee2e6' } }}
                      />
                      <Select
                        label="Invite by"
                        data={[
                          { value: 'email', label: 'Email' },
                          { value: 'phone', label: 'Phone' },
                        ]}
                        value={inviteBy}
                        onChange={setInviteBy}
                        size="sm"
                        radius="md"
                        rightSection={<IconChevronDown size={14} />}
                        styles={{ input: { border: '1px solid #dee2e6' } }}
                        allowDeselect={false}
                      />
                    </Group>
                    <Button
                      size="sm"
                      radius="md"
                      style={{ background: PRIMARY, alignSelf: 'flex-start' }}
                      mt="xs"
                      onClick={openInviteModal}
                    >
                      Send Invite
                    </Button>
                  </Stack>
                </Paper>

                <Paper
                  p="lg"
                  radius="md"
                  style={{
                    border: '1px solid #e9ecef',
                    minWidth: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RingProgress
                    size={120}
                    thickness={10}
                    roundCaps
                    sections={[{ value: Math.min((pendingJoinCount / (circleData?.maxSlots ?? 1)) * 100, 100), color: PRIMARY }]}
                    label={
                      <Text ta="center" fz={22} fw={700} style={{ color: PRIMARY }}>
                        {pendingJoinCount}
                      </Text>
                    }
                  />
                  <Text fz="sm" fw={500} ta="center" mt="sm">
                    Pending Join {pendingJoinCount === 1 ? 'Request' : 'Requests'}
                  </Text>
                </Paper>
              </Group>
            )}

            {/* Manage Members */}
            <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <Group justify="space-between" align="center" px="lg" py="md">
                <Text fw={600} fz="md">Manage Members</Text>
                <TextInput
                  placeholder="Search by names"
                  leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
                  radius="md"
                  size="sm"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.currentTarget.value)}
                  styles={{ input: { border: '1px solid #dee2e6' } }}
                  style={{ width: 260 }}
                />
              </Group>

              <Table verticalSpacing="sm" horizontalSpacing="lg">
                <Table.Thead>
                  <Table.Tr style={{ background: PRIMARY }}>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Name</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Position</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Joined</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredMembers.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text c="dimmed" ta="center" py="xl" fz="sm">
                          {memberSearch ? 'No members match your search' : 'No members have joined this group yet'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {filteredMembers.map((member) => (
                    <Table.Tr key={member.userId}>
                      <Table.Td>
                        <Group gap="sm" align="center">
                          <Avatar size={32} radius="xl" color="gray">
                            {member.name.charAt(0)}
                          </Avatar>
                          <Text fz="sm" fw={500}>{member.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ minWidth: 180 }}>
                        <Text fz="xs" c="dimmed">
                          Position: {member.position ?? 'Not assigned'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            background: member.status === 'ACTIVE' ? '#e6f5f1' : '#f1f3f5',
                            color: member.status === 'ACTIVE' ? PRIMARY : '#868e96',
                            border: 'none',
                            fontWeight: 600,
                          }}
                        >
                          {member.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm">
                          {new Date(member.joinedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="outline"
                          size="xs"
                          radius="md"
                          style={{ borderColor: PRIMARY, color: PRIMARY }}
                          onClick={() => openAssignModal({ userId: member.userId, name: member.name })}
                        >
                          Assign Position
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>

            {/* Sent Invites */}
            {!isCompleted && (
              <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
                <Group justify="space-between" align="center" px="lg" py="md">
                  <Text fw={600} fz="md">Sent Invites</Text>
                  <Button
                    variant="outline"
                    size="xs"
                    radius="md"
                    leftSection={<IconRefresh size={13} />}
                    style={{ borderColor: '#dee2e6', color: '#495057' }}
                    onClick={loadInvites}
                  >
                    Refresh
                  </Button>
                </Group>
                <Table verticalSpacing="sm" horizontalSpacing="lg">
                  <Table.Thead>
                    <Table.Tr style={{ background: '#f8f9fa' }}>
                      <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Name / Contact</Table.Th>
                      <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Status</Table.Th>
                      <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Sent</Table.Th>
                      <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {invitesLoading ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '20px 0' }}>
                          <Loader size="sm" color={PRIMARY} />
                        </Table.Td>
                      </Table.Tr>
                    ) : invites.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text c="dimmed" ta="center" py="lg" fz="sm">No invites sent yet</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : invites.map((inv) => (
                      <Table.Tr key={inv.id}>
                        <Table.Td>
                          <Text fz="sm" fw={500}>{inv.name || '—'}</Text>
                          <Text fz="xs" c="dimmed">{inv.email || inv.phone || ''}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="sm"
                            radius="sm"
                            style={{
                              background: inv.status === 'ACCEPTED' ? '#e6f5f1' : inv.status === 'REVOKED' ? '#f1f3f5' : '#fdf3e7',
                              color: inv.status === 'ACCEPTED' ? PRIMARY : inv.status === 'REVOKED' ? '#868e96' : '#e67e22',
                              border: 'none',
                              fontWeight: 600,
                            }}
                          >
                            {inv.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" c="dimmed">
                            {new Date(inv.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {inv.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="xs"
                              radius="md"
                              color="red"
                              loading={revokingId === inv.id}
                              onClick={() => handleRevokeInvite(inv.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Payment Oversight Tab */}
        <Tabs.Panel value="payments" pt="lg">
          <Stack gap="lg">
            {/* Financial Health */}
            <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
              <Group justify="space-between" align="center" mb="md">
                <Text fw={600} fz="md">Financial Health</Text>
                {financialHealthLoading && <Loader size="xs" color={PRIMARY} />}
              </Group>
              {financialHealth ? (
                <Stack gap="md">
                  <SimpleGrid cols={4} spacing="md">
                    <Box style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 8, padding: '12px 8px' }}>
                      <Text fz="xs" c="dimmed" mb={4}>Total Expected</Text>
                      <Text fz="lg" fw={700}>₦{Number(financialHealth.totalExpected ?? 0).toLocaleString('en-NG')}</Text>
                    </Box>
                    <Box style={{ textAlign: 'center', background: '#f0faf7', borderRadius: 8, padding: '12px 8px' }}>
                      <Text fz="xs" c="dimmed" mb={4}>Total Collected</Text>
                      <Text fz="lg" fw={700} style={{ color: PRIMARY }}>₦{Number(financialHealth.totalCollected ?? 0).toLocaleString('en-NG')}</Text>
                    </Box>
                    <Box style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 8, padding: '12px 8px' }}>
                      <Text fz="xs" c="dimmed" mb={4}>Collection Rate</Text>
                      <Text fz="lg" fw={700}>{financialHealth.collectionRate != null ? `${Number(financialHealth.collectionRate).toFixed(1)}%` : '—'}</Text>
                    </Box>
                    <Box style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 8, padding: '12px 8px' }}>
                      <Text fz="xs" c="dimmed" mb={4}>Total Disbursed</Text>
                      <Text fz="lg" fw={700}>₦{Number(financialHealth.totalDisbursed ?? 0).toLocaleString('en-NG')}</Text>
                    </Box>
                  </SimpleGrid>
                  {financialHealth.cycles && financialHealth.cycles.length > 0 && (
                    <Table verticalSpacing="sm" horizontalSpacing="md">
                      <Table.Thead>
                        <Table.Tr style={{ background: '#f8f9fa' }}>
                          <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Cycle</Table.Th>
                          <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Expected</Table.Th>
                          <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Collected</Table.Th>
                          <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Rate</Table.Th>
                          <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Disbursed</Table.Th>
                          <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Pending</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {financialHealth.cycles.map((cyc) => (
                          <Table.Tr key={cyc.cycle}>
                            <Table.Td><Text fz="sm" fw={500}>Cycle {cyc.cycle}</Text></Table.Td>
                            <Table.Td><Text fz="sm">₦{Number(cyc.expectedContributions ?? 0).toLocaleString('en-NG')}</Text></Table.Td>
                            <Table.Td><Text fz="sm" style={{ color: PRIMARY }}>₦{Number(cyc.actualContributions ?? 0).toLocaleString('en-NG')}</Text></Table.Td>
                            <Table.Td>
                              <Badge size="sm" radius="sm" style={{ background: cyc.collectionRate >= 80 ? '#e6f5f1' : '#fdf3e7', color: cyc.collectionRate >= 80 ? PRIMARY : '#e67e22', border: 'none', fontWeight: 600 }}>
                                {Number(cyc.collectionRate ?? 0).toFixed(0)}%
                              </Badge>
                            </Table.Td>
                            <Table.Td><Text fz="sm">₦{Number(cyc.disbursed ?? 0).toLocaleString('en-NG')}</Text></Table.Td>
                            <Table.Td><Text fz="sm" c="dimmed">₦{Number(cyc.pendingDisbursements ?? 0).toLocaleString('en-NG')}</Text></Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Stack>
              ) : !financialHealthLoading ? (
                <Text fz="sm" c="dimmed">No financial health data available</Text>
              ) : null}
            </Paper>

            {/* Contributions In */}
            <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <Group
                justify="space-between"
                align="center"
                px="lg"
                py="sm"
                style={{ background: PRIMARY }}
              >
                <Text fw={600} fz="sm" c="white">Contributions In</Text>
                <Select
                  data={roundOptions}
                  value={selectedRound}
                  onChange={setSelectedRound}
                  size="xs"
                  radius="md"
                  rightSection={<IconChevronDown size={12} color="white" />}
                  styles={{
                    input: {
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      minWidth: 110,
                    },
                  }}
                  allowDeselect={false}
                />
              </Group>

              <Table verticalSpacing="sm" horizontalSpacing="lg">
                <Table.Thead>
                  <Table.Tr style={{ background: '#f8f9fa' }}>
                    <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Members Name</Table.Th>
                    <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Amount (₦)</Table.Th>
                    <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Status</Table.Th>
                    <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Payout Method</Table.Th>
                    <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Date & Time</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paymentContribsLoading ? (
                    <Table.Tr>
                      <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                        <Loader size="sm" color={PRIMARY} />
                      </Table.Td>
                    </Table.Tr>
                  ) : paymentContribs.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text c="dimmed" ta="center" py="xl" fz="sm">No contributions found</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    paymentContribs.map((c) => {
                      const memberObj = c.member as { firstName?: string; lastName?: string } | undefined
                      const memberName = memberObj
                        ? `${memberObj.firstName ?? ''} ${memberObj.lastName ?? ''}`.trim()
                        : '—'
                      const amountNaira = Number(c.amount) / 100
                      const isPaid = (c.status ?? '').toUpperCase() === 'PAID' || (c.status ?? '').toUpperCase() === 'COMPLETED'
                      const dateStr = c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'
                      return (
                        <Table.Tr key={c.id}>
                          <Table.Td>
                            <Group gap="sm" align="center">
                              <Avatar size={28} radius="xl" color="gray">{(memberName || '?').charAt(0)}</Avatar>
                              <Text fz="sm" fw={500}>{memberName}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td><Text fz="sm">₦{amountNaira.toLocaleString('en-NG')}</Text></Table.Td>
                          <Table.Td>
                            <Badge
                              size="sm"
                              radius="sm"
                              style={{
                                background: isPaid ? '#e6f5f1' : '#fdf3e7',
                                color: isPaid ? PRIMARY : '#e67e22',
                                border: 'none',
                                fontWeight: 600,
                              }}
                            >
                              {isPaid ? 'Paid' : c.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td><Text fz="sm">{(c.payoutMethod as string) ?? 'Auto Debit'}</Text></Table.Td>
                          <Table.Td><Text fz="sm">{dateStr}</Text></Table.Td>
                        </Table.Tr>
                      )
                    })
                  )}
                </Table.Tbody>
              </Table>

              {/* Summary footer */}
              <Group
                justify="space-between"
                align="center"
                px="lg"
                py="md"
                style={{ borderTop: '1px solid #e9ecef', background: '#f8f9fa' }}
              >
                <Group gap="xl">
                  <Box>
                    <Text fz="xs" c="dimmed">Total Expected</Text>
                    <Text fz="sm" fw={600}>₦{(paymentContribs.length * (Number(circleData?.contributionAmount ?? 0) / 100)).toLocaleString('en-NG')}</Text>
                  </Box>
                  <Box>
                    <Text fz="xs" c="dimmed">Total Received</Text>
                    <Text fz="sm" fw={600} style={{ color: PRIMARY }}>
                      ₦{paymentContribs
                        .filter((c) => ['PAID','COMPLETED'].includes((c.status ?? '').toUpperCase()))
                        .reduce((sum, c) => sum + Number(c.amount) / 100, 0)
                        .toLocaleString('en-NG')}
                    </Text>
                  </Box>
                  <Box>
                    <Text fz="xs" c="dimmed">Complete Rate</Text>
                    <Text fz="sm" fw={600} style={{ color: PRIMARY }}>
                      {paymentContribs.length > 0
                        ? `${Math.round((paymentContribs.filter((c) => ['PAID','COMPLETED'].includes((c.status ?? '').toUpperCase())).length / paymentContribs.length) * 100)}%`
                        : '—'}
                    </Text>
                  </Box>
                </Group>
                <Button
                  variant="outline"
                  size="xs"
                  radius="md"
                  leftSection={<IconDownload size={14} />}
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                >
                  Download Logs
                </Button>
              </Group>
            </Paper>

            {/* Auto Debit Logs */}
            <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <Group justify="space-between" align="center" px="lg" py="md">
                <Text fw={600} fz="md">Auto Debit Logs</Text>
                <Button
                  variant="outline"
                  size="xs"
                  radius="md"
                  leftSection={<IconFilter size={14} />}
                  style={{ borderColor: '#dee2e6', color: '#495057' }}
                  onClick={() => setDebitFilterModal(true)}
                >
                  Filters
                </Button>
              </Group>

              <Table verticalSpacing="sm" horizontalSpacing="lg">
                <Table.Thead>
                  <Table.Tr style={{ background: PRIMARY }}>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Members Name</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date & Time</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount (₦)</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Failed Reason</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text c="dimmed" ta="center" py="xl" fz="sm">No debit logs available</Text>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Paper>

            {/* Disbursement Status */}
            <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <Group justify="space-between" align="center" px="lg" py="md">
                <Text fw={600} fz="md">Disbursement Status</Text>
              </Group>

              <Table verticalSpacing="sm" horizontalSpacing="lg">
                <Table.Thead>
                  <Table.Tr style={{ background: PRIMARY }}>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Members Name</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Payment Method</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date Disbursed</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {disbursementsLoading ? (
                    <Table.Tr>
                      <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                        <Loader size="sm" color={PRIMARY} />
                      </Table.Td>
                    </Table.Tr>
                  ) : disbursements.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text c="dimmed" ta="center" py="xl" fz="sm">No disbursements found</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : disbursements.map((d) => {
                    const personObj = (d.recipient ?? d.member) as { firstName?: string; lastName?: string } | undefined
                    const name = personObj ? `${personObj.firstName ?? ''} ${personObj.lastName ?? ''}`.trim() : '—'
                    const amountNaira = Number(d.amount) / 100
                    const isSuccess = ['SUCCESS', 'COMPLETED', 'PAID'].includes((d.status ?? '').toUpperCase())
                    const isUpcoming = ['UPCOMING', 'PENDING', 'SCHEDULED'].includes((d.status ?? '').toUpperCase())
                    const dateStr = (d.disbursedAt ?? d.createdAt)
                      ? new Date((d.disbursedAt ?? d.createdAt) as string).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'
                    return (
                      <Table.Tr key={d.id} style={isUpcoming ? { background: '#f0faf7' } : undefined}>
                        <Table.Td>
                          <Group gap="sm" align="center">
                            <Avatar size={28} radius="xl" color="gray">{(name || '?').charAt(0)}</Avatar>
                            <Text fz="sm" fw={500}>{name}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" c={isUpcoming ? 'dimmed' : undefined}>
                            {isUpcoming ? 'Pending' : `₦${amountNaira.toLocaleString('en-NG')}`}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="sm"
                            radius="sm"
                            style={{
                              background: isSuccess ? '#e6f5f1' : '#f1f3f5',
                              color: isSuccess ? PRIMARY : '#868e96',
                              border: 'none',
                              fontWeight: 600,
                            }}
                          >
                            {isSuccess ? 'Success' : isUpcoming ? 'Upcoming' : d.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td><Text fz="sm">{(d.paymentMethod as string) ?? 'Wallet'}</Text></Table.Td>
                        <Table.Td><Text fz="sm">{dateStr}</Text></Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* ── Payouts Tab ── */}
        <Tabs.Panel value="payouts" pt="lg">
          <Stack gap="lg">
            {/* Trigger payout action */}
            <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
              <Text fw={600} fz="md" mb="md">Manually Trigger Payout</Text>
              <Group gap="sm" align="flex-end">
                <TextInput
                  label="Cycle Number"
                  placeholder="e.g. 1"
                  radius="md"
                  size="sm"
                  value={processCycleInput}
                  onChange={(e) => setProcessCycleInput(e.currentTarget.value.replace(/\D/g, ''))}
                  styles={{ input: { border: '1px solid #dee2e6' }, root: { flex: 1, maxWidth: 180 } }}
                />
                <Button
                  size="sm"
                  radius="md"
                  style={{ background: PRIMARY }}
                  leftSection={<IconPlayerPlay size={14} />}
                  loading={processingCycle !== null}
                  disabled={!processCycleInput}
                  onClick={handleProcessPayout}
                >
                  Process Payout
                </Button>
              </Group>
              {payoutError && (
                <Text fz="sm" c="red" mt="sm">{payoutError}</Text>
              )}
            </Paper>

            {/* Payout History */}
            <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <Group justify="space-between" align="center" px="lg" py="md">
                <Text fw={600} fz="md">Payout History</Text>
                <Button
                  variant="outline"
                  size="xs"
                  radius="md"
                  leftSection={<IconRefresh size={13} />}
                  style={{ borderColor: '#dee2e6', color: '#495057' }}
                  onClick={() => {
                    if (!id) return
                    setPayoutsLoading(true)
                    getPayoutHistory(id).then(setPayouts).catch(() => {}).finally(() => setPayoutsLoading(false))
                  }}
                >
                  Refresh
                </Button>
              </Group>

              {payoutsLoading ? (
                <Group justify="center" py="xl">
                  <Loader size="sm" color={PRIMARY} />
                </Group>
              ) : (
                <Table verticalSpacing="sm" horizontalSpacing="lg">
                  <Table.Thead>
                    <Table.Tr style={{ background: PRIMARY }}>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Cycle</Table.Th>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Recipient</Table.Th>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount</Table.Th>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date</Table.Th>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {payouts.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text c="dimmed" ta="center" py="xl" fz="sm">No payouts found for this circle</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                    {payouts.map((p) => {
                      const statusColor =
                        p.status === 'SUCCESS' || p.status === 'COMPLETED'
                          ? { bg: '#e6f5f1', color: PRIMARY }
                          : p.status === 'FAILED'
                          ? { bg: '#fef2f2', color: '#e74c3c' }
                          : { bg: '#f1f3f5', color: '#868e96' }
                      const recipient = p.recipientName ?? (p.member as { firstName?: string; lastName?: string } | undefined)
                        ? `${(p.member as { firstName?: string })?.firstName ?? ''} ${(p.member as { lastName?: string })?.lastName ?? ''}`.trim()
                        : '—'
                      return (
                        <Table.Tr key={p.id}>
                          <Table.Td><Text fz="sm" fw={500}>Cycle {p.cycleNumber}</Text></Table.Td>
                          <Table.Td>
                            <Group gap="sm" align="center">
                              <Avatar size={28} radius="xl" color="gray">{(recipient || '?').charAt(0)}</Avatar>
                              <Text fz="sm">{recipient || '—'}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text fz="sm" fw={600}>
                              ₦{Number(p.amount).toLocaleString('en-NG')}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="sm"
                              radius="sm"
                              style={{ background: statusColor.bg, color: statusColor.color, border: 'none', fontWeight: 600 }}
                            >
                              {p.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fz="sm" c="dimmed">
                              {p.processedAt ? new Date(p.processedAt).toLocaleDateString('en-NG') : p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-NG') : '—'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              {p.status === 'FAILED' && (
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  px="xs"
                                  leftSection={<IconRefresh size={12} />}
                                  style={{ color: '#e67e22' }}
                                  onClick={() => handleRetryPayout(p.id)}
                                >
                                  Retry
                                </Button>
                              )}
                              {(p.status === 'SUCCESS' || p.status === 'COMPLETED') && (
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  px="xs"
                                  leftSection={<IconArrowBackUp size={12} />}
                                  style={{ color: '#e74c3c' }}
                                  onClick={() => {
                                    setReversePayout_(p)
                                    setReverseReason('')
                                    setReverseModal(true)
                                  }}
                                >
                                  Reverse
                                </Button>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* ── Contributions Tab ── */}
        <Tabs.Panel value="contributions" pt="lg">
          <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
            <Group justify="space-between" align="center" px="lg" py="md">
              <Text fw={600} fz="md">Contribution History</Text>
              <Button
                variant="outline"
                size="xs"
                radius="md"
                leftSection={<IconRefresh size={13} />}
                style={{ borderColor: '#dee2e6', color: '#495057' }}
                onClick={() => {
                  if (!id) return
                  setContribLoading(true)
                  getCircleContributions(id).then((data) => setContributions(data)).catch(() => {}).finally(() => setContribLoading(false))
                }}
              >
                Refresh
              </Button>
            </Group>

            {contribLoading ? (
              <Group justify="center" py="xl">
                <Loader size="sm" color={PRIMARY} />
              </Group>
            ) : (
              <Table verticalSpacing="sm" horizontalSpacing="lg">
                <Table.Thead>
                  <Table.Tr style={{ background: PRIMARY }}>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Member</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Cycle</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {contributions.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text c="dimmed" ta="center" py="xl" fz="sm">No contributions found for this circle</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {contributions.map((c, i) => {
                    const m = (c as ApiContribution).member as { firstName?: string; lastName?: string } | undefined
                    const memberName = m ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() : '—'
                    const st = (c as ApiContribution).status
                    const statusColor =
                      st === 'COMPLETED' || st === 'PAID'
                        ? { bg: '#e6f5f1', color: PRIMARY }
                        : st === 'FAILED'
                        ? { bg: '#fef2f2', color: '#e74c3c' }
                        : { bg: '#f1f3f5', color: '#868e96' }
                    const cycleNum = (c as ApiContribution).cycleNumber
                    const createdAt = (c as ApiContribution).createdAt
                    return (
                      <Table.Tr key={(c as ApiContribution).id ?? i}>
                        <Table.Td>
                          <Group gap="sm" align="center">
                            <Avatar size={28} radius="xl" color="gray">{(memberName || '?').charAt(0)}</Avatar>
                            <Text fz="sm" fw={500}>{memberName}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td><Text fz="sm">Cycle {cycleNum}</Text></Table.Td>
                        <Table.Td>
                          <Text fz="sm" fw={600}>₦{Number((c as ApiContribution).amount).toLocaleString('en-NG')}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="sm"
                            radius="sm"
                            style={{ background: statusColor.bg, color: statusColor.color, border: 'none', fontWeight: 600 }}
                          >
                            {st}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" c="dimmed">
                            {createdAt ? new Date(createdAt).toLocaleDateString('en-NG') : '—'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Group Notifications & Peer Review Tab */}
        <Tabs.Panel value="progress" pt="lg">
          <GroupNotificationsTab circleId={id ?? ''} members={apiMembers} />
        </Tabs.Panel>
      </Tabs>
      )}

      {/* Reverse Payout Modal */}
      <Modal
        opened={reverseModal}
        onClose={() => setReverseModal(false)}
        centered
        radius="md"
        size="sm"
        title={<Text fw={700} fz="md">Reverse Payout</Text>}
      >
        <Stack gap="md">
          {reversePayout_ && (
            <Paper p="md" radius="md" style={{ background: '#f8f9fa' }}>
              <Group justify="space-between" mb="xs">
                <Text fz="sm" c="dimmed">Payout ID</Text>
                <Text fz="sm" fw={500} style={{ fontFamily: 'monospace', fontSize: 11 }}>{reversePayout_.id}</Text>
              </Group>
              <Group justify="space-between" mb="xs">
                <Text fz="sm" c="dimmed">Cycle</Text>
                <Text fz="sm" fw={600}>Cycle {reversePayout_.cycleNumber}</Text>
              </Group>
              <Group justify="space-between">
                <Text fz="sm" c="dimmed">Amount</Text>
                <Text fz="sm" fw={600} c="red">₦{Number(reversePayout_.amount).toLocaleString('en-NG')}</Text>
              </Group>
            </Paper>
          )}
          <TextInput
            label="Reason for reversal"
            placeholder="e.g. Bank transfer failed: Account invalid"
            radius="md"
            size="sm"
            value={reverseReason}
            onChange={(e) => setReverseReason(e.currentTarget.value)}
            styles={{ input: { border: '1px solid #dee2e6' } }}
          />
          {payoutError && <Text fz="sm" c="red">{payoutError}</Text>}
          <Group gap="sm">
            <Button
              variant="outline"
              radius="md"
              size="sm"
              flex={1}
              style={{ borderColor: '#dee2e6', color: '#495057' }}
              onClick={() => setReverseModal(false)}
            >
              Cancel
            </Button>
            <Button
              radius="md"
              size="sm"
              flex={1}
              color="red"
              loading={reverseLoading}
              disabled={!reverseReason.trim()}
              onClick={handleReversePayout}
            >
              Confirm Reverse
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Send Invite Modal */}
      <Modal
        opened={inviteModal}
        onClose={() => setInviteModal(false)}
        centered
        radius="md"
        size="sm"
        withCloseButton={false}
      >
        {/* Step 1: Confirm */}
        {inviteStep === 'confirm' && (
          <Stack align="center" gap="md" py="md">
            <ThemeIcon size={56} radius="xl" style={{ background: '#e6f5f1' }}>
              <IconBell size={28} stroke={1.5} color={PRIMARY} />
            </ThemeIcon>
            <Text fw={700} fz="lg" ta="center">Send Invite</Text>
            <Text fz="sm" c="dimmed" ta="center" style={{ maxWidth: 320 }}>
              You are about to send an invite to join <b>{group.name}</b>.
            </Text>
            <Paper
              p="md"
              radius="md"
              style={{ background: '#f8f9fa', width: '100%' }}
            >
              <Group justify="space-between" mb="xs">
                <Text fz="sm" c="dimmed">Name</Text>
                <Text fz="sm" fw={600}>{inviteName}</Text>
              </Group>
              <Group justify="space-between" mb="xs">
                <Text fz="sm" c="dimmed">{inviteBy === 'email' ? 'Email' : 'Phone'}</Text>
                <Text fz="sm" fw={600}>{inviteContact}</Text>
              </Group>
              <Group justify="space-between">
                <Text fz="sm" c="dimmed">Invite By</Text>
                <Badge
                  size="sm"
                  radius="sm"
                  style={{ background: '#e6f5f1', color: PRIMARY, border: 'none', fontWeight: 600 }}
                >
                  {inviteBy === 'email' ? 'Email' : 'Phone'}
                </Badge>
              </Group>
            </Paper>
            <Group justify="center" gap="sm" mt="xs" style={{ width: '100%' }}>
              <Button
                variant="outline"
                radius="md"
                size="sm"
                onClick={() => setInviteModal(false)}
                style={{ borderColor: '#dee2e6', color: '#495057', flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY, flex: 1 }}
                onClick={handleSendInvite}
              >
                Send Invite
              </Button>
            </Group>
          </Stack>
        )}

        {/* Step 2: Sending */}
        {inviteStep === 'sending' && (
          <Stack align="center" gap="md" py="xl">
            <Loader size="lg" color={PRIMARY} />
            <Text fw={700} fz="lg">Sending Invite</Text>
            <Text fz="sm" c="dimmed">Please wait...</Text>
          </Stack>
        )}

        {/* Step 3: Success */}
        {inviteStep === 'success' && (
          <Stack align="center" gap="md" py="md">
            <ThemeIcon size={56} radius="xl" style={{ background: '#e6f5f1' }}>
              <IconCheck size={28} stroke={2} color={PRIMARY} />
            </ThemeIcon>
            <Text fw={700} fz="lg" ta="center">Invite Sent!</Text>
            <Text fz="sm" c="dimmed" ta="center" style={{ maxWidth: 320 }}>
              An invitation has been sent to <b>{inviteName}</b> via {inviteBy === 'email' ? 'email' : 'phone'} to join <b>{group.name}</b>.
            </Text>
            <Button
              radius="md"
              size="sm"
              fullWidth
              style={{ background: PRIMARY }}
              onClick={() => {
                setInviteModal(false)
                setInviteName('')
                setInviteContact('')
              }}
              mt="xs"
            >
              Close
            </Button>
          </Stack>
        )}

        {/* Step 4: Error */}
        {inviteStep === 'error' && (
          <Stack align="center" gap="md" py="md">
            <ThemeIcon size={56} radius="xl" style={{ background: '#fef2f2' }}>
              <IconX size={28} stroke={2} color="#e74c3c" />
            </ThemeIcon>
            <Text fw={700} fz="lg" ta="center">Failed to Send</Text>
            <Text fz="sm" c="red" ta="center" style={{ maxWidth: 320 }}>{inviteError}</Text>
            <Group gap="sm" style={{ width: '100%' }}>
              <Button variant="default" radius="md" size="sm" style={{ flex: 1 }} onClick={() => setInviteStep('confirm')}>Try Again</Button>
              <Button variant="default" radius="md" size="sm" style={{ flex: 1 }} onClick={() => setInviteModal(false)}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Auto Debit Filter Modal */}
      <Modal
        opened={debitFilterModal}
        onClose={() => setDebitFilterModal(false)}
        centered
        radius="md"
        size="sm"
        withCloseButton={false}
      >
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Text fw={700} fz="lg">Filters</Text>
            <IconX
              size={20}
              stroke={1.5}
              color="#868e96"
              style={{ cursor: 'pointer' }}
              onClick={() => setDebitFilterModal(false)}
            />
          </Group>

          <Select
            label="Round"
            data={roundOptions}
            value={filterRound}
            onChange={setFilterRound}
            size="sm"
            radius="md"
            rightSection={<IconChevronDown size={14} />}
            styles={{ input: { border: '1px solid #dee2e6' } }}
            allowDeselect={false}
          />

          <Box>
            <Text fz="sm" fw={600} mb="xs">Retry Attempts</Text>
            <Stack gap="xs">
              <Checkbox
                label="First Attempts Only"
                checked={retryAttempt === 'first'}
                onChange={() => setRetryAttempt('first')}
                size="sm"
                color={PRIMARY}
              />
              <Checkbox
                label="Show Retries Only"
                checked={retryAttempt === 'retries'}
                onChange={() => setRetryAttempt('retries')}
                size="sm"
                color={PRIMARY}
              />
              <Checkbox
                label="All Attempts"
                checked={retryAttempt === 'all'}
                onChange={() => setRetryAttempt('all')}
                size="sm"
                color={PRIMARY}
              />
            </Stack>
          </Box>

          <Box>
            <Text fz="sm" fw={600} mb="xs">Failure Reason</Text>
            <Stack gap="xs">
              <Checkbox
                label="Insufficient Funds"
                checked={failureReasons.includes('insufficient')}
                onChange={() => toggleFailureReason('insufficient')}
                size="sm"
                color={PRIMARY}
              />
              <Checkbox
                label="Network Error"
                checked={failureReasons.includes('network')}
                onChange={() => toggleFailureReason('network')}
                size="sm"
                color={PRIMARY}
              />
            </Stack>
          </Box>

          <Group justify="flex-end" gap="sm" mt="xs">
            <Button
              variant="outline"
              radius="md"
              size="sm"
              onClick={() => setDebitFilterModal(false)}
              style={{ borderColor: '#dee2e6', color: '#495057' }}
            >
              Cancel
            </Button>
            <Button
              radius="md"
              size="sm"
              style={{ background: PRIMARY }}
              onClick={() => setDebitFilterModal(false)}
            >
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Restart Group Modal */}
      <Modal
        opened={restartModal}
        onClose={() => setRestartModal(false)}
        centered
        radius="md"
        size="lg"
        withCloseButton={false}
      >
        {/* Form */}
        {restartStep === 'form' && (
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text fw={700} fz="lg">Restart Group</Text>
              <IconX
                size={20}
                stroke={1.5}
                color="#868e96"
                style={{ cursor: 'pointer' }}
                onClick={() => setRestartModal(false)}
              />
            </Group>

            <Group gap="md" align="center">
              <Text fz="sm" fw={500}>Keep same members?</Text>
              <Switch
                checked={keepMembers}
                onChange={(e) => setKeepMembers(e.currentTarget.checked)}
                color={PRIMARY}
                size="md"
              />
            </Group>

            <Group grow gap="sm">
              <TextInput
                label="Group Size"
                value={restartGroupSize}
                onChange={(e) => setRestartGroupSize(e.currentTarget.value)}
                size="sm"
                radius="md"
                styles={{ input: { border: '1px solid #dee2e6' } }}
              />
              <TextInput
                label="Contribution Amount"
                value={restartContribution}
                onChange={(e) => setRestartContribution(e.currentTarget.value)}
                size="sm"
                radius="md"
                leftSection={<Text fz="sm" c="dimmed">₦</Text>}
                styles={{ input: { border: '1px solid #dee2e6' } }}
              />
            </Group>

            {/* Member shortfall warning */}
            {memberShortfall > 0 && (
              <Paper
                p="sm"
                radius="md"
                style={{ background: '#fdf3e7', border: '1px solid #f5c36c' }}
              >
                <Text fz="xs" style={{ color: '#e67e22' }}>
                  This group has {restartMembers.length} of {restartGroupSize} members. You can proceed to restart, but {memberShortfall > 1 ? `${memberShortfall} more members` : 'one more member'} must join before the start date.
                </Text>
              </Paper>
            )}

            {/* Member list */}
            <Box>
              <Text fz="sm" fw={500} mb="xs">Members</Text>
              <SimpleGrid cols={2} spacing="xs">
                {restartMembers.map((m) => (
                  <Paper
                    key={m.id}
                    p="xs"
                    radius="md"
                    style={{ border: '1px solid #e9ecef' }}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Box>
                        <Text fz="sm" fw={500}>{m.name}</Text>
                        <Text fz="xs" c="dimmed">{m.email}</Text>
                      </Box>
                      <IconTrash
                        size={16}
                        stroke={1.5}
                        color="#e74c3c"
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => openRemoveMemberModal(m)}
                      />
                    </Group>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>

            <TextInput
              label="Start Date"
              value={restartStartDate}
              onChange={(e) => setRestartStartDate(e.currentTarget.value)}
              size="sm"
              radius="md"
              styles={{ input: { border: '1px solid #dee2e6' } }}
            />

            <Text fz="xs" c="dimmed">
              This {group.name} group will start with {restartMembers.length} members on July 1, 2026.
            </Text>

            <Group justify="flex-end" gap="sm">
              <Button
                variant="outline"
                radius="md"
                size="sm"
                onClick={() => setRestartModal(false)}
                style={{ borderColor: '#dee2e6', color: '#495057' }}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY }}
                onClick={handleRestartGroup}
              >
                Restart Group
              </Button>
            </Group>
          </Stack>
        )}

        {/* Restarting */}
        {restartStep === 'restarting' && (
          <Stack align="center" gap="md" py="xl">
            <Loader size="lg" color={PRIMARY} />
            <Text fw={700} fz="lg">Restarting {group.name}</Text>
            <Text fz="sm" c="dimmed">Do not close this window.</Text>
          </Stack>
        )}
      </Modal>

      {/* Remove Member Modal */}
      <Modal
        opened={removeMemberModal}
        onClose={() => setRemoveMemberModal(false)}
        centered
        radius="md"
        size="sm"
        withCloseButton={false}
      >
        {/* Confirm */}
        {removeMemberStep === 'confirm' && removeMember && (
          <Stack align="center" gap="md" py="md">
            <Text fw={600} fz="md" ta="center">
              Are you sure you want to remove {removeMember.name}?
            </Text>
            <Group justify="center" gap="sm" style={{ width: '100%' }}>
              <Button
                variant="outline"
                radius="md"
                size="sm"
                onClick={() => setRemoveMemberModal(false)}
                style={{ borderColor: '#dee2e6', color: '#495057', flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY, flex: 1 }}
                onClick={handleRemoveMember}
              >
                Yes
              </Button>
            </Group>
          </Stack>
        )}

        {/* Removing */}
        {removeMemberStep === 'removing' && removeMember && (
          <Stack align="center" gap="md" py="xl">
            <Loader size="lg" color={PRIMARY} />
            <Text fw={700} fz="lg">Removing {removeMember.name}</Text>
          </Stack>
        )}
      </Modal>

      {/* Assign Position Modal */}
      <Modal
        opened={assignModal}
        onClose={() => setAssignModal(false)}
        centered
        radius="md"
        size="sm"
        withCloseButton={false}
      >
        {assignSuccess ? (
          <Stack align="center" gap="md" py="xl">
            <div style={{ background: '#D1FAE5', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: PRIMARY, borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCheck size={28} color="white" strokeWidth={3} />
              </div>
            </div>
            <Text fw={700} fz="lg" ta="center">Position Assigned!</Text>
            <Text fz="sm" c="dimmed" ta="center">{assignMember?.name} has been assigned position {assignPosition}.</Text>
          </Stack>
        ) : (
          <Stack gap="lg">
            <Group justify="space-between" align="center">
              <Text fw={700} fz="lg">Assign Payout Position</Text>
              <IconX size={20} stroke={1.5} color="#868e96" style={{ cursor: 'pointer' }} onClick={() => setAssignModal(false)} />
            </Group>
            <Text fz="sm" c="dimmed">
              Assign a payout slot position to <strong>{assignMember?.name}</strong>. This determines when they receive the group payout.
            </Text>
            {existingAssignments.length > 0 && (
              <Paper p="sm" radius="md" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <Text fz="xs" fw={600} c="dimmed" mb={6}>Current Assignments</Text>
                <Stack gap={4}>
                  {existingAssignments.map((a) => (
                    <Group key={a.userId} justify="space-between">
                      <Text fz="xs" fw={500}>{a.name}</Text>
                      <Text fz="xs" c={a.position ? PRIMARY : '#868e96'}>
                        {a.position ? `Position ${a.position}` : 'Unassigned'}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}
            <TextInput
              label="Position Number"
              placeholder="e.g. 1, 2, 3..."
              radius="md"
              size="sm"
              value={assignPosition}
              onChange={(e) => setAssignPosition(e.currentTarget.value.replace(/\D/g, ''))}
              styles={{ input: { border: '1px solid #dee2e6' } }}
            />
            {assignError && <Text fz="sm" c="red">{assignError}</Text>}
            <Group gap="sm">
              <Button
                variant="outline"
                radius="md"
                size="sm"
                flex={1}
                style={{ borderColor: '#dee2e6', color: '#495057' }}
                onClick={() => setAssignModal(false)}
                disabled={assignLoading}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                flex={1}
                style={{ background: PRIMARY }}
                loading={assignLoading}
                disabled={!assignPosition.trim()}
                onClick={handleAssignPosition}
              >
                Assign
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Activate Circle Modal */}
      <Modal
        opened={activateModal}
        onClose={() => setActivateModal(false)}
        centered
        radius="md"
        size="sm"
        withCloseButton={false}
      >
        {activateSuccess ? (
          <Stack align="center" gap="md" py="xl">
            <div style={{ background: '#D1FAE5', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: PRIMARY, borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCheck size={28} color="white" strokeWidth={3} />
              </div>
            </div>
            <Text fw={700} fz="lg">Circle Activated!</Text>
            <Text fz="sm" c="dimmed" ta="center">{group.name} has been activated successfully.</Text>
          </Stack>
        ) : (
          <Stack gap="lg">
            <Group justify="space-between" align="center">
              <Text fw={700} fz="lg">Activate Circle</Text>
              <IconX size={20} stroke={1.5} color="#868e96" style={{ cursor: 'pointer' }} onClick={() => setActivateModal(false)} />
            </Group>
            <Text fz="sm" c="dimmed">Set a start date for <strong>{group.name}</strong>. Members will be notified and the cycle will begin on this date.</Text>
            <TextInput
              label="Start Date"
              placeholder="YYYY-MM-DD"
              radius="md"
              size="sm"
              value={activateStartDate}
              onChange={(e) => setActivateStartDate(e.currentTarget.value)}
              styles={{ input: { border: '1px solid #dee2e6' } }}
            />
            {activateError && <Text fz="sm" c="red">{activateError}</Text>}
            <Group gap="sm">
              <Button
                variant="outline"
                radius="md"
                size="sm"
                flex={1}
                style={{ borderColor: '#dee2e6', color: '#495057' }}
                onClick={() => setActivateModal(false)}
                disabled={activateLoading}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                flex={1}
                style={{ background: PRIMARY }}
                loading={activateLoading}
                disabled={!activateStartDate.trim()}
                onClick={handleActivateCircle}
                leftSection={<IconPlayerPlay size={14} />}
              >
                Activate
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
