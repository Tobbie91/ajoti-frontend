import { Card, Group, Text, Stack, Badge, Box } from '@mantine/core'
import { Sparkline } from '@mantine/charts'
import type { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string
  badgeText?: string
  icon?: ReactNode
  sparklineData?: number[]
  sparklineColor?: string
}

export function StatsCard({
  title,
  value,
  badgeText,
  icon,
  sparklineData = [10, 20, 40, 20, 40, 10, 50],
  sparklineColor = 'primary.5',
}: StatsCardProps) {
  return (
    <Card withBorder p="lg" radius="md">
      <Group justify="space-between" align="flex-start" mb="md">
        <Stack gap={4}>
          <Text fz="sm" c="dimmed" fw={500}>
            {title}
          </Text>
          <Text fz={28} fw={700} lh={1.2}>
            {value}
          </Text>
        </Stack>
        {icon && (
          <Box
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#E6F4EF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        )}
      </Group>

      <Group justify="space-between" align="flex-end">
        <Box w={100} h={40}>
          <Sparkline
            data={sparklineData}
            w="100%"
            h={40}
            curveType="natural"
            color={sparklineColor}
            fillOpacity={0.2}
          />
        </Box>
        {badgeText && (
          <Badge variant="light" color="green" size="sm">
            {badgeText}
          </Badge>
        )}
      </Group>
    </Card>
  )
}
