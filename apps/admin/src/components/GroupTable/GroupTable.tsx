import { useState, useEffect } from 'react'
import { Paper, Text, Group, TextInput, Badge, Box, ActionIcon, Loader, Button, Tooltip } from '@mantine/core'
import { IconSearch, IconAdjustmentsHorizontal, IconMailPlus } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { listAllRoscaCircles, type RoscaCircle } from '@/utils/api'
import { InviteMemberModal } from '@/components/InviteMemberModal'
import {
  canInviteToCircle,
  getGroupDisplayStatus,
  groupStatusDescription,
  type GroupDisplayStatus,
} from '@/utils/group-display'

interface RoscaGroup {
  id: string
  name: string
  status: GroupDisplayStatus
  members: string
  nextPayout: string
  cycle: string
  canInvite: boolean
}

function mapCircle(c: RoscaCircle): RoscaGroup {
  const filled = c.filledSlots ?? 0
  const total = c.maxSlots ?? c.totalSlots ?? 0
  const status = getGroupDisplayStatus(c)
  return {
    id: c.id,
    name: c.name || 'Unnamed',
    status,
    members: `${filled}/${total}`,
    nextPayout:
      status === 'Completed'
        ? 'Finished'
        : status === 'Active'
          ? '-'
          : 'Not scheduled',
    cycle: status === 'Active' ? `${c.currentCycle ?? 1} of ${c.durationCycles ?? total}` : status,
    canInvite: canInviteToCircle(c),
  }
}

const statusColors: Record<GroupDisplayStatus, string> = {
  'Not Ready': '#b45309',
  Ready: '#15803d',
  Active: '#0b6b55',
  Completed: '#2980b9',
}

const statusBg: Record<GroupDisplayStatus, string> = {
  'Not Ready': '#fff7ed',
  Ready: '#dcfce7',
  Active: '#e6f5f1',
  Completed: '#e8f4fd',
}

export function GroupTable() {
  const [groups, setGroups] = useState<RoscaGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [inviteTarget, setInviteTarget] = useState<RoscaGroup | null>(null)

  useEffect(() => {
    listAllRoscaCircles()
      .then((res) => {
        const circles = Array.isArray(res)
          ? res
          : ((res as Record<string, unknown>)?.data ??
              (res as Record<string, unknown>)?.circles ?? []) as RoscaCircle[]
        setGroups(circles.map(mapCircle))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
        <Box px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Group justify="space-between" align="center" mb="sm">
            <Text fw={700} fz="md">
              Ajo Group Portfolio
            </Text>
            <Text fz="xs" c="dimmed">Groups you created and manage</Text>
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
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </Group>
        </Box>

        <Box
          px="lg"
          py="xs"
          style={{
            background: '#0b6b55',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 1.8fr',
            minWidth: 780,
          }}
        >
          {['Group Name', 'Status', 'Members', 'Next Payout', 'Cycle', 'Actions'].map((col) => (
            <Text key={col} fz="xs" fw={600} c="white">
              {col}
            </Text>
          ))}
        </Box>

        {loading ? (
          <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
            <Loader size="sm" color="#0b6b55" />
          </Box>
        ) : filteredGroups.length === 0 ? (
          <Box py="xl" style={{ textAlign: 'center' }}>
            <Text fz="sm" c="dimmed">No groups yet</Text>
          </Box>
        ) : (
          <Box style={{ maxHeight: 420, overflow: 'auto' }}>
            {filteredGroups.map((group, i) => (
              <Box
                key={group.id}
                px="lg"
                py="sm"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 1.8fr',
                  alignItems: 'center',
                  minWidth: 780,
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                  borderBottom: i < filteredGroups.length - 1 ? '1px solid #f1f3f5' : 'none',
                }}
              >
                <Text
                  component={Link}
                  to={`/rosca/groups/${group.id}`}
                  fz="sm"
                  fw={600}
                  style={{ color: '#0b6b55', textDecoration: 'none' }}
                >
                  {group.name}
                </Text>
                <Box>
                  <Tooltip label={groupStatusDescription(group.status)} withArrow>
                    <Badge
                      size="sm"
                      radius="sm"
                      style={{
                        background: statusBg[group.status],
                        color: statusColors[group.status],
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'help',
                      }}
                    >
                      {group.status}
                    </Badge>
                  </Tooltip>
                </Box>
                <Text fz="sm" c="dimmed">{group.members}</Text>
                <Text fz="sm" c="dimmed">{group.nextPayout}</Text>
                <Text fz="sm" c="dimmed">{group.cycle}</Text>
                <Group gap={6} wrap="nowrap">
                  <Button
                    component={Link}
                    to={`/rosca/groups/${group.id}`}
                    variant="subtle"
                    size="xs"
                    style={{ color: '#0b6b55' }}
                    px="xs"
                  >
                    Manage
                  </Button>
                  {group.canInvite && (
                    <Button
                      variant="light"
                      size="xs"
                      leftSection={<IconMailPlus size={13} />}
                      color="teal"
                      onClick={() => setInviteTarget(group)}
                    >
                      Invite
                    </Button>
                  )}
                </Group>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <InviteMemberModal
        opened={inviteTarget !== null}
        groupId={inviteTarget?.id ?? null}
        groupName={inviteTarget?.name}
        onClose={() => setInviteTarget(null)}
      />
    </>
  )
}
