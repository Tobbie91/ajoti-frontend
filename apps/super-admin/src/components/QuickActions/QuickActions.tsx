import { Card, SimpleGrid, UnstyledButton, Text, Stack, Box } from '@mantine/core'
import {
  IconUserCheck,
  IconId,
  IconUsersGroup,
  IconMessageReport,
  IconCoinMonero,
  IconSpeakerphone,
} from '@tabler/icons-react'

const actions = [
  { label: 'Activate ROSCA Admin', icon: IconUserCheck, color: '#0B6B55' },
  { label: 'KYC Center', icon: IconId, color: '#095C49' },
  { label: 'Manager User', icon: IconUsersGroup, color: '#074D3D' },
  { label: 'User Complaints', icon: IconMessageReport, color: '#053E31' },
  { label: 'New Savings Product', icon: IconCoinMonero, color: '#41D980' },
  { label: 'Send System Notice', icon: IconSpeakerphone, color: '#0B6B55' },
]

export function QuickActions() {
  return (
    <Card withBorder p="lg" radius="md">
      <Text fw={600} fz="lg" mb="md">
        Quick Actions
      </Text>

      <SimpleGrid cols={3} spacing="sm">
        {actions.map((action) => (
          <UnstyledButton
            key={action.label}
            p="md"
            style={{
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-gray-2)',
              textAlign: 'center',
            }}
          >
            <Stack align="center" gap={8}>
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#E6F4EF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <action.icon size={22} color={action.color} stroke={1.5} />
              </Box>
              <Text fz="xs" fw={500} lh={1.2}>
                {action.label}
              </Text>
            </Stack>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    </Card>
  )
}
