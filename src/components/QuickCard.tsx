import { Paper, Stack, Text } from '@mantine/core'
import type { ReactNode } from 'react'

interface QuickCardProps {
  title: string
  desc: string
  icon: ReactNode
  iconBg: string
}

export function QuickCard({ title, desc, icon, iconBg }: QuickCardProps) {
  return (
    <Paper
      withBorder
      radius={12.9}
      style={{
        width: 188.79,
        height: 195.15,
        paddingTop: 18.28,
        paddingBottom: 18.28,
        paddingLeft: 15.05,
        paddingRight: 15.05,
        background: '#fff',
        boxSizing: 'border-box',
      }}
    >
      <Stack gap={10.75}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: iconBg,
            display: 'grid',
            placeItems: 'center',
            color: 'white',
          }}
        >
          {icon}
        </div>

        <div>
          <Text fw={600} size="sm">
            {title}
          </Text>
          <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
            {desc}
          </Text>
        </div>
      </Stack>
    </Paper>
  )
}
