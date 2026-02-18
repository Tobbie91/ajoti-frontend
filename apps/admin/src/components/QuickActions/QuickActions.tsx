import { useNavigate } from 'react-router-dom'
import { Paper, Text, Box, Group, ThemeIcon, Divider, Indicator } from '@mantine/core'
import {
  IconMessage2,
  IconTopologyRing,
  IconUserCheck,
  IconBell,
  IconAlertTriangle,
} from '@tabler/icons-react'

const PRIMARY = '#0b6b55'

interface Action {
  label: string
  icon: React.ElementType
  badge?: number
  path?: string
}

const actions: Action[] = [
  { label: 'Messages', icon: IconMessage2, badge: 1 },
  { label: 'Create New Group', icon: IconTopologyRing, path: '/create-group' },
  { label: 'Manage Join Request', icon: IconUserCheck, path: '/manage-join-request' },
  { label: 'Send Group Notification', icon: IconBell, path: '/rosca/groups' },
  { label: 'Handle Payment Issues', icon: IconAlertTriangle },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
      <Box px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Text fw={700} fz="md">
          Group Activity
        </Text>
      </Box>

      <Box py="xs">
        {actions.map((action, i) => (
          <Box key={action.label}>
            <Box
              px="lg"
              py="sm"
              style={{
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onClick={() => action.path && navigate(action.path)}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = '#f8fffe'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <ThemeIcon
                    size={36}
                    radius="md"
                    style={{ background: '#e6f5f1', color: PRIMARY }}
                    variant="light"
                  >
                    <action.icon size={18} stroke={1.5} />
                  </ThemeIcon>
                  <Text fz="sm" fw={500}>
                    {action.label}
                  </Text>
                </Group>
                {action.badge !== undefined && (
                  <Indicator
                    inline
                    label={action.badge}
                    size={20}
                    color="red"
                    styles={{ indicator: { fontSize: 11, fontWeight: 700 } }}
                  >
                    <Box w={8} />
                  </Indicator>
                )}
              </Group>
            </Box>
            {i < actions.length - 1 && <Divider mx="lg" />}
          </Box>
        ))}
      </Box>
    </Paper>
  )
}
