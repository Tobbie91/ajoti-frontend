import { useEffect, useRef, useState } from 'react'
import { Paper, Group, Text, Button, Loader, Table, Avatar, Badge } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import { getAllCircleContributions, type Contribution as ApiContribution } from '@/utils/api'

const PRIMARY = '#0b6b55'

interface GroupContributionsTabProps {
  circleId: string | undefined
  isActive: boolean
}

export function GroupContributionsTab({ circleId, isActive }: GroupContributionsTabProps) {
  const [contributions, setContributions] = useState<ApiContribution[]>([])
  const [contribLoading, setContribLoading] = useState(false)
  const contribsFetched = useRef(false)

  useEffect(() => {
    if (isActive && circleId && !contribsFetched.current) {
      contribsFetched.current = true
      setContribLoading(true)
      getAllCircleContributions(circleId)
        .then((data) => setContributions(data))
        .catch(() => setContributions([]))
        .finally(() => setContribLoading(false))
    }
  }, [isActive, circleId])

  function refresh() {
    if (!circleId) return
    setContribLoading(true)
    getAllCircleContributions(circleId).then((data) => setContributions(data)).catch(() => {}).finally(() => setContribLoading(false))
  }

  return (
    <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
      <Group justify="space-between" align="center" px="lg" py="md">
        <Text fw={600} fz="md">Contribution History</Text>
        <Button
          variant="outline"
          size="xs"
          radius="md"
          leftSection={<IconRefresh size={13} />}
          style={{ borderColor: '#dee2e6', color: '#495057' }}
          onClick={refresh}
        >
          Refresh
        </Button>
      </Group>

      {contribLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" color={PRIMARY} />
        </Group>
      ) : (
        <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 560 }}>
          <Table.Thead>
            <Table.Tr style={{ background: PRIMARY }}>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Member</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Cycle</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {contributions.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="xl" fz="sm">No contributions found for this circle</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {contributions.map((c, i) => {
              const amountNaira = (Number(c.amount) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
              return (
                <Table.Tr key={c.contributionId ?? i}>
                  <Table.Td>
                    <Group gap="sm" align="center">
                      <Avatar size={28} radius="xl" color="gray">{(c.memberName || '?').charAt(0)}</Avatar>
                      <Text fz="sm" fw={500}>{c.memberName}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text fz="sm">Cycle {c.cycleNumber}</Text></Table.Td>
                  <Table.Td>
                    <Text fz="sm" fw={600}>₦{amountNaira}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      radius="sm"
                      style={{ background: c.isLate ? '#fef2f2' : '#e6f5f1', color: c.isLate ? '#e74c3c' : PRIMARY, border: 'none', fontWeight: 600 }}
                    >
                      {c.isLate ? 'Late' : 'On Time'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="dimmed">
                      {c.paidAt ? new Date(c.paidAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table></div>
      )}
    </Paper>
  )
}
