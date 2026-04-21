import { Card, SimpleGrid, UnstyledButton, Text, Stack, Box } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import {
  IconId,
  IconUsersGroup,
  IconTopologyRing,
  IconReceipt,
  IconShieldCheck,
  IconFileExport,
} from '@tabler/icons-react'

const actions = [
  { label: 'KYC Approvals', icon: IconId, color: '#0B6B55', path: '/kyc-approvals' },
  { label: 'Manage Users', icon: IconUsersGroup, color: '#095C49', path: '/manage-users' },
  { label: 'ROSCA Circles', icon: IconTopologyRing, color: '#074D3D', path: '/manage-rosca' },
  { label: 'Transactions', icon: IconReceipt, color: '#053E31', path: '/transactions' },
  { label: 'Audit Logs', icon: IconShieldCheck, color: '#41D980', path: '/settings-logs' },
  { label: 'Export Data', icon: IconFileExport, color: '#0B6B55', path: '/settings-logs' },
]

export function QuickActions() {
  const navigate = useNavigate()

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
            onClick={() => navigate(action.path)}
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
