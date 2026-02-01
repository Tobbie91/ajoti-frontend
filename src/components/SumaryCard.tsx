// components/SummaryCard.tsx
import { Paper, Stack, Text } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import {CardWaves} from '@/components/CardWaves'

export function SummaryCard({
  title,
  amount,
  gradient,
  to = '/transactions',
}: {
  title: string
  amount: string
  gradient: string
  to?: string
}) {
  const navigate = useNavigate()

  return (
    <Paper
      p="xl"
      radius={13.73}
      onClick={() => navigate(to)}
      style={{
        width: 378,
        height: 206,
        background: gradient,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'none', // Animate: Instant
      }}
    >
      <Stack gap={6} style={{ zIndex: 2, position: 'relative' }}>
        <Text fz={18} fw={100} opacity={0.9}>
          {title}
        </Text>
        <Text fz={30} fw={600} lh={1}>
          {amount}
        </Text>
      </Stack>

      <CardWaves />
    </Paper>
  )
}
