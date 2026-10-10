import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import {
  IconArrowUpRight,
  IconBookmarks,
  IconCheck,
  IconChevronRight,
  IconClockPause,
  IconGauge,
  IconLock,
  IconPlayerPlay,
  IconPlus,
  IconShieldCheck,
  IconTarget,
  IconUsersGroup,
  IconWallet,
} from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import { StatsCard } from '@/components/StatsCard'
import { TrustScoreCard, CreditScoreCard } from '@/components/ScoreCards'
import { QuickActions } from '@/components/QuickActions'
import { SummaryCard } from '@/components/SumaryCard'
import { useWalletPrivacy } from '@/hooks/useWalletPrivacy'
import { WalletReservations } from '@/components/WalletReservations'
import {
  getTrustScore,
  getWalletBalance,
  getCreditScore,
  getAdminDashboard,
  listAllRoscaCircles,
  type AdminDashboard,
  type RoscaCircle,
  type TrustScore,
} from '@/utils/api'
import { getMyTargetSavings, type TargetSavingsPlan } from '@/utils/targetSavingsApi'
import { getGroupDisplayStatus } from '@/utils/group-display'

const PRIMARY = '#0b6b55'
const unavailableValue = <Text component="span" c="dimmed">—</Text>

const toNaira = (koboStr: string | number | undefined): number =>
  Number(koboStr ?? 0) / 100

