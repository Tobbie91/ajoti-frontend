import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DateInput } from '@mantine/dates'
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
  Alert,
} from '@mantine/core'
import {
  IconTopologyRing,
  IconSearch,
  IconChevronDown,
  IconFilter,
  IconX,
  IconCheck,
  IconBell,
  IconTrash,
  IconRefresh,
  IconPlayerPlay,
  IconAlertCircle,
} from '@tabler/icons-react'
import {
  getPayoutHistory,
  processPayout,
  retryPayout,
  reversePayout,
  getAdminCircleDetail,
  activateRoscaCircle,
  updatePayoutConfig,
  getPayoutConfig,
  sendCircleInvite,
  getCircleInvites,
  revokeCircleInvite,
  getFinancialHealth,
  getCircleJoinRequests,
  closeRoscaCircle,
  extendCycleDeadline,
  type Payout,
  type RoscaCircle,
  type PayoutAssignment,
  type CircleInvite,
  type FinancialHealth,
} from '@/utils/api'
import { GroupOverviewTab, GroupHistoryTab } from './GroupOverviewTab'
import { GroupContributionsTab } from './GroupContributionsTab'
import { GroupNotificationsTab } from './GroupNotificationsTab'
import { GroupPaymentsTab } from './GroupPaymentsTab'
import { GroupPayoutsTab } from './GroupPayoutsTab'
import { GroupMembersTab } from './GroupMembersTab'

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
    financialHealthFetched.current = true
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

  // Restart group modal state - preview-only placeholder, not yet wired to a backend endpoint
  const [restartModal, setRestartModal] = useState(false)
  const [keepMembers, setKeepMembers] = useState(false)
  const [restartGroupSize, setRestartGroupSize] = useState('6')
  const [restartContribution, setRestartContribution] = useState('20,000')
  const [restartStartDate, setRestartStartDate] = useState('01/06/2026')
  const [restartMembers, setRestartMembers] = useState<RestartMember[]>(defaultRestartMembers)

  const groupSizeNum = parseInt(restartGroupSize) || 0
  const memberShortfall = groupSizeNum - restartMembers.length

  function openRestartModal() {
    setRestartModal(true)
  }

  // Remove member modal state
  const [removeMemberModal, setRemoveMemberModal] = useState(false)
  const [removeMember, setRemoveMember] = useState<RestartMember | null>(null)

  function openRemoveMemberModal(member: RestartMember) {
    setRemoveMember(member)
    setRemoveMemberModal(true)
  }

  // Only edits the local restart-preview list above - no backend call, since
  // the restart feature itself isn't implemented yet (see restartModal).
  function handleRemoveMember() {
    if (removeMember) {
      setRestartMembers((prev) => prev.filter((m) => m.id !== removeMember.id))
    }
    setRemoveMemberModal(false)
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
  const financialHealthFetched = useRef(false)
  const payoutsFetched = useRef(false)
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
  const [activateStartDate, setActivateStartDate] = useState<Date | null>(null)
  const [activateLoading, setActivateLoading] = useState(false)
  const [activateError, setActivateError] = useState<string | null>(null)
  const [activateSuccess, setActivateSuccess] = useState(false)

  async function handleActivateCircle() {
    if (!id || !activateStartDate) return
    setActivateLoading(true)
    setActivateError(null)
    try {
      await activateRoscaCircle(id, activateStartDate.toISOString().split('T')[0])
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

  // Close group modal state
  const [closeModal, setCloseModal] = useState(false)
  const [closeLoading, setCloseLoading] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)

  async function handleCloseGroup() {
    if (!id) return
    setCloseLoading(true)
    setCloseError(null)
    try {
      await closeRoscaCircle(id)
      setCloseModal(false)
      navigate('/rosca/groups')
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : 'Failed to close group')
    } finally {
      setCloseLoading(false)
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

  // Payment Oversight state
  const [extendModal, setExtendModal] = useState<{ cycleNumber: number } | null>(null)
  const [extendDate, setExtendDate] = useState<string | null>(null)
  const [extendLoading, setExtendLoading] = useState(false)
  const [extendError, setExtendError] = useState<string | null>(null)
  const [paymentsRefreshToken, setPaymentsRefreshToken] = useState(0)

  // Load payouts eagerly so Member Management tab can check who's been paid
  useEffect(() => {
    if (id && !payoutsFetched.current) {
      payoutsFetched.current = true
      getPayoutHistory(id)
        .then(setPayouts)
        .catch(() => setPayouts([]))
    }
  }, [id])

  useEffect(() => {
    if (activeTab === 'payouts' && id) {
      setPayoutsLoading(true)
      getPayoutHistory(id)
        .then(setPayouts)
        .catch(() => setPayouts([]))
        .finally(() => setPayoutsLoading(false))
    }
    if (activeTab === 'payments' && id) {
      if (!financialHealthFetched.current) {
        financialHealthFetched.current = true
        setFinancialHealthLoading(true)
        getFinancialHealth(id)
          .then(setFinancialHealth)
          .catch(() => {})
          .finally(() => setFinancialHealthLoading(false))
      }
    }
    if (activeTab === 'members' && id) {
      loadInvites()
    }
  }, [activeTab, id])

  async function handleExtendDeadline() {
    if (!id || !extendModal || !extendDate) return
    setExtendLoading(true)
    setExtendError(null)
    try {
      await extendCycleDeadline(id, extendModal.cycleNumber, new Date(extendDate).toISOString())
      setExtendModal(null)
      setExtendDate(null)
      const updatedHealth = await getFinancialHealth(id)
      setFinancialHealth(updatedHealth)
      setPaymentsRefreshToken((t) => t + 1)
    } catch (err) {
      setExtendError(err instanceof Error ? err.message : 'Failed to extend deadline')
    } finally {
      setExtendLoading(false)
    }
  }

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
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
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
              <Stack gap={8}>
                {isPending && (
                  <>
                    {slotsAreFull ? (
                      <Box>
                        <Button
                          size="xs"
                          radius="md"
                          style={{ background: PRIMARY }}
                          leftSection={<IconPlayerPlay size={14} />}
                          onClick={() => { setActivateStartDate(null); setActivateError(null); setActivateModal(true) }}
                        >
                          Start Circle
                        </Button>
                      </Box>
                    ) : (
                      <Text fz={12} c="dimmed" style={{ fontStyle: 'italic' }}>
                        {circleData?.filledSlots ?? 0}/{circleData?.maxSlots ?? '?'} slots filled - invite more members to start
                      </Text>
                    )}
                    <Group gap="sm">
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
                        onClick={() => setCloseModal(true)}
                      >
                        Close Group
                      </Button>
                    </Group>
                  </>
                )}
                {isCompleted && (
                  <Group gap="sm">
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
                      onClick={() => setCloseModal(true)}
                    >
                      Close Group
                    </Button>
                  </Group>
                )}
              </Stack>
            </Box>
          </Group>

          {/* Total Group Balance */}
          <Paper
            p="md"
            radius="md"
            style={{ background: PRIMARY, minWidth: 180, flex: '1 1 180px' }}
          >
            <Text fz="xs" c="white" style={{ opacity: 0.8 }}>Total Group Balance</Text>
            <Text fz={24} fw={700} c="white" mt={4}>{group.balance}</Text>
          </Paper>
        </Group>
      </Paper>

      {/* Ready-to-start banner */}
      {isPending && slotsAreFull && (
        <Paper
          p="md"
          radius="md"
          style={{ background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
        >
          <Group gap="sm">
            <ThemeIcon size={36} radius="xl" style={{ background: '#dcfce7' }}>
              <IconCheck size={20} color="#16a34a" />
            </ThemeIcon>
            <Box>
              <Text fw={700} fz="sm" style={{ color: '#15803d' }}>All slots filled - circle is ready to start!</Text>
              <Text fz="xs" style={{ color: '#166534' }}>Click "Start Circle" to set the first contribution deadline and activate the savings cycle.</Text>
            </Box>
          </Group>
          <Button
            radius="md"
            size="sm"
            style={{ background: '#16a34a', color: 'white', flexShrink: 0 }}
            leftSection={<IconPlayerPlay size={14} />}
            onClick={() => { setActivateStartDate(null); setActivateError(null); setActivateModal(true) }}
          >
            Start Circle
          </Button>
        </Paper>
      )}

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
            <GroupOverviewTab circleData={circleData} payouts={payouts} onStartNewCycle={openRestartModal} />
          </Tabs.Panel>

          {/* History Tab */}
          <Tabs.Panel value="history" pt="lg">
            <GroupHistoryTab payouts={payouts} />
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
        <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          <Tabs.Tab value="members" style={{ whiteSpace: 'nowrap' }}>Member Management</Tabs.Tab>
          <Tabs.Tab value="payments" style={{ whiteSpace: 'nowrap' }}>Payment Oversight</Tabs.Tab>
          <Tabs.Tab value="progress" style={{ whiteSpace: 'nowrap' }}>Notifications & Reviews</Tabs.Tab>
          <Tabs.Tab value="payouts" style={{ whiteSpace: 'nowrap' }}>Payouts</Tabs.Tab>
          <Tabs.Tab value="contributions" style={{ whiteSpace: 'nowrap' }}>Contributions</Tabs.Tab>
        </Tabs.List>

        {/* Member Management Tab */}
        <Tabs.Panel value="members" pt="lg">
          <GroupMembersTab
            isCompleted={isCompleted}
            inviteName={inviteName}
            onInviteNameChange={setInviteName}
            inviteContact={inviteContact}
            onInviteContactChange={setInviteContact}
            inviteBy={inviteBy}
            onInviteByChange={setInviteBy}
            onOpenInviteModal={openInviteModal}
            pendingJoinCount={pendingJoinCount}
            maxSlots={circleData?.maxSlots}
            memberSearch={memberSearch}
            onMemberSearchChange={setMemberSearch}
            filteredMembers={filteredMembers}
            payouts={payouts}
            onAssignPosition={openAssignModal}
            invites={invites}
            invitesLoading={invitesLoading}
            onRefreshInvites={loadInvites}
            revokingId={revokingId}
            onRevokeInvite={handleRevokeInvite}
          />
        </Tabs.Panel>

        {/* Payment Oversight Tab */}
        <Tabs.Panel value="payments" pt="lg">
          <GroupPaymentsTab
            circleId={id}
            isActive={activeTab === 'payments'}
            financialHealth={financialHealth}
            financialHealthLoading={financialHealthLoading}
            refreshToken={paymentsRefreshToken}
            onExtendDeadline={(cycleNumber) => {
              setExtendModal({ cycleNumber })
              setExtendDate(null)
              setExtendError(null)
            }}
          />
        </Tabs.Panel>

        {/* ── Payouts Tab ── */}
        <Tabs.Panel value="payouts" pt="lg">
          <GroupPayoutsTab
            payouts={payouts}
            payoutsLoading={payoutsLoading}
            payoutError={payoutError}
            processCycleInput={processCycleInput}
            onProcessCycleInputChange={setProcessCycleInput}
            processingCycle={processingCycle}
            onProcessPayout={handleProcessPayout}
            onRefresh={() => {
              if (!id) return
              setPayoutsLoading(true)
              getPayoutHistory(id).then(setPayouts).catch(() => {}).finally(() => setPayoutsLoading(false))
            }}
            onRetryPayout={handleRetryPayout}
            onReverseClick={(payout) => {
              setReversePayout_(payout)
              setReverseReason('')
              setReverseModal(true)
            }}
          />
        </Tabs.Panel>

        {/* ── Contributions Tab ── */}
        <Tabs.Panel value="contributions" pt="lg">
          <GroupContributionsTab circleId={id} isActive={activeTab === 'contributions'} />
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
                <Text fz="sm" fw={600} c="red">₦{(Number(reversePayout_.amount) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
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

      {/* Extend Deadline Modal */}
      <Modal
        opened={extendModal !== null}
        onClose={() => { setExtendModal(null); setExtendDate(null); setExtendError(null) }}
        centered
        radius="md"
        size="sm"
        title={<Text fw={700} fz="md">Extend Cycle Deadline</Text>}
      >
        <Stack gap="md">
          <Text fz="sm" c="dimmed">
            Set a new payout date for cycle <b>{extendModal?.cycleNumber}</b>. All subsequent cycles will also shift forward by the same amount.
          </Text>
          <DateInput
            label="New Payout Date"
            placeholder="Pick a date"
            value={extendDate}
            onChange={setExtendDate}
            minDate={new Date(Date.now() + 86400000)}
            radius="md"
            size="sm"
          />
          {extendError && <Text fz="sm" c="red">{extendError}</Text>}
          <Group justify="flex-end" gap="sm" mt="xs">
            <Button
              variant="default"
              radius="md"
              size="sm"
              onClick={() => { setExtendModal(null); setExtendDate(null); setExtendError(null) }}
            >
              Cancel
            </Button>
            <Button
              radius="md"
              size="sm"
              color="orange"
              loading={extendLoading}
              disabled={!extendDate}
              onClick={handleExtendDeadline}
            >
              Confirm Extension
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

            <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md" variant="light">
              Restarting a group isn't wired up yet - this form is a preview only. Saving has no effect until the backend endpoint exists.
            </Alert>

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
                disabled
              >
                Restart Group (Coming Soon)
              </Button>
            </Group>
          </Stack>
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
        {removeMember && (
          <Stack align="center" gap="md" py="md">
            <Text fw={600} fz="md" ta="center">
              Remove {removeMember.name} from this restart preview?
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
                  {existingAssignments.map((a) => {
                    const isPaidOut = payouts.some(
                      (p) => p.recipientId === a.userId &&
                        ['SUCCESS', 'COMPLETED', 'PAID'].includes((p.status ?? '').toUpperCase())
                    )
                    return (
                      <Group key={a.userId} justify="space-between">
                        <Text fz="xs" fw={500}>{a.name}</Text>
                        <Group gap={4}>
                          <Text fz="xs" c={a.position ? PRIMARY : '#868e96'}>
                            {a.position ? `Position ${a.position}` : 'Unassigned'}
                          </Text>
                          {isPaidOut && (
                            <Badge size="xs" radius="sm" style={{ background: '#e6f5f1', color: PRIMARY, border: 'none' }}>
                              Paid
                            </Badge>
                          )}
                        </Group>
                      </Group>
                    )
                  })}
                </Stack>
              </Paper>
            )}
            {(() => {
              const totalSlots = existingAssignments.length || apiMembers.length
              const paidPositions = new Set(
                payouts
                  .filter(p => ['SUCCESS', 'COMPLETED', 'PAID'].includes((p.status ?? '').toUpperCase()))
                  .map(p => existingAssignments.find(a => a.userId === p.recipientId)?.position)
                  .filter(Boolean)
              )
              const takenPositions = new Set(
                existingAssignments
                  .filter(a => a.userId !== assignMember?.userId && a.position != null)
                  .map(a => a.position)
              )
              const availablePositions = Array.from({ length: totalSlots }, (_, i) => i + 1)
                .filter(pos => !paidPositions.has(pos) && !takenPositions.has(pos))
              return (
                <Stack gap={8}>
                  <Text fz="sm" fw={500}>Select Position</Text>
                  {availablePositions.length === 0 ? (
                    <Text fz="sm" c="dimmed">No positions available - all slots are taken or paid out.</Text>
                  ) : (
                    <Group gap="sm">
                      {availablePositions.map(pos => (
                        <Button
                          key={pos}
                          size="sm"
                          radius="md"
                          variant={assignPosition === String(pos) ? 'filled' : 'outline'}
                          style={assignPosition === String(pos)
                            ? { background: PRIMARY, color: 'white', border: 'none' }
                            : { borderColor: PRIMARY, color: PRIMARY }}
                          onClick={() => setAssignPosition(String(pos))}
                        >
                          Position {pos}
                        </Button>
                      ))}
                    </Group>
                  )}
                </Stack>
              )
            })()}
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
            <DateInput
              label="Start Date"
              placeholder="Pick a start date"
              radius="md"
              size="sm"
              valueFormat="DD MMM YYYY"
              minDate={new Date()}
              value={activateStartDate}
              onChange={(val) => setActivateStartDate(val ? new Date(val) : null)}
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
                disabled={!activateStartDate}
                onClick={handleActivateCircle}
                leftSection={<IconPlayerPlay size={14} />}
              >
                Activate
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Close Group confirmation modal */}
      <Modal
        opened={closeModal}
        onClose={() => { setCloseModal(false); setCloseError(null) }}
        title="Close Group"
        centered
        radius="md"
        size="sm"
      >
        <Stack gap="md">
          <Text fz={14} c="dimmed">
            Are you sure you want to close <strong>{group.name}</strong>? This will:
          </Text>
          <Box
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px' }}
          >
            <Stack gap={6}>
              {[
                'Release collateral back to all members',
                'Cancel all pending memberships',
                'Mark the group as Closed permanently',
              ].map((item) => (
                <Text key={item} fz={13} style={{ color: '#B91C1C' }}>• {item}</Text>
              ))}
            </Stack>
          </Box>
          <Text fz={13} c="dimmed">This action cannot be undone.</Text>
          {closeError && (
            <Text fz={13} style={{ color: '#EF4444' }}>{closeError}</Text>
          )}
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              radius="md"
              size="sm"
              onClick={() => { setCloseModal(false); setCloseError(null) }}
              disabled={closeLoading}
            >
              Cancel
            </Button>
            <Button
              color="red"
              radius="md"
              size="sm"
              loading={closeLoading}
              onClick={handleCloseGroup}
            >
              Close Group
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
