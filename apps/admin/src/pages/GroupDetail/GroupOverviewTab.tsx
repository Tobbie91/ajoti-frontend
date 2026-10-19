import { formatKobo, kobo } from '@/utils/kobo'
import { Stack, Paper, SimpleGrid, Box, Text, Button, Table, Group } from '@mantine/core'
import type { RoscaCircle, Payout } from '@/utils/api'
import { payoutSettlementDisplay } from '@/utils/payout-settlement'

const PRIMARY = '#0b6b55'

const FREQ_LABEL: Record<string, string> = { WEEKLY: 'Weekly', BI_WEEKLY: 'Bi-weekly', MONTHLY: 'Monthly' }

function formatMonthYear(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
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
  const contributionAmount = kobo(circleData?.contributionAmount)
  const disbursementAmount = contributionAmount == null ? null : (contributionAmount * BigInt(totalMembers)).toString()
  const frequency = circleData ? (FREQ_LABEL[circleData.frequency as string] ?? circleData.frequency ?? '-') : '-'

  const sortedPayouts = [...payouts].sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0))
  const firstPayout = sortedPayouts[0]
  const lastPayout = sortedPayouts[sortedPayouts.length - 1]
  const startDate = formatMonthYear(firstPayout?.payoutDate ?? firstPayout?.processedAt)
  const endDate = formatMonthYear(lastPayout?.payoutDate ?? lastPayout?.processedAt)

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
            <Text fz="xl" fw={700}>{formatKobo(contributionAmount?.toString())}</Text>
          </Box>
          <Box ta="center">
            <Text fz="xs" c="dimmed" mb={4}>Contribution Rate</Text>
            <Text fz="xl" fw={700} style={{ color: PRIMARY }}>-</Text>
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
            <Text fz="xs" c="dimmed" mb={4}>Expected cycle pot</Text>
            <Text fz="md" fw={600}>{formatKobo(disbursementAmount)}</Text>
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

export function GroupHistoryTab({ payouts, onViewPayouts }: { payouts: Payout[]; onViewPayouts: () => void }) {
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
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount paid out</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Settlement status</Table.Th>
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
              sortedPayouts.map((p) => {
                const settlement = payoutSettlementDisplay(p.settlementStatus, p.amountPaidOut, p.status)
                return (
                <Table.Tr key={p.cycleNumber}>
                  <Table.Td><Text fz="sm">Cycle {p.cycleNumber}</Text></Table.Td>
                  <Table.Td>
                    <Text fz="sm">
                      {p.recipientName ?? 'Unassigned'}
                    </Text>
                  </Table.Td>
                  <Table.Td><Text fz="sm">{p.amountPaidOut == null ? 'Not settled' : formatKobo(p.amountPaidOut)}</Text></Table.Td>
                  <Table.Td><Text fz="sm" c={settlement.color}>{settlement.label}</Text></Table.Td>
                  <Table.Td><Text fz="sm">{formatMonthYear(p.payoutDate ?? p.processedAt)}</Text></Table.Td>
                  <Table.Td>
                    <Button
                      variant="outline"
                      size="xs"
                      radius="md"
                      onClick={onViewPayouts}
                      style={{ borderColor: '#dee2e6', color: '#495057' }}
                    >
                      View Payouts
                    </Button>
                  </Table.Td>
                </Table.Tr>
                )
              })
            )}
          </Table.Tbody>
        </Table>
      </div>
    </Paper>
  )
}
