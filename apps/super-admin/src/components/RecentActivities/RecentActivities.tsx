import { useState } from 'react'
import {
  Card,
  Text,
  Table,
  Group,
  Anchor,
  Button,
  Modal,
  Stack,
  UnstyledButton,
  Box,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

type RoleFilter = 'All' | 'Regular' | 'ROSCA Admin'

const activities = [
  {
    timestamp: 'Apr 25, 2025\n10:01 AM',
    user: 'Ayomide Ife',
    role: 'Regular User',
    activity: 'Joined ROSCA',
  },
  {
    timestamp: 'Apr 25, 2025\n10:01 AM',
    user: 'Ayomide Ife',
    role: 'Regular User',
    activity: 'Joined ROSCA',
  },
  {
    timestamp: 'Apr 25, 2025\n10:01 AM',
    user: 'Chidi Okonkwo',
    role: 'ROSCA Admin',
    activity: 'Created ROSCA',
  },
]

export function RecentActivities() {
  const [opened, { open, close }] = useDisclosure(false)
  const [filter, setFilter] = useState<RoleFilter>('All')

  const filtered =
    filter === 'All'
      ? activities
      : activities.filter((a) =>
          filter === 'Regular'
            ? a.role === 'Regular User'
            : a.role === 'ROSCA Admin',
        )

  const handleFilter = (value: RoleFilter) => {
    setFilter(value)
    close()
  }

  return (
    <Card withBorder p="lg" radius="md">
      <Modal
        opened={opened}
        onClose={close}
        withCloseButton={false}
        size="xs"
        padding={0}
        radius="md"
      >
        <Box
          p="md"
          style={{
            backgroundColor: '#0B6B55',
            borderTopLeftRadius: 'var(--mantine-radius-md)',
            borderTopRightRadius: 'var(--mantine-radius-md)',
            textAlign: 'center',
          }}
        >
          <Text fw={600} fz="lg" c="white">
            Filter
          </Text>
        </Box>
        <Text fz="xs" c="dimmed" px="md" pt="sm">
          Status pop up
        </Text>
        <Stack gap={0}>
          {(['Regular', 'ROSCA Admin'] as const).map((option) => (
            <UnstyledButton
              key={option}
              p="md"
              onClick={() => handleFilter(option)}
              style={{
                borderBottom: '1px solid var(--mantine-color-gray-2)',
                backgroundColor:
                  filter === option
                    ? 'var(--mantine-color-gray-0)'
                    : undefined,
              }}
            >
              <Text fz="md" fw={filter === option ? 600 : 400}>
                {option}
              </Text>
            </UnstyledButton>
          ))}
        </Stack>
      </Modal>

      <Group justify="space-between" mb="md">
        <Text fw={600} fz="lg">
          Recent Activities
        </Text>
        <Button variant="light" size="xs" onClick={open}>
          Filter {filter !== 'All' ? `(${filter})` : ''}
        </Button>
      </Group>

      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr style={{ backgroundColor: '#0B6B55' }}>
            <Table.Th style={{ color: 'white' }}>Time Stamp</Table.Th>
            <Table.Th style={{ color: 'white' }}>User</Table.Th>
            <Table.Th style={{ color: 'white' }}>Role</Table.Th>
            <Table.Th style={{ color: 'white' }}>Activity</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.map((activity, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <Text fz="sm" c="dimmed" style={{ whiteSpace: 'pre-line' }}>
                  {activity.timestamp}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{activity.user}</Text>
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{activity.role}</Text>
              </Table.Td>
              <Table.Td>
                <Text fz="sm">{activity.activity}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="flex-end" mt="md">
        <Anchor fz="sm" c="primary.5" fw={500}>
          Next &gt;
        </Anchor>
      </Group>
    </Card>
  )
}
