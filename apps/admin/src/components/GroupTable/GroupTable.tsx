import { Paper, Text, Group, TextInput, Badge, Box, ActionIcon } from '@mantine/core'
import { IconSearch, IconAdjustmentsHorizontal } from '@tabler/icons-react'

interface RoscaGroup {
  name: string
  status: 'Active' | 'Pending' | 'Completed'
  members: string
  nextPayout: string
  cycle: string
}

const groups: RoscaGroup[] = [
  { name: 'Monthly 50k Squad', status: 'Active', members: '7/7', nextPayout: 'May 12, 2026', cycle: '3 of 7' },
  { name: 'Smart Savers', status: 'Active', members: '6/6', nextPayout: 'May 15, 2026', cycle: '4 of 6' },
  { name: 'MamaGoals', status: 'Pending', members: '1/10', nextPayout: 'Pending', cycle: 'Pending' },
  { name: 'Travel & Chill', status: 'Completed', members: '6/6', nextPayout: 'Finished', cycle: '6 of 6' },
  { name: 'Smart Pocket', status: 'Active', members: '7/7', nextPayout: 'May 18, 2026', cycle: '2 of 7' },
]

const statusColors: Record<RoscaGroup['status'], string> = {
  Active: '#0b6b55',
  Pending: '#e67e22',
  Completed: '#2980b9',
}

const statusBg: Record<RoscaGroup['status'], string> = {
  Active: '#e6f5f1',
  Pending: '#fdf3e7',
  Completed: '#e8f4fd',
}

export function GroupTable() {
  return (
    <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
      {/* Header */}
      <Box px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" mb="sm">
          <Text fw={700} fz="md">
            ROSCA Group Portfolio
          </Text>
        </Group>
        <Group gap="sm">
          <ActionIcon variant="default" size="lg" radius="md" style={{ border: '1px solid #dee2e6' }}>
            <IconAdjustmentsHorizontal size={16} stroke={1.5} color="#868e96" />
          </ActionIcon>
          <TextInput
            placeholder="Search groups..."
            leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
            radius="md"
            size="sm"
            style={{ flex: 1 }}
            styles={{ input: { border: '1px solid #dee2e6' } }}
          />
        </Group>
      </Box>

      {/* Table header */}
      <Box
        px="lg"
        py="xs"
        style={{ background: '#0b6b55', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr' }}
      >
        {['Group Name', 'Status', 'Members', 'Next Payout', 'Cycle'].map((col) => (
          <Text key={col} fz="xs" fw={600} c="white">
            {col}
          </Text>
        ))}
      </Box>

      {/* Rows */}
      {groups.map((group, i) => (
        <Box
          key={group.name}
          px="lg"
          py="sm"
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr',
            alignItems: 'center',
            background: i % 2 === 0 ? 'white' : '#fafafa',
            borderBottom: i < groups.length - 1 ? '1px solid #f1f3f5' : 'none',
          }}
        >
          <Text fz="sm" fw={500}>
            {group.name}
          </Text>
          <Box>
            <Badge
              size="sm"
              radius="sm"
              style={{
                background: statusBg[group.status],
                color: statusColors[group.status],
                border: 'none',
                fontWeight: 600,
              }}
            >
              {group.status}
            </Badge>
          </Box>
          <Text fz="sm" c="dimmed">
            {group.members}
          </Text>
          <Text fz="sm" c="dimmed">
            {group.nextPayout}
          </Text>
          <Text fz="sm" c="dimmed">
            {group.cycle}
          </Text>
        </Box>
      ))}
    </Paper>
  )
}
