import { Paper, Text, Box, Group, ThemeIcon, Divider, Indicator } from '@mantine/core'
import {
  IconMessage2,
  IconUserPlus,
  IconTopologyRing,
  IconAlertTriangle,
  IconFileText,
} from '@tabler/icons-react'

const PRIMARY = '#0b6b55'

interface Action {
  label: string
  icon: React.ElementType
  badge?: number
  onClick?: () => void
}

const actions: Action[] = [
  { label: 'Messages', icon: IconMessage2, badge: 3 },
  { label: 'Add New User', icon: IconUserPlus },
  { label: 'Create ROSCA Group', icon: IconTopologyRing },
  { label: 'Handle Payment Issues', icon: IconAlertTriangle },
  { label: 'Generate Report', icon: IconFileText },
]

export function QuickActions() {
  return (
    <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
      <Box px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Text fw={700} fz="md">
          Quick Actions
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
