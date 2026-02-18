import { useState } from 'react'
import {
  Stack,
  Text,
  Box,
  Group,
  TextInput,
  Button,
  Paper,
  Avatar,
  Badge,
  Modal,
  Textarea,
  Loader,
} from '@mantine/core'
import { IconSearch, IconCircleCheck, IconAlertTriangle, IconShieldCheck } from '@tabler/icons-react'

const PRIMARY = '#0b6b55'

interface JoinRequest {
  id: string
  name: string
  timeAgo: string
  message: string
  trustScore: number
  history: string
  group: string
}

const requests: JoinRequest[] = [
  {
    id: '1',
    name: 'Esther Ajakaye',
    timeAgo: '12 mins ago',
    message: "Hi, I'd love to join the Mamagoals group to save up.",
    trustScore: 92,
    history: 'Completed 2 ROSCA Cycles',
    group: 'Mamagoals',
  },
  {
    id: '2',
    name: 'Chidi Okonkwo',
    timeAgo: '1 hour ago',
    message: 'Looking forward to joining the savings group.',
    trustScore: 32,
    history: 'Defaulted in 2 previous cycles',
    group: 'Mamagoals',
  },
  {
    id: '3',
    name: 'Femi Adeyemi',
    timeAgo: '3 hours ago',
    message: 'I want to be part of Men Thrive to build discipline in saving.',
    trustScore: 85,
    history: 'Completed 4 ROSCA Cycles',
    group: 'Men Thrive',
  },
]

const groups = ['Mamagoals', 'Men Thrive']

function getTrustColor(score: number) {
  if (score >= 70) return PRIMARY
  if (score >= 50) return '#e67e22'
  return '#e74c3c'
}

function getTrustBg(score: number) {
  if (score >= 70) return '#e6f5f1'
  if (score >= 50) return '#fdf3e7'
  return '#fde8e8'
}

