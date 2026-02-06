import { Card, Text, Group, Stack, Box } from '@mantine/core'
import { DonutChart } from '@mantine/charts'

const data = [
  { name: 'Transactions', value: 80, color: '#0B6B55' },
  { name: 'Inflow', value: 12, color: '#F59E0B' },
  { name: 'Outflow', value: 8, color: '#F97316' },
]

export function AnalyticsDonutChart() {
  return (
    <Card withBorder p="lg" radius="md" h="100%">
      <Text fw={600} fz="lg" mb="md">
        Analytics
      </Text>

      <Stack align="center" gap="md">
        <DonutChart
          data={data}
          size={180}
          thickness={24}
          tooltipDataSource="segment"
          chartLabel="80%"
          paddingAngle={2}
        />

        <Group gap="lg" justify="center">
          {[
            { label: 'Users', color: '#0B6B55' },
            { label: 'Inflow', color: '#F59E0B' },
            { label: 'Outflow', color: '#F97316' },
          ].map((item) => (
            <Group key={item.label} gap={6}>
              <Box
                w={10}
                h={10}
                style={{ borderRadius: '50%', backgroundColor: item.color }}
              />
              <Text fz="xs" c="dimmed">
                {item.label}
              </Text>
            </Group>
          ))}
        </Group>
      </Stack>
    </Card>
  )
}
