import { useEffect, useState } from 'react'
import { Card, Text, Table, Group, Badge, Skeleton, Stack } from '@mantine/core'
import { getAuditLogs, type AuditLogRow } from '@/utils/api'

function formatAction(action: string) {
  return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '\n' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

const entityBadgeColor: Record<string, string> = {
  USER: 'blue',
  KYC: 'yellow',
  CIRCLE: 'green',
  MEMBERSHIP: 'grape',
}

export function RecentActivities() {
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAuditLogs({ page: 1, limit: 8 })
      .then((res) => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card withBorder p="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="lg">
          Recent Admin Activity
        </Text>
      </Group>

      {loading ? (
        <Stack gap="xs">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} h={36} radius="sm" />
          ))}
        </Stack>
      ) : logs.length === 0 ? (
        <Text fz="sm" c="dimmed" ta="center" py="xl">
          No admin activity yet
        </Text>
      ) : (
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr style={{ backgroundColor: '#0B6B55' }}>
              <Table.Th style={{ color: 'white' }}>Time</Table.Th>
              <Table.Th style={{ color: 'white' }}>Action</Table.Th>
              <Table.Th style={{ color: 'white' }}>Entity</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {logs.map((log) => (
              <Table.Tr key={log.id}>
                <Table.Td>
                  <Text fz="xs" c="dimmed" style={{ whiteSpace: 'pre-line' }}>
                    {formatDate(log.createdAt)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{formatAction(log.action)}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size="xs"
                    variant="light"
                    color={entityBadgeColor[log.entityType] ?? 'gray'}
                  >
                    {log.entityType}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}