export function ManageJoinRequest() {
  const [activeGroup, setActiveGroup] = useState<string>(groups[0])
  const [search, setSearch] = useState('')
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>(requests)
  const [acceptModal, setAcceptModal] = useState(false)
  const [selectedReq, setSelectedReq] = useState<JoinRequest | null>(null)
  const [acceptReason, setAcceptReason] = useState('')
  const [acceptStep, setAcceptStep] = useState<'confirm' | 'loading' | 'success'>('confirm')
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectStep, setRejectStep] = useState<'confirm' | 'loading' | 'success'>('confirm')
  const [historyModal, setHistoryModal] = useState(false)

  function openAcceptModal(req: JoinRequest) {
    setSelectedReq(req)
    setAcceptReason('')
    setAcceptStep('confirm')
    setAcceptModal(true)
  }

  function closeAcceptModal() {
    if (acceptStep === 'success' && selectedReq) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== selectedReq.id))
    }
    setAcceptModal(false)
    setSelectedReq(null)
    setAcceptReason('')
    setAcceptStep('confirm')
  }

  function handleAcceptUser() {
    setAcceptStep('loading')
    setTimeout(() => {
      setAcceptStep('success')
    }, 2000)
  }

  function openRejectModal(req: JoinRequest) {
    setSelectedReq(req)
    setRejectReason('')
    setRejectStep('confirm')
    setRejectModal(true)
  }

  function closeRejectModal() {
    if (rejectStep === 'success' && selectedReq) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== selectedReq.id))
    }
    setRejectModal(false)
    setSelectedReq(null)
    setRejectReason('')
    setRejectStep('confirm')
  }

  function handleRejectUser() {
    setRejectStep('loading')
    setTimeout(() => {
      setRejectStep('success')
    }, 2000)
  }

  function openHistoryModal(req: JoinRequest) {
    setSelectedReq(req)
    setHistoryModal(true)
  }

  function closeHistoryModal() {
    setHistoryModal(false)
    setSelectedReq(null)
  }

  function getTrustLabel(score: number) {
    if (score >= 70) return 'High'
    if (score >= 50) return 'Medium'
    return 'Low'
  }

  const filtered = pendingRequests.filter(
    (r) =>
      r.group === activeGroup &&
      (r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.message.toLowerCase().includes(search.toLowerCase())),
  )

  if (pendingRequests.length === 0) {
    return (
      <Stack gap="lg" align="center" justify="center" style={{ minHeight: 400 }}>
        <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center', maxWidth: 400 }}>
          <IconSearch size={48} stroke={1.2} color="#868e96" style={{ marginBottom: 12 }} />
          <Text fz="lg" fw={600} mb={4}>No Pending Requests</Text>
          <Text fz="sm" c="dimmed">
            There are no pending join requests at the moment. New requests will appear here when users apply to join a group.
          </Text>
        </Paper>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box>
        <Text fz={22} fw={700} mb={2}>
          Pending Join Request
        </Text>
        <Text fz="sm" c="dimmed">
          {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''} across {groups.length} groups
        </Text>
      </Box>

      {/* Search */}
      <TextInput
        placeholder="Search by name..."
        leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
        radius="md"
        size="sm"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        styles={{ input: { border: '1px solid #dee2e6' } }}
      />

      {/* Group filter tabs */}
      <Group gap="sm">
        {groups.map((group) => (
          <Button
            key={group}
            size="xs"
            radius="xl"
            variant={activeGroup === group ? 'filled' : 'default'}
            style={
              activeGroup === group
                ? { background: PRIMARY }
                : { borderColor: '#dee2e6' }
            }
            onClick={() => setActiveGroup(group)}
          >
            {group}
          </Button>
        ))}
      </Group>

      {/* Request cards */}
      <Stack gap="md">
        {filtered.length === 0 && (
          <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Text c="dimmed" ta="center">
              No pending requests for {activeGroup}
            </Text>
          </Paper>
        )}

        {filtered.map((req) => (
          <Paper
            key={req.id}
            p="lg"
            radius="md"
            style={{ border: '1px solid #e9ecef' }}
          >
            <Group align="flex-start" justify="space-between" wrap="nowrap">
              {/* Left: user info */}
              <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1 }}>
                <Avatar size={44} radius="xl" color="gray">
                  {req.name.charAt(0)}
                </Avatar>
                <Box style={{ flex: 1 }}>
                  <Group gap="sm" mb={2}>
                    <Text fz="sm" fw={600}>
                      {req.name}
                    </Text>
                    <Text fz="xs" c="dimmed">
                      {req.timeAgo}
                    </Text>
                  </Group>
                  <Text fz="sm" c="dimmed" mb="sm">
                    {req.message}
                  </Text>

                  {/* Trust score + history */}
                  <Group gap="md" align="center">
                    <Box>
                      <Text fz="xs" c="dimmed" mb={2}>
                        Trust Score
                      </Text>
                      <Badge
                        size="lg"
                        radius="sm"
                        style={{
                          background: getTrustBg(req.trustScore),
                          color: getTrustColor(req.trustScore),
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {req.trustScore}/100
                      </Badge>
                    </Box>
                    <Box>
                      <Text fz="xs" c="dimmed" mb={2}>
                        History
                      </Text>
                      <Text fz="xs" fw={500}>
                        {req.history}
                      </Text>
                    </Box>
                    <Button
                      variant="subtle"
                      size="xs"
                      style={{ color: PRIMARY }}
                      px={0}
                      mt={12}
                      onClick={() => openHistoryModal(req)}
                    >
                      View History
                    </Button>
                  </Group>
                </Box>
              </Group>

              {/* Right: action buttons */}
              <Stack gap="xs" mt={4}>
                <Button
                  size="xs"
                  radius="md"
                  style={{ background: PRIMARY, minWidth: 80 }}
                  onClick={() => openAcceptModal(req)}
                >
                  Accept
                </Button>
                <Button
                  size="xs"
                  radius="md"
                  variant="outline"
                  color="red"
                  style={{ minWidth: 80 }}
                  onClick={() => openRejectModal(req)}
                >
                  Reject
                </Button>
              </Stack>
            </Group>
          </Paper>
        ))}
      </Stack>
      {/* Accept Modal */}
      <Modal
        opened={acceptModal}
        onClose={closeAcceptModal}
        centered
        radius="md"
        size="sm"
        withCloseButton={acceptStep === 'confirm'}
        title={acceptStep === 'confirm' ? (
          <Text fw={700} fz="md">Accept Join Request</Text>
        ) : undefined}
        closeOnClickOutside={acceptStep === 'confirm'}
      >
        {acceptStep === 'confirm' && selectedReq && (
          <Stack gap="md">
            {/* User info */}
            <Paper p="md" radius="md" style={{ background: '#f8f9fa' }}>
              <Group gap="md" align="center">
                <Avatar size={44} radius="xl" color="gray">
                  {selectedReq.name.charAt(0)}
                </Avatar>
                <Box>
                  <Text fz="sm" fw={600}>{selectedReq.name}</Text>
                  <Text fz="xs" c="dimmed">Group: {selectedReq.group}</Text>
                </Box>
              </Group>
              <Group gap="sm" mt="sm">
                <Text fz="xs" c="dimmed">Trust Score:</Text>
                <Badge
                  size="sm"
                  radius="sm"
                  style={{
                    background: getTrustBg(selectedReq.trustScore),
                    color: getTrustColor(selectedReq.trustScore),
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  {selectedReq.trustScore} - {getTrustLabel(selectedReq.trustScore)}
                </Badge>
              </Group>
            </Paper>

            {/* Reason textarea */}
            <Box>
              <Text fz="sm" fw={500} mb={4}>Reason for Acceptance (optional)</Text>
              <Textarea
                placeholder="Enter reason..."
                radius="md"
                minRows={3}
                value={acceptReason}
                onChange={(e) => setAcceptReason(e.currentTarget.value)}
                styles={{ input: { border: '1px solid #dee2e6' } }}
              />
            </Box>

            {/* Actions */}
            <Group justify="flex-end" gap="sm" mt="xs">
              <Button
                variant="default"
                radius="md"
                size="sm"
                onClick={closeAcceptModal}
                style={{ borderColor: '#dee2e6' }}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY }}
                onClick={handleAcceptUser}
              >
                Accept User
              </Button>
            </Group>
          </Stack>
        )}

        {acceptStep === 'loading' && (
          <Stack align="center" gap="md" py="xl">
            <Loader size="md" color={PRIMARY} />
            <Text fz="sm" c="dimmed">Accepting user...</Text>
          </Stack>
        )}

        {acceptStep === 'success' && (
          <Stack align="center" gap="md" py="xl">
            <IconCircleCheck size={48} color={PRIMARY} stroke={1.5} />
            <Text fz="sm" fw={500}>Request accepted successfully</Text>
            <Button
              variant="default"
              radius="md"
              size="sm"
              onClick={closeAcceptModal}
              style={{ borderColor: '#dee2e6' }}
            >
              Back
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        opened={rejectModal}
        onClose={closeRejectModal}
        centered
        radius="md"
        size="sm"
        withCloseButton={rejectStep === 'confirm'}
        title={rejectStep === 'confirm' ? (
          <Text fw={700} fz="md">Reject Join Request</Text>
        ) : undefined}
        closeOnClickOutside={rejectStep === 'confirm'}
      >
        {rejectStep === 'confirm' && selectedReq && (
          <Stack gap="md">
            <Text fz="sm" c="dimmed">
              You are about to reject this user's request to join this group.
            </Text>

            {/* User info */}
            <Paper p="md" radius="md" style={{ background: '#f8f9fa' }}>
              <Group gap="md" align="center">
                <Avatar size={44} radius="xl" color="gray">
                  {selectedReq.name.charAt(0)}
                </Avatar>
                <Box>
                  <Text fz="sm" fw={600}>{selectedReq.name}</Text>
                  <Text fz="xs" c="dimmed">Group: {selectedReq.group}</Text>
                </Box>
              </Group>
              <Group gap="sm" mt="sm">
                <Text fz="xs" c="dimmed">Trust Score:</Text>
                <Badge
                  size="sm"
                  radius="sm"
                  style={{
                    background: getTrustBg(selectedReq.trustScore),
                    color: getTrustColor(selectedReq.trustScore),
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  {selectedReq.trustScore} - {getTrustLabel(selectedReq.trustScore)}
                </Badge>
              </Group>
            </Paper>

            {/* Reason textarea */}
            <Box>
              <Text fz="sm" fw={500} mb={4}>Reason for Rejection (optional)</Text>
              <Textarea
                placeholder="E.g. Incomplete profile, history of default. Not eligible for this group."
                radius="md"
                minRows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.currentTarget.value)}
                styles={{ input: { border: '1px solid #dee2e6' } }}
              />
            </Box>

            {/* Actions */}
            <Group justify="flex-end" gap="sm" mt="xs">
              <Button
                variant="default"
                radius="md"
                size="sm"
                onClick={closeRejectModal}
                style={{ borderColor: '#dee2e6' }}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                color="red"
                onClick={handleRejectUser}
              >
                Reject User
              </Button>
            </Group>
          </Stack>
        )}

        {rejectStep === 'loading' && (
          <Stack align="center" gap="md" py="xl">
            <Loader size="md" color="red" />
            <Text fz="sm" c="dimmed">Rejecting user...</Text>
          </Stack>
        )}

        {rejectStep === 'success' && (
          <Stack align="center" gap="md" py="xl">
            <IconAlertTriangle size={48} color="#e74c3c" stroke={1.5} />
            <Text fz="sm" fw={500}>Request rejected successfully</Text>
            <Button
              variant="default"
              radius="md"
              size="sm"
              onClick={closeRejectModal}
              style={{ borderColor: '#dee2e6' }}
            >
              Back
            </Button>
          </Stack>
        )}
      </Modal>

      {/* View History Modal */}
      <Modal
        opened={historyModal}
        onClose={closeHistoryModal}
        centered
        radius="md"
        size="md"
        withCloseButton
        title={undefined}
      >
        {selectedReq && (
          <Stack gap="lg" align="center">
            {/* Avatar + Name */}
            <Stack align="center" gap="xs">
              <Avatar size={64} radius="xl" color="gray">
                {selectedReq.name.charAt(0)}
              </Avatar>
              <Text fw={600} fz="md">{selectedReq.name}</Text>
            </Stack>

            {/* Trust Score + Status Cards */}
            <Group gap="md" grow>
              <Paper
                p="md"
                radius="md"
                style={{ border: '1px solid #e9ecef', textAlign: 'center' }}
              >
                <Text fz={28} fw={700} style={{ color: getTrustColor(selectedReq.trustScore) }}>
                  {selectedReq.trustScore}
                </Text>
                <Text fz="xs" c="dimmed">Current Trust Score</Text>
              </Paper>
              <Paper
                p="md"
                radius="md"
                style={{ background: '#e6f5f1', textAlign: 'center' }}
              >
                <IconShieldCheck size={28} color={PRIMARY} stroke={1.5} style={{ margin: '0 auto 4px' }} />
                <Text fz="xs" fw={500} style={{ color: PRIMARY }}>
                  {selectedReq.trustScore >= 70
                    ? 'No missed payments or defaults'
                    : 'Has history of missed payments'}
                </Text>
              </Paper>
            </Group>

            {/* Score Breakdown */}
            <Box w="100%">
              <Text fw={600} fz="sm" mb="sm">Score Breakdown</Text>
              <Group gap="md" grow>
                <Paper p="md" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center' }}>
                  <Text fz="lg" fw={700}>{selectedReq.trustScore >= 70 ? '14/14' : '8/14'}</Text>
                  <Text fz="xs" c="dimmed">On-Time Payments</Text>
                </Paper>
                <Paper p="md" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center' }}>
                  <Text fz="lg" fw={700}>{selectedReq.history.match(/\d+/)?.[0] || '0'}</Text>
                  <Text fz="xs" c="dimmed">Completed Cycle</Text>
                </Paper>
                <Paper p="md" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center' }}>
                  <Text fz="lg" fw={700}>{selectedReq.trustScore >= 70 ? '0' : '1'}</Text>
                  <Text fz="xs" c="dimmed">Group Suspended From</Text>
                </Paper>
              </Group>
            </Box>

            {/* Action Buttons */}
            <Group gap="sm" justify="center" w="100%">
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY, flex: 1 }}
                onClick={() => {
                  closeHistoryModal()
                  openAcceptModal(selectedReq)
                }}
              >
                Accept
              </Button>
              <Button
                radius="md"
                size="sm"
                color="red"
                style={{ flex: 1 }}
                onClick={() => {
                  closeHistoryModal()
                  openRejectModal(selectedReq)
                }}
              >
                Reject
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
