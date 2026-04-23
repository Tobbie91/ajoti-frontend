import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Divider,
  Group,
  NumberInput,
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
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconRefresh, IconSearch } from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuditLogs, type AuditLogRow, type PaginatedResponse } from '@/utils/api'

// ── Settings tab (static / coming-soon) ─────────────────────────────────────

function SettingsTab() {
  const [enableRegistration, setEnableRegistration] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [enable2FA, setEnable2FA] = useState(false)
  const [autoLogout, setAutoLogout] = useState<string | null>('30 mins')
  const [failedLogins, setFailedLogins] = useState<string | number>(5)

  return (
    <Stack gap="lg" pt="md">
      <Paper withBorder radius="md" p="md">
        <Text fw={600} size="lg" mb="md">General</Text>

        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>Enable Registration</Text>
            <Switch
              checked={enableRegistration}
              onChange={(e) => setEnableRegistration(e.currentTarget.checked)}
              size="md"
              color="#066F5B"
            />
          </Group>

          <div>
            <Text fw={500} mb="xs">Default Time Zone</Text>
            <Select
              data={[
                { value: 'UTC', label: '(GMT +00:00) UTC' },
                { value: 'WAT', label: '(GMT +01:00) West Africa Time' },
                { value: 'EST', label: '(GMT -05:00) Eastern Time' },
              ]}
              defaultValue="WAT"
              radius="md"
            />
          </div>

          <div>
            <Text fw={500} mb="xs">Default Language</Text>
            <Select
              data={[
                { value: 'en', label: 'English' },
                { value: 'yo', label: 'Yoruba' },
                { value: 'ha', label: 'Hausa' },
                { value: 'ig', label: 'Igbo' },
              ]}
              defaultValue="en"
              radius="md"
            />
          </div>
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" align="center" mb="md">
          <Text fw={600} size="lg">Maintenance Mode</Text>
          <Switch
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.currentTarget.checked)}
            size="md"
            color="#066F5B"
          />
        </Group>
        {maintenanceMode && (
          <Alert color="orange" radius="md" variant="light">
            Maintenance mode is ON. The app will show a maintenance page to all users.
          </Alert>
        )}
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Text fw={600} size="lg" mb="md">Security</Text>
        <Stack gap="md">
          <div>
            <Text fw={500} mb="xs">Password Policy</Text>
            <Select
              data={[
                { value: 'standard', label: 'Standard (8 characters, 1 number)' },
                { value: 'strong', label: 'Strong (10+ chars, uppercase, number, special)' },
              ]}
              defaultValue="standard"
              radius="md"
            />
          </div>

          <Group justify="space-between">
            <Text fw={500}>Require 2FA for Superadmins</Text>
            <Switch
              checked={enable2FA}
              onChange={(e) => setEnable2FA(e.currentTarget.checked)}
              size="md"
              color="#066F5B"
            />
          </Group>

          <Divider />

          <div>
            <Text fw={500} mb="xs">Auto logout after inactivity</Text>
            <Select
              data={[
                { value: '15 mins', label: '15 minutes' },
                { value: '30 mins', label: '30 minutes' },
                { value: '1 hour', label: '1 hour' },
                { value: '2 hours', label: '2 hours' },
              ]}
              value={autoLogout}
              onChange={setAutoLogout}
              radius="md"
            />
          </div>

          <div>
            <Text fw={500} mb="xs">Lock account after failed logins</Text>
            <NumberInput
              value={failedLogins}
              onChange={setFailedLogins}
              min={1}
              max={10}
              rightSection={<Text size="sm" c="dimmed" pr="xs">times</Text>}
              radius="md"
            />
          </div>
        </Stack>
      </Paper>
    </Stack>
  )
}

// ── Audit Logs tab ───────────────────────────────────────────────────────────

function actionBadgeColor(action: string) {
  const a = action?.toLowerCase() ?? ''
  if (a.includes('approve') || a.includes('activate') || a.includes('promote')) return 'green'
  if (a.includes('reject') || a.includes('ban') || a.includes('cancel') || a.includes('flag')) return 'red'
  if (a.includes('suspend')) return 'orange'
  if (a.includes('login') || a.includes('logout')) return 'blue'
  return 'gray'
}

