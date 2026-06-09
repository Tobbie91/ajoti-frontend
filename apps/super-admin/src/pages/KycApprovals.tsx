import { useEffect, useRef, useState } from 'react'
import {
  Title,
  Text,
  Stack,
  Group,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  Pagination,
  Card,
  Drawer,
  Skeleton,
  Alert,
  Divider,
  Modal,
  Textarea,
  Button,
  Tabs,
  SimpleGrid,
  ThemeIcon,
  ScrollArea,
  Code,
  SegmentedControl,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconSearch,
  IconEye,
  IconAlertCircle,
  IconUser,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconRefresh,
} from '@tabler/icons-react'
import { listKycQueue, approveKyc, rejectKyc, overrideKycLevel, getMonoIdentity, type KycQueueRow } from '@/utils/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TAB = ['PENDING', 'APPROVED', 'REJECTED'] as const
type KycStatusTab = typeof STATUS_TAB[number]

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Mono Verification Card ────────────────────────────────────────────────────

function MonoVerificationCard({ data }: { data: Record<string, unknown> }) {
  const inner = (data?.data ?? data) as Record<string, unknown>
  const customer = inner?.customer as Record<string, string> | undefined
  const event = (data?.event ?? inner?.event) as string | undefined
  const status = inner?.status as string | undefined
  const kycLevel = inner?.kyc_level as string | undefined
  const reference = inner?.reference as string | undefined
  const createdAt = inner?.created_at as string | undefined
  const liveMode = inner?.live_mode as boolean | undefined

  if (!status && !kycLevel && !customer) {
    return (
      <ScrollArea h={220} type="auto">
        <Code block fz="xs" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(data, null, 2)}
        </Code>
      </ScrollArea>
    )
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" wrap="nowrap">
        {status && (
          <Badge color={status === 'successful' ? 'green' : 'red'} variant="filled" size="sm">
            {status}
          </Badge>
        )}
        {kycLevel && (
          <Badge color="blue" variant="light" size="sm">
            {kycLevel.replace('_', ' ').toUpperCase()}
          </Badge>
        )}
        {liveMode === false && (
          <Badge color="gray" variant="outline" size="sm">Sandbox</Badge>
        )}
        {liveMode === true && (
          <Badge color="teal" variant="outline" size="sm">Live</Badge>
        )}
      </Group>
      {event && <Text fz="xs" c="dimmed">{event}</Text>}
      <SimpleGrid cols={2} spacing="xs">
        {customer?.name && <InfoRow label="Verified Name" value={customer.name} />}
        {customer?.email && <InfoRow label="Verified Email" value={customer.email} />}
        {customer?.phone && <InfoRow label="Verified Phone" value={customer.phone} />}
        {reference && <InfoRow label="Reference" value={reference} />}
        {createdAt && <InfoRow label="Verified At" value={fmt(createdAt)} />}
      </SimpleGrid>
    </Stack>
  )
}

// ── KYC Detail Drawer ────────────────────────────────────────────────────────

