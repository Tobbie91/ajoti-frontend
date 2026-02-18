import { Stack, Grid, Text, Box, SimpleGrid, Button, Group, Paper } from '@mantine/core'
import { IconArrowUpRight, IconPlus } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { StatsCard } from '@/components/StatsCard'
import { TrustScoreCard, CreditScoreCard } from '@/components/ScoreCards'
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

      {/* Wallet quick actions */}
      <Paper p="lg" radius="md" style={{ background: '#02A36E' }}>
        <Group justify="space-between" align="center">
          <Box>
            <Text fz="xs" c="white" opacity={0.7}>Wallet Balance</Text>
            <Text fz={28} fw={700} c="white" lh={1.2}>₦10,000.00</Text>
          </Box>
          <Group gap="sm">
            <Button
              component={Link}
              to="/fund-wallet"
              radius="md"
              size="sm"
              leftSection={<IconPlus size={16} />}
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              Fund Wallet
            </Button>
            <Button
              component={Link}
              to="/withdraw"
              radius="md"
              size="sm"
              leftSection={<IconArrowUpRight size={16} />}
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              Withdraw
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Trust Score & Credit Score */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TrustScoreCard score={72} />
        <CreditScoreCard score={685} />
      </SimpleGrid>

      {/* Main content: table + quick actions */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <GroupTable />
          <Box mt="sm">
            <Button
              component={Link}
              to="/rosca/groups"
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
