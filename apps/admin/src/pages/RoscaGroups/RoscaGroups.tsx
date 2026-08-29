import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconArchive, IconChevronDown, IconMailPlus, IconSearch } from '@tabler/icons-react'
import { InviteMemberModal } from '@/components/InviteMemberModal'
import { listAllRoscaCircles, type RoscaCircle } from '@/utils/api'
import {
  canInviteToCircle,
  getGroupDisplayStatus,
  groupStatusDescription,
  type GroupDisplayStatus,
} from '@/utils/group-display'

const PRIMARY = '#0b6b55'
const PAGE_SIZE = 10

interface RoscaGroup {
  id: string
  name: string
  members: string
  nextPayout: string
  roundProgress: string
  status: GroupDisplayStatus
  canInvite: boolean
}

function mapCircleToGroup(circle: RoscaCircle): RoscaGroup {
  const filled = circle.filledSlots ?? 0
  const total = circle.maxSlots ?? circle.totalSlots ?? 0
  const status = getGroupDisplayStatus(circle)

  return {
    id: circle.id,
    name: circle.name || 'Unnamed',
    members: `${filled}/${total}`,
    nextPayout:
      status === 'Completed'
        ? 'Completed'
        : status === 'Active'
          ? '-'
          : 'Not scheduled',
    roundProgress:
      status === 'Active'
        ? `${circle.currentCycle ?? 1} of ${circle.durationCycles ?? total}`
        : status,
    status,
    canInvite: canInviteToCircle(circle),
  }
}

const statusOptions = [
  { value: 'All', label: 'All' },
  { value: 'Not Ready', label: 'Not Ready' },
  { value: 'Ready', label: 'Ready' },
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
]

const statusColor: Record<GroupDisplayStatus, string> = {
  'Not Ready': '#b45309',
  Ready: '#15803d',
  Active: PRIMARY,
  Completed: '#2980b9',
}

const statusBackground: Record<GroupDisplayStatus, string> = {
  'Not Ready': '#fff7ed',
  Ready: '#dcfce7',
  Active: '#e6f5f1',
  Completed: '#e8f4fd',
}

export function RoscaGroups() {
  const navigate = useNavigate()
  const [allGroups, setAllGroups] = useState<RoscaGroup[]>([])
  const [archivedCount, setArchivedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [inviteTarget, setInviteTarget] = useState<RoscaGroup | null>(null)

  useEffect(() => {
    listAllRoscaCircles()
      .then((res) => {
        const circles = Array.isArray(res)
          ? res
          : ((res as Record<string, unknown>)?.data ??
              (res as Record<string, unknown>)?.circles ?? []) as RoscaCircle[]
        const activeCircles = circles.filter(
          (circle) => (circle.status ?? '').toUpperCase() !== 'CANCELLED',
        )
        setArchivedCount(circles.length - activeCircles.length)
        setAllGroups(activeCircles.map(mapCircleToGroup))
      })
      .catch((err) => console.error('Failed to load ROSCA circles:', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = allGroups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || group.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allOnPageSelected =
    paginated.length > 0 && paginated.every((group) => selected.includes(group.id))

  function toggleAll() {
    if (allOnPageSelected) {
      setSelected((previous) =>
        previous.filter((id) => !paginated.some((group) => group.id === id)),
      )
      return
    }
    setSelected((previous) => [...new Set([...previous, ...paginated.map((group) => group.id)])])
  }

  function toggleOne(id: string) {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
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
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Text fz={22} fw={700} mb={2}>All Groups</Text>
            <Text fz="sm" c="dimmed">
              {allGroups.filter((group) => group.status === 'Active').length} active groups ·{' '}
              {allGroups.filter((group) => group.status === 'Ready').length} ready to start
            </Text>
          </Box>
          <Button
            variant="light"
            color="gray"
            leftSection={<IconArchive size={16} />}
            onClick={() => navigate('/rosca/groups/archive')}
          >
            Archive{archivedCount > 0 ? ` (${archivedCount})` : ''}
          </Button>
        </Group>

        <Group gap="sm" align="end" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Search groups..."
            leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
            radius="md"
            size="sm"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value)
              setPage(1)
            }}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select
            label="Status"
            data={statusOptions}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value || 'All')
              setPage(1)
            }}
            rightSection={<IconChevronDown size={14} />}
            allowDeselect={false}
            style={{ minWidth: 160 }}
          />
        </Group>

        <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
          <div style={{ overflowX: 'auto' }}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 820 }}>
              <Table.Thead>
                <Table.Tr style={{ background: PRIMARY }}>
                  <Table.Th style={{ color: 'white' }}>
                    <Checkbox
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                      size="xs"
                    />
                  </Table.Th>
                  <Table.Th style={{ color: 'white' }}>Group Name</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Members</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Next Payout</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Round Progress</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Status</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginated.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="xl" fz="sm">No groups match your filters.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : paginated.map((group) => (
                  <Table.Tr key={group.id}>
                    <Table.Td>
                      <Checkbox
                        checked={selected.includes(group.id)}
                        onChange={() => toggleOne(group.id)}
                        size="xs"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600} fz="sm">{group.name}</Text>
                    </Table.Td>
                    <Table.Td><Text fz="sm">{group.members}</Text></Table.Td>
                    <Table.Td><Text fz="sm">{group.nextPayout}</Text></Table.Td>
                    <Table.Td><Text fz="sm">{group.roundProgress}</Text></Table.Td>
                    <Table.Td>
                      <Tooltip label={groupStatusDescription(group.status)} withArrow>
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            background: statusBackground[group.status],
                            color: statusColor[group.status],
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'help',
                          }}
                        >
                          {group.status}
                        </Badge>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Button
                          variant="subtle"
                          size="xs"
                          style={{ color: PRIMARY }}
                          onClick={() => navigate(`/rosca/groups/${group.id}`)}
                        >
                          Manage
                        </Button>
                        {group.canInvite && (
                          <Button
                            variant="light"
                            size="xs"
                            color="teal"
                            leftSection={<IconMailPlus size={13} />}
                            onClick={() => setInviteTarget(group)}
                          >
                            Invite Member
                          </Button>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <Group justify="space-between" align="center" px="lg" py="md" style={{ borderTop: '1px solid #e9ecef' }}>
            <Text fz="xs" c="dimmed">
              Showing {filtered.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} groups
            </Text>
            <Pagination
              total={totalPages}
              value={Math.min(page, totalPages)}
              onChange={setPage}
              size="sm"
              radius="md"
              color={PRIMARY}
            />
          </Group>
        </Paper>
      </Stack>

      <InviteMemberModal
        opened={inviteTarget !== null}
        groupId={inviteTarget?.id ?? null}
        groupName={inviteTarget?.name}
        onClose={() => setInviteTarget(null)}
      />
    </>
  )
}
