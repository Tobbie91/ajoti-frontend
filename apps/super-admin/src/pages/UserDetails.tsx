// src/pages/UserDetails.tsx
import { useState } from 'react';
import {
  Container,
  Stack,
  Group,
  Text,
  Title,
  Paper,
  Avatar,
  Grid,
  Tabs,
  Table,
  Badge,
  Button,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import { IconArrowLeft, IconMail, IconPhone, IconWallet } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';

// Mock user data - replace with API call
const mockUser = {
  name: 'Ayomide Emmanuel',
  email: 'mide@domain.com',
  phone: '+234 903 380 1431',
  mainBalance: 45900,
  fixedSavings: 20000,
  fixedMaturity: 'June 20, 2026',
  targetSavings: 75000,
  activeGoals: 2,
  transactions: [
    { date: 'Mar 03/25 09:00 AM', description: 'Wallet Top up', type: 'Credit', status: 'Success', paymentOption: 'Card', amount: 7500, balance: 45900 },
    { date: 'Mar 03/25 08:30 AM', description: 'Bank Transfer', type: 'Debit', status: 'Success', paymentOption: 'Wallet', amount: 5000, balance: 38400 },
    { date: 'Mar 03/25 08:17 AM', description: 'Target Savings', type: 'Debit', status: 'Success', paymentOption: 'Wallet', amount: 4000, balance: 43400 },
    { date: 'Mar 01/25 10:21 PM', description: 'Bank Transfer', type: 'Debit', status: 'Success', paymentOption: 'Wallet', amount: 2000, balance: 47400 },
    { date: 'Feb 28/25 01:00 PM', description: 'USD Conversion', type: 'Credit', status: 'Success', paymentOption: 'Wallet', amount: 6790, balance: 49400 },
    { date: 'Feb 27/25 09:00 AM', description: 'Bank Transfer', type: 'Debit', status: 'Success', paymentOption: 'Card', amount: 7500, balance: 49400 },
    { date: 'Feb 27/25 09:00 AM', description: 'ROSCA Deduction', type: 'Debit', status: 'Success', paymentOption: 'Wallet', amount: 10000, balance: 56900 },
    { date: 'Feb 20/25 04:32 PM', description: 'Withdrawal', type: 'Debit', status: 'Success', paymentOption: 'Wallet', amount: 20500, balance: 66900 },
    { date: 'Feb 19/25 02:13 AM', description: 'Wallet Top up', type: 'Credit', status: 'Success', paymentOption: 'Card', amount: 5000, balance: 91900 },
    { date: 'Feb 03/25 09:00 AM', description: 'Wallet Top up', type: 'Credit', status: 'Success', paymentOption: 'Card', amount: 7500, balance: 86900 },
  ],
};

export function UserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams(); // Get user ID from URL
  const [activeTab, setActiveTab] = useState<string | null>('transactions');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success': return 'green';
      case 'Pending': return 'yellow';
      case 'Failed': return 'red';
      default: return 'gray';
    }
  };

  // Get transaction type color
  const getTypeColor = (type: string) => {
    return type === 'Credit' ? 'green' : 'red';
  };

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        {/* Back Button */}
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate('/manage-users')}
          >
            Back
          </Button>
        </Group>

        {/* User Header */}
          <Group align="flex-start" gap="xl">

            <Stack style={{ flex: 1 }}>
              <Title order={2}>{mockUser.name}</Title>
              
              <Group gap="lg">
                <Group gap="xs">
                  <IconMail size={16} color="#666" />
                  <Text>{mockUser.email}</Text>
                </Group>
                <Group gap="xs">
                  <IconPhone size={16} color="#666" />
                  <Text>{mockUser.phone}</Text>
                </Group>
              </Group>
            </Stack>
          </Group>

        {/* Balance Cards */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Group>
                <IconWallet size={20} color="#066F5B" />
                <Text size="sm" c="dimmed">Main Account Balance</Text>
              </Group>
              <Text size="xl" fw={700}>{formatCurrency(mockUser.mainBalance)}</Text>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Fixed Savings</Text>
              <Text size="xl" fw={700}>{formatCurrency(mockUser.fixedSavings)}</Text>
              <Text size="sm" c="dimmed">Maturity: {mockUser.fixedMaturity}</Text>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Target Savings</Text>
              <Text size="xl" fw={700}>{formatCurrency(mockUser.targetSavings)}</Text>
              <Text size="sm" c="dimmed">{mockUser.activeGoals} active goals</Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Tabs */}
        <Paper withBorder radius={0}>
          <Tabs value={activeTab} onChange={setActiveTab} >
            <Tabs.List >
              <Tabs.Tab py='lg' value="transactions">Transactions</Tabs.Tab>
              <Tabs.Tab py='lg' value="rosca">ROSCA Participation</Tabs.Tab>
              <Tabs.Tab py='lg' value="personal">Personal Information</Tabs.Tab>
              <Tabs.Tab py='lg' value="security">Security Logs</Tabs.Tab>
            </Tabs.List>

            {/* Transactions Tab */}
            <Tabs.Panel value="transactions" pt="md">
              <Table.ScrollContainer minWidth={1000}>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#066F5B' }}>
                    <Table.Tr style={{ height: '55px' }}>
                      <Table.Th style={{ color: 'white' }}>Time Stamp</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Description</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Type</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Status</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Payment option</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Amount</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Balance</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {mockUser.transactions.map((tx, index) => (
                      <Table.Tr key={index} style={{ height: '55px' }}>
                        <Table.Td>{tx.date}</Table.Td>
                        <Table.Td>{tx.description}</Table.Td>
                        <Table.Td>
                          <Text c={getTypeColor(tx.type)} fw={500}>
                            {tx.type}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(tx.status)} variant="light">
                            {tx.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{tx.paymentOption}</Table.Td>
                        <Table.Td>
                          <Text c={tx.type === 'Credit' ? 'green' : 'red'} fw={500}>
                            {tx.type === 'Credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td>{formatCurrency(tx.balance)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              {/* Pagination */}
              <Group justify="space-between" p="md">
                <Text size="sm" c="dimmed">
                  Showing 1-10 of 101 transactions
                </Text>
                <Group gap="xs">
                  <Button variant="outline" size="xs" disabled>Previous</Button>
                  <Button variant="filled" size="xs" color="#066F5B">1</Button>
                  <Button variant="outline" size="xs">2</Button>
                  <Button variant="outline" size="xs">3</Button>
                  <Button variant="outline" size="xs">Next</Button>
                </Group>
              </Group>
            </Tabs.Panel>

            {/* ROSCA Participation Tab */}
            <Tabs.Panel value="rosca" pt="md">
              <Text ta="center" py="xl" c="dimmed">ROSCA participation details will appear here</Text>
            </Tabs.Panel>

            {/* Personal Information Tab */}
            <Tabs.Panel value="personal" pt="md">
              <Text ta="center" py="xl" c="dimmed">Personal information will appear here</Text>
            </Tabs.Panel>

            {/* Security Logs Tab */}
            <Tabs.Panel value="security" pt="md">
              <Text ta="center" py="xl" c="dimmed">Security logs will appear here</Text>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  );
}