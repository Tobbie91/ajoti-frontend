import { Group, Text, Avatar, Burger } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendar } from '@tabler/icons-react'
import { useState } from 'react'

interface HeaderProps {
  opened: boolean
  onToggle: () => void
  userName?: string
  avatarSrc?: string
}

export function Header({
  opened,
  onToggle,
  userName = 'Osho',
  avatarSrc,
}: HeaderProps) {
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />
        <Text fw={600} fz="lg">
          Super Admin
        </Text>
      </Group>

      <Group gap="sm" visibleFrom="sm">
        <DatePickerInput
          leftSection={<IconCalendar size={16} />}
          placeholder="Start date"
          value={startDate}
          onChange={setStartDate}
          size="xs"
          w={160}
        />
        <DatePickerInput
          leftSection={<IconCalendar size={16} />}
          placeholder="End date"
          value={endDate}
          onChange={setEndDate}
          size="xs"
          w={160}
        />
      </Group>

      <Group gap="sm">
        <Text fz="sm">Hi {userName}</Text>
        <Avatar src={avatarSrc} radius="xl" size="md" color="primary">
          {userName.charAt(0)}
        </Avatar>
      </Group>
    </Group>
  )
}