const LIMIT = 20

function AuditLogsTab() {
  const [data, setData] = useState<PaginatedResponse<AuditLogRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [entityType, setEntityType] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchLogs = useCallback(() => {
    setLoading(true)
    setError(null)
    getAuditLogs({
      page,
      limit: LIMIT,
      ...(search.trim() ? { actorId: search.trim() } : {}),
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
    })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load audit logs'))
      .finally(() => setLoading(false))
  }, [page, search, entityType, action])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function handleSearchChange(val: string) {
    setSearch(val)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchLogs, 400)
  }

  const rows = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 1

  return (
    <Stack gap="md" pt="md">
      <Group gap="sm">
        <TextInput
          placeholder="Search by actor ID..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => handleSearchChange(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 280 }}
          radius="md"
        />
        <Select
          placeholder="Entity type"
          data={[
            { value: 'USER', label: 'User' },
            { value: 'KYC', label: 'KYC' },
            { value: 'CIRCLE', label: 'Circle' },
            { value: 'WALLET', label: 'Wallet' },
            { value: 'TRANSACTION', label: 'Transaction' },
          ]}
          value={entityType}
          onChange={(v) => { setEntityType(v); setPage(1) }}
          clearable
          radius="md"
          style={{ width: 170 }}
        />
        <Select
          placeholder="Action"
          data={[
            { value: 'APPROVE_KYC', label: 'Approve KYC' },
            { value: 'REJECT_KYC', label: 'Reject KYC' },
            { value: 'SUSPEND_USER', label: 'Suspend User' },
            { value: 'BAN_USER', label: 'Ban User' },
            { value: 'PROMOTE_USER', label: 'Promote User' },
            { value: 'CANCEL_CIRCLE', label: 'Cancel Circle' },
            { value: 'FLAG_MEMBER', label: 'Flag Member' },
          ]}
          value={action}
          onChange={(v) => { setAction(v); setPage(1) }}
          clearable
          radius="md"
          style={{ width: 180 }}
        />
        <ActionIcon variant="default" size="lg" radius="md" onClick={fetchLogs} title="Refresh">
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {error}
        </Alert>
      )}

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={700}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr bg="#066F5B">
              <Table.Th c="white">Timestamp</Table.Th>
              <Table.Th c="white">Actor</Table.Th>
              <Table.Th c="white">Action</Table.Th>
              <Table.Th c="white">Entity</Table.Th>
              <Table.Th c="white">Reason</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              [...Array(10)].map((_, i) => (
                <Table.Tr key={i}>
                  {[...Array(5)].map((__, j) => (
                    <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" py="xl" c="dimmed">No audit log entries found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Text size="sm">{new Date(row.createdAt).toLocaleDateString('en-NG')}</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(row.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500} style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {row.actorId.slice(0, 8)}…
                    </Text>
                    <Text size="xs" c="dimmed">{row.actorType}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={actionBadgeColor(row.action)} variant="light" size="sm">
                      {row.action.replace(/_/g, ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{row.entityType}</Text>
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {row.entityId.slice(0, 8)}…
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={2} style={{ maxWidth: 200 }}>
                      {row.reason ?? '—'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            {data ? `${data.meta.total.toLocaleString()} entries` : ''}
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      </Paper>
    </Stack>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function SettingsLogs() {
  const [tab, setTab] = useState<string | null>('logs')

  return (
    <Stack gap="lg" p="xl">
      <Title order={2} fw={700}>Settings & Logs</Title>

      <Box>
        <Tabs value={tab} onChange={setTab}>
          <Tabs.List>
            <Tabs.Tab value="logs">Audit Logs</Tabs.Tab>
            <Tabs.Tab value="settings">Settings</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="logs">
            <AuditLogsTab />
          </Tabs.Panel>

          <Tabs.Panel value="settings">
            <SettingsTab />
          </Tabs.Panel>
        </Tabs>
      </Box>
    </Stack>
  )
}
