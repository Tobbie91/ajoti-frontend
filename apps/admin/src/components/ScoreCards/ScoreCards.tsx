import { Paper, Text, RingProgress, Progress, Group, Stack, Badge } from '@mantine/core'
import { IconShieldCheck, IconGauge } from '@tabler/icons-react'

function getTrustTier(score: number) {
  if (score >= 80) return { label: 'Excellent', color: '#02A36E' }
  if (score >= 60) return { label: 'Good', color: '#10B981' }
  if (score >= 40) return { label: 'Fair', color: '#F59E0B' }
  return { label: 'Poor', color: '#EF4444' }
}

function getCreditTier(score: number) {
  if (score >= 750) return { label: 'Excellent', color: '#02A36E' }
  if (score >= 650) return { label: 'Good', color: '#10B981' }
  if (score >= 500) return { label: 'Fair', color: '#F59E0B' }
  return { label: 'Poor', color: '#EF4444' }
}

export function TrustScoreCard({ score }: { score: number }) {
  const tier = getTrustTier(score)

  return (
    <Paper
      radius={14}
      style={{
        boxShadow: '0px 6px 16px rgba(0,0,0,0.12)',
        padding: 24,
        background: '#FFFFFF',
      }}
    >
      <Group justify="space-between" align="center">
        <Stack gap={8}>
          <Group gap={8} align="center">
            <IconShieldCheck size={20} color={tier.color} />
            <Text fw={600} fz={14} style={{ color: '#0F172A' }}>
              Trust Score
            </Text>
          </Group>
          <Text fw={300} fz={12} style={{ color: '#6B7280' }}>
            Based on your ROSCA activity and repayment history
          </Text>
          <Badge
            variant="light"
            size="sm"
            style={{
              backgroundColor: `${tier.color}15`,
              color: tier.color,
              border: `1px solid ${tier.color}30`,
              width: 'fit-content',
            }}
          >
            {tier.label}
          </Badge>
        </Stack>

        <RingProgress
          size={90}
          thickness={8}
          roundCaps
          sections={[{ value: score, color: tier.color }]}
          label={
            <Text ta="center" fw={700} fz={18} style={{ color: '#0F172A' }}>
              {score}
            </Text>
          }
        />
      </Group>
    </Paper>
  )
}

export function CreditScoreCard({ score }: { score: number }) {
  const tier = getCreditTier(score)
  const percentage = ((score - 300) / (850 - 300)) * 100

  return (
    <Paper
      radius={14}
      style={{
        boxShadow: '0px 6px 16px rgba(0,0,0,0.12)',
        padding: 24,
        background: '#FFFFFF',
      }}
    >
      <Stack gap={12}>
        <Group justify="space-between" align="center">
          <Group gap={8} align="center">
            <IconGauge size={20} color={tier.color} />
            <Text fw={600} fz={14} style={{ color: '#0F172A' }}>
              Credit Score
            </Text>
          </Group>
          <Badge
            variant="light"
            size="sm"
            style={{
              backgroundColor: `${tier.color}15`,
              color: tier.color,
              border: `1px solid ${tier.color}30`,
            }}
          >
            {tier.label}
          </Badge>
        </Group>

        <Group justify="space-between" align="flex-end">
          <Text fw={700} fz={28} style={{ color: '#0F172A', lineHeight: 1 }}>
            {score}
          </Text>
          <Text fw={400} fz={12} style={{ color: '#9CA3AF' }}>
            out of 850
          </Text>
        </Group>

        <Progress
          value={percentage}
          color={tier.color}
          size="sm"
          radius="xl"
          style={{ background: '#F3F4F6' }}
        />

        <Group justify="space-between">
          <Text fw={400} fz={11} style={{ color: '#9CA3AF' }}>
            300
          </Text>
          <Text fw={400} fz={11} style={{ color: '#9CA3AF' }}>
            850
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}
