import { useState, useEffect } from 'react'
import { Paper, Text, Group, TextInput, Badge, Box, ActionIcon, Loader } from '@mantine/core'
import { IconSearch, IconAdjustmentsHorizontal } from '@tabler/icons-react'
import { listAllRoscaCircles, type RoscaCircle } from '@/utils/api'

interface RoscaGroup {
  name: string
  status: 'Active' | 'Pending' | 'Completed'
  members: string
  nextPayout: string
  cycle: string
}

function mapCircle(c: RoscaCircle): RoscaGroup {
  const filled = c.filledSlots ?? 0
  const total = c.maxSlots ?? c.totalSlots ?? 0
  const s = (c.status || '').toUpperCase()
  const status: RoscaGroup['status'] =
    s === 'ACTIVE' || s === 'STARTED' ? 'Active' : s === 'COMPLETED' ? 'Completed' : 'Pending'
  return {
    name: c.name || 'Unnamed',
    status,
    members: `${filled}/${total}`,
    nextPayout: status === 'Pending' ? 'Pending' : status === 'Completed' ? 'Finished' : '—',
    cycle: status === 'Pending' ? 'Pending' : `${filled} of ${c.durationCycles ?? total}`,
  }
}

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
  const [groups, setGroups] = useState<RoscaGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllRoscaCircles()
      .then((res) => {
        const circles = Array.isArray(res) ? res : ((res as Record<string, unknown>)?.data ?? (res as Record<string, unknown>)?.circles ?? []) as RoscaCircle[]
        setGroups(circles.slice(0, 5).map(mapCircle))
      })
      .catch((err) => console.error('GroupTable fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

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

      {/* Body */}
      {loading ? (
        <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
          <Loader size="sm" color="#0b6b55" />
        </Box>
      ) : groups.length === 0 ? (
        <Box py="xl" style={{ textAlign: 'center' }}>
          <Text fz="sm" c="dimmed">No groups yet</Text>
        </Box>
      ) : (
        groups.map((group, i) => (
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
        ))
      )}
    </Paper>
  )
}
