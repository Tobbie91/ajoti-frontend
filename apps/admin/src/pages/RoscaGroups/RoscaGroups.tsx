import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Text,
  Box,
  Group,
  TextInput,
  Paper,
  Table,
  Badge,
  Checkbox,
  Pagination,
  Select,
  Button,
  Modal,
  Textarea,
  Loader,
  ThemeIcon,
  SimpleGrid,
} from '@mantine/core'
import { IconSearch, IconChevronDown, IconCheck, IconAlertTriangle, IconTrash } from '@tabler/icons-react'
import { listAllRoscaCircles, type RoscaCircle } from '@/utils/api'

const PRIMARY = '#0b6b55'

type Status = 'Active' | 'Pending' | 'Completed'

interface RoscaGroup {
  id: string
  name: string
  members: string
  nextPayout: string
  roundProgress: string
  status: Status
  readyToStart: boolean
}

function mapCircleToGroup(c: RoscaCircle): RoscaGroup {
  const filled = c.filledSlots ?? 0
  const total = c.maxSlots ?? c.totalSlots ?? 0
  let status: Status = 'Pending'
  const s = (c.status || '').toUpperCase()
  if (s === 'ACTIVE' || s === 'STARTED') status = 'Active'
  else if (s === 'COMPLETED') status = 'Completed'
  const readyToStart = status === 'Pending' && total > 0 && filled >= total
  return {
    id: c.id,
    name: c.name || 'Unnamed',
    members: `${filled}/${total}`,
    nextPayout: status === 'Pending' ? 'Pending' : status === 'Completed' ? 'Completed' : '—',
    roundProgress: status === 'Pending' ? 'Pending' : `${filled} of ${c.durationCycles ?? total}`,
    status,
    readyToStart,
  }
}

const PAGE_SIZE = 10

