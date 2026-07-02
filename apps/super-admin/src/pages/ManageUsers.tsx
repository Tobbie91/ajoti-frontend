import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Title,
  Text,
  Stack,
  Group,
  TextInput,
  Select,
  Table,
  Badge,
  Menu,
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
  ThemeIcon,
  SimpleGrid,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconSearch,
  IconDots,
  IconAlertCircle,
  IconUser,
  IconWallet,
  IconTopologyRing,
  IconShieldCheck,
} from '@tabler/icons-react'
import {
  listUsers,
  getUserDetail,
  updateUserStatus,
  unfreezeAccount,
  promoteToSuperadmin,
  approveAdminRequest,
  rejectAdminRequest,
  clearUserVirtualAccount,
  releaseUserReservedFunds,
  type SuperadminUserRow,
  type SuperadminUserDetail,
} from '@/utils/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'green',
  SUSPENDED: 'yellow',
  BANNED: 'red',
  FROZEN: 'orange',
}

const KYC_COLOR: Record<string, string> = {
  APPROVED: 'green',
  PENDING: 'yellow',
  REJECTED: 'red',
  NOT_SUBMITTED: 'gray',
}

function formatNaira(naira: string) {
  const n = parseFloat(naira)
  if (isNaN(n)) return '₦0.00'
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

// ── User Detail Body (extracted to reset TS instantiation depth) ─────────────

function UserDetailBody({
  detail,
  actionLoading,
  currentStatus,
  currentRole,
  onReactivate,
  onUnfreeze,
  onOpenSuspend,
  onOpenBan,
  onOpenPromote,
  onOpenApproveAdmin,
  onOpenRejectAdmin,
  onOpenClearVa,
  onOpenReleaseReserved,
}: {
  detail: SuperadminUserDetail
  actionLoading: boolean
  currentStatus: string
  currentRole: string
  onReactivate: () => void
  onUnfreeze: () => void
  onOpenSuspend: () => void
  onOpenBan: () => void
  onOpenPromote: () => void
  onOpenApproveAdmin: () => void
  onOpenRejectAdmin: () => void
  onOpenClearVa: () => void
  onOpenReleaseReserved: () => void
}) {
  const user = detail.user as Record<string, unknown>
  const wallet = detail.wallet
  const roscaCount = detail.roscaParticipation.length
  const debtCount = detail.outstandingDebts.length
  const kyc = user.kyc as { status: string } | null

  return (
    <Stack gap="md">
      {/* Identity */}
      <Group gap="xs">
        <ThemeIcon size={48} radius="xl" variant="light" color="primary">
          <IconUser size={24} stroke={1.5} />
        </ThemeIcon>
        <Stack gap={2}>
          <Text fw={600} fz="lg">
            {user.firstName as string} {user.lastName as string}
          </Text>
          <Text fz="sm" c="dimmed">{user.email as string}</Text>
        </Stack>
      </Group>

      <SimpleGrid cols={2} spacing="xs">
        <InfoItem label="Phone" value={(user.phone as string) ?? '—'} />
        <InfoItem label="Role" value={currentRole} />
        <InfoItem
          label="Status"
          value={
            <Badge color={STATUS_COLOR[currentStatus] ?? 'gray'} variant="light" size="sm">
              {currentStatus}
            </Badge>
          }
        />
        <InfoItem
          label="KYC"
          value={
            <Badge color={KYC_COLOR[kyc?.status ?? 'NOT_SUBMITTED'] ?? 'gray'} variant="light" size="sm">
              {kyc?.status ?? 'NOT_SUBMITTED'}
            </Badge>
          }
        />
        <InfoItem label="Joined" value={user.createdAt ? new Date(user.createdAt as string).toLocaleDateString('en-NG') : '—'} />
        <InfoItem label="Verified" value={(user.isVerified as boolean) ? 'Yes' : 'No'} />
      </SimpleGrid>

      <Divider />

      {/* Wallet */}
      <Group gap="xs">
        <ThemeIcon size={36} radius="md" variant="light" color="blue">
          <IconWallet size={18} stroke={1.5} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text fz="xs" c="dimmed">Wallet Balance</Text>
          <Text fw={600}>{wallet ? formatNaira(wallet.balanceNaira) : 'No wallet'}</Text>
        </Stack>
        {wallet && (
          <Badge ml="auto" size="xs" color={wallet.status === 'ACTIVE' ? 'green' : 'gray'} variant="light">
            {wallet.status}
          </Badge>
        )}
      </Group>

      {/* Stats */}
      <SimpleGrid cols={2} spacing="xs">
        <Card withBorder p="sm" radius="md">
          <Group gap="xs">
            <ThemeIcon size={28} radius="md" variant="light" color="grape">
              <IconTopologyRing size={14} stroke={1.5} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fz="xs" c="dimmed">ROSCA Groups</Text>
              <Text fw={600} fz="sm">{roscaCount}</Text>
            </Stack>
          </Group>
        </Card>
        <Card withBorder p="sm" radius="md">
          <Group gap="xs">
            <ThemeIcon size={28} radius="md" variant="light" color={debtCount > 0 ? 'red' : 'green'}>
              <IconShieldCheck size={14} stroke={1.5} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fz="xs" c="dimmed">Outstanding Debts</Text>
              <Text fw={600} fz="sm" c={debtCount > 0 ? 'red' : undefined}>{debtCount}</Text>
            </Stack>
          </Group>
        </Card>
      </SimpleGrid>

      {(user.suspensionReason as string | null) && (
        <Alert color="orange" radius="md" variant="light">
          <Text fz="xs" fw={500}>Suspension reason:</Text>
          <Text fz="sm">{user.suspensionReason as string}</Text>
        </Alert>
      )}

      <Divider />

      {/* Pending admin request */}
      {(user.adminRequestedAt as string | null) && (
        <Alert color="orange" radius="md" variant="light" title="Pending Admin Request">
          <Text fz="xs">Requested on {new Date(user.adminRequestedAt as string).toLocaleDateString('en-NG')}</Text>
          <Group mt="xs" gap="xs">
            <Button size="xs" color="green" variant="filled" onClick={onOpenApproveAdmin} loading={actionLoading}>
              Approve
            </Button>
            <Button size="xs" color="red" variant="light" onClick={onOpenRejectAdmin} loading={actionLoading}>
              Reject
            </Button>
          </Group>
        </Alert>
      )}

      {/* Actions */}
      <Stack gap="xs">
        {currentStatus === 'FROZEN' && (
          <Alert color="orange" radius="md" variant="light" title="Self-Frozen Account">
            <Text fz="xs">
              This user froze their own account. Unfreezing requires verifying their identity through
              the standard process outside this app first — this button is the final step, not a
              verification step itself. Check the linked support ticket (category Account, ref type
              ACCOUNT_FREEZE) for context before proceeding.
            </Text>
            <Button
              fullWidth
              mt="xs"
              variant="filled"
              color="orange"
              onClick={onUnfreeze}
              loading={actionLoading}
            >
              Unfreeze Account (after identity verification)
            </Button>
          </Alert>
        )}
        {currentStatus !== 'ACTIVE' && currentStatus !== 'FROZEN' && (
          <Button fullWidth variant="light" color="green" onClick={onReactivate} loading={actionLoading}>
            Reactivate Account
          </Button>
        )}
        {currentStatus === 'ACTIVE' && (
          <Button fullWidth variant="light" color="yellow" onClick={onOpenSuspend}>
            Suspend Account
          </Button>
        )}
        {currentStatus !== 'BANNED' && (
          <Button fullWidth variant="light" color="red" onClick={onOpenBan}>
            Ban Account
          </Button>
        )}
        {currentRole !== 'SUPERADMIN' && (
          <Button fullWidth variant="subtle" color="primary" onClick={onOpenPromote}>
            Promote to Superadmin
          </Button>
        )}
        <Divider />
        <Button fullWidth variant="subtle" color="orange" onClick={onOpenClearVa}>
          Reset Virtual Account
        </Button>
        <Button fullWidth variant="subtle" color="violet" onClick={onOpenReleaseReserved}>
          Release Reserved Funds
        </Button>
      </Stack>
    </Stack>
  )
}

// ── User Detail Drawer ────────────────────────────────────────────────────────

function UserDetailDrawer({
  userId,
  opened,
  onClose,
  onStatusChange,
}: {
  userId: string | null
  opened: boolean
  onClose: () => void
  onStatusChange: () => void
}) {
  const [detail, setDetail] = useState<SuperadminUserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [suspendModal, { open: openSuspend, close: closeSuspend }] = useDisclosure(false)
  const [banModal, { open: openBan, close: closeBan }] = useDisclosure(false)
  const [promoteModal, { open: openPromote, close: _closePromote }] = useDisclosure(false)
  const [promoteRole, setPromoteRole] = useState<'SUPERADMIN' | 'SUPPORT' | 'COMPLIANCE' | 'OPERATIONS' | null>(null)
  function closePromote() { _closePromote(); setPromoteRole(null) }
  const [approveAdminModal, { open: openApproveAdmin, close: closeApproveAdmin }] = useDisclosure(false)
  const [rejectAdminModal, { open: openRejectAdmin, close: closeRejectAdmin }] = useDisclosure(false)
  const [clearVaModal, { open: openClearVa, close: closeClearVa }] = useDisclosure(false)
  const [releaseReservedModal, { open: openReleaseReserved, close: closeReleaseReserved }] = useDisclosure(false)
  const [releaseReservedLoading, setReleaseReservedLoading] = useState(false)
  const [releaseReservedResult, setReleaseReservedResult] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!userId || !opened) return
    setDetail(null)
    setError(null)
    setLoading(true)
    getUserDetail(userId)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load user'))
      .finally(() => setLoading(false))
  }, [userId, opened])

  async function handleStatus(status: 'ACTIVE' | 'SUSPENDED' | 'BANNED', reasonText?: string) {
    if (!userId) return
    setActionLoading(true)
    try {
      await updateUserStatus(userId, status, reasonText)
      closeSuspend()
      closeBan()
      onStatusChange()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnfreeze() {
    if (!userId) return
    setActionLoading(true)
    try {
      await unfreezeAccount(userId)
      onStatusChange()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePromote() {
    if (!userId || !promoteRole) return
    setActionLoading(true)
    try {
      await promoteToSuperadmin(userId, promoteRole)
      closePromote()
      onStatusChange()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promote failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleApproveAdmin() {
    if (!userId) return
    setActionLoading(true)
    try {
      await approveAdminRequest(userId)
      closeApproveAdmin()
      onStatusChange()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRejectAdmin() {
    if (!userId) return
    setActionLoading(true)
    try {
      await rejectAdminRequest(userId)
      closeRejectAdmin()
      onStatusChange()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleClearVa() {
    if (!userId) return
    setActionLoading(true)
    try {
      await clearUserVirtualAccount(userId)
      closeClearVa()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clear VA failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReleaseReserved() {
    if (!userId) return
    setReleaseReservedLoading(true)
    setReleaseReservedResult(null)
    try {
      const res = await releaseUserReservedFunds(userId)
      setReleaseReservedResult(res.data.message)
    } catch (e) {
      setReleaseReservedResult(e instanceof Error ? e.message : 'Release failed')
    } finally {
      setReleaseReservedLoading(false)
    }
  }

  const user = detail?.user as Record<string, unknown> | undefined
  const wallet = detail?.wallet
  const currentStatus = (user?.status as string) ?? ''
  const currentRole = (user?.role as string) ?? ''

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        title={<Text fw={600}>User Profile</Text>}
        position="right"
        size="md"
        padding="lg"
      >
        {loading ? (
          <Stack gap="sm">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={40} radius="sm" />)}
          </Stack>
        ) : error ? (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">{error}</Alert>
        ) : detail ? (
          <UserDetailBody
            detail={detail}
            actionLoading={actionLoading}
            currentStatus={currentStatus}
            currentRole={currentRole}
            onReactivate={() => handleStatus('ACTIVE')}
            onUnfreeze={handleUnfreeze}
            onOpenSuspend={openSuspend}
            onOpenBan={openBan}
            onOpenPromote={openPromote}
            onOpenApproveAdmin={openApproveAdmin}
            onOpenRejectAdmin={openRejectAdmin}
            onOpenClearVa={openClearVa}
            onOpenReleaseReserved={openReleaseReserved}
          />
        ) : null}
      </Drawer>

      {/* Suspend modal */}
      <Modal opened={suspendModal} onClose={closeSuspend} title="Suspend User" size="sm">
        <Stack gap="md">
          <Text fz="sm" c="dimmed">Provide a reason for suspending this account (optional).</Text>
          <Textarea
            placeholder="Reason for suspension..."
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            rows={3}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeSuspend}>Cancel</Button>
            <Button color="yellow" loading={actionLoading} onClick={() => { handleStatus('SUSPENDED', reason || undefined); setReason('') }}>
              Suspend
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Ban modal */}
      <Modal opened={banModal} onClose={closeBan} title="Ban User" size="sm">
        <Stack gap="md">
          <Text fz="sm" c="dimmed">Permanently ban this user. Provide a reason (optional).</Text>
          <Textarea
            placeholder="Reason for ban..."
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            rows={3}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeBan}>Cancel</Button>
            <Button color="red" loading={actionLoading} onClick={() => { handleStatus('BANNED', reason || undefined); setReason('') }}>
              Ban
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Promote modal */}
      <Modal opened={promoteModal} onClose={closePromote} title="Promote to Superadmin" size="sm">
        <Stack gap="md">
          <Text fz="sm" c="dimmed">
            Promoting <strong>{(user?.firstName as string)} {(user?.lastName as string)}</strong> to
            Superadmin. Choose a role scope — this controls which parts of the platform they can access.
            This action is logged in the audit trail.
          </Text>
          <Select
            label="Admin role"
            placeholder="Select a role scope"
            required
            value={promoteRole}
            onChange={(v) => setPromoteRole(v as typeof promoteRole)}
            data={[
              { value: 'SUPERADMIN', label: 'Superadmin — Full platform access' },
              { value: 'SUPPORT', label: 'Support — Customer support operations' },
              { value: 'COMPLIANCE', label: 'Compliance — Compliance & KYC review' },
              { value: 'OPERATIONS', label: 'Operations — Day-to-day platform operations' },
            ]}
            allowDeselect={false}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closePromote}>Cancel</Button>
            <Button color="primary" loading={actionLoading} disabled={!promoteRole} onClick={handlePromote}>
              Confirm Promote
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Approve admin request modal */}
      <Modal opened={approveAdminModal} onClose={closeApproveAdmin} title="Approve Admin Request" size="sm">
        <Stack gap="md">
          <Text fz="sm" c="dimmed">
            This will grant admin access to{' '}
            <strong>{(user?.firstName as string)} {(user?.lastName as string)}</strong> and allow them to create and manage ROSCA groups.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeApproveAdmin}>Cancel</Button>
            <Button color="green" loading={actionLoading} onClick={handleApproveAdmin}>
              Approve
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reject admin request modal */}
      <Modal opened={rejectAdminModal} onClose={closeRejectAdmin} title="Reject Admin Request" size="sm">
        <Stack gap="md">
          <Text fz="sm" c="dimmed">
            This will reject the admin access request from{' '}
            <strong>{(user?.firstName as string)} {(user?.lastName as string)}</strong>. They will remain a regular member.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRejectAdmin}>Cancel</Button>
            <Button color="red" loading={actionLoading} onClick={handleRejectAdmin}>
              Reject
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reset virtual account modal */}
      <Modal opened={clearVaModal} onClose={closeClearVa} title="Reset Virtual Account" size="sm">
        <Stack gap="md">
          <Text fz="sm" c="dimmed">
            This will remove the stale virtual account for{' '}
            <strong>{(user?.firstName as string)} {(user?.lastName as string)}</strong> from the database.
            The next time they visit Fund Wallet, a fresh live account will be provisioned automatically.
          </Text>
          <Alert color="orange" variant="light">
            <Text fz="xs">Use this only for accounts created in sandbox/test mode that are no longer valid.</Text>
          </Alert>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeClearVa}>Cancel</Button>
            <Button color="orange" loading={actionLoading} onClick={handleClearVa}>
              Reset VA
            </Button>
          </Group>
        </Stack>
      </Modal>
      {/* Release reserved funds modal */}
      <Modal opened={releaseReservedModal} onClose={closeReleaseReserved} title="Release Reserved Funds" size="sm">
        <Stack gap="md">
          <Text fz="sm" c="dimmed">
            Releases any unreleased ROSCA collateral across all circle memberships back to{' '}
            <strong>{(user?.firstName as string)} {(user?.lastName as string)}</strong>'s wallet.
            Run this before deleting an account that has reserved funds.
          </Text>
          {releaseReservedResult && (
            <Alert color="teal" variant="light">
              <Text fz="xs">{releaseReservedResult}</Text>
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeReleaseReserved}>Close</Button>
            <Button color="violet" loading={releaseReservedLoading} onClick={handleReleaseReserved}>
              Release Funds
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack gap={2}>
      <Text fz="xs" c="dimmed">{label}</Text>
      {typeof value === 'string' ? <Text fz="sm" fw={500}>{value || '—'}</Text> : value}
    </Stack>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export function ManageUsers() {
  const [users, setUsers] = useState<SuperadminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [kycFilter, setKycFilter] = useState<string | null>(null)
  const [pendingAdminFilter, setPendingAdminFilter] = useState(false)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400)
  }, [search])

  function fetchUsers() {
    setLoading(true)
    setError(null)
    listUsers({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      role: roleFilter ?? undefined,
      status: statusFilter ?? undefined,
      kycStatus: kycFilter ?? undefined,
      pendingAdminRequest: pendingAdminFilter || undefined,
    })
      .then((res) => {
        setUsers(res.data)
        setTotal(res.meta.total)
        setTotalPages(res.meta.totalPages)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, roleFilter, statusFilter, kycFilter, pendingAdminFilter])

  function openUserDetail(userId: string) {
    setSelectedUserId(userId)
    openDrawer()
  }

  function handleFiltersReset() {
    setSearch('')
    setRoleFilter(null)
    setStatusFilter(null)
    setKycFilter(null)
    setPendingAdminFilter(false)
    setPage(1)
  }

  const hasFilters = !!(search || roleFilter || statusFilter || kycFilter || pendingAdminFilter)

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>Manage Users</Title>
        <Text fz="sm" c="dimmed">{total.toLocaleString()} users total</Text>
      </Group>

      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Search by name, email or phone"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(1) }}
          w={280}
          size="sm"
        />
        <Select
          placeholder="Role"
          data={['MEMBER', 'ADMIN', 'SUPERADMIN']}
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1) }}
          size="sm"
          w={140}
          clearable
        />
        <Select
          placeholder="Status"
          data={['ACTIVE', 'SUSPENDED', 'BANNED']}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          size="sm"
          w={140}
          clearable
        />
        <Select
          placeholder="KYC Status"
          data={['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED']}
          value={kycFilter}
          onChange={(v) => { setKycFilter(v); setPage(1) }}
          size="sm"
          w={165}
          clearable
        />
        <Button
          variant={pendingAdminFilter ? 'filled' : 'light'}
          color="orange"
          size="sm"
          onClick={() => { setPendingAdminFilter((v) => !v); setPage(1) }}
        >
          Pending Admin Requests
        </Button>
        {hasFilters && (
          <Button variant="subtle" size="sm" color="gray" onClick={handleFiltersReset}>
            Clear filters
          </Button>
        )}
      </Group>

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
              <Table.Th style={{ color: 'white' }}>Role</Table.Th>
              <Table.Th style={{ color: 'white' }}>KYC</Table.Th>
              <Table.Th style={{ color: 'white' }}>ROSCA</Table.Th>
              <Table.Th style={{ color: 'white' }}>Status</Table.Th>
              <Table.Th style={{ color: 'white' }} w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <Table.Td key={j}><Skeleton h={20} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : users.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="xl" c="dimmed">
                    {hasFilters ? 'No users match your filters' : 'No users yet'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              users.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Text fz="sm" fw={500}>{user.firstName} {user.lastName}</Text>
                      {user.adminRequestedAt && (
                        <Badge size="xs" color="orange" variant="filled">Admin Request</Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="dimmed">{user.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">{user.phone ?? '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm" color={user.role === 'STAFF' ? 'violet' : user.role === 'CIRCLE_ADMIN' ? 'blue' : 'gray'}>
                      {user.role}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      size="sm"
                      color={KYC_COLOR[user.kyc?.status ?? 'NOT_SUBMITTED'] ?? 'gray'}
                    >
                      {user.kyc?.status ?? 'NOT_SUBMITTED'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">{user._count.roscaMemberships}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={STATUS_COLOR[user.status] ?? 'gray'}
                      variant="filled"
                      size="sm"
                      radius="sm"
                    >
                      {user.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={180} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="dark">
                          <IconDots size={18} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => openUserDetail(user.id)}>
                          View Profile
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
      </Card>

      <Group justify="space-between">
        <Text fz="sm" c="dimmed">
          {total > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()} users`
            : 'No users to display'}
        </Text>
        {totalPages > 1 && (
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" color="primary" />
        )}
      </Group>

      <UserDetailDrawer
        userId={selectedUserId}
        opened={drawerOpened}
        onClose={closeDrawer}
        onStatusChange={fetchUsers}
      />
    </Stack>
  )
}
