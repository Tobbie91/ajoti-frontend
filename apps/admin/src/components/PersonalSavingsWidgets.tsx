import { useEffect, useState } from 'react'
import { Anchor, Button, Paper, SimpleGrid, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { getMyContributionsSummary } from '@/utils/api'
import { formatKobo, kobo } from '@/utils/kobo'
import type { TargetSavingsPlan } from '@/utils/targetSavingsApi'

type Props = { targetPlans: TargetSavingsPlan[]; targetSavingsError: boolean; hidden: boolean }

export function PersonalSavingsWidgets({ targetPlans, targetSavingsError, hidden }: Props) {
  const [contributions, setContributions] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    setFailed(false)
    setContributions(null)
    getMyContributionsSummary().then(summary => {
      const amount = kobo(summary.activeAjosContributionsKobo)
      if (amount === null || amount < 0n) throw new Error('Invalid contribution summary')
      if (current) setContributions(amount.toString())
    }).catch(() => { if (current) setFailed(true) })
    return () => { current = false }
  }, [attempt])

  const matured = targetPlans.filter(plan => {
    const saved = kobo(plan.myMembership?.savedAmountKobo)
    return plan.status === 'MATURED' && plan.myMembership?.status === 'COMPLETED'
      && saved !== null && saved > 0n
      && !plan.investment?.enabled && plan.investment?.lifecycleStatus === 'LEGACY'
  })
  const amountLabel = (value: string) => hidden ? '₦••••' : formatKobo(value)
  return (
    <Stack gap="xs">
      <SimpleGrid cols={matured.length ? 2 : 1} spacing="sm">
        <Paper component="section" aria-label="My Active Ajos" withBorder radius="md" p={{ base: 'sm', sm: 'md' }} style={{ minWidth: 0 }}>
          <Stack gap="xs">
            <Text size="xs" c="dimmed" tt="uppercase">My Active Ajos</Text>
            <Text fw={700} size="lg" style={{ overflowWrap: 'anywhere' }}>
              {failed ? 'Unavailable' : contributions === null ? 'Loading…' : amountLabel(contributions)}
            </Text>
            <Text size="sm" c="dimmed">Contributions awaiting payout</Text>
            <Text size="xs" c="dimmed">Read-only · not available to withdraw</Text>
            {failed && <Button variant="subtle" size="compact-xs" onClick={() => setAttempt(value => value + 1)}>Retry Ajo summary</Button>}
          </Stack>
        </Paper>
        {matured.length > 0 && (
          <Paper component="section" aria-label="Target Savings Matured" withBorder radius="md" p={{ base: 'sm', sm: 'md' }} style={{ minWidth: 0 }}>
            <Stack gap="sm">
              <Text size="xs" c="dimmed" tt="uppercase">Target Savings Matured</Text>
              {matured.map(plan => (
                <Stack key={plan.id} gap={4}>
                  <Text fw={700} size="lg" style={{ overflowWrap: 'anywhere' }}>{amountLabel(plan.myMembership!.savedAmountKobo)}</Text>
                  <Text size="sm" c="dimmed" style={{ overflowWrap: 'anywhere' }}>{plan.name}</Text>
                  <Text size="xs" c="dimmed">Released to your wallet</Text>
                  <Text size="sm">
                    <Anchor component={Link} to={`/target-savings#target-plan-${encodeURIComponent(plan.id)}`} size="sm">View</Anchor>
                    {' / '}
                    <Anchor component={Link} to="/withdraw" size="sm">Withdraw</Anchor>{' →'}
                  </Text>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}
      </SimpleGrid>
      {targetSavingsError && <Text role="alert" size="sm" c="red">Unable to load matured savings. Refresh to try again.</Text>}
    </Stack>
  )
}
