import { Paper, Text, RingProgress, Progress, Group, Stack, Badge, Loader, Modal, Divider } from '@mantine/core'
import { IconShieldCheck, IconGauge, IconChevronRight } from '@tabler/icons-react'
import { useState } from 'react'
import type { ATIBreakdown } from '@/utils/api'

function getTrustTier(score: number) {
  if (score >= 80) return { label: 'Excellent', color: '#02A36E' }
  if (score >= 60) return { label: 'Good', color: '#10B981' }
  if (score >= 40) return { label: 'Average', color: '#F59E0B' }
  return { label: 'Poor', color: '#EF4444' }
}

function getCreditTier(score: number) {
  if (score >= 750) return { label: 'Excellent', color: '#02A36E' }
  if (score >= 650) return { label: 'Good', color: '#10B981' }
  if (score >= 500) return { label: 'Fair', color: '#F59E0B' }
  return { label: 'Poor', color: '#EF4444' }
}

const BREAKDOWN_META: { key: keyof ATIBreakdown; label: string; weight: number; description: string }[] = [
  { key: 'recentBehavior', label: 'Recent Behaviour', weight: 30, description: 'On-time payments this cycle' },
  { key: 'historyBehavior', label: 'History Behaviour', weight: 25, description: 'All-time reliability, penalised for late/missed/defaults' },
  { key: 'payoutReliability', label: 'Payout Reliability', weight: 20, description: 'Payments made after receiving your payout' },
  { key: 'peerScore', label: 'Peer Trust', weight: 15, description: 'Ratings from fellow circle members' },
  { key: 'historyLength', label: 'History Length', weight: 10, description: 'Account age (grows over time)' },
]

export function TrustScoreCard({ score, breakdown }: { score: number | null; breakdown?: ATIBreakdown | null }) {
  const [open, setOpen] = useState(false)
  const resolvedScore = score ?? 0
  const tier = getTrustTier(resolvedScore)
  const hasBreakdown = !!breakdown

  return (
    <>
      <Paper
        radius={14}
        onClick={() => hasBreakdown && setOpen(true)}
        style={{
          boxShadow: '0px 6px 16px rgba(0,0,0,0.12)',
          padding: 24,
          background: '#FFFFFF',
          cursor: hasBreakdown ? 'pointer' : 'default',
        }}
      >
        <Group justify="space-between" align="center">
          <Stack gap={8}>
            <Group gap={8} align="center">
              <IconShieldCheck size={20} color={tier.color} />
              <Text fw={600} fz={14} style={{ color: '#0F172A' }}>
                Trust Score
              </Text>
              {hasBreakdown && <IconChevronRight size={14} color="#9CA3AF" />}
            </Group>
            <Text fw={300} fz={12} style={{ color: '#6B7280' }}>
              Based on your ROSCA activity and repayment history
            </Text>
            {score !== null && (
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
            )}
          </Stack>

          {score === null ? (
            <Loader size="sm" color="#02A36E" />
          ) : (
            <RingProgress
              size={90}
              thickness={8}
              roundCaps
              sections={[{ value: resolvedScore, color: tier.color }]}
              label={
                <Text ta="center" fw={700} fz={18} style={{ color: '#0F172A' }}>
                  {resolvedScore}
                </Text>
              }
            />
          )}
        </Group>
      </Paper>

      {hasBreakdown && (
        <Modal
          opened={open}
          onClose={() => setOpen(false)}
          title={
            <Group gap={8}>
              <IconShieldCheck size={18} color={tier.color} />
              <Text fw={700} fz={15}>Trust Score Breakdown</Text>
            </Group>
          }
          radius={16}
          size="sm"
          centered
        >
          <Stack gap="md">
            {/* Overall score */}
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text fw={700} fz={32} style={{ color: '#0F172A', lineHeight: 1 }}>{resolvedScore}</Text>
                <Text fz={12} c="dimmed">out of 100</Text>
              </Stack>
              <Badge color={tier.color} variant="filled" size="lg">{tier.label}</Badge>
            </Group>
            <Progress value={resolvedScore} color={tier.color} size="md" radius="xl" />

            <Divider />

            {/* Component breakdown */}
            <Stack gap="sm">
              {BREAKDOWN_META.map(({ key, label, weight, description }) => {
                const val = key === 'weights' ? 0 : (breakdown![key] as number)
                return (
                  <div key={key}>
                    <Group justify="space-between" mb={4}>
                      <div>
                        <Text fz={13} fw={500}>{label}</Text>
                        <Text fz={11} c="dimmed">{description}</Text>
                      </div>
                      <Stack gap={0} align="flex-end">
                        <Text fz={13} fw={700}>{val.toFixed(1)}</Text>
                        <Text fz={10} c="dimmed">{weight}% weight</Text>
                      </Stack>
                    </Group>
                    <Progress value={val} color="#02A36E" size="xs" radius="xl" />
                  </div>
                )
              })}
            </Stack>

            <Text fz={11} c="dimmed" ta="center" mt={4}>
              Tap anywhere outside to close
            </Text>
          </Stack>
        </Modal>
      )}
    </>
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