function KycDetailDrawer({
  record,
  opened,
  onClose,
  onAction,
}: {
  record: KycQueueRow | null
  opened: boolean
  onClose: () => void
  onAction: () => void
}) {
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [rejectModal, { open: openReject, close: closeReject }] = useDisclosure(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [overrideLevel, setOverrideLevel] = useState<string>('')
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [monoFetchLoading, setMonoFetchLoading] = useState(false)
  const [monoFetchError, setMonoFetchError] = useState<string | null>(null)
  const [monoLiveData, setMonoLiveData] = useState<Record<string, unknown> | null>(null)

  async function handleOverride() {
    if (!record || overrideLevel === '') return
    setOverrideLoading(true)
    setActionError(null)
    try {
      await overrideKycLevel(record.userId, Number(overrideLevel))
      onAction()
      onClose()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Override failed')
    } finally {
      setOverrideLoading(false)
    }
  }

  async function handleMonoRefetch() {
    if (!record) return
    setMonoFetchLoading(true)
    setMonoFetchError(null)
    try {
      const data = await getMonoIdentity(record.userId)
      setMonoLiveData(data)
    } catch (err) {
      setMonoFetchError(err instanceof Error ? err.message : 'Failed to fetch from Mono')
    } finally {
      setMonoFetchLoading(false)
    }
  }

  async function handleApprove() {
    if (!record) return
    setActionLoading(true)
    setActionError(null)
    try {
      await approveKyc(record.userId)
      onAction()
      onClose()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!record || !rejectionReason.trim()) return
    setActionLoading(true)
    setActionError(null)
    try {
      await rejectKyc(record.userId, rejectionReason.trim())
      closeReject()
      setRejectionReason('')
      onAction()
      onClose()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Reject failed')
    } finally {
      setActionLoading(false)
    }
  }

  const u = record?.user

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        title={<Text fw={600}>KYC Review</Text>}
        position="right"
        size="lg"
        padding="lg"
      >
        {!record ? null : (
          <Stack gap="md">
            {actionError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" onClose={() => setActionError(null)} withCloseButton>
                {actionError}
              </Alert>
            )}

            {/* Applicant */}
            <Group gap="xs">
              <ThemeIcon size={48} radius="xl" variant="light" color="primary">
                <IconUser size={24} stroke={1.5} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={600} fz="lg">{u?.firstName} {u?.lastName}</Text>
                <Text fz="sm" c="dimmed">{u?.email}</Text>
              </Stack>
              <Group ml="auto" gap="xs">
                <Badge color="blue" variant="light">
                  Level {record.kycLevel}
                </Badge>
                <Badge color={STATUS_COLOR[record.status] ?? 'gray'} variant="light">
                  {record.status}
                </Badge>
              </Group>
            </Group>

            <SimpleGrid cols={2} spacing="xs">
              <InfoRow label="Phone" value={u?.phone ?? '—'} />
              <InfoRow label="Gender" value={u?.gender ?? '—'} />
              <InfoRow label="Date of Birth" value={u?.dob ? fmt(u.dob) : '—'} />
              <InfoRow label="Submitted" value={fmt(record.submittedAt)} />
              <InfoRow label="KYC Level" value={`Level ${record.kycLevel}`} />
              <InfoRow label="Step" value={record.step ?? '—'} />
              <InfoRow label="Mono Status" value={record.monoProveStatus ?? '—'} />
              <InfoRow label="Reviewed" value={record.reviewedAt ? fmt(record.reviewedAt) : '—'} />
            </SimpleGrid>

            {/* Next of kin */}
            {record.nextOfKinName && (
              <>
                <Divider label="Next of Kin" labelPosition="left" />
                <SimpleGrid cols={2} spacing="xs">
                  <InfoRow label="Name" value={record.nextOfKinName} />
                  <InfoRow label="Relationship" value={record.nextOfKinRelationship ?? '—'} />
                  <InfoRow label="Phone" value={record.nextOfKinPhone ?? '—'} />
                </SimpleGrid>
              </>
            )}

            {/* Address */}
            {record.address && (
              <>
                <Divider label="Address" labelPosition="left" />
                <Text fz="sm">
                  {[record.address, record.city, record.lga, record.state, record.country]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </>
            )}

            {/* Mono Verification Data */}
            <Divider
              label={
                <Group gap={4}>
                  <IconShieldCheck size={14} />
                  <Text fz="xs">Mono Prove Verification</Text>
                </Group>
              }
              labelPosition="left"
            />
            <Group justify="space-between" align="center" mb={4}>
              <Text fz="xs" c="dimmed">Stored snapshot</Text>
              <Button
                size="xs"
                variant="subtle"
                color="blue"
                leftSection={<IconRefresh size={12} />}
                loading={monoFetchLoading}
                onClick={handleMonoRefetch}
              >
                Re-fetch from Mono
              </Button>
            </Group>
            {monoFetchError && (
              <Alert color="red" radius="md" variant="light" mb={4}>
                <Text fz="xs">{monoFetchError}</Text>
              </Alert>
            )}
            {monoLiveData ? (
              <MonoVerificationCard data={monoLiveData} />
            ) : record.verificationData ? (
              <MonoVerificationCard data={record.verificationData as Record<string, unknown>} />
            ) : (
              <Text fz="sm" c="dimmed">No Mono verification data yet.</Text>
            )}

            {record.rejectionReason && (
              <Alert color="red" radius="md" variant="light">
                <Text fz="xs" fw={500}>Previous rejection reason:</Text>
                <Text fz="sm">{record.rejectionReason}</Text>
              </Alert>
            )}

            {/* Actions */}
            {record.status === 'PENDING' && (
              <>
                <Divider />
                <Group>
                  <Button
                    flex={1}
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    loading={actionLoading}
                    onClick={handleApprove}
                  >
                    Approve
                  </Button>
                  <Button
                    flex={1}
                    color="red"
                    variant="light"
                    leftSection={<IconX size={16} />}
                    onClick={openReject}
                  >
                    Reject
                  </Button>
                </Group>
              </>
            )}

            {/* Manual override */}
            <Divider label="Manual Override" labelPosition="left" />
            <Stack gap="xs">
              <Text fz="xs" c="dimmed">Force-set KYC level regardless of current state.</Text>
              <Group gap="sm" align="flex-end">
                <SegmentedControl
                  value={overrideLevel}
                  onChange={setOverrideLevel}
                  data={[
                    { label: 'Level 0', value: '0' },
                    { label: 'Level 1', value: '1' },
                    { label: 'Level 2', value: '2' },
                    { label: 'Level 3', value: '3' },
                  ]}
                  disabled={overrideLoading}
                  size="xs"
                />
                <Button
                  size="xs"
                  color="orange"
                  loading={overrideLoading}
                  disabled={overrideLevel === '' || overrideLevel === String(record.kycLevel)}
                  onClick={handleOverride}
                >
                  Set Level
                </Button>
              </Group>
            </Stack>
          </Stack>
        )}
      </Drawer>

      <Modal opened={rejectModal} onClose={closeReject} title="Reject KYC" size="sm">
        <Stack gap="md">
          <Text fz="sm" c="dimmed">
            Provide a reason. The user will see this and can resubmit their documents.
          </Text>
          <Textarea
            placeholder="e.g. Selfie does not match government ID..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.currentTarget.value)}
            rows={4}
            autosize
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeReject}>Cancel</Button>
            <Button
              color="red"
              loading={actionLoading}
              disabled={!rejectionReason.trim()}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text fz="xs" c="dimmed">{label}</Text>
      <Text fz="sm" fw={500}>{value || '—'}</Text>
    </Stack>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export function KycApprovals() {
  const [activeTab, setActiveTab] = useState<KycStatusTab>('PENDING')
  const [records, setRecords] = useState<KycQueueRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selected, setSelected] = useState<KycQueueRow | null>(null)
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400)
  }, [search])

  function fetchRecords() {
    setLoading(true)
    setError(null)
    listKycQueue({ page, limit: PAGE_SIZE, status: activeTab })
      .then((res) => {
        // Client-side search filter (search not supported server-side on KYC endpoint)
        const filtered = debouncedSearch
          ? res.data.filter((r) => {
              const q = debouncedSearch.toLowerCase()
              return (
                r.user.firstName.toLowerCase().includes(q) ||
                r.user.lastName.toLowerCase().includes(q) ||
                r.user.email.toLowerCase().includes(q)
              )
            })
          : res.data
        setRecords(filtered)
        setTotal(debouncedSearch ? filtered.length : res.meta.total)
        setTotalPages(debouncedSearch ? 1 : res.meta.totalPages)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load KYC queue'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRecords()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeTab, debouncedSearch])

  function handleTabChange(tab: string | null) {
    if (!tab) return
    setActiveTab(tab as KycStatusTab)
    setPage(1)
    setSearch('')
  }

  function openDetail(record: KycQueueRow) {
    setSelected(record)
    openDrawer()
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>KYC Approvals</Title>
        <Text fz="sm" c="dimmed">{total} record{total !== 1 ? 's' : ''}</Text>
      </Group>

      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List>
          {STATUS_TAB.map((s) => (
            <Tabs.Tab
              key={s}
              value={s}
              color={STATUS_COLOR[s]}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <TextInput
        placeholder="Filter by name or email..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => { setSearch(e.currentTarget.value); setPage(1) }}
        w={280}
        size="sm"
      />

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">{error}</Alert>
      )}

      <Card withBorder p={0} radius="md">
        <Table.ScrollContainer minWidth={900}>
        <Table verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr style={{ backgroundColor: '#0B6B55' }}>
              <Table.Th style={{ color: 'white' }}>Name</Table.Th>
              <Table.Th style={{ color: 'white' }}>Email</Table.Th>
              <Table.Th style={{ color: 'white' }}>Phone</Table.Th>
              <Table.Th style={{ color: 'white' }}>Submitted</Table.Th>
              <Table.Th style={{ color: 'white' }}>Level</Table.Th>
              <Table.Th style={{ color: 'white' }}>Step</Table.Th>
              <Table.Th style={{ color: 'white' }}>Status</Table.Th>
              <Table.Th style={{ color: 'white' }} w={60} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <Table.Td key={j}><Skeleton h={20} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : records.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="xl" c="dimmed">
                    {search ? 'No records match your search' : `No ${activeTab.toLowerCase()} KYC submissions`}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              records.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Text fz="sm" fw={500}>{r.user.firstName} {r.user.lastName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="dimmed">{r.user.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">{r.user.phone ?? '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">{fmt(r.submittedAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" variant="light" color="blue">
                      Level {r.kycLevel}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="xs" c="dimmed">{r.step}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLOR[r.status] ?? 'gray'} variant="filled" size="sm" radius="sm">
                      {r.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" color="primary" onClick={() => openDetail(r)}>
                      <IconEye size={18} stroke={1.5} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>
      </Card>

      <Group justify="space-between">
        <Text fz="sm" c="dimmed">
          {total > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
            : 'No records'}
        </Text>
        {totalPages > 1 && (
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" color="primary" />
        )}
      </Group>

      <KycDetailDrawer
        record={selected}
        opened={drawerOpened}
        onClose={closeDrawer}
        onAction={fetchRecords}
      />
    </Stack>
  )
}
