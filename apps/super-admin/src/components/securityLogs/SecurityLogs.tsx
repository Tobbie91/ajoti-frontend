import {
  Paper,
  Title,
  Tabs,
  Group,
  Select,
  Table,
  Text,
  Stack,
  Pagination,
  TextInput,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';

// Define types
interface LogEntry {
  date: string;
  time: string;
  name: string;
  email: string;
  ip: string;
  device: string;
  location: string;
  activity: string;
  timestamp?: Date; // For filtering
}

// Helper to create timestamps for filtering
const createTimestamp = (dateStr: string, timeStr: string): Date => {
  const [month, day, year] = dateStr.split(' ');
  const monthMap: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const [hours, minutes, period] = timeStr.split(/:| /);
  let hour = parseInt(hours);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  return new Date(parseInt(year), monthMap[month], parseInt(day.replace(',', '')), hour, parseInt(minutes));
};

// Generate user logs with timestamps
const generateUserLogs = (): LogEntry[] => {
  const baseLogs = Array.from({ length: 25 }).map((_, index) => ({
    date: 'Apr 25, 2025',
    time: '10:01 AM',
    name: 'Ayomide Emmanuel',
    email: 'mide@domain.com',
    ip: '104.98.129',
    device: 'Samsung',
    location: 'Lagos',
    activity: 'Signed In',
  }));

  // Add variety for testing
  return [
    ...baseLogs,
    {
      date: 'Apr 24, 2025',
      time: '02:30 PM',
      name: 'Chioma Okonkwo',
      email: 'chioma@domain.com',
      ip: '192.168.1.45',
      device: 'iPhone 13',
      location: 'Abuja',
      activity: 'Password Change',
    },
    {
      date: 'Apr 23, 2025',
      time: '11:15 AM',
      name: 'Emeka Okafor',
      email: 'emeka@domain.com',
      ip: '10.0.0.56',
      device: 'MacBook Pro',
      location: 'Port Harcourt',
      activity: 'Signed In',
    },
    {
      date: 'Apr 22, 2025',
      time: '09:45 AM',
      name: 'Folake Coker',
      email: 'folake@domain.com',
      ip: '172.16.0.78',
      device: 'iPad',
      location: 'Ibadan',
      activity: 'Failed Login',
    },
    {
      date: 'Apr 21, 2025',
      time: '04:20 PM',
      name: 'Tunde Bakare',
      email: 'tunde@domain.com',
      ip: '192.168.0.23',
      device: 'Windows Laptop',
      location: 'Kano',
      activity: 'Signed In',
    },
    {
      date: 'Apr 20, 2025',
      time: '08:00 AM',
      name: 'Aisha Mohammed',
      email: 'aisha@domain.com',
      ip: '10.10.0.89',
      device: 'Android',
      location: 'Kaduna',
      activity: 'Profile Update',
    },
  ].map(log => ({
    ...log,
    timestamp: createTimestamp(log.date, log.time)
  }));
};

const adminLogs: LogEntry[] = [
  {
    date: 'Apr 25, 2025',
    time: '10:01 AM',
    name: 'Oluwatobi Talabi',
    email: 'tobi@domain.com',
    ip: '---',
    device: 'Windows 10 HP',
    location: 'Lagos',
    activity: 'Disburse Payment',
  },
  {
    date: 'Apr 25, 2025',
    time: '10:01 AM',
    name: 'Michael Ifeoluwa',
    email: 'mide@domain.com',
    ip: '104.98.129',
    device: 'Windows 11 HP',
    location: 'Lagos',
    activity: 'Signed In',
  },
  {
    date: 'Apr 25, 2025',
    time: '10:01 AM',
    name: 'Osho Joel',
    email: 'joel@domain.com',
    ip: '---',
    device: 'Samsung',
    location: 'Lagos',
    activity: 'Enable Autodebit',
  },
  {
    date: 'Apr 24, 2025',
    time: '03:15 PM',
    name: 'Oluwatobi Talabi',
    email: 'tobi@domain.com',
    ip: '192.168.1.100',
    device: 'Windows 10 HP',
    location: 'Lagos',
    activity: 'User Suspension',
  },
  {
    date: 'Apr 23, 2025',
    time: '11:30 AM',
    name: 'Michael Ifeoluwa',
    email: 'michael@domain.com',
    ip: '10.0.0.23',
    device: 'Windows 11 HP',
    location: 'Lagos',
    activity: 'System Settings',
  },
  {
    date: 'Apr 22, 2025',
    time: '09:00 AM',
    name: 'Osho Joel',
    email: 'joel@domain.com',
    ip: '172.16.0.45',
    device: 'Samsung',
    location: 'Lagos',
    activity: 'Role Assignment',
  },
  {
    date: 'Apr 21, 2025',
    time: '02:45 PM',
    name: 'Oluwatobi Talabi',
    email: 'tobi@domain.com',
    ip: '192.168.0.67',
    device: 'Windows 10 HP',
    location: 'Lagos',
    activity: 'Transaction Approval',
  },
  {
    date: 'Apr 20, 2025',
    time: '10:30 AM',
    name: 'Michael Ifeoluwa',
    email: 'michael@domain.com',
    ip: '10.10.0.12',
    device: 'Windows 11 HP',
    location: 'Lagos',
    activity: 'Signed In',
  },
].map(log => ({
  ...log,
  timestamp: createTimestamp(log.date, log.time)
}));

const userLogs = generateUserLogs();

type DateFilter = 'all' | 'today' | 'last7days' | 'last30days';

export function SecurityLogs() {
  const [activeTab, setActiveTab] = useState<string | null>('user');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [userSearch, setUserSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);
  
  const PAGE_SIZE = 10;

  // Filter logs based on date and search
  const filterLogs = (logs: LogEntry[], searchQuery: string, dateRange: DateFilter) => {
    return logs.filter(log => {
      // Date filter
      if (dateRange !== 'all') {
        const logDate = dayjs(log.timestamp);
        const now = dayjs();
        
        switch (dateRange) {
          case 'today':
            if (!logDate.isSame(now, 'day')) return false;
            break;
          case 'last7days':
            if (logDate.isBefore(now.subtract(7, 'day'))) return false;
            break;
          case 'last30days':
            if (logDate.isBefore(now.subtract(30, 'day'))) return false;
            break;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.name.toLowerCase().includes(query) ||
          log.email.toLowerCase().includes(query) ||
          log.activity.toLowerCase().includes(query) ||
          log.location.toLowerCase().includes(query) ||
          log.device.toLowerCase().includes(query) ||
          log.ip.includes(query)
        );
      }

      return true;
    });
  };

  // Apply filters to user logs
  const filteredUserLogs = useMemo(() => {
    return filterLogs(userLogs, userSearch, dateFilter);
  }, [userSearch, dateFilter]);

  // Apply filters to admin logs
  const filteredAdminLogs = useMemo(() => {
    return filterLogs(adminLogs, adminSearch, dateFilter);
  }, [adminSearch, dateFilter]);

  // Pagination
  const userTotalPages = Math.ceil(filteredUserLogs.length / PAGE_SIZE);
  const adminTotalPages = Math.ceil(filteredAdminLogs.length / PAGE_SIZE);
  
  const paginatedUserLogs = filteredUserLogs.slice(
    (userPage - 1) * PAGE_SIZE,
    userPage * PAGE_SIZE
  );
  
  const paginatedAdminLogs = filteredAdminLogs.slice(
    (adminPage - 1) * PAGE_SIZE,
    adminPage * PAGE_SIZE
  );

  // Reset page when filters change
  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    setUserPage(1);
  };

  const handleAdminSearchChange = (value: string) => {
    setAdminSearch(value);
    setAdminPage(1);
  };

  const handleDateFilterChange = (value: string | null) => {
    setDateFilter((value as DateFilter) || 'all');
    setUserPage(1);
    setAdminPage(1);
  };

  const clearFilters = () => {
    setDateFilter('all');
    setUserSearch('');
    setAdminSearch('');
    setUserPage(1);
    setAdminPage(1);
  };

  // Get date filter label
  const getDateFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'today': return 'Today';
      case 'last7days': return 'Last 7 days';
      case 'last30days': return 'Last 30 days';
      default: return 'All Time';
    }
  };

  const renderTable = (
    logs: LogEntry[],
    paginatedLogs: LogEntry[],
    searchValue: string,
    onSearchChange: (value: string) => void,
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    totalEntries: number
  ) => (
    <Stack gap="md">
      {/* Search input */}
      <TextInput
        placeholder="Search by name, email, activity, device, location..."
        leftSection={<IconSearch size={16} />}
        value={searchValue}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        rightSection={
          searchValue ? (
            <ActionIcon size="sm" onClick={() => onSearchChange('')}>
              <IconX size={14} />
            </ActionIcon>
          ) : null
        }
      />

      <Paper withBorder radius="md">
        <Table striped highlightOnHover styles={{
          th: { padding: '16px 20px' },
          td: { padding: '16px 20px' },
        }}>
          <Table.Thead>
            <Table.Tr bg="#066F5B">
              <Table.Th c="white">Time Stamp</Table.Th>
              <Table.Th c="white">User/Admin</Table.Th>
              <Table.Th c="white">IP Address</Table.Th>
              <Table.Th c="white">Device</Table.Th>
              <Table.Th c="white">Activity</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Text fw={500}>{log.date}</Text>
                    <Text size="sm" c="dimmed">
                      {log.time}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text fw={500}>{log.name}</Text>
                    <Text size="sm" c="dimmed">
                      {log.email}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Badge variant="light" color="gray">
                      {log.ip}
                    </Badge>
                  </Table.Td>

                  <Table.Td>
                    <Text fw={500}>{log.device}</Text>
                    <Text size="sm" c="dimmed">
                      {log.location}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Badge 
                      style={{padding: '20px', background: 'transparent'}}
                      variant="light"
                    >
                      {log.activity}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" py="xl" c="dimmed">
                    No logs found matching your filters
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        {/* Footer */}
        {totalEntries > 0 && (
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalEntries)}-
              {Math.min(currentPage * PAGE_SIZE, totalEntries)} of {totalEntries} entries
            </Text>
            {totalPages > 1 && (
              <Pagination 
                total={totalPages} 
                value={currentPage} 
                onChange={onPageChange}
                color="#066F5B"
              />
            )}
          </Group>
        )}
      </Paper>
    </Stack>
  );

  return (
    <Stack mt="xl" gap="lg">
      <Group justify="space-between">
        <Group>
          <Title order={3}>Login & Security Logs</Title>
          {(dateFilter !== 'all' || userSearch || adminSearch) && (
            <ActionIcon 
              variant="subtle" 
              color="gray" 
              onClick={clearFilters}
              title="Clear all filters"
              size="sm"
            >
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>

        <Group>
          <Text size="sm" c="dimmed">
            {dateFilter !== 'all' && `Showing: ${getDateFilterLabel(dateFilter)}`}
          </Text>
          <Select
            placeholder="Filter by date"
            data={[
              { value: 'all', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: 'last7days', label: 'Last 7 days' },
              { value: 'last30days', label: 'Last 30 days' },
            ]}
            value={dateFilter}
            onChange={handleDateFilterChange}
            w={160}
            clearable={false}
          />
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="user">
            User Activity 
            {userSearch && <Badge ml="xs" size="xs" circle>!</Badge>}
          </Tabs.Tab>
          <Tabs.Tab value="admin">
            Admin Activity
            {adminSearch && <Badge ml="xs" size="xs" circle>!</Badge>}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="user" pt="md">
          {renderTable(
            filteredUserLogs,
            paginatedUserLogs,
            userSearch,
            handleUserSearchChange,
            userPage,
            userTotalPages,
            setUserPage,
            filteredUserLogs.length
          )}
        </Tabs.Panel>

        <Tabs.Panel value="admin" pt="md">
          {renderTable(
            filteredAdminLogs,
            paginatedAdminLogs,
            adminSearch,
            handleAdminSearchChange,
            adminPage,
            adminTotalPages,
            setAdminPage,
            filteredAdminLogs.length
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}