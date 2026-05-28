import {
  ActionIcon,
  Badge,
  Button,
  Drawer,
  Group,
  Loader,
  Menu,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  Alert,
  Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconAlertCircle,
  IconCircleX,
  IconDots,
  IconEye,
  IconFlag,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cancelCircle,
  flagMember,
  getCircleDetail,
  getDefaulters,
  getAllRoscaCircles,
  listCircles,
  type CircleRow,
  type PaginatedResponse,
} from '@/utils/api'

// ── helpers ─────────────────────────────────────────────────────────────────

function formatNaira(kobo: string | number) {
  const n = typeof kobo === 'string' ? parseFloat(kobo) : kobo
  if (isNaN(n)) return '—'
  return `₦${(n / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

function statusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE': return 'green'
    case 'COMPLETED': return 'blue'
    case 'CANCELLED': return 'red'
    case 'PENDING': return 'yellow'
    default: return 'gray'
  }
}

// ── Circle detail drawer ─────────────────────────────────────────────────────

interface CircleDetailDrawerProps {
  circleId: string | null
  opened: boolean
  onClose: () => void
  onCancelled: () => void
}

function CircleDetailDrawer({ circleId, opened, onClose, onCancelled }: CircleDetailDrawerProps) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cancel circle modal
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Flag member modal
  const [flagMemberId, setFlagMemberId] = useState<string | null>(null)
  const [flagReason, setFlagReason] = useState('')
  const [flagging, setFlagging] = useState(false)
  const [flagError, setFlagError] = useState<string | null>(null)

  useEffect(() => {
    if (!circleId || !opened) return
    setLoading(true)
    setError(null)
    setDetail(null)
    getCircleDetail(circleId)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load circle'))
      .finally(() => setLoading(false))
  }, [circleId, opened])

  async function handleCancel() {
    if (!circleId || !cancelReason.trim()) return
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelCircle(circleId, cancelReason.trim())
      closeCancel()
      setCancelReason('')
      onCancelled()
      onClose()
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : 'Failed to cancel circle')
    } finally {
      setCancelling(false)
    }
  }

  async function handleFlagMember() {
    if (!flagMemberId || !flagReason.trim()) return
    setFlagging(true)
    setFlagError(null)
    try {
      await flagMember(flagMemberId, flagReason.trim())
      setFlagMemberId(null)
      setFlagReason('')
    } catch (e) {
      setFlagError(e instanceof Error ? e.message : 'Failed to flag member')
    } finally {
      setFlagging(false)
    }
  }

  const circle = detail as Record<string, unknown> | null
  const members = (circle?.members as unknown[] | undefined) ?? []
  const admin = circle?.admin as { firstName?: string; lastName?: string; email?: string } | undefined

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size="lg"
        title={
          <Text fw={700} size="lg">
            Circle Detail
          </Text>
        }
        padding="lg"
      >
        {loading && (
          <Stack gap="md">
            {[...Array(6)].map((_, i) => <Skeleton key={i} height={20} radius="sm" />)}
          </Stack>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
            {error}
          </Alert>
        )}

        {circle && !loading && (
          <Stack gap="lg">
            {/* Summary */}
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="lg">{String(circle.name ?? '—')}</Text>
                <Badge color={statusColor(String(circle.status ?? ''))} variant="light">
                  {String(circle.status ?? '—')}
                </Badge>
              </Group>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
                <InfoItem label="Admin" value={admin ? `${admin.firstName} ${admin.lastName}` : '—'} />
                <InfoItem label="Admin Email" value={admin?.email ?? '—'} />
                <InfoItem label="Contribution" value={formatNaira(String(circle.contributionAmount ?? 0))} />
                <InfoItem label="Frequency" value={String(circle.frequency ?? '—')} />
                <InfoItem label="Cycle" value={`${String(circle.currentCycle ?? 0)} / ${String(circle.durationCycles ?? 0)}`} />
                <InfoItem label="Members" value={String(circle.memberCount ?? 0)} />
              </div>
            </Paper>

            {/* Members */}
            {members.length > 0 && (
              <Paper withBorder radius="md" p="md">
                <Text fw={600} mb="sm">Members</Text>
                <Stack gap="xs">
                  {(members as Record<string, unknown>[]).map((m, i) => {
                    const user = m.user as Record<string, unknown> | undefined
                    const membershipId = String(m.id ?? '')
                    const isFlagged = m.isFlagged as boolean | undefined
                    return (
                      <Group key={i} justify="space-between" p="xs" style={{ borderRadius: 8, background: '#F9FAFB' }}>
                        <div>
                          <Text size="sm" fw={500}>
                            {user ? `${user.firstName} ${user.lastName}` : `Member ${i + 1}`}
                          </Text>
                          <Text size="xs" c="dimmed">{String(user?.email ?? '—')}</Text>
                        </div>
                        <Group gap="xs">
                          {isFlagged && <Badge color="orange" size="xs">Flagged</Badge>}
                          <Badge color={statusColor(String(m.status ?? ''))} size="xs" variant="light">
                            {String(m.status ?? '—')}
                          </Badge>
                          <ActionIcon
                            variant="light"
                            color="orange"
                            size="sm"
                            title="Flag member"
                            onClick={() => { setFlagMemberId(membershipId); setFlagReason(''); setFlagError(null) }}
                          >
                            <IconFlag size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    )
                  })}
                </Stack>
              </Paper>
            )}

            {/* Cancel button — only for active/pending circles */}
            {['ACTIVE', 'PENDING'].includes(String(circle.status ?? '').toUpperCase()) && (
              <Button
                color="red"
                variant="light"
                leftSection={<IconCircleX size={16} />}
                onClick={openCancel}
              >
                Cancel Circle
              </Button>
            )}
          </Stack>
        )}
      </Drawer>

      {/* Cancel modal */}
      <Modal opened={cancelOpened} onClose={closeCancel} title="Cancel Circle" centered size="md">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This action cannot be undone. Provide a reason for cancellation.
          </Text>
          {cancelError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {cancelError}
            </Alert>
          )}
          <Textarea
            label="Reason"
            placeholder="Explain why this circle is being cancelled..."
            minRows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.currentTarget.value)}
            autosize
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCancel}>Back</Button>
            <Button
              color="red"
              loading={cancelling}
              disabled={!cancelReason.trim()}
              onClick={handleCancel}
            >
              Confirm Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Flag member modal */}
      <Modal
        opened={!!flagMemberId}
        onClose={() => setFlagMemberId(null)}
        title="Flag Member"
        centered
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">Describe the issue with this member.</Text>
          {flagError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {flagError}
            </Alert>
          )}
          <Textarea
            label="Reason"
            placeholder="e.g. Missed contributions, suspicious activity..."
            minRows={3}
            value={flagReason}
            onChange={(e) => setFlagReason(e.currentTarget.value)}
            autosize
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setFlagMemberId(null)}>Cancel</Button>
            <Button
              color="orange"
              loading={flagging}
              disabled={!flagReason.trim()}
              onClick={handleFlagMember}
            >
              Flag Member
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed" fw={500}>{label}</Text>
      <Text size="sm" fw={500}>{value}</Text>
    </div>
  )
}

// ── Circles tab ──────────────────────────────────────────────────────────────

function CirclesTab() {
  const [data, setData] = useState<PaginatedResponse<CircleRow> | null>(null)
  const [allCircles, setAllCircles] = useState<CircleRow[] | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 20

  const fetchCircles = useCallback(() => {
    setLoading(true)
    setError(null)
    if (showAll) {
      getAllRoscaCircles({ ...(status ? { status } : {}) })
        .then((res) => setAllCircles(res.data))
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load circles'))
        .finally(() => setLoading(false))
    } else {
      listCircles({
        page,
        limit: LIMIT,
        ...(status ? { status } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      })
        .then(setData)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load circles'))
        .finally(() => setLoading(false))
    }
  }, [page, status, search, showAll])

  useEffect(() => { fetchCircles() }, [fetchCircles])

  function handleSearchChange(val: string) {
    setSearch(val)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchCircles, 400)
  }

  function openCircleDetail(id: string) {
    setDetailId(id)
    openDetail()
  }

  const rows = showAll ? (allCircles ?? []) : (data?.data ?? [])
  const totalPages = showAll ? 1 : (data?.meta.totalPages ?? 1)

  return (
    <>
      {/* Filters */}
      <Group mb="md" gap="sm">
        {!showAll && (
          <TextInput
            placeholder="Search by name..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 320 }}
            radius="md"
          />
        )}
        <Select
          placeholder="Status"
          data={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1) }}
          clearable
          radius="md"
          style={{ width: 160 }}
        />
        <ActionIcon variant="default" size="lg" radius="md" onClick={fetchCircles} title="Refresh">
          <IconRefresh size={16} />
        </ActionIcon>
        <Switch
          label="Include private"
          size="sm"
          checked={showAll}
          onChange={(e) => { setShowAll(e.currentTarget.checked); setPage(1) }}
        />
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" mb="md">
          {error}
        </Alert>
      )}

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={900}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr bg="#066F5B">
              <Table.Th c="white">Name</Table.Th>
              <Table.Th c="white">Admin</Table.Th>
              <Table.Th c="white">Contribution</Table.Th>
              <Table.Th c="white">Frequency</Table.Th>
              <Table.Th c="white">Cycle</Table.Th>
              <Table.Th c="white">Members</Table.Th>
              <Table.Th c="white">Status</Table.Th>
              <Table.Th c="white" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <Table.Tr key={i}>
                  {[...Array(8)].map((__, j) => (
                    <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="xl" c="dimmed">No circles found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td fw={500}>{c.name}</Table.Td>
                  <Table.Td>
                    {c.admin ? (
                      <div>
                        <Text size="sm">{c.admin.firstName} {c.admin.lastName}</Text>
                        <Text size="xs" c="dimmed">{c.admin.email}</Text>
                      </div>
                    ) : '—'}
                  </Table.Td>
                  <Table.Td>{formatNaira(c.contributionAmount)}</Table.Td>
                  <Table.Td style={{ textTransform: 'capitalize' }}>{c.frequency?.toLowerCase() ?? '—'}</Table.Td>
                  <Table.Td>{c.currentCycle} / {c.durationCycles}</Table.Td>
                  <Table.Td>{c.memberCount}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(c.status)} variant="light" size="sm">
                      {c.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={180} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEye size={14} />}
                          onClick={() => openCircleDetail(c.id)}
                        >
                          View Detail
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            {showAll
              ? `${rows.length} circle${rows.length !== 1 ? 's' : ''} (all, including private)`
              : data ? `${data.meta.total} circle${data.meta.total !== 1 ? 's' : ''}` : ''}
          </Text>
          {!showAll && <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />}
        </Group>
      </Paper>

      <CircleDetailDrawer
        circleId={detailId}
        opened={detailOpened}
        onClose={closeDetail}
        onCancelled={fetchCircles}
      />
    </>
  )
}

// ── Defaulters tab ───────────────────────────────────────────────────────────

function DefaultersTab() {
  const [data, setData] = useState<PaginatedResponse<unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    getDefaulters(page, 20)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load defaulters'))
      .finally(() => setLoading(false))
  }, [page])

  const rows = (data?.data ?? []) as Record<string, unknown>[]
  const totalPages = data?.meta.totalPages ?? 1

  return (
    <>
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" mb="md">
          {error}
        </Alert>
      )}

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={700}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr bg="#066F5B">
              <Table.Th c="white">User</Table.Th>
              <Table.Th c="white">Email</Table.Th>
              <Table.Th c="white">Circle</Table.Th>
              <Table.Th c="white">Amount Owed</Table.Th>
              <Table.Th c="white">Missed Cycles</Table.Th>
              <Table.Th c="white">Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <Table.Tr key={i}>
                  {[...Array(6)].map((__, j) => (
                    <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" py="xl" c="dimmed">No defaulters found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((d, i) => {
                const user = d.user as Record<string, unknown> | undefined
                const circle = d.circle as Record<string, unknown> | undefined
                return (
                  <Table.Tr key={i}>
                    <Table.Td fw={500}>
                      {user ? `${user.firstName} ${user.lastName}` : String(d.userId ?? '—')}
                    </Table.Td>
                    <Table.Td c="dimmed">{String(user?.email ?? '—')}</Table.Td>
                    <Table.Td>{String(circle?.name ?? d.circleId ?? '—')}</Table.Td>
                    <Table.Td>{formatNaira(String(d.amountOwedKobo ?? d.amount ?? 0))}</Table.Td>
                    <Table.Td>{String(d.missedCycles ?? d.missedPayments ?? '—')}</Table.Td>
                    <Table.Td>
                      <Badge color="red" variant="light" size="sm">
                        {String(d.status ?? 'DEFAULTED')}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                )
              })
            )}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            {data ? `${data.meta.total} defaulter${data.meta.total !== 1 ? 's' : ''}` : ''}
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      </Paper>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function ManageRosca() {
  const [tab, setTab] = useState<string | null>('circles')

  return (
    <Stack gap="lg" p="xl">
      <div>
        <Title order={2} fw={700}>Circle Governance</Title>
        <Text c="dimmed" size="sm" mt={4}>
          Monitor and manage all ROSCA circles, members, and defaulters.
        </Text>
      </div>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List mb="lg">
          <Tabs.Tab value="circles">Circles</Tabs.Tab>
          <Tabs.Tab value="defaulters">Defaulters</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="circles">
          <CirclesTab />
        </Tabs.Panel>

        <Tabs.Panel value="defaulters">
          <DefaultersTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
