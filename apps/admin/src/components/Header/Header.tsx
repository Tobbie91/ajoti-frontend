import { Group, Burger, Text, Avatar, Box, ActionIcon } from '@mantine/core'
import { IconBell } from '@tabler/icons-react'

interface HeaderProps {
  opened: boolean
  onToggle: () => void
}

const PRIMARY = '#0b6b55'

export function Header({ opened, onToggle }: HeaderProps) {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />
        <Text fw={900} fz={20} style={{ color: PRIMARY, letterSpacing: 1 }} visibleFrom="sm">
          AJOTI
        </Text>
      </Group>

      <Group gap="sm">
        <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
          <IconBell size={20} stroke={1.5} />
        </ActionIcon>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Box style={{ textAlign: 'right' }}>
            <Text fz="sm" fw={600} lh={1.2}>
              Admin
            </Text>
            <Text fz="xs" c="dimmed" lh={1.2}>
              Admin
            </Text>
          </Box>
          <Avatar
            size={36}
            radius="xl"
            style={{ backgroundColor: PRIMARY, color: 'white', fontWeight: 700 }}
          >
            A
          </Avatar>
        </Box>
      </Group>
    </Group>
  )
}
