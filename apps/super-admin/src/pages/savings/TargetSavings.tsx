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
  ThemeIcon,
  Modal,
} from '@mantine/core';
import { IconPlus, IconSearch, IconRefresh } from '@tabler/icons-react';
import { useState } from 'react';
import { PlanCreationFlow } from '@/components/planCreationFlow';

// Mock data for the table
const mockSavingsData = [
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
];

export function TargetSavings() {
  const [createPlanOpened, setCreatePlanOpened] = useState(false);
  const [activePage, setActivePage] = useState(1);

  return (
    <>
      <Container size="xl" py="xl"> 
        <Stack gap="xl">
          {/* Header */}
          
            <Title order={2}>Target Savings</Title>

          {/* Stats Cards */}
          <SimpleGrid cols={3} spacing="md">
            <Paper withBorder p="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Total Active</Text>
                <Text fw={700} size="xl">340</Text>
              </Stack>
            </Paper>
            
            <Paper withBorder p="lg" radius="md">
              <Stack gap="xs">
                <Text c="dimmed">Missed Payment Today</Text>
                <Text fw={700} size="xl">13</Text>
                <Text size='sm' c="dimmed" style={{textAlign: "end"}}>May 20, 2025</Text>
              </Stack>
            </Paper>
            
            <Paper withBorder p="lg" radius="sm">
              <Stack gap="xs">
                <Text c="dimmed">Early Withdrawal Today</Text>
                <Text fw={700} size="xl">2</Text>
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
                    style={{ width: 300 }}
                  />
                  <Select
                    placeholder="Plan Status"
                    data={['All', 'Active', 'Matured', 'Withdrawn']}
                    style={{ width: 150 }}
                  />
                </Group>
              </Group>
            </Stack>
          <Group>
            <Text size="sm" c="dimmed">
              Last Synced: May 20, 2025 | 10:45 AM
            </Text>
            <Button variant="subtle" size="xs" leftSection={<IconRefresh size={14} />}>
              Refresh
            </Button>
          </Group>

          {/* Table */}
          <Paper withBorder radius={0} style={{ overflow: 'hidden',}}>
          <Table striped highlightOnHover verticalSpacing="md">
              <Table.Thead style={{ backgroundColor: '#066F5B', color: '#00C853'}}>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Savings Title</Table.Th>
                  <Table.Th>Progress</Table.Th>
                  <Table.Th>Frequency</Table.Th>
                  <Table.Th>Next Payment</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mockSavingsData.map((row, index) => (
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
                      <Badge style={{backgroundColor: '#00C853', padding: '18px', borderRadius: '5px', color: 'white'}} variant="light">
                        {row.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            
            <Divider />
            
            {/* Pagination */}
            <Group justify="space-between" p="md">
              <Text size="sm" c="dimmed">
                Showing 1–10 of 11 live entries
              </Text>
              <Pagination
                total={2}
                value={activePage}
                onChange={setActivePage}
                color="#066F5B"
              />
            </Group>
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