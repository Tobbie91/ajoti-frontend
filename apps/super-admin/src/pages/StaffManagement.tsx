import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  ActionIcon,
  Menu,
  Alert,
} from '@mantine/core'
import { useDisclosure, useClipboard } from '@mantine/hooks'
import { IconUserPlus, IconUserCog, IconDots, IconAlertCircle, IconCopy, IconCheck } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import {
  listStaff,
  inviteStaff,
  createStaff,
  changeStaffRole,
  suspendStaff,
  reactivateStaff,
  cancelStaffInvite,
  getStaffAuditLog,
  type StaffRow,
  type StaffAdminRole,
  type StaffAuditLogRow,
  type PaginatedResponse,
} from '@/utils/api'
import { getStaffRoleFromStorage } from '@/utils/permissions'

const ROLE_LABELS: Record<StaffAdminRole, string> = {
  SUPPORT: 'Support',
  COMPLIANCE: 'Compliance',
  OPERATIONS: 'Operations',
  MANAGER: 'Manager',
  SUPERADMIN: 'Super Admin',
}

const ROLE_COLORS: Record<StaffAdminRole, string> = {
  SUPPORT: 'blue',
  COMPLIANCE: 'violet',
  OPERATIONS: 'orange',
  MANAGER: 'teal',
  SUPERADMIN: 'red',
}

// SUPERADMIN can never be assigned through this UI — creation/promotion to
// SUPERADMIN is rejected unconditionally at the API layer regardless of actor.
const ASSIGNABLE_ROLES: { value: StaffAdminRole; label: string }[] = [
  { value: 'SUPPORT', label: 'Support' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'MANAGER', label: 'Manager' },
]

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'green',
  SUSPENDED: 'red',
  PENDING: 'gray',
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  STAFF_INVITED: 'Invite sent',
  STAFF_ROLE_CHANGED: 'Role changed',
  STAFF_SUSPENDED: 'Account suspended',
  STAFF_REACTIVATED: 'Account reactivated',
  STAFF_INVITE_CANCELLED: 'Invite cancelled',
}

