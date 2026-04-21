import { Card, Text, Group, SegmentedControl } from '@mantine/core'
import { LineChart } from '@mantine/charts'
import { useState } from 'react'

interface SeriesPoint {
  date: string
  count: number
}

interface UsersEngagementChartProps {
  userSeries?: SeriesPoint[]
  circleSeries?: SeriesPoint[]
}

function buildChartData(userSeries: SeriesPoint[], circleSeries: SeriesPoint[]) {
  // Merge the two series by date
  const map: Record<string, { date: string; users: number; circles: number }> = {}
  for (const p of userSeries) {
    map[p.date] = { date: p.date, users: p.count, circles: 0 }
  }
  for (const p of circleSeries) {
    if (map[p.date]) map[p.date].circles = p.count
    else map[p.date] = { date: p.date, users: 0, circles: p.count }
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

const FALLBACK = [
  { date: '', users: 0, circles: 0 },
]

export function UsersEngagementChart({ userSeries = [], circleSeries = [] }: UsersEngagementChartProps) {
  const [view, setView] = useState<'30d' | '7d'>('30d')

  const data = userSeries.length > 0 || circleSeries.length > 0
    ? buildChartData(userSeries, circleSeries)
    : FALLBACK

  // For 7d slice the last 7 points
  const displayed = view === '7d' ? data.slice(-7) : data

  return (
    <Card withBorder p="lg" radius="md" h="100%">
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="lg">
          Platform Growth
        </Text>
        <SegmentedControl
          size="xs"
          value={view}
          onChange={(v) => setView(v as '30d' | '7d')}
          data={[
            { label: '7d', value: '7d' },
            { label: '30d', value: '30d' },
          ]}
        />
      </Group>

      <LineChart
        h={250}
        data={displayed}
        dataKey="date"
        series={[
          { name: 'users', label: 'New Users', color: '#0B6B55' },
          { name: 'circles', label: 'New Circles', color: '#F472B6' },
        ]}
        curveType="natural"
        withDots={false}
        gridAxis="y"
        tickLine="none"
      />
    </Card>
  )
}
