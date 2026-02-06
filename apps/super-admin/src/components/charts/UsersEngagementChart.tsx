import { Card, Text, Group } from '@mantine/core'
import { LineChart } from '@mantine/charts'

const data = [
  { day: '1', users: 40, active: 20, new: 10 },
  { day: '4', users: 55, active: 35, new: 15 },
  { day: '8', users: 50, active: 30, new: 12 },
  { day: '12', users: 60, active: 40, new: 18 },
  { day: '16', users: 65, active: 42, new: 20 },
  { day: '20', users: 42, active: 55, new: 35 },
  { day: '24', users: 50, active: 30, new: 25 },
  { day: '28', users: 55, active: 35, new: 20 },
  { day: '31', users: 60, active: 40, new: 22 },
]

export function UsersEngagementChart() {
  return (
    <Card withBorder p="lg" radius="md" h="100%">
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="lg">
          Users Engagement
        </Text>
        <Text fz="xs" c="dimmed">
          ...
        </Text>
      </Group>

      <LineChart
        h={250}
        data={data}
        dataKey="day"
        series={[
          { name: 'users', color: '#0B6B55' },
          { name: 'active', color: '#F472B6' },
          { name: 'new', color: '#A78BFA' },
        ]}
        curveType="natural"
        withDots={false}
        gridAxis="y"
        tickLine="none"
      />
    </Card>
  )
}