function InviteModal({ opened, onClose, onSuccess }: { opened: boolean; onClose: () => void; onSuccess: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffAdminRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setRole(null)
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!firstName || !lastName || !email || !role) {
      setError('First name, last name, email, and role are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await inviteStaff({ firstName, lastName, email, staffRole: role })
      onSuccess()
      handleClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send invite.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Invite Staff Member" centered>
      <Stack>
        {error && <Alert color="red" icon={<IconAlertCircle size={16} />}>{error}</Alert>}
        <Group grow>
          <TextInput
            label="First name"
            placeholder="Jane"
            value={firstName}
            onChange={(e) => setFirstName(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Last name"
            placeholder="Smith"
            value={lastName}
            onChange={(e) => setLastName(e.currentTarget.value)}
            required
          />
        </Group>
        <TextInput
          label="Email address"
          placeholder="jane.smith@ajoti.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
        />
        <Select
          label="Role"
          placeholder="Select a role"
          data={ASSIGNABLE_ROLES}
          value={role}
          onChange={(v) => setRole(v as StaffAdminRole)}
          required
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Send Invite</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function CreateStaffModal({ opened, onClose, onSuccess }: { opened: boolean; onClose: () => void; onSuccess: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffAdminRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setupUrl, setSetupUrl] = useState('')
  const clipboard = useClipboard({ timeout: 1500 })

  function reset() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setRole(null)
    setError('')
    setSetupUrl('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!firstName || !lastName || !email || !role) {
      setError('First name, last name, email, and role are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await createStaff({ firstName, lastName, email, staffRole: role })
      setSetupUrl(res.setupUrl)
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Create Staff Account" centered>
      <Stack>
        {error && <Alert color="red" icon={<IconAlertCircle size={16} />}>{error}</Alert>}
        {setupUrl ? (
          <>
            <Alert color="green">
              Account created. A setup email was sent to {email}, and you can also share this link directly.
            </Alert>
            <TextInput
              label="Setup link"
              value={setupUrl}
              readOnly
              rightSection={
                <ActionIcon variant="subtle" onClick={() => clipboard.copy(setupUrl)}>
                  {clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              }
            />
            <Group justify="flex-end">
              <Button onClick={handleClose}>Done</Button>
            </Group>
          </>
        ) : (
          <>
            <Group grow>
              <TextInput
                label="First name"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Last name"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.currentTarget.value)}
                required
              />
            </Group>
            <TextInput
              label="Email address"
              placeholder="jane.smith@ajoti.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />
            <Select
              label="Role"
              placeholder="Select a role"
              data={ASSIGNABLE_ROLES}
              value={role}
              onChange={(v) => setRole(v as StaffAdminRole)}
              required
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSubmit} loading={loading}>Create Account</Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  )
}

function ChangeRoleModal({
  opened,
  onClose,
  onSuccess,
  target,
}: {
  opened: boolean
  onClose: () => void
  onSuccess: () => void
  target: { id: string; email: string; staffRole: StaffAdminRole } | null
}) {
  const [role, setRole] = useState<StaffAdminRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (target) setRole(target.staffRole)
  }, [target])

  async function handleSubmit() {
    if (!target || !role) return
    setLoading(true)
    setError('')
    try {
      await changeStaffRole(target.id, role)
      onSuccess()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to change role.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Change Role" centered>
      <Stack>
        {error && <Alert color="red" icon={<IconAlertCircle size={16} />}>{error}</Alert>}
        <Text size="sm" c="dimmed">Changing role for <strong>{target?.email}</strong></Text>
        <Select
          label="New role"
          data={ASSIGNABLE_ROLES}
          value={role}
          onChange={(v) => setRole(v as StaffAdminRole)}
        />
        <Text size="xs" c="dimmed">All active sessions will be revoked. New role takes effect on next login.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={role === target?.staffRole}>Apply</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export function StaffManagement() {
  const myStaffRole = getStaffRoleFromStorage()
  const isSuperadmin = myStaffRole === 'SUPERADMIN'

  // Staff list state
  const [data, setData] = useState<PaginatedResponse<StaffRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<StaffAdminRole | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'SUSPENDED' | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  // Audit log state
  const [auditData, setAuditData] = useState<PaginatedResponse<StaffAuditLogRow> | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditPage, setAuditPage] = useState(1)

  // Modals
  const [inviteOpened, { open: openInvite, close: closeInvite }] = useDisclosure(false)
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)
  const [roleModalOpened, { open: openRoleModal, close: closeRoleModal }] = useDisclosure(false)
  const [roleTarget, setRoleTarget] = useState<{ id: string; email: string; staffRole: StaffAdminRole } | null>(null)

  const loadStaff = useCallback(() => {
    setLoading(true)
    setError('')
    listStaff({
      page,
      limit: 20,
      staffRole: roleFilter ?? undefined,
      status: statusFilter ?? undefined,
    })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, roleFilter, statusFilter])

  useEffect(() => { loadStaff() }, [loadStaff])

  function loadAuditLog() {
    setAuditLoading(true)
    getStaffAuditLog({ page: auditPage, limit: 20 })
      .then(setAuditData)
      .catch(() => {})
      .finally(() => setAuditLoading(false))
  }

  async function handleSuspend(staffId: string) {
    setActionLoading(staffId)
    setActionError('')
    try {
      await suspendStaff(staffId)
      loadStaff()
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to suspend account.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReactivate(staffId: string) {
    setActionLoading(staffId)
    setActionError('')
    try {
      await reactivateStaff(staffId)
      loadStaff()
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to reactivate account.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    setActionLoading(inviteId)
    setActionError('')
    try {
      await cancelStaffInvite(inviteId)
      loadStaff()
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to cancel invite.')
    } finally {
      setActionLoading(null)
    }
  }

  function openChangeRole(row: StaffRow) {
    if (row.type !== 'USER') return
    setRoleTarget({ id: row.id, email: row.email, staffRole: row.staffRole })
    openRoleModal()
  }

  const rows = data?.data ?? []
  const totalPages = data ? Math.ceil(data.meta.total / 20) : 1

  return (
    <Stack>
      <Group justify="space-between" align="center">
        <Title order={2}>Staff Management</Title>
        {isSuperadmin && (
          <Group>
            <Button variant="default" leftSection={<IconUserCog size={16} />} onClick={openCreate}>
              Create Staff Account
            </Button>
            <Button leftSection={<IconUserPlus size={16} />} onClick={openInvite}>
              Invite Staff Member
            </Button>
          </Group>
        )}
      </Group>

      <Tabs defaultValue="accounts" onChange={(v) => { if (v === 'audit') loadAuditLog() }}>
        <Tabs.List>
          <Tabs.Tab value="accounts">Staff Accounts</Tabs.Tab>
          <Tabs.Tab value="audit">Audit Log</Tabs.Tab>
        </Tabs.List>

        {/* ── Staff Accounts ── */}
        <Tabs.Panel value="accounts" pt="md">
          <Stack>
            <Group>
              <Select
                placeholder="All roles"
                clearable
                data={[
                  { value: 'SUPPORT', label: 'Support' },
                  { value: 'COMPLIANCE', label: 'Compliance' },
                  { value: 'OPERATIONS', label: 'Operations' },
                  { value: 'SUPERADMIN', label: 'Super Admin' },
                ]}
                value={roleFilter}
                onChange={(v) => { setRoleFilter(v as StaffAdminRole); setPage(1) }}
                w={160}
              />
              <Select
                placeholder="All statuses"
                clearable
                data={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                ]}
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v as 'ACTIVE' | 'SUSPENDED'); setPage(1) }}
                w={160}
              />
            </Group>

            {actionError && (
              <Alert color="red" icon={<IconAlertCircle size={16} />} withCloseButton onClose={() => setActionError('')}>
                {actionError}
              </Alert>
            )}

            <Card withBorder p={0}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name / Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Since</Table.Th>
                    {isSuperadmin && <Table.Th w={50} />}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <Table.Tr key={i}>
                          <Table.Td><Skeleton h={16} /></Table.Td>
                          <Table.Td><Skeleton h={16} /></Table.Td>
                          <Table.Td><Skeleton h={16} /></Table.Td>
                          <Table.Td><Skeleton h={16} /></Table.Td>
                          {isSuperadmin && <Table.Td />}
                        </Table.Tr>
                      ))
                    : rows.length === 0
                    ? (
                        <Table.Tr>
                          <Table.Td colSpan={isSuperadmin ? 5 : 4}>
                            <Text ta="center" c="dimmed" py="xl">No staff accounts found.</Text>
                          </Table.Td>
                        </Table.Tr>
                      )
                    : rows.map((row) => (
                        <Table.Tr key={row.id}>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text size="sm" fw={500}>
                                {row.firstName} {row.lastName}
                                {row.type === 'INVITE' && <Text span c="dimmed" size="xs"> (pending)</Text>}
                              </Text>
                              <Text size="xs" c="dimmed">{row.email}</Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={ROLE_COLORS[row.staffRole]} variant="light">
                              {ROLE_LABELS[row.staffRole]}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={STATUS_COLORS[row.status]} variant="light">
                              {row.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {new Date(row.createdAt).toLocaleDateString()}
                            </Text>
                          </Table.Td>
                          {isSuperadmin && (
                            <Table.Td>
                              {row.type === 'INVITE' ? (
                                <Button
                                  size="xs"
                                  variant="subtle"
                                  color="red"
                                  loading={actionLoading === row.id}
                                  onClick={() => handleCancelInvite(row.id)}
                                >
                                  Cancel invite
                                </Button>
                              ) : row.staffRole === 'SUPERADMIN' ? (
                                <Text size="xs" c="dimmed">Root account</Text>
                              ) : (
                                <Menu shadow="md" width={180}>
                                  <Menu.Target>
                                    <ActionIcon variant="subtle" loading={actionLoading === row.id}>
                                      <IconDots size={16} />
                                    </ActionIcon>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Item onClick={() => openChangeRole(row)}>
                                      Change role
                                    </Menu.Item>
                                    {row.status === 'ACTIVE' ? (
                                      <Menu.Item color="red" onClick={() => handleSuspend(row.id)}>
                                        Suspend account
                                      </Menu.Item>
                                    ) : (
                                      <Menu.Item color="green" onClick={() => handleReactivate(row.id)}>
                                        Reactivate account
                                      </Menu.Item>
                                    )}
                                  </Menu.Dropdown>
                                </Menu>
                              )}
                            </Table.Td>
                          )}
                        </Table.Tr>
                      ))
                  }
                </Table.Tbody>
              </Table>
            </Card>

            {error && <Text c="red" size="sm">{error}</Text>}

            {totalPages > 1 && (
              <Group justify="center">
                <Pagination total={totalPages} value={page} onChange={setPage} />
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        {/* ── Audit Log ── */}
        <Tabs.Panel value="audit" pt="md">
          <Stack>
            <Card withBorder p={0}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Action</Table.Th>
                    <Table.Th>Target</Table.Th>
                    <Table.Th>Details</Table.Th>
                    <Table.Th>Time</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {auditLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <Table.Tr key={i}>
                          <Table.Td><Skeleton h={16} /></Table.Td>
                          <Table.Td><Skeleton h={16} /></Table.Td>
                          <Table.Td><Skeleton h={16} /></Table.Td>
                          <Table.Td><Skeleton h={16} /></Table.Td>
                        </Table.Tr>
                      ))
                    : (auditData?.data ?? []).length === 0
                    ? (
                        <Table.Tr>
                          <Table.Td colSpan={4}>
                            <Text ta="center" c="dimmed" py="xl">No audit log entries yet.</Text>
                          </Table.Td>
                        </Table.Tr>
                      )
                    : (auditData?.data ?? []).map((log) => (
                        <Table.Tr key={log.id}>
                          <Table.Td>
                            <Badge variant="light" color="blue">
                              {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">{log.entityId}</Text>
                          </Table.Td>
                          <Table.Td>
                            {log.after && (
                              <Text size="xs" c="dimmed">
                                {JSON.stringify(log.after)}
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {new Date(log.createdAt).toLocaleString()}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))
                  }
                </Table.Tbody>
              </Table>
            </Card>

            {(auditData?.meta.totalPages ?? 0) > 1 && (
              <Group justify="center">
                <Pagination
                  total={auditData?.meta.totalPages ?? 1}
                  value={auditPage}
                  onChange={(p) => { setAuditPage(p); loadAuditLog() }}
                />
              </Group>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <InviteModal opened={inviteOpened} onClose={closeInvite} onSuccess={loadStaff} />
      <CreateStaffModal opened={createOpened} onClose={closeCreate} onSuccess={loadStaff} />
      <ChangeRoleModal
        opened={roleModalOpened}
        onClose={closeRoleModal}
        onSuccess={loadStaff}
        target={roleTarget}
      />
    </Stack>
  )
}
