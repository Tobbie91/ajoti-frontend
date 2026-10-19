import { formatKobo } from "@/utils/kobo";
import { useEffect, useState } from 'react'
import { getCircleEarlyPayouts, type CircleEarlyPayout } from '@/utils/api/rosca'
import { Stack, Paper, Text, Group, Button, TextInput, Table, Avatar, Badge, Loader } from '@mantine/core'
import { IconPlayerPlay, IconRefresh } from '@tabler/icons-react'
import type { Payout } from '@/utils/api'
import { payoutSettlementDisplay } from '@/utils/payout-settlement'

const PRIMARY = '#0b6b55'

interface GroupPayoutsTabProps {
  circleId: string
  payouts: Payout[]
  payoutsLoading: boolean
  payoutError: string | null
  processCycleInput: string
  onProcessCycleInputChange: (value: string) => void
  processingCycle: number | null
  onProcessPayout: () => void
  onRefresh: () => void
}

export function GroupPayoutsTab({
  circleId,
  payouts,
  payoutsLoading,
  payoutError,
  processCycleInput,
  onProcessCycleInputChange,
  processingCycle,
  onProcessPayout,
  onRefresh,
}: GroupPayoutsTabProps) {
  const [earlyPayouts, setEarlyPayouts] = useState<CircleEarlyPayout | null>(null)
  const [earlyPayoutError, setEarlyPayoutError] = useState<string | null>(null)
  useEffect(() => {
    getCircleEarlyPayouts(circleId).then(setEarlyPayouts).catch(err =>
      setEarlyPayoutError(err instanceof Error ? err.message : 'Could not load early payouts'),
    )
  }, [circleId])
  return (
    <Stack gap="lg">
      {/* Trigger payout action */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Text fw={600} fz="md" mb="md">Manually Trigger Payout</Text>
        <Group gap="sm" align="flex-end">
          <TextInput
            label="Cycle Number"
            placeholder="e.g. 1"
            radius="md"
            size="sm"
            value={processCycleInput}
            onChange={(e) => onProcessCycleInputChange(e.currentTarget.value.replace(/\D/g, ''))}
            styles={{ input: { border: '1px solid #dee2e6' }, root: { flex: 1, maxWidth: 180 } }}
          />
          <Button
            size="sm"
            radius="md"
            style={{ background: PRIMARY }}
            leftSection={<IconPlayerPlay size={14} />}
            loading={processingCycle !== null}
            disabled={!processCycleInput}
            onClick={onProcessPayout}
          >
            Process Payout
          </Button>
        </Group>
        {payoutError && (
          <Text fz="sm" c="red" mt="sm">{payoutError}</Text>
        )}
      </Paper>

      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Text fw={600} fz="md" mb="xs">Member Early Payouts</Text>
        {earlyPayoutError ? <Text role="alert" c="red" size="sm">Unable to load early-payout summary.</Text> : earlyPayouts === null ? <Loader size="sm" /> :
          <Group wrap="wrap">{[['Total', earlyPayouts.totalLoans], ['Active', earlyPayouts.activeCount], ['Repaid', earlyPayouts.repaidCount], ['Defaulted', earlyPayouts.defaultedCount], ['Cancelled', earlyPayouts.cancelledCount]].map(([label, count]) => <Text key={label}>{label}: {count}</Text>)}</Group>}

      </Paper>
      {/* Payout History */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" px="lg" py="md">
          <Text fw={600} fz="md">Payout History</Text>
          <Button
            variant="outline"
            size="xs"
            radius="md"
            leftSection={<IconRefresh size={13} />}
            style={{ borderColor: '#dee2e6', color: '#495057' }}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </Group>

        {payoutError ? <Text role="alert" c="red" p="lg">{payoutError}</Text> : payoutsLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color={PRIMARY} />
          </Group>
        ) : (
          <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 560 }}>
            <Table.Thead>
              <Table.Tr style={{ background: PRIMARY }}>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Cycle</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Recipient</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount paid out</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Settlement status</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payouts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center" py="xl" fz="sm">No payouts found for this circle</Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {payouts.map((p) => {
                const settlement = payoutSettlementDisplay(p.settlementStatus, p.amountPaidOut, p.status)
                const cycleNumber = p.cycleNumber
                const recipient = p.recipientName ?? 'Unassigned'
                const amountNaira = p.amountPaidOut == null ? 'Not settled' : formatKobo(p.amountPaidOut)
                return (
                  <Table.Tr key={p.cycleNumber}>
                    <Table.Td><Text fz="sm" fw={500}>{cycleNumber != null ? `Cycle ${cycleNumber}` : '-'}</Text></Table.Td>
                    <Table.Td>
                      <Group gap="sm" align="center">
                        <Avatar size={28} radius="xl" color="gray">{(recipient || '?').charAt(0)}</Avatar>
                        <Text fz="sm">{recipient}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm" fw={600}>
                        {amountNaira}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        radius="sm"
                        color={settlement.color}
                      >
                        {settlement.label}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm" c="dimmed">
                        {p.processedAt ? new Date(p.processedAt).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' }) : 'Not processed'}
                      </Text>
                    </Table.Td>

                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table></div>
        )}
      </Paper>
    </Stack>
  )
}
