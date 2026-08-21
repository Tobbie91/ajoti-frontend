import { useEffect, useState } from 'react'
import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconArrowUpRight,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMinus,
  IconPlus,
} from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { StatsCard } from '@/components/StatsCard'
import { TrustScoreCard, CreditScoreCard } from '@/components/ScoreCards'
import { GroupTable } from '@/components/GroupTable'
import { QuickActions } from '@/components/QuickActions'
import { useWalletPrivacy } from '@/hooks/useWalletPrivacy'
import {
  getTrustScore,
  getAdminWalletBalance,
  getWalletBalance,
  getCreditScore,
  getAdminDashboard,
  type AdminDashboard,
  type TrustScore,
} from '@/utils/api'

const PRIMARY = '#0b6b55'
const unavailableValue = <IconMinus size={32} stroke={1.75} aria-label="Not available" />

export function Dashboard() {
  const [trustScoreData, setTrustScoreData] = useState<TrustScore | null>(null)
  const [creditScore, setCreditScore] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const { hidden, toggle } = useWalletPrivacy()
  const [dashStats, setDashStats] = useState<AdminDashboard | null>(null)
  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}')
  const [adminName] = useState(
    [storedUser.firstName, storedUser.lastName].filter(Boolean).join(' ') || '',
  )
  const userId = storedUser.id ?? storedUser._id ?? ''

  useEffect(() => {
    const balancePromise = userId
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

    Promise.allSettled([
      getAdminDashboard().then(setDashStats),
      getTrustScore()
        .then(setTrustScoreData)
        .catch(() => setTrustScoreData({ trustScore: 0 })),
      getCreditScore()
        .then((response) => {
          const score = response as Record<string, number>
          setCreditScore(
            score.trustDisplayScore ??
              score.finalScore ??
              score.externalScore ??
              score.compositeScore ??
              score.score ??
              0,
          )
        })
        .catch(() => setCreditScore(0)),
      balancePromise,
    ])
  }, [userId])

  return (
    <Stack gap="lg">
      <Box>
        <Text fz={22} fw={700}>
          Hi, {adminName || 'Admin'}
        </Text>
        <Text fz="sm" c="dimmed">
          Here's today's ajo snapshot
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatsCard
          title="Total Groups"
          value={dashStats ? String(dashStats.totalGroups) : unavailableValue}
          subtitle="Active"
          withBar
        />
        <StatsCard
          title="Next Deadline"
          value={
            dashStats?.nextDeadline
              ? new Date(dashStats.nextDeadline.deadline).toLocaleDateString('en-NG')
              : unavailableValue
          }
          subtitle={dashStats?.nextDeadline?.groupName ?? ''}
        />
        <StatsCard
          title="Pending Join Requests"
          value={
            dashStats ? String(dashStats.pendingJoinRequests.total) : unavailableValue
          }
          subtitle=""
        />
      </SimpleGrid>

      <Paper p="lg" radius="md" style={{ background: '#02A36E' }}>
        <Group justify="space-between">
          <Box>
            <Group gap="xs">
              <Text fz="xs" c="white" opacity={0.7}>
                Wallet Balance
              </Text>
              <ActionIcon
                variant="subtle"
                aria-label={hidden ? 'Show wallet balance' : 'Hide wallet balance'}
                onClick={toggle}
                style={{ color: 'white' }}
              >
                {hidden ? <IconEye size={18} /> : <IconEyeOff size={18} />}
              </ActionIcon>
            </Group>
            {balance === null ? (
              <Text fz={28} fw={700} c="white">
                Loading
              </Text>
            ) : hidden ? (
              <IconLock
                size={25}
                color="white"
                aria-label="Wallet balance hidden"
                style={{ display: 'block', marginTop: 4 }}
              />
            ) : (
              <Text fz={28} fw={700} c="white">
                ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </Box>
          <Group gap="sm">
            <Button
              component={Link}
              to="/fund-wallet"
              leftSection={<IconPlus size={16} />}
              style={{ background: 'rgba(255,255,255,.2)' }}
            >
              Fund Wallet
            </Button>
            <Button
              component={Link}
              to="/withdraw"
              leftSection={<IconArrowUpRight size={16} />}
              style={{ background: 'rgba(255,255,255,.2)' }}
            >
              Withdraw
            </Button>
          </Group>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TrustScoreCard
          score={trustScoreData?.trustScore ?? null}
          breakdown={trustScoreData?.atiBreakdown}
        />
        <CreditScoreCard score={creditScore} />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <GroupTable />
          <Box mt="sm">
            <Button component={Link} to="/rosca/groups" style={{ background: PRIMARY }}>
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
