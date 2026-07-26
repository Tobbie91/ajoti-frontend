import { Stack, Paper, SimpleGrid, Box, Text, Button, Table, Group } from '@mantine/core'
import type { RoscaCircle, Payout } from '@/utils/api'

const PRIMARY = '#0b6b55'

const FREQ_LABEL: Record<string, string> = { WEEKLY: 'Weekly', BI_WEEKLY: 'Bi-weekly', MONTHLY: 'Monthly' }

function formatMonthYear(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
}

interface GroupOverviewTabProps {
  circleData: RoscaCircle | null
  payouts: Payout[]
  onStartNewCycle: () => void
}

export function GroupOverviewTab({ circleData, payouts, onStartNewCycle }: GroupOverviewTabProps) {
  const totalMembers = circleData?.filledSlots ?? 0
  const totalRounds = circleData?.durationCycles ?? 0
  const contributionAmountNaira = Number(circleData?.contributionAmount ?? 0) / 100
  const disbursementAmountNaira = contributionAmountNaira * totalMembers
  const frequency = circleData ? (FREQ_LABEL[circleData.frequency as string] ?? circleData.frequency ?? '—') : '—'

  const sortedPayouts = [...payouts].sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0))
  const firstPayout = sortedPayouts[0]
  const lastPayout = sortedPayouts[sortedPayouts.length - 1]
  const startDate = formatMonthYear(firstPayout?.schedule?.payoutDate ?? firstPayout?.processedAt ?? firstPayout?.createdAt)
  const endDate = formatMonthYear(lastPayout?.schedule?.payoutDate ?? lastPayout?.processedAt ?? lastPayout?.createdAt)

  return (
    <Stack gap="lg">
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>Total Members</Text>
            <Text fz="xl" fw={700}>{totalMembers}</Text>
          </Box>
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>Total Rounds</Text>
            <Text fz="xl" fw={700}>{totalRounds}</Text>
          </Box>
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>Total Contribution</Text>
            <Text fz="xl" fw={700}>₦{contributionAmountNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
          </Box>
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>Contribution Rate</Text>
            <Text fz="xl" fw={700} style={{ color: PRIMARY }}>—</Text>
          </Box>
        </SimpleGrid>
      </Paper>

      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>Start</Text>
            <Text fz="md" fw={600}>{startDate}</Text>
          </Box>
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>End</Text>
            <Text fz="md" fw={600}>{endDate}</Text>
          </Box>
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>Contribution Frequency</Text>
            <Text fz="md" fw={600}>{frequency}</Text>
          </Box>
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>Disbursement Amount</Text>
            <Text fz="md" fw={600}>₦{disbursementAmountNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
          </Box>
        </SimpleGrid>
      </Paper>

      <Button
        radius="md"
        size="sm"
        style={{ background: PRIMARY, alignSelf: 'flex-start' }}
        onClick={onStartNewCycle}
      >
        Start New Cycle With Members
      </Button>
    </Stack>
  )
}

export function GroupHistoryTab({ payouts }: { payouts: Payout[] }) {
  const sortedPayouts = [...payouts].sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0))

  return (
    <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
      <Group px="lg" py="md">
        <Text fw={600} fz="md">History</Text>
      </Group>

      <div style={{ overflowX: 'auto' }}>
        <Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 560 }}>
          <Table.Thead>
            <Table.Tr style={{ background: PRIMARY }}>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Cycle</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Recipient</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Disbursed Amount</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedPayouts.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text fz="sm" c="dimmed" ta="center" py="md">No completed cycles yet</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              sortedPayouts.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td><Text fz="sm">Cycle {p.cycleNumber ?? p.schedule?.cycleNumber ?? '—'}</Text></Table.Td>
                  <Table.Td>
                    <Text fz="sm">
                      {p.recipient ? `${p.recipient.firstName} ${p.recipient.lastName}` : '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td><Text fz="sm">₦{(Number(p.amount) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text></Table.Td>
                  <Table.Td><Text fz="sm">{p.status}</Text></Table.Td>
                  <Table.Td><Text fz="sm">{formatMonthYear(p.schedule?.payoutDate ?? p.processedAt ?? p.createdAt)}</Text></Table.Td>
                  <Table.Td>
                    <Button
                      variant="outline"
                      size="xs"
                      radius="md"
                      style={{ borderColor: '#dee2e6', color: '#495057' }}
                    >
                      View Details
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
    </Paper>
  )
}
