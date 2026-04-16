import { useEffect, useState } from 'react'
import { SimpleGrid, Grid, Stack, Skeleton, Alert } from '@mantine/core'
import { IconUsers, IconTopologyRing, IconWallet, IconAlertCircle } from '@tabler/icons-react'
import { StatsCard } from '@/components/StatsCard'
import { UsersEngagementChart, AnalyticsDonutChart } from '@/components/charts'
import { RecentActivities } from '@/components/RecentActivities'
import { QuickActions } from '@/components/QuickActions'
import { getDashboardStats, getGrowthMetrics, type DashboardStats, type GrowthMetrics } from '@/utils/api'

function formatNaira(nairaStr: string) {
  const num = parseFloat(nairaStr)
  if (isNaN(num)) return '₦0'
  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `₦${(num / 1_000).toFixed(1)}K`
  return `₦${num.toFixed(2)}`
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [growth, setGrowth] = useState<GrowthMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getGrowthMetrics({ period: '30d' }),
    ])
      .then(([s, g]) => {
        setStats(s)
        setGrowth(g)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Skeleton h={120} radius="md" />
          <Skeleton h={120} radius="md" />
          <Skeleton h={120} radius="md" />
        </SimpleGrid>
        <Skeleton h={320} radius="md" />
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Skeleton h={300} radius="md" />
          <Skeleton h={300} radius="md" />
        </SimpleGrid>
      </Stack>
    )
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
        {error}
      </Alert>
    )
  }

  const userSparkline = growth?.timeSeries.users.map((p) => p.count) ?? []
  const circleSparkline = growth?.timeSeries.circles.map((p) => p.count) ?? []

  const totalWalletNaira = stats
    ? (parseFloat(stats.wallet.totalUserBalanceNaira) + parseFloat(stats.wallet.platformPoolNaira)).toFixed(2)
    : '0.00'

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatsCard
          title="Total Users"
          value={stats?.users.total.toLocaleString() ?? '—'}
          badgeText={stats?.users.newThisWeek ? `+${stats.users.newThisWeek} this week` : undefined}
          icon={<IconUsers size={24} color="#0B6B55" stroke={1.5} />}
          sparklineData={userSparkline.length > 0 ? userSparkline : [0]}
        />
        <StatsCard
          title="ROSCA Circles"
          value={stats?.circles.total.toLocaleString() ?? '—'}
          badgeText={stats?.circles.active ? `${stats.circles.active} active` : undefined}
          icon={<IconTopologyRing size={24} color="#0B6B55" stroke={1.5} />}
          sparklineData={circleSparkline.length > 0 ? circleSparkline : [0]}
        />
        <StatsCard
          title="Platform Wallet"
          value={formatNaira(totalWalletNaira)}
          badgeText={stats ? `Pool: ${formatNaira(stats.wallet.platformPoolNaira)}` : undefined}
          icon={<IconWallet size={24} color="#0B6B55" stroke={1.5} />}
          sparklineData={[20, 30, 25, 45, 35, 50, 48, 55, 52]}
        />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <UsersEngagementChart
            userSeries={growth?.timeSeries.users}
            circleSeries={growth?.timeSeries.circles}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <AnalyticsDonutChart kyc={stats?.kyc} />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <RecentActivities />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <QuickActions />
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
