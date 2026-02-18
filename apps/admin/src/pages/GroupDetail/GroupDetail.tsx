import { useState } from 'react'
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
  Select,
  Table,
  Avatar,
  Progress,
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
  IconAlertTriangle,
  IconTrash,
} from '@tabler/icons-react'

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

interface Member {
  id: string
  name: string
  contributionReceived: number
  contributionTotal: number
  payoutSlot: 'Paid' | 'Upcoming'
  nextPayment: string
}

const mockMembers: Member[] = [
  { id: '1', name: 'Rhoda A.', contributionReceived: 3, contributionTotal: 7, payoutSlot: 'Paid', nextPayment: 'May 12, 2026' },
  { id: '2', name: 'Mide E.', contributionReceived: 3, contributionTotal: 7, payoutSlot: 'Upcoming', nextPayment: 'May 12, 2026' },
  { id: '3', name: 'Kola B.', contributionReceived: 3, contributionTotal: 7, payoutSlot: 'Upcoming', nextPayment: 'May 12, 2026' },
  { id: '4', name: 'Ife M.', contributionReceived: 3, contributionTotal: 7, payoutSlot: 'Paid', nextPayment: 'May 12, 2026' },
  { id: '5', name: 'John C.', contributionReceived: 3, contributionTotal: 7, payoutSlot: 'Upcoming', nextPayment: 'May 12, 2026' },
  { id: '6', name: 'Debby O.', contributionReceived: 3, contributionTotal: 7, payoutSlot: 'Upcoming', nextPayment: 'May 12, 2026' },
]

// Payment Oversight mock data
interface Contribution {
  id: string
  name: string
  amount: string
  status: 'Paid' | 'Pending'
  payoutMethod: string
  dateTime: string
}

const mockContributions: Contribution[] = [
  { id: '1', name: 'Gloria A.', amount: '₦10,000', status: 'Paid', payoutMethod: 'Auto Debit', dateTime: 'Feb 10, 2026 – 10:00 AM' },
  { id: '2', name: 'Tobi A.', amount: '₦10,000', status: 'Paid', payoutMethod: 'Auto Debit', dateTime: 'Feb 10, 2026 – 10:05 AM' },
  { id: '3', name: 'Temi T.', amount: '₦10,000', status: 'Paid', payoutMethod: 'Auto Debit', dateTime: 'Feb 10, 2026 – 10:12 AM' },
  { id: '4', name: 'Taiwo Y.', amount: '₦10,000', status: 'Paid', payoutMethod: 'Auto Debit', dateTime: 'Feb 10, 2026 – 10:20 AM' },
  { id: '5', name: 'Dapo A.', amount: '₦10,000', status: 'Paid', payoutMethod: 'Auto Debit', dateTime: 'Feb 10, 2026 – 10:30 AM' },
  { id: '6', name: 'Rhoda A.', amount: '₦10,000', status: 'Paid', payoutMethod: 'Auto Debit', dateTime: 'Feb 10, 2026 – 10:35 AM' },
]

interface DebitLog {
  id: string
  name: string
  dateTime: string
  amount: string
  status: 'Success' | 'Failed'
  failedReason: string
}

const mockDebitLogs: DebitLog[] = [
  { id: '1', name: 'Gloria A.', dateTime: 'Feb 10, 2026 – 10:00 AM', amount: '₦10,000', status: 'Success', failedReason: 'None' },
  { id: '2', name: 'Tobi A.', dateTime: 'Feb 10, 2026 – 10:05 AM', amount: '₦10,000', status: 'Success', failedReason: 'None' },
  { id: '3', name: 'Temi T.', dateTime: 'Feb 10, 2026 – 10:12 AM', amount: '₦10,000', status: 'Failed', failedReason: 'Insufficient Funds' },
  { id: '4', name: 'Taiwo Y.', dateTime: 'Feb 10, 2026 – 10:20 AM', amount: '₦10,000', status: 'Success', failedReason: 'None' },
  { id: '5', name: 'Dapo A.', dateTime: 'Feb 10, 2026 – 10:30 AM', amount: '₦10,000', status: 'Failed', failedReason: 'Network Error' },
  { id: '6', name: 'Rhoda A.', dateTime: 'Feb 10, 2026 – 10:35 AM', amount: '₦10,000', status: 'Success', failedReason: 'None' },
]

interface Disbursement {
  id: string
  name: string
  amount: string
  status: 'Success' | 'Upcoming'
  paymentMethod: string
  disbursement: string
}

