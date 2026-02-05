import { SimpleGrid, Grid, Stack } from '@mantine/core'
import { IconUsers, IconTopologyRing, IconWallet } from '@tabler/icons-react'
import { StatsCard } from '@/components/StatsCard'
import { UsersEngagementChart, AnalyticsDonutChart } from '@/components/charts'
import { RecentActivities } from '@/components/RecentActivities'
import { QuickActions } from '@/components/QuickActions'

export function Dashboard() {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatsCard
          title="Total Users"
          value="12,453"
          badgeText="+10 New Added"
          icon={<IconUsers size={24} color="#0B6B55" stroke={1.5} />}
          sparklineData={[30, 40, 35, 50, 45, 60, 55, 65, 60]}
        />
        <StatsCard
          title="ROSCA Groups"
          value="102"
          badgeText="+2 New Created"
          icon={<IconTopologyRing size={24} color="#0B6B55" stroke={1.5} />}
          sparklineData={[15, 25, 20, 35, 30, 40, 38]}
        />
        <StatsCard
          title="Overall Wallet"
          value="102,31,888"
          icon={<IconWallet size={24} color="#0B6B55" stroke={1.5} />}
          sparklineData={[20, 30, 25, 45, 35, 50, 48, 55, 52]}
        />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <UsersEngagementChart />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <AnalyticsDonutChart />
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