const money = (n: number): string =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function Dashboard() {
  const navigate = useNavigate()
  const [trustScoreData, setTrustScoreData] = useState<TrustScore | null>(null)
  const [creditScore, setCreditScore] = useState<number | null>(null)
  const [wallet, setWallet] = useState<{ total: number; available: number; reserved: number } | null>(null)
  const { hidden, toggle } = useWalletPrivacy()
  const [dashStats, setDashStats] = useState<AdminDashboard | null>(null)
  const [circles, setCircles] = useState<RoscaCircle[]>([])
  const [targetPlans, setTargetPlans] = useState<TargetSavingsPlan[]>([])

  const [reservedOpen, setReservedOpen] = useState(false)
  const [trustOpen, setTrustOpen] = useState(false)
  const [creditOpen, setCreditOpen] = useState(false)

  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}')
  const [adminName] = useState(
    [storedUser.firstName, storedUser.lastName].filter(Boolean).join(' ') || '',
  )

  useEffect(() => {
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
      getWalletBalance()
        .then((data) =>
          setWallet({
            total: toNaira(data.total ?? '0'),
            available: toNaira(data.available ?? '0'),
            reserved: toNaira(data.reserved ?? '0'),
          }),
        )
        .catch(() => setWallet({ total: 0, available: 0, reserved: 0 })),
      listAllRoscaCircles()
        .then(setCircles)
        .catch(() => setCircles([])),
      getMyTargetSavings()
        .then(setTargetPlans)
        .catch(() => setTargetPlans([])),
    ])
  }, [])

  const bucketCounts = useMemo(() => {
    const counts = { Active: 0, 'Not Ready': 0, Ready: 0, Completed: 0 } as Record<string, number>
    for (const c of circles) {
      const status = getGroupDisplayStatus(c)
      counts[status] = (counts[status] ?? 0) + 1
    }
    return {
      active: counts.Active,
      notReady: counts['Not Ready'],
      ready: counts.Ready,
      completed: counts.Completed,
      targetSavings: targetPlans.length,
    }
  }, [circles, targetPlans])

  return (
    <Stack gap="lg">
      {/* ─── Greeting ─────────────────────────────────────────────── */}
      <Box>
        <Text fz={22} fw={700}>
          Hi, {adminName || 'there'}
        </Text>
        <Text fz="sm" c="dimmed">
          Here's today's ajo snapshot
        </Text>
      </Box>

      {/* ─── Wallet trio ──────────────────────────────────────────── */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <SummaryCard
          title="Total Balance"
          amount={wallet ? money(wallet.total) : '-'}
          gradient="linear-gradient(135deg, #1F4037 0%, #99F2C8 100%)"
          hideable
          hidden={hidden}
          onToggleHidden={toggle}
        />
        <SummaryCard
          title="Available"
          amount={wallet ? money(wallet.available) : '-'}
          gradient="linear-gradient(135deg, #9EB6E5 0%, #D6E4FF 100%)"
          hidden={hidden}
        />
        <SummaryCard
          title="Reserved"
          amount={wallet ? money(wallet.reserved) : '-'}
          gradient="linear-gradient(135deg, #A8D8B9 0%, #DFF3E7 100%)"
          hidden={hidden}
        />
      </SimpleGrid>

      {/* ─── Icon action strip ────────────────────────────────────── */}
      <Paper withBorder radius="md" p="sm">
        <SimpleGrid cols={{ base: 3, sm: 5 }} spacing="xs">
          <IconTile
            icon={<IconPlus size={20} />}
            label="Fund wallet"
            onClick={() => navigate('/fund-wallet')}
          />
          <IconTile
            icon={<IconArrowUpRight size={20} />}
            label="Withdraw"
            onClick={() => navigate('/withdraw')}
          />
          <IconTile
            icon={<IconLock size={20} />}
            label="Where it's reserved"
            onClick={() => setReservedOpen(true)}
          />
          <IconTile
            icon={<IconShieldCheck size={20} />}
            label="Trust score"
            badge={trustScoreData ? String(trustScoreData.trustScore ?? 0) : undefined}
            onClick={() => setTrustOpen(true)}
          />
          <IconTile
            icon={<IconGauge size={20} />}
            label="Credit score"
            badge={creditScore !== null ? String(creditScore) : undefined}
            onClick={() => setCreditOpen(true)}
          />
        </SimpleGrid>
      </Paper>

      {/* ─── Create-pair ──────────────────────────────────────────── */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <CreateCard
          icon={<IconUsersGroup size={22} />}
          title="Create an Ajo group"
          subtitle="Set up a new rotating savings circle"
          cta="Create"
          onClick={() => navigate('/create-group')}
        />
        <CreateCard
          icon={<IconTarget size={22} />}
          title="Create Target Savings"
          subtitle="Lock funds toward a specific goal"
          cta="Create"
          onClick={() => navigate('/target-savings?create=1')}
        />
      </SimpleGrid>

      {/* ─── 3-stat row (unchanged) ───────────────────────────────── */}
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

      {/* ─── Group buckets ────────────────────────────────────────── */}
      <Box>
        <Group justify="space-between" align="flex-end" mb="sm">
          <Box>
            <Text fw={700} fz="lg">Groups you administer</Text>
            <Text fz="xs" c="dimmed">
              Ajo circles you created and manage · Target savings you set up
            </Text>
          </Box>
          <Text
            fz="xs"
            c="dimmed"
            style={{ fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.08em' }}
          >
            Tap a tile to drill in
          </Text>
        </Group>
        <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="xs">
          <BucketTile
            tone="active"
            icon={<IconPlayerPlay size={14} />}
            label="Active"
            count={bucketCounts.active}
            context="Running now"
            onClick={() => navigate('/rosca/groups?status=active')}
          />
          <BucketTile
            tone="notready"
            icon={<IconClockPause size={14} />}
            label="Not Ready"
            count={bucketCounts.notReady}
            context="Waiting for members"
            onClick={() => navigate('/rosca/groups?status=not-ready')}
          />
          <BucketTile
            tone="ready"
            icon={<IconBookmarks size={14} />}
            label="Ready"
            count={bucketCounts.ready}
            context="All slots filled — activate"
            onClick={() => navigate('/rosca/groups?status=ready')}
          />
          <BucketTile
            tone="completed"
            icon={<IconCheck size={14} />}
            label="Completed"
            count={bucketCounts.completed}
            context="Finished cycles"
            onClick={() => navigate('/rosca/groups?status=completed')}
          />
          <BucketTile
            tone="target"
            icon={<IconTarget size={14} />}
            label="Target Savings"
            count={bucketCounts.targetSavings}
            context="Goal-based plans"
            onClick={() => navigate('/target-savings')}
          />
        </SimpleGrid>
      </Box>

      {/* ─── Sidebar — QuickActions ───────────────────────────────── */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder p="lg" radius="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <Box>
                <Text fw={700} fz="sm">Need the full admin groups list?</Text>
                <Text fz="xs" c="dimmed">Browse, filter, archive, invite, and manage every ajo circle you administer.</Text>
              </Box>
              <Button
                component={Link}
                to="/rosca/groups"
                size="sm"
                variant="light"
                color="green"
                rightSection={<IconChevronRight size={16} />}
              >
                Open admin groups
              </Button>
            </Group>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <QuickActions />
        </Grid.Col>
      </Grid>

      {/* ─── Modals (icon-strip targets) ──────────────────────────── */}
      <Modal
        opened={reservedOpen}
        onClose={() => setReservedOpen(false)}
        title={
          <Group gap="xs">
            <IconWallet size={18} color={PRIMARY} />
            <Text fw={700}>Where your money is reserved</Text>
          </Group>
        }
        size="lg"
        centered
      >
        <WalletReservations />
      </Modal>

      <Modal
        opened={trustOpen}
        onClose={() => setTrustOpen(false)}
        title={
          <Group gap="xs">
            <IconShieldCheck size={18} color={PRIMARY} />
            <Text fw={700}>Trust score</Text>
          </Group>
        }
        size="md"
        centered
      >
        <TrustScoreCard
          score={trustScoreData?.trustScore ?? null}
          breakdown={trustScoreData?.atiBreakdown}
        />
      </Modal>

      <Modal
        opened={creditOpen}
        onClose={() => setCreditOpen(false)}
        title={
          <Group gap="xs">
            <IconGauge size={18} color={PRIMARY} />
            <Text fw={700}>Credit score</Text>
          </Group>
        }
        size="md"
        centered
      >
        <CreditScoreCard score={creditScore} />
      </Modal>
    </Stack>
  )
}

// ─── Small helper components (co-located) ───────────────────────────

function IconTile({
  icon,
  label,
  onClick,
  badge,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  badge?: string
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      aria-label={label}
      style={{
        padding: '12px 6px',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F1F5F3')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <Box
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#E7F4EE',
          color: PRIMARY,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
        {badge && (
          <Badge
            size="xs"
            color="green"
            variant="filled"
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              padding: '0 5px',
              fontSize: 10,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {badge}
          </Badge>
        )}
      </Box>
      <Text fz="xs" fw={500} ta="center" style={{ lineHeight: 1.3 }}>
        {label}
      </Text>
    </UnstyledButton>
  )
}

function CreateCard({
  icon,
  title,
  subtitle,
  cta,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  cta: string
  onClick: () => void
}) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group gap="md" wrap="nowrap">
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: '#E7F4EE',
            color: PRIMARY,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} fz="sm" lh={1.2}>{title}</Text>
          <Text fz="xs" c="dimmed" mt={2} lh={1.4}>{subtitle}</Text>
        </Box>
        <Button
          size="xs"
          onClick={onClick}
          style={{ background: PRIMARY, flexShrink: 0 }}
          leftSection={<IconPlus size={14} />}
        >
          {cta}
        </Button>
      </Group>
    </Paper>
  )
}

const BUCKET_TONES = {
  active:    { bg: '#D1F2DE', fg: '#056148', number: '#0B6B55', border: '#BFE0CC' },
  notready:  { bg: '#FEF3C7', fg: '#92400E', number: '#92400E', border: '#FDE68A' },
  ready:     { bg: '#DBEAFE', fg: '#1E40AF', number: '#1E40AF', border: '#BFDBFE' },
  completed: { bg: '#E5E7EB', fg: '#374151', number: '#374151', border: '#D1D5DB' },
  target:    { bg: '#CFEBF8', fg: '#075985', number: '#075985', border: '#BAE0F3' },
} as const

function BucketTile({
  tone,
  icon,
  label,
  count,
  context,
  onClick,
}: {
  tone: keyof typeof BUCKET_TONES
  icon: React.ReactNode
  label: string
  count: number
  context: string
  onClick: () => void
}) {
  const t = BUCKET_TONES[tone]
  return (
    <UnstyledButton
      onClick={onClick}
      aria-label={`${label} — ${count}`}
      style={{
        padding: '16px 14px 14px',
        background: '#FFFFFF',
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'stretch',
        textAlign: 'left',
        transition: 'transform 0.12s, box-shadow 0.12s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-1px)'
        el.style.boxShadow = '0 4px 10px rgba(15, 23, 42, 0.05)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'none'
        el.style.boxShadow = 'none'
      }}
    >
      <Group gap={6} align="center">
        <Box
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: t.bg,
            color: t.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Text
          fz={11}
          fw={700}
          c={t.fg}
          style={{ letterSpacing: '0.4px', textTransform: 'uppercase' }}
        >
          {label}
        </Text>
      </Group>
      <Text
        fz={34}
        fw={700}
        style={{
          color: t.number,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.015em',
        }}
      >
        {count}
      </Text>
      <Text fz="xs" c="dimmed" lh={1.3}>
        {context}
      </Text>
    </UnstyledButton>
  )
}
