import { useState, useEffect } from 'react'
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
import { IconSearch, IconCircleCheck, IconAlertTriangle, IconTrendingUp, IconHistory } from '@tabler/icons-react'
import { getJoinRequests, getCircleJoinRequests, approveMember, rejectMember, type CirclePendingRequests, type JoinRequesterDossier } from '@/utils/api'

const PRIMARY = '#0b6b55'

type PendingMember = JoinRequesterDossier

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1} min${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? 's' : ''} ago`
}

function getTrustColor(score: number) {
  if (score >= 70) return PRIMARY
  if (score >= 40) return '#e67e22'
  return '#e74c3c'
}

function getTrustBg(score: number) {
  if (score >= 70) return '#e6f5f1'
  if (score >= 40) return '#fdf3e7'
  return '#fde8e8'
}

export function ManageJoinRequest() {
  const [tabsLoading, setTabsLoading] = useState(true)
  const [circles, setCircles] = useState<CirclePendingRequests[]>([])
  const [activeCircle, setActiveCircle] = useState<CirclePendingRequests | null>(null)

  const [membersLoading, setMembersLoading] = useState(false)
  const [members, setMembers] = useState<PendingMember[]>([])
  const [search, setSearch] = useState('')

  const [fetchError, setFetchError] = useState<string | null>(null)

  // Accept modal
  const [acceptModal, setAcceptModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null)
  const [acceptReason, setAcceptReason] = useState('')
  const [acceptStep, setAcceptStep] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm')
  const [acceptError, setAcceptError] = useState<string | null>(null)

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectStep, setRejectStep] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm')
  const [rejectError, setRejectError] = useState<string | null>(null)

  // Load circle tabs
  useEffect(() => {
    getJoinRequests()
      .then((data) => {
        setCircles(data)
        if (data.length > 0) setActiveCircle(data[0])
      })
      .catch((err) => setFetchError(err instanceof Error ? err.message : 'Failed to load requests'))
      .finally(() => setTabsLoading(false))
  }, [])

  // Load pending members whenever active circle changes
  useEffect(() => {
    if (!activeCircle) return
    setMembersLoading(true)
    setMembers([])
    getCircleJoinRequests(activeCircle.circleId)
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false))
  }, [activeCircle])

  function removeFromList(userId: string) {
    setMembers((prev) => prev.filter((m) => m.userId !== userId))
    setCircles((prev) => prev.map((c) =>
      c.circleId === activeCircle?.circleId
        ? { ...c, pendingCount: Math.max(0, c.pendingCount - 1) }
        : c
    ))
  }

  // Accept
  function openAccept(member: PendingMember) {
    setSelectedMember(member)
    setAcceptReason('')
    setAcceptError(null)
    setAcceptStep('confirm')
    setAcceptModal(true)
  }
  function closeAccept() {
    if (acceptStep === 'success' && selectedMember) removeFromList(selectedMember.userId)
    setAcceptModal(false)
    setSelectedMember(null)
  }
  async function handleAccept() {
    if (!selectedMember || !activeCircle) return
    setAcceptStep('loading')
    try {
      await approveMember(activeCircle.circleId, selectedMember.userId)
      setAcceptStep('success')
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept')
      setAcceptStep('error')
    }
  }

  // Reject
  function openReject(member: PendingMember) {
    setSelectedMember(member)
    setRejectReason('')
    setRejectError(null)
    setRejectStep('confirm')
    setRejectModal(true)
  }
  function closeReject() {
    if (rejectStep === 'success' && selectedMember) removeFromList(selectedMember.userId)
    setRejectModal(false)
    setSelectedMember(null)
  }
  async function handleReject() {
    if (!selectedMember || !activeCircle) return
    setRejectStep('loading')
    try {
      await rejectMember(activeCircle.circleId, selectedMember.userId)
      setRejectStep('success')
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Failed to reject')
      setRejectStep('error')
    }
  }

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  )

  // Loading tabs
  if (tabsLoading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Loader color={PRIMARY} />
      </Box>
    )
  }

  if (fetchError) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 400 }}>
        <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center', maxWidth: 400 }}>
          <IconAlertTriangle size={40} color="#e74c3c" stroke={1.5} style={{ marginBottom: 12 }} />
          <Text fz="md" fw={600} mb={4}>Failed to load requests</Text>
          <Text fz="sm" c="dimmed">{fetchError}</Text>
        </Paper>
      </Stack>
    )
  }

  const totalPending = circles.reduce((sum, c) => sum + c.pendingCount, 0)

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box>
        <Text fz={22} fw={700} mb={2}>Pending Join Request</Text>
        <Text fz="sm" c="dimmed">
          {totalPending} pending request{totalPending !== 1 ? 's' : ''} across {circles.length} group{circles.length !== 1 ? 's' : ''}
        </Text>
      </Box>

      {circles.length === 0 ? (
        <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center' }}>
          <IconSearch size={48} stroke={1.2} color="#868e96" style={{ marginBottom: 12 }} />
          <Text fz="lg" fw={600} mb={4}>No Pending Requests</Text>
          <Text fz="sm" c="dimmed">
            There are no pending join requests at the moment.
          </Text>
        </Paper>
      ) : (
        <>
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

          {/* Circle tabs */}
          <Group gap="sm">
            {circles.map((c) => (
              <Button
                key={c.circleId}
                size="xs"
                radius="xl"
                variant={activeCircle?.circleId === c.circleId ? 'filled' : 'default'}
                style={
                  activeCircle?.circleId === c.circleId
                    ? { background: PRIMARY }
                    : { borderColor: '#dee2e6', color: '#495057' }
                }
                onClick={() => setActiveCircle(c)}
              >
                {c.name}
              </Button>
            ))}
          </Group>

          {/* Member cards */}
          {membersLoading ? (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader size="sm" color={PRIMARY} />
            </Box>
          ) : filtered.length === 0 ? (
            <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center' }}>
              <Text fz="sm" c="dimmed">No pending requests for {activeCircle?.name}</Text>
            </Paper>
          ) : (
            <Stack gap="md">
              {filtered.map((member) => (
                <Paper key={member.userId} p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
                  <Group align="flex-start" justify="space-between" wrap="nowrap">
                    <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1 }}>
                      <Avatar size={48} radius="xl" color="gray" fw={700}>
                        {member.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box style={{ flex: 1 }}>
                        <Group gap="sm" mb={6}>
                          <Text fz="sm" fw={700}>{member.name}</Text>
                          <Text fz="xs" c="dimmed">Requested {timeAgo(member.requestedAt)}</Text>
                        </Group>

                        {/* Stats row */}
                        <Group gap="lg" wrap="wrap">
                          {/* Trust Score */}
                          <Box>
                            <Text fz="xs" c="dimmed" mb={4}>Trust Score</Text>
                            <Badge
                              size="lg"
                              radius="sm"
                              leftSection={<IconTrendingUp size={12} />}
                              style={{
                                background: getTrustBg(member.trustScore),
                                color: getTrustColor(member.trustScore),
                                border: 'none',
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              {member.trustScore}
                            </Badge>
                          </Box>

                          {/* On-time payment rate */}
                          <Box>
                            <Text fz="xs" c="dimmed" mb={4}>On-time Payments</Text>
                            {member.onTimePaymentRate !== null ? (
                              <Badge
                                size="lg"
                                radius="sm"
                                style={{
                                  background: getTrustBg(member.onTimePaymentRate),
                                  color: getTrustColor(member.onTimePaymentRate),
                                  border: 'none',
                                  fontWeight: 700,
                                  fontSize: 13,
                                }}
                              >
                                {member.onTimePaymentRate}%
                              </Badge>
                            ) : (
                              <Text fz="sm" c="dimmed">No history</Text>
                            )}
                          </Box>

                          {/* Completed cycles */}
                          <Box>
                            <Text fz="xs" c="dimmed" mb={4}>Completed Cycles</Text>
                            <Group gap={4} align="center">
                              <IconHistory size={14} color="#6B7280" />
                              <Text fz="sm" fw={600}>{member.completedCycles}</Text>
                            </Group>
                          </Box>
                        </Group>
                      </Box>
                    </Group>

                    <Stack gap="xs" mt={4} style={{ flexShrink: 0 }}>
                      <Button
                        size="xs"
                        radius="md"
                        style={{ background: PRIMARY, minWidth: 80 }}
                        onClick={() => openAccept(member)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="xs"
                        radius="md"
                        variant="outline"
                        color="red"
                        style={{ minWidth: 80 }}
                        onClick={() => openReject(member)}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Accept Modal */}
      <Modal
        opened={acceptModal}
        onClose={closeAccept}
        centered
        radius="md"
        size="sm"
        withCloseButton={acceptStep === 'confirm'}
        title={acceptStep === 'confirm' ? <Text fw={700} fz="md">Accept Join Request</Text> : undefined}
        closeOnClickOutside={acceptStep === 'confirm'}
      >
        {acceptStep === 'confirm' && selectedMember && (
          <Stack gap="md">
            <Paper p="md" radius="md" style={{ background: '#f8f9fa' }}>
              <Group gap="md" align="center">
                <Avatar size={44} radius="xl" color="gray">{selectedMember.name.charAt(0)}</Avatar>
                <Box>
                  <Text fz="sm" fw={600}>{selectedMember.name}</Text>
                  <Text fz="xs" c="dimmed">Group: {activeCircle?.name}</Text>
                </Box>
              </Group>
              <Group gap="sm" mt="sm">
                <Text fz="xs" c="dimmed">Trust Score:</Text>
                <Badge
                  size="sm"
                  radius="sm"
                  style={{
                    background: getTrustBg(selectedMember.trustScore),
                    color: getTrustColor(selectedMember.trustScore),
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  {selectedMember.trustScore}/100
                </Badge>
              </Group>
            </Paper>
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
            <Group justify="flex-end" gap="sm" mt="xs">
              <Button variant="default" radius="md" size="sm" onClick={closeAccept} style={{ borderColor: '#dee2e6' }}>Cancel</Button>
              <Button radius="md" size="sm" style={{ background: PRIMARY }} onClick={handleAccept}>Accept User</Button>
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
            <Button variant="default" radius="md" size="sm" onClick={closeAccept} style={{ borderColor: '#dee2e6' }}>Close</Button>
          </Stack>
        )}
        {acceptStep === 'error' && (
          <Stack align="center" gap="md" py="xl">
            <IconAlertTriangle size={48} color="#e74c3c" stroke={1.5} />
            <Text fz="sm" fw={500} c="red">{acceptError}</Text>
            <Group gap="sm">
              <Button variant="default" radius="md" size="sm" onClick={() => setAcceptStep('confirm')} style={{ borderColor: '#dee2e6' }}>Try Again</Button>
              <Button variant="default" radius="md" size="sm" onClick={closeAccept} style={{ borderColor: '#dee2e6' }}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        opened={rejectModal}
        onClose={closeReject}
        centered
        radius="md"
        size="sm"
        withCloseButton={rejectStep === 'confirm'}
        title={rejectStep === 'confirm' ? <Text fw={700} fz="md">Reject Join Request</Text> : undefined}
        closeOnClickOutside={rejectStep === 'confirm'}
      >
        {rejectStep === 'confirm' && selectedMember && (
          <Stack gap="md">
            <Text fz="sm" c="dimmed">You are about to reject this user's request to join this group.</Text>
            <Paper p="md" radius="md" style={{ background: '#f8f9fa' }}>
              <Group gap="md" align="center">
                <Avatar size={44} radius="xl" color="gray">{selectedMember.name.charAt(0)}</Avatar>
                <Box>
                  <Text fz="sm" fw={600}>{selectedMember.name}</Text>
                  <Text fz="xs" c="dimmed">Group: {activeCircle?.name}</Text>
                </Box>
              </Group>
            </Paper>
            <Box>
              <Text fz="sm" fw={500} mb={4}>Reason for Rejection (optional)</Text>
              <Textarea
                placeholder="E.g. Incomplete profile, history of default..."
                radius="md"
                minRows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.currentTarget.value)}
                styles={{ input: { border: '1px solid #dee2e6' } }}
              />
            </Box>
            <Group justify="flex-end" gap="sm" mt="xs">
              <Button variant="default" radius="md" size="sm" onClick={closeReject} style={{ borderColor: '#dee2e6' }}>Cancel</Button>
              <Button radius="md" size="sm" color="red" onClick={handleReject}>Reject User</Button>
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
            <Button variant="default" radius="md" size="sm" onClick={closeReject} style={{ borderColor: '#dee2e6' }}>Close</Button>
          </Stack>
        )}
        {rejectStep === 'error' && (
          <Stack align="center" gap="md" py="xl">
            <IconAlertTriangle size={48} color="#e74c3c" stroke={1.5} />
            <Text fz="sm" fw={500} c="red">{rejectError}</Text>
            <Group gap="sm">
              <Button variant="default" radius="md" size="sm" onClick={() => setRejectStep('confirm')} style={{ borderColor: '#dee2e6' }}>Try Again</Button>
              <Button variant="default" radius="md" size="sm" onClick={closeReject} style={{ borderColor: '#dee2e6' }}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
