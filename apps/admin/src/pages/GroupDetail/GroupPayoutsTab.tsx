import { Stack, Paper, Text, Group, Button, TextInput, Table, Avatar, Badge, Loader } from '@mantine/core'
import { IconPlayerPlay, IconRefresh, IconArrowBackUp } from '@tabler/icons-react'
import type { Payout } from '@/utils/api'

const PRIMARY = '#0b6b55'

interface GroupPayoutsTabProps {
  payouts: Payout[]
  payoutsLoading: boolean
  payoutError: string | null
  processCycleInput: string
  onProcessCycleInputChange: (value: string) => void
  processingCycle: number | null
  onProcessPayout: () => void
  onRefresh: () => void
  onRetryPayout: (payoutId: string) => void
  onReverseClick: (payout: Payout) => void
}

export function GroupPayoutsTab({
  payouts,
  payoutsLoading,
  payoutError,
  processCycleInput,
  onProcessCycleInputChange,
  processingCycle,
  onProcessPayout,
  onRefresh,
  onRetryPayout,
  onReverseClick,
}: GroupPayoutsTabProps) {
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

        {payoutsLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color={PRIMARY} />
          </Group>
        ) : (
          <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 560 }}>
            <Table.Thead>
              <Table.Tr style={{ background: PRIMARY }}>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Cycle</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Recipient</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date</Table.Th>
                <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payouts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="xl" fz="sm">No payouts found for this circle</Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {payouts.map((p) => {
                const statusColor =
                  p.status === 'SUCCESS' || p.status === 'COMPLETED'
                    ? { bg: '#e6f5f1', color: PRIMARY }
                    : p.status === 'FAILED'
                    ? { bg: '#fef2f2', color: '#e74c3c' }
                    : { bg: '#f1f3f5', color: '#868e96' }
                const cycleNumber = p.cycleNumber ?? p.schedule?.cycleNumber
                const recipient = p.recipient
                  ? `${p.recipient.firstName} ${p.recipient.lastName}`.trim()
                  : '—'
                const amountNaira = (Number(p.amount) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
                return (
                  <Table.Tr key={p.id}>
                    <Table.Td><Text fz="sm" fw={500}>{cycleNumber != null ? `Cycle ${cycleNumber}` : '—'}</Text></Table.Td>
                    <Table.Td>
                      <Group gap="sm" align="center">
                        <Avatar size={28} radius="xl" color="gray">{(recipient || '?').charAt(0)}</Avatar>
                        <Text fz="sm">{recipient}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm" fw={600}>
                        ₦{amountNaira}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        radius="sm"
                        style={{ background: statusColor.bg, color: statusColor.color, border: 'none', fontWeight: 600 }}
                      >
                        {p.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm" c="dimmed">
                        {p.processedAt ? new Date(p.processedAt).toLocaleDateString('en-NG') : p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-NG') : '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {p.status === 'FAILED' && (
                          <Button
                            variant="subtle"
                            size="xs"
                            px="xs"
                            leftSection={<IconRefresh size={12} />}
                            style={{ color: '#e67e22' }}
                            onClick={() => onRetryPayout(p.id)}
                          >
                            Retry
                          </Button>
                        )}
                        {/* Reversal is an admin recovery tool for a payout still
                            stuck mid-flight (PENDING/PROCESSING). A COMPLETED/settled
                            payout is not reversible — the backend rejects it too, this
                            isn't just a hidden-but-callable button. */}
                          {(p.status === 'PENDING' || p.status === 'PROCESSING') && (
                          <Button
                            variant="subtle"
                            size="xs"
                            px="xs"
                            leftSection={<IconArrowBackUp size={12} />}
                            style={{ color: '#e74c3c' }}
                            onClick={() => onReverseClick(p)}
                          >
                            Reverse
                          </Button>
                        )}
                      </Group>
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