const mockDisbursements: Disbursement[] = [
  { id: '1', name: 'Gloria A.', amount: '₦60,000', status: 'Success', paymentMethod: 'Wallet', disbursement: 'Feb 10, 2026' },
  { id: '2', name: 'Tobi A.', amount: '₦60,000', status: 'Success', paymentMethod: 'Wallet', disbursement: 'Feb 17, 2026' },
  { id: '3', name: 'Temi T.', amount: '₦60,000', status: 'Success', paymentMethod: 'Wallet', disbursement: 'Feb 24, 2026' },
  { id: '4', name: 'Taiwo Y.', amount: 'Pending', status: 'Upcoming', paymentMethod: 'Wallet', disbursement: 'Mar 3, 2026' },
  { id: '5', name: 'Dapo A.', amount: 'Pending', status: 'Upcoming', paymentMethod: 'Wallet', disbursement: 'Mar 10, 2026' },
  { id: '6', name: 'Rhoda A.', amount: 'Pending', status: 'Upcoming', paymentMethod: 'Wallet', disbursement: 'Mar 17, 2026' },
]

const roundOptions = [
  { value: '4', label: 'Round 4' },
  { value: '3', label: 'Round 3' },
  { value: '2', label: 'Round 2' },
  { value: '1', label: 'Round 1' },
]

// Group Progress View mock data
interface ProgressMember {
  id: string
  name: string
  round: number
  totalRounds: number
  status: 'Paid' | 'Upcoming'
  contributed: string
  total: string
  missedPayment: string
  payoutDate: string
}