const statusOptions = [
  { value: 'All', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
]

const bulkOptions = [
  { value: '', label: 'Bulk Actions' },
  { value: 'send-notification', label: 'Send Notification' },
  { value: 'delete', label: 'Delete Groups' },
]

function getStatusColor(status: string) {
  if (status === 'Active') return PRIMARY
  if (status === 'Pending') return '#e67e22'
  return '#228be6'
}

function getStatusBg(status: string) {
  if (status === 'Active') return '#e6f5f1'
  if (status === 'Pending') return '#fdf3e7'
  return '#e7f5ff'
}

export function RoscaGroups() {
  const navigate = useNavigate()
  const [allGroups, setAllGroups] = useState<RoscaGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [bulkAction, setBulkAction] = useState<string>('')

  useEffect(() => {
    listAllRoscaCircles()
      .then((res) => {
        const circles = Array.isArray(res) ? res : ((res as Record<string, unknown>)?.data ?? (res as Record<string, unknown>)?.circles ?? []) as RoscaCircle[]
        setAllGroups(circles.map(mapCircleToGroup))
      })
      .catch((err) => console.error('Failed to load ROSCA circles:', err))
      .finally(() => setLoading(false))
  }, [])

  // Notification modal state
  const [notifModal, setNotifModal] = useState(false)
  const [notifStep, setNotifStep] = useState<'form' | 'loading' | 'success'>('form')
  const [notifSearch, setNotifSearch] = useState('')
  const [notifSelected, setNotifSelected] = useState<string[]>([])
  const [notifMessage, setNotifMessage] = useState('')
  const [notifPush, setNotifPush] = useState(false)

  function openNotifModal() {
    // Pre-select groups that were checked in the table
    setNotifSelected([...selected])
    setNotifSearch('')
    setNotifMessage('')
    setNotifPush(false)
    setNotifStep('form')
    setNotifModal(true)
  }

  function closeNotifModal() {
    setNotifModal(false)
  }

  function handleSendNotification() {
    setNotifStep('loading')
    setTimeout(() => {
      setNotifStep('success')
    }, 2000)
  }

  const notifFilteredGroups = allGroups.filter((g) =>
    g.name.toLowerCase().includes(notifSearch.toLowerCase()),
  )

  const allNotifSelected =
    notifFilteredGroups.length > 0 &&
    notifFilteredGroups.every((g) => notifSelected.includes(g.id))

  function toggleNotifAll() {
    if (allNotifSelected) {
      setNotifSelected([])
    } else {
      setNotifSelected(notifFilteredGroups.map((g) => g.id))
    }
  }

  function toggleNotifOne(id: string) {
    setNotifSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const notifSelectedNames = allGroups
    .filter((g) => notifSelected.includes(g.id))
    .map((g) => g.name)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'success'>('confirm')
  const [deleteTargets, setDeleteTargets] = useState<RoscaGroup[]>([])
  const [deleteSkipped, setDeleteSkipped] = useState<RoscaGroup[]>([])

  function openDeleteModal() {
    const selectedGroups = allGroups.filter((g) => selected.includes(g.id))
    const deletable = selectedGroups.filter((g) => g.status !== 'Active')
    const skipped = selectedGroups.filter((g) => g.status === 'Active')
    setDeleteTargets(deletable)
    setDeleteSkipped(skipped)
    setDeleteStep('confirm')
    setDeleteModal(true)
  }

  function closeDeleteModal() {
    setDeleteModal(false)
  }

  function handleConfirmDelete() {
    setDeleteStep('success')
  }

  const filtered = allGroups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || g.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const allOnPageSelected = paginated.length > 0 && paginated.every((g) => selected.includes(g.id))

  function toggleAll() {
    if (allOnPageSelected) {
      setSelected((prev) => prev.filter((id) => !paginated.some((g) => g.id === id)))
    } else {
      setSelected((prev) => [...new Set([...prev, ...paginated.map((g) => g.id)])])
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 300 }}>
        <Loader size={40} color={PRIMARY} />
        <Text fz="sm" c="dimmed">Loading groups...</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box>
        <Text fz={22} fw={700} mb={2}>
          All Groups
        </Text>
        <Text fz="sm" c="dimmed">
          {allGroups.filter((g) => g.status === 'Active').length} active groups
        </Text>
      </Box>

      {/* Search + Filters */}
      <Group gap="sm" align="center">
        <TextInput
          placeholder="Search groups..."
          leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
          radius="md"
          size="sm"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value)
            setPage(1)
          }}
          styles={{ input: { border: '1px solid #dee2e6' } }}
          style={{ flex: 1, maxWidth: 300 }}
        />
        <Select
          data={statusOptions}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val || 'All')
            setPage(1)
          }}
          size="sm"
          radius="md"
          rightSection={<IconChevronDown size={14} />}
          styles={{ input: { border: '1px solid #dee2e6', minWidth: 130 } }}
          allowDeselect={false}
        />
        <Select
          data={bulkOptions}
          value={bulkAction}
          onChange={(val) => {
            setBulkAction(val || '')
            if (val === 'send-notification') openNotifModal()
            if (val === 'delete') openDeleteModal()
          }}
          size="sm"
          radius="md"
          rightSection={<IconChevronDown size={14} />}
          styles={{ input: { border: '1px solid #dee2e6', minWidth: 150 } }}
          allowDeselect={false}
        />
        {bulkAction && selected.length > 0 && (
          <Button
            size="sm"
            radius="md"
            style={{ background: bulkAction === 'delete' ? '#e74c3c' : PRIMARY }}
            onClick={() => {
              if (bulkAction === 'send-notification') openNotifModal()
              if (bulkAction === 'delete') openDeleteModal()
            }}
          >
            Apply ({selected.length})
          </Button>
        )}
      </Group>

      {/* Table */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
        <Table verticalSpacing="sm" horizontalSpacing="lg">
          <Table.Thead>
            <Table.Tr style={{ background: PRIMARY }}>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>
                <Checkbox
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                  size="xs"
                  styles={{ input: { cursor: 'pointer' } }}
                />
              </Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Group Name</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Members</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Next Payout</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Round Progress</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginated.map((group) => (
              <Table.Tr key={group.id}>
                <Table.Td>
                  <Checkbox
                    checked={selected.includes(group.id)}
                    onChange={() => toggleOne(group.id)}
                    size="xs"
                    styles={{ input: { cursor: 'pointer' } }}
                  />
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    <Text fz="sm" fw={500}>{group.name}</Text>
                    {group.readyToStart && (
                      <Badge
                        size="xs"
                        radius="sm"
                        style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', fontWeight: 700, animation: 'pulse 2s infinite' }}
                      >
                        ● Ready to Start
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{group.members}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{group.nextPayout}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{group.roundProgress}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size="sm"
                    radius="sm"
                    style={{
                      background: getStatusBg(group.status),
                      color: getStatusColor(group.status),
                      border: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {group.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="subtle"
                    size="xs"
                    style={{ color: PRIMARY }}
                    px="xs"
                    onClick={() => navigate(`/rosca/groups/${group.id}`)}
                  >
                    View
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {/* Pagination */}
        <Group justify="space-between" align="center" px="lg" py="md" style={{ borderTop: '1px solid #e9ecef' }}>
          <Text fz="xs" c="dimmed">
            Showing {filtered.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} groups
          </Text>
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            size="sm"
            radius="md"
            styles={{
              control: { fontSize: 12 },
            }}
            color={PRIMARY}
          />
        </Group>
      </Paper>
      {/* Send Notification Modal */}
      <Modal
        opened={notifModal}
        onClose={closeNotifModal}
        centered
        radius="md"
        size="lg"
        withCloseButton={notifStep === 'form'}
        closeOnClickOutside={notifStep === 'form'}
        title={notifStep === 'form' ? (
          <Text fw={700} fz="lg">Send Notification</Text>
        ) : undefined}
      >
        {notifStep === 'form' && (
          <Stack gap="md">
            <Text fz="sm" c="dimmed">Select groups to send a notification.</Text>

            <TextInput
              placeholder="Search groups..."
              leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
              radius="md"
              size="sm"
              value={notifSearch}
              onChange={(e) => setNotifSearch(e.currentTarget.value)}
              styles={{ input: { border: '1px solid #dee2e6' } }}
            />

            <Checkbox
              label="Select All"
              checked={allNotifSelected}
              onChange={toggleNotifAll}
              size="sm"
              color={PRIMARY}
              styles={{ label: { fontWeight: 600 } }}
            />

            <Box
              style={{
                maxHeight: 200,
                overflowY: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs">
                {notifFilteredGroups.map((g) => (
                  <Checkbox
                    key={g.id}
                    label={g.name}
                    checked={notifSelected.includes(g.id)}
                    onChange={() => toggleNotifOne(g.id)}
                    size="sm"
                    color={PRIMARY}
                  />
                ))}
              </SimpleGrid>
            </Box>

            <Textarea
              placeholder="Type your notification message here..."
              radius="md"
              size="sm"
              minRows={4}
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.currentTarget.value)}
              styles={{ input: { border: '1px solid #dee2e6' } }}
            />

            <Checkbox
              label="Push Notification (in-app only)"
              checked={notifPush}
              onChange={(e) => setNotifPush(e.currentTarget.checked)}
              size="sm"
              color={PRIMARY}
            />

            <Group justify="flex-end" gap="sm" mt="xs">
              <Button
                variant="outline"
                radius="md"
                size="sm"
                onClick={closeNotifModal}
                style={{ borderColor: '#dee2e6', color: '#495057' }}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY }}
                disabled={notifSelected.length === 0 || !notifMessage.trim()}
                onClick={handleSendNotification}
              >
                Send
              </Button>
            </Group>
          </Stack>
        )}

        {notifStep === 'loading' && (
          <Stack align="center" justify="center" gap="md" py={60}>
            <Loader size={48} color={PRIMARY} />
            <Text fw={700} fz="lg">Sending Notification</Text>
            <Text fz="sm" c="dimmed">Please wait...</Text>
            <Text fz="xs" c="dimmed">Do not close this window.</Text>
          </Stack>
        )}

        {notifStep === 'success' && (
          <Stack align="center" gap="md" py={40}>
            <ThemeIcon size={64} radius="xl" style={{ background: '#e6f5f1' }}>
              <IconCheck size={32} stroke={2} color={PRIMARY} />
            </ThemeIcon>
            <Text fw={700} fz="lg">Notification Sent Successfully</Text>
            <Text fz="sm" c="dimmed" ta="center">
              Your message was delivered to {notifSelected.length} selected group{notifSelected.length !== 1 ? 's' : ''}.
            </Text>

            <Paper
              p="md"
              radius="md"
              style={{ border: '1px solid #e9ecef', width: '100%' }}
            >
              <Stack gap={6}>
                {notifSelectedNames.slice(0, 3).map((name) => (
                  <Text key={name} fz="sm" fw={500}>{name}</Text>
                ))}
                {notifSelectedNames.length > 3 && (
                  <Text fz="sm" c={PRIMARY} fw={500} style={{ cursor: 'pointer' }}>
                    +{notifSelectedNames.length - 3} more
                  </Text>
                )}
              </Stack>
            </Paper>

            <Group gap="sm" mt="xs">
              <Button
                variant="outline"
                radius="md"
                size="sm"
                style={{ borderColor: PRIMARY, color: PRIMARY }}
                onClick={() => {
                  setNotifSelected([])
                  setNotifMessage('')
                  setNotifPush(false)
                  setNotifSearch('')
                  setNotifStep('form')
                }}
              >
                Send Another Notification
              </Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY }}
                onClick={closeNotifModal}
              >
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Delete Groups Modal */}
      <Modal
        opened={deleteModal}
        onClose={closeDeleteModal}
        centered
        radius="md"
        size="md"
        withCloseButton={deleteStep === 'confirm'}
        closeOnClickOutside={deleteStep === 'confirm'}
        title={deleteStep === 'confirm' ? (
          <Text fw={700} fz="lg">Delete Groups</Text>
        ) : undefined}
      >
        {deleteStep === 'confirm' && (
          <Stack gap="md">
            <Stack align="center" gap="sm" py="md">
              <ThemeIcon size={56} radius="xl" style={{ background: '#fef2f2' }}>
                <IconTrash size={28} stroke={1.5} color="#e74c3c" />
              </ThemeIcon>
              <Text fz="sm" c="dimmed" ta="center">
                Are you sure you want to delete the selected groups? This action cannot be undone.
              </Text>
            </Stack>

            {deleteSkipped.length > 0 && (
              <Paper p="sm" radius="md" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
                <Group gap="xs" align="flex-start" wrap="nowrap">
                  <IconAlertTriangle size={18} color="#e67e22" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Text fz="xs" c="#e67e22">
                    {deleteSkipped.length} active group{deleteSkipped.length !== 1 ? 's' : ''} cannot be deleted:{' '}
                    <Text span fw={600} fz="xs">{deleteSkipped.map((g) => g.name).join(', ')}</Text>
                  </Text>
                </Group>
              </Paper>
            )}

            {deleteTargets.length > 0 && (
              <Paper p="md" radius="md" style={{ border: '1px solid #e9ecef' }}>
                <Text fz="xs" fw={600} c="dimmed" mb="xs">
                  The following {deleteTargets.length} group{deleteTargets.length !== 1 ? 's' : ''} will be deleted:
                </Text>
                <Stack gap={4}>
                  {deleteTargets.map((g) => (
                    <Group key={g.id} gap="xs" align="center">
                      <Text fz="sm" fw={500}>{g.name}</Text>
                      <Badge
                        size="xs"
                        radius="sm"
                        style={{
                          background: getStatusBg(g.status),
                          color: getStatusColor(g.status),
                          border: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {g.status}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}

            <Group justify="flex-end" gap="sm" mt="xs">
              <Button
                variant="outline"
                radius="md"
                size="sm"
                onClick={closeDeleteModal}
                style={{ borderColor: '#dee2e6', color: '#495057' }}
              >
                Cancel
              </Button>
              <Button
                radius="md"
                size="sm"
                color="red"
                disabled={deleteTargets.length === 0}
                onClick={handleConfirmDelete}
              >
                Delete ({deleteTargets.length})
              </Button>
            </Group>
          </Stack>
        )}

        {deleteStep === 'success' && (
          <Stack align="center" gap="md" py={40}>
            <ThemeIcon size={64} radius="xl" style={{ background: '#e6f5f1' }}>
              <IconCheck size={32} stroke={2} color={PRIMARY} />
            </ThemeIcon>
            <Text fw={700} fz="lg">Groups Deleted Successfully</Text>
            <Text fz="sm" c="dimmed" ta="center">
              {deleteTargets.length} group{deleteTargets.length !== 1 ? 's have' : ' has'} been permanently deleted.
            </Text>

            <Paper p="md" radius="md" style={{ border: '1px solid #e9ecef', width: '100%' }}>
              <Stack gap={4}>
                {deleteTargets.map((g) => (
                  <Text key={g.id} fz="sm" fw={500}>{g.name}</Text>
                ))}
              </Stack>
            </Paper>

            <Button
              radius="md"
              size="sm"
              style={{ background: PRIMARY }}
              onClick={closeDeleteModal}
            >
              Close
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
