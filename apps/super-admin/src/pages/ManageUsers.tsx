import { useState } from 'react'
import {
  Title,
  Text,
  Stack,
  Group,
  TextInput,
  Select,
  Table,
  Checkbox,
  Badge,
  Menu,
  ActionIcon,
  Pagination,
  Card,
} from '@mantine/core'
import { IconSearch, IconDots } from '@tabler/icons-react'

interface User {
  name: string
  email: string
  phone: string
  activeRosca: string
  bvn: string
  status: 'Active' | 'Inactive'
}

const allUsers: User[] = [
  { name: 'Ayomide Emmanuel', email: 'mide@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active' },
  { name: 'Adediran Rhoda', email: 'vicR@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active' },
  { name: 'Yakubu Taiwo', email: 'tee@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active' },
  { name: 'Obatowon Nuel', email: 'nuel@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active' },
  { name: 'Emmanuel Ifeade', email: 'adeif@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive' },
  { name: 'Oyesiji Inioluwa', email: 'ini@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive' },
  { name: 'Ayinde Samuel', email: 'sam@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active' },
  { name: 'Okeleye Peter', email: 'shak@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active' },
  { name: 'Balogun Tunde', email: 'tunde@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active' },
  { name: 'Afolabi Grace', email: 'grace@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active' },
  { name: 'Okonkwo Chidi', email: 'chidi@domain.com', phone: '+234 901 234 5678', activeRosca: '3 Groups', bvn: '2234567899', status: 'Active' },
  { name: 'Adeyemi Funke', email: 'funke@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive' },
  { name: 'Ibrahim Musa', email: 'musa@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active' },
  { name: 'Ogunleye Dayo', email: 'dayo@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active' },
  { name: 'Nnamdi Kelechi', email: 'kele@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active' },
  { name: 'Oluwaseun Bisi', email: 'bisi@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive' },
  { name: 'Eze Obioma', email: 'obioma@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active' },
  { name: 'Fashola Kemi', email: 'kemi@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active' },
  { name: 'Abdullahi Fatima', email: 'fatima@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active' },
  { name: 'Oladipo Wale', email: 'wale@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active' },
  { name: 'Chukwuma Emeka', email: 'emeka@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active' },
  { name: 'Adebayo Tosin', email: 'tosin@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive' },
  { name: 'Ogundele Segun', email: 'segun@domain.com', phone: '+234 901 234 5678', activeRosca: '3 Groups', bvn: '2234567899', status: 'Active' },
  { name: 'Adekunle Ronke', email: 'ronke@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active' },
  { name: 'Yusuf Aminat', email: 'aminat@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active' },
]

const PAGE_SIZE = 20

export function ManageUsers() {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])

  const totalPages = Math.ceil(allUsers.length / PAGE_SIZE)
  const paginatedUsers = allUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleRow = (email: string) =>
    setSelected((current) =>
      current.includes(email)
        ? current.filter((e) => e !== email)
        : [...current, email],
    )

  const toggleAll = () =>
    setSelected((current) =>
      current.length === paginatedUsers.length
        ? []
        : paginatedUsers.map((u) => u.email),
    )

  return (
    <Stack gap="md">
      <Title order={2}>Manage User</Title>

      <Group gap="sm">
        <TextInput
          placeholder="Search"
          leftSection={<IconSearch size={16} />}
          w={250}
          size="sm"
        />
        <Select
          placeholder="User"
          data={['All Users', 'Admin', 'Regular User']}
          size="sm"
          w={150}
          clearable
        />
        <Select
          placeholder="Account Status"
          data={['All', 'Active', 'Inactive']}
          size="sm"
          w={170}
          clearable
        />
        <Select
          placeholder="Bulk Action"
          data={['Activate', 'Deactivate', 'Delete']}
          size="sm"
          w={150}
          clearable
        />
      </Group>

      <Card withBorder p={0} radius="md">
        <Table verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr style={{ backgroundColor: '#0B6B55' }}>
              <Table.Th w={40}>
                <Checkbox
                  checked={
                    paginatedUsers.length > 0 &&
                    selected.length === paginatedUsers.length
                  }
                  indeterminate={
                    selected.length > 0 &&
                    selected.length < paginatedUsers.length
                  }
                  onChange={toggleAll}
                  color="white"
                  styles={{ input: { borderColor: 'white' } }}
                />
              </Table.Th>
              <Table.Th style={{ color: 'white' }}>Name</Table.Th>
              <Table.Th style={{ color: 'white' }}>Email address</Table.Th>
              <Table.Th style={{ color: 'white' }}>Phone number</Table.Th>
              <Table.Th style={{ color: 'white' }}>Active ROSCA</Table.Th>
              <Table.Th style={{ color: 'white' }}>BVN</Table.Th>
              <Table.Th style={{ color: 'white' }}>Status</Table.Th>
              <Table.Th style={{ color: 'white' }}>View</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedUsers.map((user) => (
              <Table.Tr key={user.email}>
                <Table.Td>
                  <Checkbox
                    checked={selected.includes(user.email)}
                    onChange={() => toggleRow(user.email)}
                  />
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{user.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{user.email}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{user.phone}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{user.activeRosca}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">{user.bvn}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={user.status === 'Active' ? 'green' : 'red'}
                    variant="filled"
                    size="sm"
                    radius="sm"
                  >
                    {user.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={160} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="dark">
                        <IconDots size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item>View Profile</Menu.Item>
                      <Menu.Item>Edit User</Menu.Item>
                      <Menu.Item color="red">Deactivate</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Group justify="space-between">
        <Text fz="sm" c="dimmed">
          Showing {(page - 1) * PAGE_SIZE + 1}-
          {Math.min(page * PAGE_SIZE, allUsers.length)} of {allUsers.length}{' '}
          users
        </Text>
        <Pagination
          total={totalPages}
          value={page}
          onChange={setPage}
          size="sm"
          color="primary"
        />
      </Group>
    </Stack>
  )
}
