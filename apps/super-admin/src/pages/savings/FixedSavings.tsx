import { useState, useMemo } from 'react';
import {
  Container,
  Group,
  Text,
  Title,
  Table,
  Paper,
  TextInput,
  Button,
  Select,
  Badge,
  Pagination,
  Stack,
  ActionIcon,
} from '@mantine/core';
import { IconArrowLeft, IconSearch, IconUpload, IconX } from '@tabler/icons-react';

interface FixedSaving {
  name: string;
  role: 'Regular User' | 'Admin';
  amount: string;
  duration: string;
  interest: string;
  date: string;
  method: string;
  status: 'Matured' | 'Active';
}

const data: FixedSaving[] = [
  {
    name: 'Esther Idowu',
    role: 'Regular User',
    amount: '₦50,000',
    duration: '6 months',
    interest: '₦30,000',
    date: 'Jun 01, 2025',
    method: 'Wallet',
    status: 'Matured',
  },
  {
    name: 'Ayomide Ife',
    role: 'Regular User',
    amount: '₦25,000',
    duration: '3 months',
    interest: '₦7,500',
    date: 'May 29, 2025',
    method: 'Wallet',
    status: 'Matured',
  },
  {
    name: 'Gbenga Adesuji',
    role: 'Regular User',
    amount: '₦32,000',
    duration: '6 months',
    interest: '₦19,200',
    date: 'May 29, 2025',
    method: 'Wallet',
    status: 'Matured',
  },
  {
    name: 'Esther Idowu',
    role: 'Admin',
    amount: '₦50,000',
    duration: '6 months',
    interest: '₦30,000',
    date: 'Jun 01, 2027',
    method: 'Wallet',
    status: 'Active',
  },
  // Additional mock data for testing
  {
    name: 'Oluwaseun Bamidele',
    role: 'Regular User',
    amount: '₦100,000',
    duration: '12 months',
    interest: '₦120,000',
    date: 'Apr 15, 2025',
    method: 'Bank Transfer',
    status: 'Matured',
  },
  {
    name: 'Chidi Okonkwo',
    role: 'Admin',
    amount: '₦75,000',
    duration: '9 months',
    interest: '₦67,500',
    date: 'May 10, 2025',
    method: 'Wallet',
    status: 'Matured',
  },
  {
    name: 'Aisha Mohammed',
    role: 'Regular User',
    amount: '₦45,000',
    duration: '6 months',
    interest: '₦27,000',
    date: 'Mar 22, 2025',
    method: 'Bank Transfer',
    status: 'Matured',
  },
  {
    name: 'Tunde Bakare',
    role: 'Admin',
    amount: '₦200,000',
    duration: '12 months',
    interest: '₦240,000',
    date: 'Feb 28, 2025',
    method: 'Wallet',
    status: 'Matured',
  },
  {
    name: 'Funke Akindele',
    role: 'Regular User',
    amount: '₦15,000',
    duration: '3 months',
    interest: '₦4,500',
    date: 'Jun 05, 2025',
    method: 'Wallet',
    status: 'Matured',
  },
  {
    name: 'Emeka Nnamdi',
    role: 'Regular User',
    amount: '₦80,000',
    duration: '6 months',
    interest: '₦48,000',
    date: 'Apr 30, 2025',
    method: 'Bank Transfer',
    status: 'Active',
  },
  {
    name: 'Blessing Eze',
    role: 'Regular User',
    amount: '₦35,000',
    duration: '4 months',
    interest: '₦14,000',
    date: 'May 18, 2025',
    method: 'Wallet',
    status: 'Matured',
  },
];

const PAGE_SIZE = 5;

export function FixedSavings() {
  const [page, setPage] = useState(1);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(query) ||
          item.amount.toLowerCase().includes(query) ||
          item.duration.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (roleFilter && roleFilter !== 'All') {
        if (item.role !== roleFilter) return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== 'All') {
        if (item.status !== statusFilter) return false;
      }

      return true;
    });
  }, [searchQuery, roleFilter, statusFilter]);

  // Reset filters
  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter(null);
    setStatusFilter(null);
    setPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Matured':
        return '#120DAA'; // Purple
      case 'Active':
        return '#066F5B'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Page title */}
        <Group justify="space-between" align="center">
          <Title order={3}>Total Interest Accrued</Title>
          {(searchQuery || roleFilter || statusFilter) && (
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

        {/* Back */}
        <Group gap="xs" style={{ cursor: 'pointer' }}>
          <IconArrowLeft size={18} />
          <Text fw={500}>Back</Text>
        </Group>

        {/* Section title */}
        <Title order={4}>All Matured Fixed Savings</Title>

        {/* Toolbar */}
        <Group justify="space-between">
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="Search by user name or saving title"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.currentTarget.value);
              setPage(1);
            }}
            w={420}
          />

          <Group>
            <Button
              leftSection={<IconUpload size={16} />}
              variant="outline"
              color="#066F5B"
              onClick={() => console.log('Exporting filtered data:', filteredData)}
            >
              Export
            </Button>

            <Select
              placeholder="Role"
              data={['All', 'Regular User', 'Admin']}
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value === 'All' ? null : value);
                setPage(1);
              }}
              w={120}
              clearable
            />

            <Select
              placeholder="Status"
              data={['All', 'Matured', 'Active']}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value === 'All' ? null : value);
                setPage(1);
              }}
              w={120}
              clearable
            />
          </Group>
        </Group>

        {/* Results count */}
        {filteredData.length > 0 && (
          <Text size="sm" c="dimmed">
            Found {filteredData.length} saving{filteredData.length !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Table */}
        <Paper withBorder radius="md">
          <Table
            striped
            highlightOnHover
            styles={{
              th: {
                backgroundColor: '#066F5B',
                color: 'white',
                padding: '14px 18px',
              },
              td: {
                padding: '14px 18px',
              },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Interest Paid</Table.Th>
                <Table.Th>Date Paid</Table.Th>
                <Table.Th>Payment Method</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Text fw={500}>{row.name}</Text>
                      <Text size="sm" c="dimmed">
                        {row.role}
                      </Text>
                    </Table.Td>
                    <Table.Td>{row.amount}</Table.Td>
                    <Table.Td>{row.duration}</Table.Td>
                    <Table.Td>{row.interest}</Table.Td>
                    <Table.Td>{row.date}</Table.Td>
                    <Table.Td>{row.method}</Table.Td>
                    <Table.Td>
                      <Badge 
                        color={getStatusColor(row.status)} 
                        radius="sm" 
                        style={{ 
                          padding: '20px',
                          backgroundColor: getStatusColor(row.status),
                        }}
                      >
                        {row.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">
                      No savings found matching your filters
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          {/* Footer */}
          {filteredData.length > 0 && (
            <Group justify="space-between" p="md">
              <Text size="sm" c="dimmed">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredData.length)}-
                {Math.min(page * PAGE_SIZE, filteredData.length)} of {filteredData.length} entries
              </Text>

              <Pagination 
                total={totalPages} 
                value={page} 
                onChange={setPage}
                color="#066F5B"
              />
            </Group>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}