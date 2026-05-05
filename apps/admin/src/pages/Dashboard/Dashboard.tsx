import { useState, useEffect } from 'react'
import { Stack, Grid, Text, Box, SimpleGrid, Button, Group, Paper } from '@mantine/core'
import { IconArrowUpRight, IconPlus } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { StatsCard } from '@/components/StatsCard'
import { TrustScoreCard, CreditScoreCard } from '@/components/ScoreCards'
import { GroupTable } from '@/components/GroupTable'
import { QuickActions } from '@/components/QuickActions'
import { getTrustScore, getAdminWalletBalance, getWalletBalance, getCreditScore, getAdminDashboard, getUserProfile, type AdminDashboard, type TrustScore } from '@/utils/api'

const PRIMARY = '#0b6b55'

export function Dashboard() {
  const [trustScoreData, setTrustScoreData] = useState<TrustScore | null>(null)
  const [creditScore, setCreditScore] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [dashStats, setDashStats] = useState<AdminDashboard | null>(null)
  const [adminName, setAdminName] = useState('')

  const storedUser = JSON.parse(localStorage.getItem('admin_user') ?? '{}')
  const userId = storedUser.id ?? storedUser._id ?? ''

  useEffect(() => {
    getAdminDashboard()
      .then(setDashStats)
      .catch(() => {})

    getUserProfile()
      .then((p) => setAdminName(`${p.firstName} ${p.lastName}`.trim()))
      .catch(() => {})

    getTrustScore()
      .then((res) => setTrustScoreData(res))
      .catch(() => setTrustScoreData({ trustScore: 0 }))

    getCreditScore()
      .then((res) => { const r = res as Record<string, number>; setCreditScore(r.trustDisplayScore ?? r.finalScore ?? r.externalScore ?? r.compositeScore ?? r.score ?? 0) })
      .catch(() => setCreditScore(0))

    const balanceFetch = userId
      ? getAdminWalletBalance(userId)
          .then((data) => setBalance(data.available ?? data.total ?? 0))
          .catch(() =>
            getWalletBalance()
              .then((data) => setBalance(Number(data.available ?? data.total ?? 0) / 100))
              .catch(() => setBalance(0)),
          )
      : getWalletBalance()
          .then((data) => setBalance(Number(data.available ?? data.total ?? 0) / 100))
          .catch(() => setBalance(0))
    void balanceFetch
  }, [userId])

  return (
    <Stack gap="lg">
      {/* Page heading */}
      <Box>
        <Text fz={22} fw={700} mb={2}>
          Hi, {adminName || 'Admin'}
        </Text>
        <Text fz="sm" c="dimmed">
          Here's today's ROSCA snapshot
        </Text>
      </Box>

      {/* Stats cards — 3 columns matching the screenshot */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatsCard
          title="Total Groups"
          value={dashStats ? String(dashStats.totalGroups) : '—'}
          subtitle="Active"
          withBar
        />
        <StatsCard
          title="Next Deadline"
          value={
            dashStats?.nextDeadline
              ? new Date(dashStats.nextDeadline.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'
          }
          subtitle={dashStats?.nextDeadline?.groupName ?? ''}
        />
        <StatsCard
          title="Pending Join Requests"
          value={dashStats ? String(dashStats.pendingJoinRequests.total) : '—'}
          subtitle={
            dashStats?.pendingJoinRequests.breakdown.length
              ? dashStats.pendingJoinRequests.breakdown.map((b) => b.groupName).join(', ')
              : ''
          }
        />
      </SimpleGrid>

      {/* Wallet quick actions */}
      <Paper p="lg" radius="md" style={{ background: '#02A36E' }}>
        <Group justify="space-between" align="center">
          <Box>
            <Text fz="xs" c="white" opacity={0.7}>Wallet Balance</Text>
            <Text fz={28} fw={700} c="white" lh={1.2}>
              {balance === null ? '...' : `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
            </Text>
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
        <TrustScoreCard score={trustScoreData?.trustScore ?? null} breakdown={trustScoreData?.atiBreakdown} />
        <CreditScoreCard score={creditScore} />
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
