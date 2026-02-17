import {
  Container,
  Title,
  Group,
  Text,
  Button,
  Stack,
  Paper,
  SimpleGrid,
  Table,
  Badge,
  TextInput,
  Select,
  Pagination,
  Divider,
  Modal,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconSearch, IconRefresh, IconX } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { PlanCreationFlow } from '@/components/planCreationFlow';

// Define the type for savings data
interface SavingsPlan {
  user: string;
  title: string;
  saved: number;
  target: number;
  frequency: string;
  nextPayment: string;
  status: 'Active' | 'Matured' | 'Withdrawn';
}

// Mock data for the table
const mockSavingsData: SavingsPlan[] = [
  { user: 'Osho Joel', title: 'Vacation Fund', saved: 15000, target: 50000, frequency: 'Weekly', nextPayment: '20/06/2025', status: 'Active' },
  { user: 'John Emmanuel', title: 'Emergency Fund', saved: 500000, target: 500000, frequency: 'Monthly', nextPayment: 'Completed', status: 'Matured' },
  { user: 'Tobi Ayinla', title: 'Car Savings', saved: 15000, target: 100000, frequency: 'Monthly', nextPayment: '20/06/2025', status: 'Active' },
  { user: 'Benita Ikechukwu', title: 'New Car Savings', saved: 75000, target: 600000, frequency: 'Monthly', nextPayment: '24/06/2025', status: 'Active' },
  { user: 'Praise Samson', title: 'New House Savings', saved: 100000, target: 650000, frequency: 'Monthly', nextPayment: '24/06/2025', status: 'Active' },
  { user: 'Lanre Badejo', title: 'Trip Savings', saved: 10000, target: 90000, frequency: 'Monthly', nextPayment: '25/06/2025', status: 'Active' },
  { user: 'Samson Faithful', title: 'New Car Funds', saved: 10000, target: 10000, frequency: 'Monthly', nextPayment: '26/06/2025', status: 'Active' },
  { user: 'Ifedapo John', title: 'Travel & Trip', saved: 10000, target: 10000, frequency: 'Monthly', nextPayment: 'Withdrawn', status: 'Withdrawn' },
  { user: 'Mary Ajakaye', title: 'Lagos Vibes', saved: 5000, target: 45000, frequency: 'Weekly', nextPayment: '27/06/2025', status: 'Active' },
  { user: 'Michael Richard', title: 'School Fee', saved: 10000, target: 10000, frequency: 'Monthly', nextPayment: 'Completed', status: 'Matured' },
  // Additional mock data for testing filters
  { user: 'Chioma Okonkwo', title: 'Business Expansion', saved: 250000, target: 500000, frequency: 'Monthly', nextPayment: '28/06/2025', status: 'Active' },
  { user: 'Abdul Salami', title: 'Hajj Savings', saved: 150000, target: 800000, frequency: 'Weekly', nextPayment: '22/06/2025', status: 'Active' },
  { user: 'Folake Coker', title: 'Rent Fund', saved: 300000, target: 300000, frequency: 'Monthly', nextPayment: 'Completed', status: 'Matured' },
  { user: 'Emeka Okafor', title: 'Children School Fees', saved: 120000, target: 400000, frequency: 'Monthly', nextPayment: '30/06/2025', status: 'Active' },
  { user: 'Blessing James', title: 'Wedding Plan', saved: 45000, target: 500000, frequency: 'Weekly', nextPayment: '21/06/2025', status: 'Active' },
];

const PAGE_SIZE = 10;

// Helper function to get badge color based on status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return '#00C853'; // Green
    case 'Matured':
      return '#228be6'; // Blue
    case 'Withdrawn':
      return '#868e96'; // Gray
    default:
      return '#00C853';
  }
};

