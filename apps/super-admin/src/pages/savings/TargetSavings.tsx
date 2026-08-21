import { Alert, Badge, Card, Group, Pagination, Select, SimpleGrid, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { IconAlertCircle, IconSearch } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import {
  getTargetSavingsOversight,
  type TargetSavingsOversightResponse,
  type TargetSavingsStatus,
  type TargetSavingsType,
} from '@/utils/api'

const LIMIT = 20

function money(kobo: string) {
  const value = Number(kobo || 0) / 100
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusColor(status: TargetSavingsStatus) {
  if (status === 'ACTIVE') return 'blue'
  if (status === 'MATURED') return 'green'
  return 'gray'
}

export function TargetSavings() {
  const [result, setResult] = useState<TargetSavingsOversightResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getTargetSavingsOversight({
      page,
      limit: LIMIT,
      ...(status ? { status: status as TargetSavingsStatus } : {}),
      ...(type ? { type: type as TargetSavingsType } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    })
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load Target Savings'))
      .finally(() => setLoading(false))
  }, [page, status, type, search])

  useEffect(() => {
    const id = window.setTimeout(load, 250)
    return () => window.clearTimeout(id)
  }, [load])

  const summary = result?.summary
  const rows = result?.data ?? []

  return (
    <Stack gap="lg" p="xl">
      <div>
        <Title order={2} fw={700}>Target Savings</Title>
        <Text c="dimmed" size="sm" mt={4}>
          Read-only oversight of individual and group Target Savings plans.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Active plans</Text>
          <Text fw={700} size="xl" mt={4}>{summary?.activePlans ?? 0}</Text>
        </Card>
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Matured plans</Text>
          <Text fw={700} size="xl" mt={4}>{summary?.maturedPlans ?? 0}</Text>
        </Card>
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Group plans</Text>
          <Text fw={700} size="xl" mt={4}>{summary?.groupPlans ?? 0}</Text>
        </Card>
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Active locked savings</Text>
          <Text fw={700} size="xl" mt={4}>{money(summary?.totalSavedKobo ?? '0')}</Text>
        </Card>
      </SimpleGrid>

      <Group gap="sm" align="end">
        <TextInput
          label="Search"
          placeholder="Plan, owner or email"
          leftSection={<IconSearch size={15} />}
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(1) }}
          style={{ flex: 1, minWidth: 240 }}
        />
        <Select
          label="Type"
          placeholder="All types"
          clearable
          value={type}
          onChange={(value) => { setType(value); setPage(1) }}
          data={[
            { value: 'INDIVIDUAL', label: 'Individual' },
            { value: 'GROUP', label: 'Group' },
          ]}
          w={170}
        />
        <Select
          label="Status"
          placeholder="All statuses"
          clearable
          value={status}
          onChange={(value) => { setStatus(value); setPage(1) }}
          data={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'MATURED', label: 'Matured' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
          w={170}
        />
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
          {error}
        </Alert>
      )}

      <Card withBorder radius="md" p={0}>
        <Table.ScrollContainer minWidth={1050}>
          <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Owner</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Saved</Table.Th>
                <Table.Th>Expected target</Table.Th>
                <Table.Th>Frequency</Table.Th>
                <Table.Th>Maturity</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loading && rows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text ta="center" c="dimmed" py="xl">No Target Savings plans found.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {rows.map((plan) => (
                <Table.Tr key={plan.id}>
                  <Table.Td>
                    <Text size="sm" fw={600}>{plan.name}</Text>
                    <Text size="xs" c="dimmed">{plan.id.slice(0, 8)}…</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{plan.owner.firstName} {plan.owner.lastName}</Text>
                    <Text size="xs" c="dimmed">{plan.owner.email}</Text>
                  </Table.Td>
                  <Table.Td><Badge variant="light">{plan.type}</Badge></Table.Td>
                  <Table.Td><Badge color={statusColor(plan.status)} variant="light">{plan.status}</Badge></Table.Td>
                  <Table.Td>{plan.memberCount}</Table.Td>
                  <Table.Td>{money(plan.totalSavedKobo)}</Table.Td>
                  <Table.Td>{money(plan.effectiveTargetAmountKobo)}</Table.Td>
                  <Table.Td>{money(plan.contributionAmountKobo)} {plan.frequency.toLowerCase()}</Table.Td>
                  <Table.Td>{new Date(plan.maturityDate).toLocaleDateString('en-NG')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {result?.meta.total ?? 0} plan{result?.meta.total === 1 ? '' : 's'}
        </Text>
        <Pagination value={page} onChange={setPage} total={result?.meta.totalPages ?? 1} />
      </Group>
    </Stack>
  )
}
