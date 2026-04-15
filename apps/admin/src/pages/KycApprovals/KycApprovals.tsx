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
import {
  IconSearch,
  IconCircleCheck,
  IconAlertTriangle,
  IconShieldCheck,
  IconClock,
  IconX,
} from '@tabler/icons-react'
import {
  listPendingKyc,
  approveKyc,
  rejectKyc,
  type PendingKycRecord,
} from '@/utils/api'

const PRIMARY = '#0b6b55'

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Unknown'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1} min${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? 's' : ''} ago`
}

export function KycApprovals() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<PendingKycRecord[]>([])
  const [search, setSearch] = useState('')
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Approve modal
  const [approveModal, setApproveModal] = useState(false)
  const [selected, setSelected] = useState<PendingKycRecord | null>(null)
  const [approveStep, setApproveStep] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm')
  const [approveError, setApproveError] = useState<string | null>(null)

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectStep, setRejectStep] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm')
  const [rejectError, setRejectError] = useState<string | null>(null)

  useEffect(() => {
    listPendingKyc()
      .then(setRecords)
      .catch((err) => setFetchError(err instanceof Error ? err.message : 'Failed to load KYC submissions'))
      .finally(() => setLoading(false))
  }, [])

  function removeRecord(userId: string) {
    setRecords((prev) => prev.filter((r) => r.userId !== userId))
  }

  // Approve
  function openApprove(record: PendingKycRecord) {
    setSelected(record)
    setApproveError(null)
    setApproveStep('confirm')
    setApproveModal(true)
  }
  function closeApprove() {
    if (approveStep === 'success' && selected) removeRecord(selected.userId)
    setApproveModal(false)
    setSelected(null)
  }
  async function handleApprove() {
    if (!selected) return
    setApproveStep('loading')
    try {
      await approveKyc(selected.userId)
      setApproveStep('success')
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Failed to approve')
      setApproveStep('error')
    }
  }

  // Reject
  function openReject(record: PendingKycRecord) {
    setSelected(record)
    setRejectReason('')
    setRejectError(null)
    setRejectStep('confirm')
    setRejectModal(true)
  }
  function closeReject() {
    if (rejectStep === 'success' && selected) removeRecord(selected.userId)
    setRejectModal(false)
    setSelected(null)
  }
  async function handleReject() {
    if (!selected) return
    setRejectStep('loading')
    try {
      await rejectKyc(selected.userId, rejectReason)
      setRejectStep('success')
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Failed to reject')
      setRejectStep('error')
    }
  }

  const filtered = records.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
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
          <Text fz="md" fw={600} mb={4}>Failed to load KYC submissions</Text>
          <Text fz="sm" c="dimmed">{fetchError}</Text>
        </Paper>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box>
        <Text fz={22} fw={700} mb={2}>KYC Approvals</Text>
        <Text fz="sm" c="dimmed">
          {records.length} pending submission{records.length !== 1 ? 's' : ''} awaiting review
        </Text>
      </Box>

      {records.length === 0 ? (
        <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center' }}>
          <IconShieldCheck size={48} stroke={1.2} color="#868e96" style={{ marginBottom: 12 }} />
          <Text fz="lg" fw={600} mb={4}>All Caught Up</Text>
          <Text fz="sm" c="dimmed">No pending KYC submissions to review.</Text>
        </Paper>
      ) : (
        <>
          <TextInput
            placeholder="Search by name or email..."
            leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
            radius="md"
            size="sm"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            styles={{ input: { border: '1px solid #dee2e6' } }}
          />

          <Stack gap="md">
            {filtered.map((record) => (
              <Paper key={record.userId} p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
                <Group align="flex-start" justify="space-between" wrap="nowrap">
                  <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1 }}>
                    <Avatar size={48} radius="xl" color="gray" fw={700}>
                      {record.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb={4}>
                        <Text fz="sm" fw={700}>{record.name}</Text>
                        <Text fz="xs" c="dimmed">{record.email}</Text>
                      </Group>
                      <Group gap={6} mb={6}>
                        <IconClock size={13} color="#868e96" />
                        <Text fz="xs" c="dimmed">Submitted {timeAgo(record.submittedAt)}</Text>
                      </Group>
                      <Group gap="sm" wrap="wrap">
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            background: record.ninVerifiedAt ? '#e6f5f1' : '#f3f4f6',
                            color: record.ninVerifiedAt ? PRIMARY : '#6B7280',
                            border: 'none',
                          }}
                        >
                          NIN {record.ninVerifiedAt ? '✓' : '–'}
                        </Badge>
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            background: record.bvnVerifiedAt ? '#e6f5f1' : '#f3f4f6',
                            color: record.bvnVerifiedAt ? PRIMARY : '#6B7280',
                            border: 'none',
                          }}
                        >
                          BVN {record.bvnVerifiedAt ? '✓' : '–'}
                        </Badge>
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            background: record.nokSubmitted ? '#e6f5f1' : '#f3f4f6',
                            color: record.nokSubmitted ? PRIMARY : '#6B7280',
                            border: 'none',
                          }}
                        >
                          NOK {record.nokSubmitted ? '✓' : '–'}
                        </Badge>
                      </Group>
                    </Box>
                  </Group>

                  <Stack gap="xs" mt={4} style={{ flexShrink: 0 }}>
                    <Button
                      size="xs"
                      radius="md"
                      style={{ background: PRIMARY, minWidth: 80 }}
                      onClick={() => openApprove(record)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      radius="md"
                      variant="outline"
                      color="red"
                      style={{ minWidth: 80 }}
                      onClick={() => openReject(record)}
                    >
                      Reject
                    </Button>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>
        </>
      )}

      {/* Approve Modal */}
      <Modal
        opened={approveModal}
        onClose={closeApprove}
        centered
        radius="md"
        size="sm"
        withCloseButton={approveStep === 'confirm'}
        title={approveStep === 'confirm' ? <Text fw={700} fz="md">Approve KYC</Text> : undefined}
        closeOnClickOutside={approveStep === 'confirm'}
      >
        {approveStep === 'confirm' && selected && (
          <Stack gap="md">
            <Paper p="md" radius="md" style={{ background: '#f8f9fa' }}>
              <Group gap="md" align="center">
                <Avatar size={44} radius="xl" color="gray">{selected.name.charAt(0)}</Avatar>
                <Box>
                  <Text fz="sm" fw={600}>{selected.name}</Text>
                  <Text fz="xs" c="dimmed">{selected.email}</Text>
                </Box>
              </Group>
            </Paper>
            <Text fz="sm" c="dimmed">
              Approving this submission will grant the user full platform access including funding and withdrawals.
            </Text>
            <Group justify="flex-end" gap="sm" mt="xs">
              <Button variant="default" radius="md" size="sm" onClick={closeApprove} style={{ borderColor: '#dee2e6' }}>
                Cancel
              </Button>
              <Button radius="md" size="sm" style={{ background: PRIMARY }} onClick={handleApprove}>
                Approve
              </Button>
            </Group>
          </Stack>
        )}
        {approveStep === 'loading' && (
          <Stack align="center" gap="md" py="xl">
            <Loader size="md" color={PRIMARY} />
            <Text fz="sm" c="dimmed">Approving KYC...</Text>
          </Stack>
        )}
        {approveStep === 'success' && (
          <Stack align="center" gap="md" py="xl">
            <IconCircleCheck size={48} color={PRIMARY} stroke={1.5} />
            <Text fz="sm" fw={500}>KYC approved successfully</Text>
            <Button variant="default" radius="md" size="sm" onClick={closeApprove} style={{ borderColor: '#dee2e6' }}>
              Close
            </Button>
          </Stack>
        )}
        {approveStep === 'error' && (
          <Stack align="center" gap="md" py="xl">
            <IconAlertTriangle size={48} color="#e74c3c" stroke={1.5} />
            <Text fz="sm" fw={500} c="red">{approveError}</Text>
            <Group gap="sm">
              <Button variant="default" radius="md" size="sm" onClick={() => setApproveStep('confirm')} style={{ borderColor: '#dee2e6' }}>
                Try Again
              </Button>
              <Button variant="default" radius="md" size="sm" onClick={closeApprove} style={{ borderColor: '#dee2e6' }}>
                Close
              </Button>
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
        title={rejectStep === 'confirm' ? <Text fw={700} fz="md">Reject KYC</Text> : undefined}
        closeOnClickOutside={rejectStep === 'confirm'}
      >
        {rejectStep === 'confirm' && selected && (
          <Stack gap="md">
            <Paper p="md" radius="md" style={{ background: '#f8f9fa' }}>
              <Group gap="md" align="center">
                <Avatar size={44} radius="xl" color="gray">{selected.name.charAt(0)}</Avatar>
                <Box>
                  <Text fz="sm" fw={600}>{selected.name}</Text>
                  <Text fz="xs" c="dimmed">{selected.email}</Text>
                </Box>
              </Group>
            </Paper>
            <Box>
              <Text fz="sm" fw={500} mb={4}>Reason for Rejection <Text span c="dimmed" fz="xs">(optional)</Text></Text>
              <Textarea
                placeholder="E.g. Documents unclear, mismatched information..."
                radius="md"
                minRows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.currentTarget.value)}
                styles={{ input: { border: '1px solid #dee2e6' } }}
              />
            </Box>
            <Group justify="flex-end" gap="sm" mt="xs">
              <Button variant="default" radius="md" size="sm" onClick={closeReject} style={{ borderColor: '#dee2e6' }}>
                Cancel
              </Button>
              <Button radius="md" size="sm" color="red" onClick={handleReject}>
                Reject
              </Button>
            </Group>
          </Stack>
        )}
        {rejectStep === 'loading' && (
          <Stack align="center" gap="md" py="xl">
            <Loader size="md" color="red" />
            <Text fz="sm" c="dimmed">Rejecting KYC...</Text>
          </Stack>
        )}
        {rejectStep === 'success' && (
          <Stack align="center" gap="md" py="xl">
            <IconX size={48} color="#e74c3c" stroke={1.5} />
            <Text fz="sm" fw={500}>KYC rejected successfully</Text>
            <Button variant="default" radius="md" size="sm" onClick={closeReject} style={{ borderColor: '#dee2e6' }}>
              Close
            </Button>
          </Stack>
        )}
        {rejectStep === 'error' && (
          <Stack align="center" gap="md" py="xl">
            <IconAlertTriangle size={48} color="#e74c3c" stroke={1.5} />
            <Text fz="sm" fw={500} c="red">{rejectError}</Text>
            <Group gap="sm">
              <Button variant="default" radius="md" size="sm" onClick={() => setRejectStep('confirm')} style={{ borderColor: '#dee2e6' }}>
                Try Again
              </Button>
              <Button variant="default" radius="md" size="sm" onClick={closeReject} style={{ borderColor: '#dee2e6' }}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
