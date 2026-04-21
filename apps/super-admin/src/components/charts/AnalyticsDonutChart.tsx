import { Card, Text, Group, Stack, Box } from '@mantine/core'
import { DonutChart } from '@mantine/charts'

interface KycStats {
  pending: number
  approved: number
  rejected: number
}

interface AnalyticsDonutChartProps {
  kyc?: KycStats
}

export function AnalyticsDonutChart({ kyc }: AnalyticsDonutChartProps) {
  const pending = kyc?.pending ?? 0
  const approved = kyc?.approved ?? 0
  const rejected = kyc?.rejected ?? 0
  const total = pending + approved + rejected

  const data = total > 0
    ? [
        { name: 'Approved', value: approved, color: '#0B6B55' },
        { name: 'Pending', value: pending, color: '#F59E0B' },
        { name: 'Rejected', value: rejected, color: '#EF4444' },
      ]
    : [{ name: 'No data', value: 1, color: '#E5E7EB' }]

  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

  return (
    <Card withBorder p="lg" radius="md" h="100%">
      <Text fw={600} fz="lg" mb="md">
        KYC Overview
      </Text>

      <Stack align="center" gap="md">
        <DonutChart
          data={data}
          size={180}
          thickness={24}
          tooltipDataSource="segment"
          chartLabel={total > 0 ? `${approvalRate}%` : '—'}
          paddingAngle={2}
        />

        <Stack gap={6} w="100%">
          {[
            { label: 'Approved', value: approved, color: '#0B6B55' },
            { label: 'Pending', value: pending, color: '#F59E0B' },
            { label: 'Rejected', value: rejected, color: '#EF4444' },
          ].map((item) => (
            <Group key={item.label} justify="space-between">
              <Group gap={6}>
                <Box w={10} h={10} style={{ borderRadius: '50%', backgroundColor: item.color }} />
                <Text fz="xs" c="dimmed">{item.label}</Text>
              </Group>
              <Text fz="xs" fw={600}>{item.value}</Text>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
