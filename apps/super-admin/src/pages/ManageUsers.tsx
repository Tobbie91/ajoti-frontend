import { useState, useMemo } from 'react'
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
import { IconSearch, IconDots, IconX } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

interface User {
  name: string
  email: string
  phone: string
  activeRosca: string
  bvn: string
  status: 'Active' | 'Inactive'
  role: 'Admin' | 'Regular User' // Added role field for filtering
}

import { SuspendUserModal } from '@/components/SuspendUserModal'
import { KycReminderModal } from '@/components/KycReminderModal';

const allUsers: User[] = [
  { name: 'Ayomide Emmanuel', email: 'mide@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Adediran Rhoda', email: 'vicR@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Yakubu Taiwo', email: 'tee@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active', role: 'Admin' },
  { name: 'Obatowon Nuel', email: 'nuel@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Emmanuel Ifeade', email: 'adeif@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive', role: 'Regular User' },
  { name: 'Oyesiji Inioluwa', email: 'ini@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive', role: 'Regular User' },
  { name: 'Ayinde Samuel', email: 'sam@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active', role: 'Admin' },
  { name: 'Okeleye Peter', email: 'shak@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Balogun Tunde', email: 'tunde@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Afolabi Grace', email: 'grace@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Okonkwo Chidi', email: 'chidi@domain.com', phone: '+234 901 234 5678', activeRosca: '3 Groups', bvn: '2234567899', status: 'Active', role: 'Admin' },
  { name: 'Adeyemi Funke', email: 'funke@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive', role: 'Regular User' },
  { name: 'Ibrahim Musa', email: 'musa@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Ogunleye Dayo', email: 'dayo@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Nnamdi Kelechi', email: 'kele@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Oluwaseun Bisi', email: 'bisi@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive', role: 'Regular User' },
  { name: 'Eze Obioma', email: 'obioma@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Fashola Kemi', email: 'kemi@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Abdullahi Fatima', email: 'fatima@domain.com', phone: '+234 901 234 5678', activeRosca: '2 Groups', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Oladipo Wale', email: 'wale@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Chukwuma Emeka', email: 'emeka@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active', role: 'Admin' },
  { name: 'Adebayo Tosin', email: 'tosin@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: 'Unsubmitted', status: 'Inactive', role: 'Regular User' },
  { name: 'Ogundele Segun', email: 'segun@domain.com', phone: '+234 901 234 5678', activeRosca: '3 Groups', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Adekunle Ronke', email: 'ronke@domain.com', phone: '+234 901 234 5678', activeRosca: 'None', bvn: '2234567899', status: 'Active', role: 'Regular User' },
  { name: 'Yusuf Aminat', email: 'aminat@domain.com', phone: '+234 901 234 5678', activeRosca: '1 Group', bvn: '2234567899', status: 'Active', role: 'Regular User' },
]

const PAGE_SIZE = 20

export function ManageUsers() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [accountStatus, setAccountStatus] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<string | null>(null)

  //Modal state
  const [suspendModalOpened, setSuspendModalOpened] = useState(false)
  const [kycModalOpened, setKycModalOpened] = useState(false);

  // Filter users based on all filter criteria
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      // Search filter (name, email, phone)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone.includes(query)
        if (!matchesSearch) return false
      }

      // Role filter
      if (userRole && userRole !== 'All Users') {
        if (user.role !== userRole) return false
      }

      // Status filter
      if (accountStatus && accountStatus !== 'All') {
        if (user.status !== accountStatus) return false
      }

      return true
    })
  }, [searchQuery, userRole, accountStatus])

  // Get selected user objects
  const selectedUsers = useMemo(() => {
    return allUsers.filter(user => selected.includes(user.email))
  }, [selected])

  // Handle bulk actions
  const handleBulkAction = (action: string | null) => {
    if (!action || selected.length === 0) return

    switch (action) {
      case 'Suspend':
        setSuspendModalOpened(true)
        break
      case 'Send KYC Reminder':
        setKycModalOpened(true)
        break
      case 'Send Notification':
        console.log('Sending notification to:', selected)
        // API call here
        setSelected([])
        setBulkAction(null)
        break
      case 'Export CSV':
        console.log('Exporting users:', selected)
        // Export logic here
        setSelected([])
        setBulkAction(null)
        break
    }
  }

  const handleConfirmSuspension = (reason: string, notifyUser: boolean) => {
    console.log('Suspending users:', selected)
    console.log('Reason:', reason)
    console.log('Notify:', notifyUser)
    
    // API call here to suspend users
    // Update user status in your data
    setUsers(prevUsers => 
      prevUsers.map((user: { email: string }) => 
        selected.includes(user.email) 
          ? { ...user, status: 'Suspended' as const }
          : user
      )
    )
    
    // Clear selection after action
    setSelected([])
    setBulkAction(null)
  }

  const handleKycReminder = (reminderType: string, message: string, sendAs: string) => {
    console.log('Sending KYC reminder to:', selected)
    console.log('Reminder type:', reminderType)
    console.log('Message:', message)
    console.log('Send as:', sendAs)
    
    // API call here to send KYC reminders
    
    // Clear selection after action
    setSelected([])
    setBulkAction(null)
  }
  

  // Reset all filters
  const clearFilters = () => {
    setSearchQuery('')
    setUserRole(null)
    setAccountStatus(null)
    setPage(1)
  }

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE)
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
      <Group justify="space-between" align="center">
        <Title order={2}>Manage Users</Title>
        {(searchQuery || userRole || accountStatus) && (
          <ActionIcon 
            variant="subtle" 
            color="gray" 
            onClick={clearFilters}
            title="Clear filters"
          >
            <IconX size={18} />
          </ActionIcon>
        )}
      </Group>

      <Group gap="sm">
        <TextInput
          placeholder="Search by name, email or phone"
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.currentTarget.value)
            setPage(1) // Reset to first page on search
          }}
          w={300}
          size="sm"
        />
        <Select
          placeholder="User Role"
          data={['All Users', 'Admin', 'Regular User']}
          value={userRole}
          onChange={(value) => {
            setUserRole(value)
            setPage(1)
          }}
          size="sm"
          w={150}
          clearable
        />
        <Select
          placeholder="Account Status"
          data={['All', 'Active', 'Inactive']}
          value={accountStatus}
          onChange={(value) => {
            setAccountStatus(value)
            setPage(1)
          }}
          size="sm"
          w={170}
          clearable
        />
        <Select
          placeholder="Bulk Action"
          data={['Suspend', 'Send KYC Reminder', 'Send Notification', 'Export CSV']}
          value={bulkAction}
          onChange={handleBulkAction}
          size="sm"
          w={150}
          disabled={selected.length === 0}
          clearable
        />
      </Group>

      {/* Results count */}
      {filteredUsers.length > 0 && (
        <Text size="sm" c="dimmed">
          Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </Text>
      )}

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
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
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
                      style={{ padding: '18px' }}
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
                        <Menu.Item onClick={() => navigate(`/users/${encodeURIComponent(user.email)}`)}>
                          View Profile
                        </Menu.Item>
                        <Menu.Item>Edit User</Menu.Item>
                        <Menu.Item color="red">Deactivate</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="xl" c="dimmed">
                    No users found matching your filters
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Group justify="space-between">
        <Text fz="sm" c="dimmed">
          {filteredUsers.length > 0 ? (
            `Showing ${(page - 1) * PAGE_SIZE + 1}-
            ${Math.min(page * PAGE_SIZE, filteredUsers.length)} of ${filteredUsers.length} users`
          ) : (
            'No users to display'
          )}
        </Text>
        {filteredUsers.length > PAGE_SIZE && (
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            size="sm"
            color="primary"
          />
        )}
      </Group>

      {/* Suspend User Modal */}
      <SuspendUserModal
        opened={suspendModalOpened}
        onClose={() => {
          setSuspendModalOpened(false)
          setBulkAction(null)
        }}
        selectedUsers={selectedUsers}
        onConfirm={handleConfirmSuspension}
      />

      <KycReminderModal
        opened={kycModalOpened}
        onClose={() => {
          setKycModalOpened(false)
          setBulkAction(null)
        }}
        selectedUsers={selectedUsers}
        onConfirm={handleKycReminder}
      />

    </Stack>
  )
}

function setUsers(_updater: (prevUsers: any) => any) {
  throw new Error('Function not implemented.')
}