const mockProgressMembers: ProgressMember[] = [
  { id: '1', name: 'Gloria A.', round: 1, totalRounds: 6, status: 'Paid', contributed: '₦60,000', total: '₦60,000', missedPayment: 'None', payoutDate: 'Paid' },
  { id: '2', name: 'Tobi A.', round: 2, totalRounds: 6, status: 'Paid', contributed: '₦60,000', total: '₦60,000', missedPayment: 'None', payoutDate: 'Paid' },
  { id: '3', name: 'Temi T.', round: 3, totalRounds: 6, status: 'Paid', contributed: '₦60,000', total: '₦60,000', missedPayment: 'None', payoutDate: 'Paid' },
  { id: '4', name: 'Taiwo Y.', round: 4, totalRounds: 6, status: 'Paid', contributed: '₦40,000', total: '₦60,000', missedPayment: 'None', payoutDate: 'Paid' },
  { id: '5', name: 'Dapo A.', round: 5, totalRounds: 6, status: 'Upcoming', contributed: '₦40,000', total: '₦60,000', missedPayment: 'None', payoutDate: 'Mar 10, 2026' },
  { id: '6', name: 'Rhoda A.', round: 6, totalRounds: 6, status: 'Upcoming', contributed: '₦40,000', total: '₦60,000', missedPayment: 'None', payoutDate: 'Mar 17, 2026' },
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
  const group = mockGroups.find((g) => g.id === id) || defaultGroup
  const isPending = group.status === 'Pending'
  const isCompleted = group.status === 'Completed'
  const badge = getStatusBadge(group.status)

  const [activeTab, setActiveTab] = useState<string | null>(isCompleted ? 'overview' : 'members')
  const [memberSearch, setMemberSearch] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteContact, setInviteContact] = useState('')
  const [inviteBy, setInviteBy] = useState<string | null>('email')

  // Payment Oversight state
  const [selectedRound, setSelectedRound] = useState<string | null>('4')

  // Group Progress View state
  const [selectedProgressMember, setSelectedProgressMember] = useState('5')
  const [progressRound, setProgressRound] = useState<string | null>('4')

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
  const [inviteStep, setInviteStep] = useState<'confirm' | 'sending' | 'success'>('confirm')

  function handleSendInvite() {
    setInviteStep('sending')
    setTimeout(() => setInviteStep('success'), 1500)
  }

  function openInviteModal() {
    setInviteStep('confirm')
    setInviteModal(true)
  }

  // Notify member modal state
  const [notifyModal, setNotifyModal] = useState(false)
  const [notifyStep, setNotifyStep] = useState<'confirm' | 'sending' | 'success'>('confirm')
  const [notifyMember, setNotifyMember] = useState<DebitLog | null>(null)

  function openNotifyModal(member: DebitLog) {
    setNotifyMember(member)
    setNotifyStep('confirm')
    setNotifyModal(true)
  }

  function handleSendNotify() {
    setNotifyStep('sending')
    setTimeout(() => setNotifyStep('success'), 1500)
  }

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

  const filteredMembers = mockMembers
    .filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
    .sort((a, b) => {
      if (a.payoutSlot === 'Paid' && b.payoutSlot !== 'Paid') return -1
      if (a.payoutSlot !== 'Paid' && b.payoutSlot === 'Paid') return 1
      return 0
    })

  return (
    <Stack gap="lg">
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
              <Text fz="sm" c="dimmed" mb="md">{group.tagline}</Text>
              <Group gap="sm">
                {isPending && (
                  <>
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
          <Tabs.Tab value="progress">Group Progress View</Tabs.Tab>
        </Tabs.List>

        {/* Member Management Tab */}
        <Tabs.Panel value="members" pt="lg">
          <Stack gap="lg">
            {/* Invite Member + Pending Requests (only for Pending groups) */}
            {isPending && (
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
                    sections={[{ value: 10, color: PRIMARY }]}
                    label={
                      <Text ta="center" fz={22} fw={700} style={{ color: PRIMARY }}>
                        1
                      </Text>
                    }
                  />
                  <Text fz="sm" fw={500} ta="center" mt="sm">
                    Pending Join Request
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
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Contribution Progress</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Payout Slot</Table.Th>
                    <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Next Payment</Table.Th>
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
                    <Table.Tr key={member.id}>
                      <Table.Td>
                        <Group gap="sm" align="center">
                          <Avatar size={32} radius="xl" color="gray">
                            {member.name.charAt(0)}
                          </Avatar>
                          <Text fz="sm" fw={500}>{member.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ minWidth: 180 }}>
                        <Group gap="xs" align="center">
                          <Progress
                            value={(member.contributionReceived / member.contributionTotal) * 100}
                            color={PRIMARY}
                            size="sm"
                            radius="xl"
                            style={{ flex: 1 }}
                          />
                          <Text fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                            {member.contributionReceived} of {member.contributionTotal} received
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            background: member.payoutSlot === 'Paid' ? '#e6f5f1' : '#f1f3f5',
                            color: member.payoutSlot === 'Paid' ? PRIMARY : '#868e96',
                            border: 'none',
                            fontWeight: 600,
                          }}
                        >
                          {member.payoutSlot}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm">{member.nextPayment}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="subtle"
                          size="xs"
                          color="red"
                          px="xs"
                        >
                          Suspend
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Payment Oversight Tab */}
        <Tabs.Panel value="payments" pt="lg">
          <Stack gap="lg">
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
                  {mockContributions.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td>
                        <Group gap="sm" align="center">
                          <Avatar size={28} radius="xl" color="gray">{c.name.charAt(0)}</Avatar>
                          <Text fz="sm" fw={500}>{c.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td><Text fz="sm">{c.amount}</Text></Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            background: c.status === 'Paid' ? '#e6f5f1' : '#fdf3e7',
                            color: c.status === 'Paid' ? PRIMARY : '#e67e22',
                            border: 'none',
                            fontWeight: 600,
                          }}
                        >
                          {c.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td><Text fz="sm">{c.payoutMethod}</Text></Table.Td>
                      <Table.Td><Text fz="sm">{c.dateTime}</Text></Table.Td>
                    </Table.Tr>
                  ))}
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
                    <Text fz="sm" fw={600}>₦60,000</Text>
                  </Box>
                  <Box>
                    <Text fz="xs" c="dimmed">Total Received</Text>
                    <Text fz="sm" fw={600} style={{ color: PRIMARY }}>₦60,000</Text>
                  </Box>
                  <Box>
                    <Text fz="xs" c="dimmed">Complete Rate</Text>
                    <Text fz="sm" fw={600} style={{ color: PRIMARY }}>100%</Text>
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
                  {mockDebitLogs.map((l) => (
                      <Table.Tr key={l.id}>
                        <Table.Td>
                          <Group gap="sm" align="center">
                            <Avatar size={28} radius="xl" color="gray">{l.name.charAt(0)}</Avatar>
                            <Text fz="sm" fw={500}>{l.name}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td><Text fz="sm">{l.dateTime}</Text></Table.Td>
                        <Table.Td><Text fz="sm">{l.amount}</Text></Table.Td>
                        <Table.Td>
                          <Badge
                            size="sm"
                            radius="sm"
                            style={{
                              background: l.status === 'Success' ? '#e6f5f1' : '#fef2f2',
                              color: l.status === 'Success' ? PRIMARY : '#e74c3c',
                              border: 'none',
                              fontWeight: 600,
                            }}
                          >
                            {l.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td><Text fz="sm">{l.failedReason}</Text></Table.Td>
                        <Table.Td>
                          {l.status === 'Failed' && (
                            <Button
                              variant="subtle"
                              size="xs"
                              px="xs"
                              style={{ color: '#e74c3c' }}
                              onClick={() => openNotifyModal(l)}
                            >
                              Notify
                            </Button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
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
                  {mockDisbursements.map((d) => (
                    <Table.Tr
                      key={d.id}
                      style={d.status === 'Upcoming' ? { background: '#f0faf7' } : undefined}
                    >
                      <Table.Td>
                        <Group gap="sm" align="center">
                          <Avatar size={28} radius="xl" color="gray">{d.name.charAt(0)}</Avatar>
                          <Text fz="sm" fw={500}>{d.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm" c={d.status === 'Upcoming' ? 'dimmed' : undefined}>{d.amount}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            background: d.status === 'Success' ? '#e6f5f1' : '#f1f3f5',
                            color: d.status === 'Success' ? PRIMARY : '#868e96',
                            border: 'none',
                            fontWeight: 600,
                          }}
                        >
                          {d.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td><Text fz="sm">{d.paymentMethod}</Text></Table.Td>
                      <Table.Td><Text fz="sm">{d.disbursement}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Group Progress View Tab */}
        <Tabs.Panel value="progress" pt="lg">
          <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="center">
              <Text fz="sm" c="dimmed">
                Monitor the contribution and payout flow across all cycles
              </Text>
              <Button
                size="xs"
                radius="md"
                style={{ background: PRIMARY }}
              >
                Remind All
              </Button>
            </Group>

            {/* Round / Member Carousel */}
            <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
              <Group gap="xl" justify="center" style={{ overflowX: 'auto' }}>
                {mockProgressMembers.map((pm) => (
                  <Box
                    key={pm.id}
                    onClick={() => setSelectedProgressMember(pm.id)}
                    style={{
                      cursor: 'pointer',
                      textAlign: 'center',
                      minWidth: 80,
                    }}
                  >
                    <Text fz="xs" c="dimmed" mb={6}>
                      Round {pm.round}/{pm.totalRounds}
                    </Text>
                    <Avatar
                      size={52}
                      radius="xl"
                      color={pm.status === 'Paid' ? 'teal' : 'gray'}
                      style={{
                        margin: '0 auto',
                        border: selectedProgressMember === pm.id
                          ? `3px solid ${PRIMARY}`
                          : '3px solid transparent',
                      }}
                    >
                      {pm.name.charAt(0)}
                    </Avatar>
                    <Text fz="xs" fw={500} mt={6}>{pm.name}</Text>
                    <Badge
                      size="xs"
                      radius="sm"
                      mt={4}
                      style={{
                        background: pm.status === 'Paid' ? '#e6f5f1' : '#f1f3f5',
                        color: pm.status === 'Paid' ? PRIMARY : '#868e96',
                        border: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {pm.status}
                    </Badge>
                  </Box>
                ))}
              </Group>
            </Paper>

            {/* Contribution Tracker + Missed Payments */}
            <Group align="flex-start" gap="lg" wrap="nowrap">
              {/* Contribution Tracker Table */}
              <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden', flex: 2 }}>
                <Group justify="space-between" align="center" px="lg" py="md">
                  <Text fw={600} fz="md">Contribution Tracker</Text>
                  <Select
                    data={roundOptions}
                    value={progressRound}
                    onChange={setProgressRound}
                    size="xs"
                    radius="md"
                    rightSection={<IconChevronDown size={12} />}
                    styles={{ input: { border: '1px solid #dee2e6', minWidth: 110 } }}
                    allowDeselect={false}
                  />
                </Group>

                <Table verticalSpacing="sm" horizontalSpacing="lg">
                  <Table.Thead>
                    <Table.Tr style={{ background: PRIMARY }}>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Name</Table.Th>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Progress</Table.Th>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Missed Payment</Table.Th>
                      <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Payout Date</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {mockProgressMembers.map((pm) => (
                      <Table.Tr key={pm.id}>
                        <Table.Td>
                          <Group gap="sm" align="center">
                            <Avatar size={28} radius="xl" color="gray">{pm.name.charAt(0)}</Avatar>
                            <Text fz="sm" fw={500}>{pm.name}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ minWidth: 180 }}>
                          <Group gap="xs" align="center">
                            <Progress
                              value={(parseFloat(pm.contributed.replace(/[₦,]/g, '')) / parseFloat(pm.total.replace(/[₦,]/g, ''))) * 100}
                              color={PRIMARY}
                              size="sm"
                              radius="xl"
                              style={{ flex: 1 }}
                            />
                            <Text fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                              {pm.contributed} / {pm.total}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text fz="sm" c={pm.missedPayment === 'None' ? 'dimmed' : '#e74c3c'}>
                            {pm.missedPayment}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {pm.payoutDate === 'Paid' ? (
                            <Badge
                              size="sm"
                              radius="sm"
                              style={{ background: '#e6f5f1', color: PRIMARY, border: 'none', fontWeight: 600 }}
                            >
                              Paid
                            </Badge>
                          ) : (
                            <Text fz="sm">{pm.payoutDate}</Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>

              {/* Missed Payments Card */}
              <Paper
                p="xl"
                radius="md"
                style={{
                  border: '1px solid #e9ecef',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                }}
              >
                <ThemeIcon size={48} radius="xl" style={{ background: '#fdf3e7' }} mb="md">
                  <IconAlertTriangle size={24} stroke={1.5} color="#e67e22" />
                </ThemeIcon>
                <Text fw={600} fz="md" ta="center" mb="xs">Missed Payments</Text>
                <Text fz="sm" c="dimmed" ta="center" style={{ maxWidth: 220 }}>
                  All members are up to date. No missed contributions this cycle.
                </Text>
              </Paper>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
      )}

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
      </Modal>

      {/* Notify Member Modal */}
      <Modal
        opened={notifyModal}
        onClose={() => setNotifyModal(false)}
        centered
        radius="md"
        size="sm"
        withCloseButton={false}
      >
        {/* Step 1: Confirm */}
        {notifyStep === 'confirm' && notifyMember && (
          <Stack align="center" gap="md" py="md">
            <ThemeIcon size={56} radius="xl" style={{ background: '#fef2f2' }}>
              <IconBell size={28} stroke={1.5} color="#e74c3c" />
            </ThemeIcon>
            <Text fw={700} fz="lg" ta="center">Notify Member</Text>
            <Text fz="sm" c="dimmed" ta="center" style={{ maxWidth: 320 }}>
              Send a payment reminder notification to <b>{notifyMember.name}</b> about their failed debit.
            </Text>
            <Paper
              p="md"
              radius="md"
              style={{ background: '#f8f9fa', width: '100%' }}
            >
              <Group justify="space-between" mb="xs">
                <Text fz="sm" c="dimmed">Member</Text>
                <Text fz="sm" fw={600}>{notifyMember.name}</Text>
              </Group>
              <Group justify="space-between" mb="xs">
                <Text fz="sm" c="dimmed">Amount</Text>
                <Text fz="sm" fw={600}>{notifyMember.amount}</Text>
              </Group>
              <Group justify="space-between">
                <Text fz="sm" c="dimmed">Failed Reason</Text>
                <Badge
                  size="sm"
                  radius="sm"
                  style={{ background: '#fef2f2', color: '#e74c3c', border: 'none', fontWeight: 600 }}
                >
                  {notifyMember.failedReason}
                </Badge>
              </Group>
            </Paper>
            <Group justify="center" gap="sm" mt="xs" style={{ width: '100%' }}>
              <Button
                variant="outline"
                radius="md"
                size="sm"
                onClick={() => setNotifyModal(false)}
                style={{ borderColor: '#dee2e6', color: '#495057', flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY, flex: 1 }}
                onClick={handleSendNotify}
              >
                Send Notification
              </Button>
            </Group>
          </Stack>
        )}

        {/* Step 2: Sending */}
        {notifyStep === 'sending' && (
          <Stack align="center" gap="md" py="xl">
            <Loader size="lg" color={PRIMARY} />
            <Text fw={700} fz="lg">Sending Notification</Text>
            <Text fz="sm" c="dimmed">Please wait...</Text>
          </Stack>
        )}

        {/* Step 3: Success */}
        {notifyStep === 'success' && notifyMember && (
          <Stack align="center" gap="md" py="md">
            <ThemeIcon size={56} radius="xl" style={{ background: '#e6f5f1' }}>
              <IconCheck size={28} stroke={2} color={PRIMARY} />
            </ThemeIcon>
            <Text fw={700} fz="lg" ta="center">Notification Sent!</Text>
            <Text fz="sm" c="dimmed" ta="center" style={{ maxWidth: 320 }}>
              A payment reminder has been sent to <b>{notifyMember.name}</b> about their failed debit of <b>{notifyMember.amount}</b>.
            </Text>
            <Button
              radius="md"
              size="sm"
              fullWidth
              style={{ background: PRIMARY }}
              onClick={() => setNotifyModal(false)}
              mt="xs"
            >
              Close
            </Button>
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
    </Stack>
  )
}
