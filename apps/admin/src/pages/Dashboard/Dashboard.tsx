import { Stack, Grid, Text, Box, SimpleGrid, Button } from '@mantine/core'
import { StatsCard } from '@/components/StatsCard'
import { GroupTable } from '@/components/GroupTable'
import { QuickActions } from '@/components/QuickActions'

const PRIMARY = '#0b6b55'

export function Dashboard() {
  return (
    <Stack gap="lg">
      {/* Page heading */}
      <Box>
        <Text fz={22} fw={700} mb={2}>
          Hi, Admin
        </Text>
        <Text fz="sm" c="dimmed">
          Here's today's ROSCA snapshot
        </Text>
      </Box>

      {/* Stats cards — 3 columns matching the screenshot */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatsCard
          title="Total Groups"
          value="23"
          subtitle="Active"
          withBar
        />
        <StatsCard
          title="Next Payout"
          value="May 12, 2026"
          subtitle="Monthly 50k Squad"
        />
        <StatsCard
          title="Pending Join Request"
          value="5"
          subtitle="MamaGoals + 1"
        />
      </SimpleGrid>

      {/* Main content: table + quick actions */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <GroupTable />
          <Box mt="sm">
            <Button
              style={{ background: PRIMARY }}
              radius="md"
              px="xl"
            >
              View All Groups
            </Button>
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <QuickActions />
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
