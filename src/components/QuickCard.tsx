// components/QuickCard.tsx
import { Paper, Text, Box } from '@mantine/core'
import type { ReactNode } from 'react'

export function QuickCard({
  title,
  desc,
  icon,
}: {
  title: string
  desc: string
  icon: ReactNode
}) {
  return (
    <Paper
      p={12}
      radius="md"
      style={{
        aspectRatio: '1 / 1',
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* no icon bg */}
      <Box style={{ width: 20, height: 20 }}>
        {icon}
      </Box>

      <Text fw={800} fz={13} lh={1.15}>
        {title}
      </Text>

      <Text fz={12} c="dimmed" lh={1.25}>
        {desc}
      </Text>
    </Paper>
  )
}