export function TargetSavings() {
  const [createPlanOpened, setCreatePlanOpened] = useState(false);
  const [activePage, setActivePage] = useState(1);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Calculate stats based on filtered data
  const filteredData = useMemo(() => {
    return mockSavingsData.filter(plan => {
      // Search filter (name and title)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          plan.user.toLowerCase().includes(query) ||
          plan.title.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== 'All') {
        if (plan.status !== statusFilter) return false;
      }

      return true;
    });
  }, [searchQuery, statusFilter]);

  // Calculate stats based on filtered data
  const totalActive = filteredData.filter(p => p.status === 'Active').length;
  
  // For missed payments and early withdrawals, we'll use the filtered data
  // In a real app, these would come from API
  const missedPaymentToday = filteredData.filter(p => 
    p.status === 'Active' && p.nextPayment === '20/06/2025'
  ).length;
  
  const earlyWithdrawalToday = filteredData.filter(p => 
    p.status === 'Withdrawn' && p.nextPayment === 'Withdrawn'
  ).length;

  // Reset filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setActivePage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE
  );

  // Handle refresh
  const handleRefresh = () => {
    console.log('Refreshing data...');
    // In a real app, this would refetch data from API
    setActivePage(1);
  };

  return (
    <>
      <Container size="xl" py="xl"> 
        <Stack gap="xl">
          {/* Header with clear filters */}
          <Group justify="space-between">
            <Title order={2}>Target Savings</Title>
            {(searchQuery || statusFilter) && (
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

          {/* Stats Cards */}
          <SimpleGrid cols={3} spacing="md">
            <Paper withBorder p="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Total Active</Text>
                <Text fw={700} size="xl">{totalActive}</Text>
              </Stack>
            </Paper>
            
            <Paper withBorder p="lg" radius="md">
              <Stack gap="xs">
                <Text c="dimmed">Missed Payment Today</Text>
                <Text fw={700} size="xl">{missedPaymentToday}</Text>
                <Text size='sm' c="dimmed" style={{textAlign: "end"}}>May 20, 2025</Text>
              </Stack>
            </Paper>
            
            <Paper withBorder p="lg" radius="sm">
              <Stack gap="xs">
                <Text c="dimmed">Early Withdrawal Today</Text>
                <Text fw={700} size="xl">{earlyWithdrawalToday}</Text>
                <Text size='sm' c="dimmed" style={{textAlign: "end"}}>May 20, 2025</Text>
              </Stack>
            </Paper>
          </SimpleGrid>

          <Group justify='space-around'>
            <Button
              variant="filled"
              color="#066F5B"
              leftSection={<IconPlus size={18} />}
              size="md"
              onClick={() => setCreatePlanOpened(true)}
            >
              Create New Plan
            </Button>
          </Group>

          {/* Filters */}
          <Text fw={500}>All Target Savings</Text>
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <TextInput
                  placeholder="Search by user name or saving title"
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.currentTarget.value);
                    setActivePage(1);
                  }}
                  style={{ width: 300 }}
                />
                <Select
                  placeholder="Plan Status"
                  data={['All', 'Active', 'Matured', 'Withdrawn']}
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value === 'All' ? null : value);
                    setActivePage(1);
                  }}
                  style={{ width: 150 }}
                  clearable
                />
              </Group>
            </Group>
          </Stack>

          {/* Results count and refresh */}
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Found {filteredData.length} plan{filteredData.length !== 1 ? 's' : ''}
            </Text>
            <Group>
              <Text size="sm" c="dimmed">
                Last Synced: May 20, 2025 | 10:45 AM
              </Text>
              <Button 
                variant="subtle" 
                size="xs" 
                leftSection={<IconRefresh size={14} />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </Group>
          </Group>

          {/* Table */}
          <Paper withBorder radius={0} style={{ overflow: 'hidden'}}>
            <Table striped highlightOnHover verticalSpacing="md">
              <Table.Thead style={{ backgroundColor: '#066F5B' }}>
                <Table.Tr>
                  <Table.Th style={{ color: '#fff' }}>User</Table.Th>
                  <Table.Th style={{ color: '#fff' }}>Savings Title</Table.Th>
                  <Table.Th style={{ color: '#fff' }}>Progress</Table.Th>
                  <Table.Th style={{ color: '#fff' }}>Frequency</Table.Th>
                  <Table.Th style={{ color: '#fff' }}>Next Payment</Table.Th>
                  <Table.Th style={{ color: '#fff' }}>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <Text fw={500}>{row.user}</Text>
                      </Table.Td>
                      <Table.Td>{row.title}</Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text size="sm">
                            ₦{row.saved.toLocaleString()} / ₦{row.target.toLocaleString()}
                          </Text>
                          <div style={{ width: '100%', height: 6, backgroundColor: '#e9ecef', borderRadius: 3 }}>
                            <div
                              style={{
                                width: `${(row.saved / row.target) * 100}%`,
                                height: 6,
                                backgroundColor: row.status === 'Matured' ? '#228be6' : row.status === 'Withdrawn' ? '#868e96' : '#12b886',
                                borderRadius: 3,
                              }}
                            />
                          </div>
                        </Stack>
                      </Table.Td>
                      <Table.Td>{row.frequency}</Table.Td>
                      <Table.Td>
                        <Text 
                          size="sm" 
                          c={row.nextPayment === 'Completed' ? 'green' : row.nextPayment === 'Withdrawn' ? 'dimmed' : undefined}
                          fw={row.nextPayment === 'Completed' || row.nextPayment === 'Withdrawn' ? 500 : 400}
                        >
                          {row.nextPayment}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          style={{
                            backgroundColor: getStatusColor(row.status),
                            padding: '8px 12px',
                            borderRadius: '5px',
                            color: 'white',
                            minWidth: '80px',
                            textAlign: 'center',
                          }}
                        >
                          {row.status}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" py="xl" c="dimmed">
                        No savings plans found matching your filters
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
            
            <Divider />
            
            {/* Pagination */}
            {filteredData.length > 0 && (
              <Group justify="space-between" p="md">
                <Text size="sm" c="dimmed">
                  Showing {Math.min((activePage - 1) * PAGE_SIZE + 1, filteredData.length)}-
                  {Math.min(activePage * PAGE_SIZE, filteredData.length)} of {filteredData.length} entries
                </Text>
                <Pagination
                  total={totalPages}
                  value={activePage}
                  onChange={setActivePage}
                  color="#066F5B"
                />
              </Group>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Plan Creation Modal */}
      <Modal
        opened={createPlanOpened}
        onClose={() => setCreatePlanOpened(false)}
        size="xl"
        padding={0}
        withCloseButton={false}
      >
        <PlanCreationFlow />
      </Modal>
    </>
  );
}