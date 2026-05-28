import { Group, Text, Avatar, Burger, ActionIcon, Tooltip } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { clearSessionAndRedirect, logoutApi } from '@/utils/api'

interface HeaderProps {
  opened: boolean
  onToggle: () => void
}

export function Header({ opened, onToggle }: HeaderProps) {
  const stored = localStorage.getItem('superadmin_user')
  const user = stored ? (JSON.parse(stored) as { firstName?: string; lastName?: string }) : null
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Admin' : 'Admin'
  const initial = displayName.charAt(0).toUpperCase()

  async function handleLogout() {
    const refreshToken = localStorage.getItem('superadmin_refresh_token') ?? ''
    try {
      await logoutApi(refreshToken)
    } catch {
      // best-effort
    }
    clearSessionAndRedirect()
  }

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />
        <Text fw={600} fz="lg">
          Super Admin
        </Text>
      </Group>

      <Group gap="sm">
        <Text fz="sm" visibleFrom="sm">
          Hi, {displayName}
        </Text>
        <Avatar radius="xl" size="md" color="primary">
          {initial}
        </Avatar>
        <Tooltip label="Sign out" withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={handleLogout} aria-label="Sign out">
            <IconLogout size={18} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  )
}
