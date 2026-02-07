
import React from 'react';
import {
  Container,
  Title,
  Card,
  Text,
  Grid,
  Table,
  Badge,
  Group,
  Button,
  Select,
  Paper,
  rem,
  Box,
  Stack,
} from '@mantine/core';
import {
  IconDownload,
  IconFilter,
  IconArrowUpRight,
  IconArrowDownRight,
  IconRefresh,
  IconCurrencyNaira,
} from '@tabler/icons-react';
import { TransactionMiniStats } from '@/components/StatsCard/transactionMiniStats';

// Define transaction data type
interface Transaction {
  id: number;
  dateTime: string;
  type: 'Wallet Top-up' | 'Withdrawal';
  amount: string;
  user: string;
  timeframe: string;
  status: 'success' | 'pending' | 'failed';
}

const transactionsData: Transaction[] = [
  {
    id: 1,
    dateTime: '20/05/2025 09:10 AM',
    type: 'Wallet Top-up',
    amount: '₦ 10,100',
    user: 'Okeh Benita benny@domain.com',
    timeframe: '2 mins ago',
    status: 'success',
  },
  {
    id: 2,
    dateTime: '20/05/2025 09:10 AM',
    type: 'Withdrawal',
    amount: '₦ 30,500',
    user: 'Ajakaye John john@domain.com',
    timeframe: '2 mins ago',
    status: 'success',
  },
  {
    id: 3,
    dateTime: '20/05/2025 09:10 AM',
    type: 'Withdrawal',
    amount: '₦ 2,900',
    user: 'Peter Praise pope@domain.com',
    timeframe: '2 mins ago',
    status: 'success',
  },
  {
    id: 4,
    dateTime: '20/05/2025 09:10 AM',
    type: 'Wallet Top-up',
    amount: '₦ 1,500',
    user: 'Abel Ojetunde ab@domain.com',
    timeframe: '2 mins ago',
    status: 'success',
  },
  {
    id: 5,
    dateTime: '20/05/2025 09:10 AM',
    type: 'Wallet Top-up',
    amount: '₦ 10,100',
    user: 'Ayo Ifeoluwa ayo@domain.com',
    timeframe: '2 mins ago',
    status: 'pending',
  },
];

export function Transactions() {
  // Calculate summary stats
  const totalInflow = 245000000;
  const totalOutflow = 56000000;
  const netBalance = totalInflow - totalOutflow;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const rows = transactionsData.map((transaction) => (
    <Table.Tr key={transaction.id}>
      <Table.Td>{transaction.dateTime}</Table.Td>
      <Table.Td>
        <Badge
          color={transaction.type === 'Wallet Top-up' ? 'green' : 'blue'}
          variant="light"
          leftSection={
            transaction.type === 'Wallet Top-up' ? (
              <IconArrowUpRight size={12} />
            ) : (
              <IconArrowDownRight size={12} />
            )
          }
        >
          {transaction.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text fw={500} className={transaction.type === 'Withdrawal' ? 'text-red-600' : 'text-green-600'}>
          {transaction.amount}
        </Text>
      </Table.Td>
      <Table.Td>
        <div>
          <Text size="sm" fw={500}>
            {transaction.user.split(' ')[0]} {transaction.user.split(' ')[1]}
          </Text>
          <Text size="xs" c="dimmed">
            {transaction.user.split(' ')[2]}
          </Text>
        </div>
      </Table.Td>
      <Table.Td>
        <Badge color="gray" variant="light">
          {transaction.timeframe}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Button
          size="xs"
          variant="light"
          color="blue"
          leftSection={<IconRefresh size={14} />}
          onClick={() => console.log('Retry transaction:', transaction.id)}
        >
          Retry
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} fw={700}>Transactions</Title>
        </div>
                
      </Group>

      {/* Summary Cards */}
      <Grid gutter="xl" mb="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" padding="md" className="shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <IconArrowDownRight size={20} className="text-green-600" />
            </div>
            <Text size="sm" fw={500} mb={4}>Total Inflow</Text>
            <Text size="xl" fw={800} className="text-2xl">
              {formatCurrency(245000000)}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" padding="md" className="shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <IconArrowUpRight size={20} className="text-red-600" />
            </div>
            <Text size="sm" fw={500} mb={4}>Total Outflow</Text>
            <Text size="xl" fw={800} className="text-2xl">
              {formatCurrency(56000000)}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" padding="md" className="shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <IconCurrencyNaira size={20} className="text-green-600" />
        
            </div>
            <Text size="sm" fw={500} mb={4}>Net Balance</Text>
            <Text size="xl" fw={800} className="text-2xl">
              {formatCurrency(189000000)}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <TransactionMiniStats/>

      <Group justify="space-between" mb="xl">
        <div>
          <Text c="dimmed" mt={4}>Pending transactions</Text>
        </div>
        
        {/* Action Buttons */}
        <Group>
          <Button
            leftSection={<IconDownload size={16} />}
            variant="outline"
          >
            Export
          </Button>
          <Button
            leftSection={<IconFilter size={16} />}
            variant="outline"
          >
            Filter by Date
          </Button>
        </Group>
      </Group>

      <Card withBorder radius={0} p={0}>
        
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: '#066F5B' }}>
                <Table.Th style={{ color: 'white' }}>Date & Time</Table.Th>
                <Table.Th style={{ color: 'white' }}>Transaction Type</Table.Th>
                <Table.Th style={{ color: 'white' }}>Amount</Table.Th>
                <Table.Th style={{ color: 'white' }}>User ID</Table.Th>
                <Table.Th style={{ color: 'white' }}>Timeframe</Table.Th>
                <Table.Th style={{ color: 'white' }}>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      
    </Container>
  );
}

export default Transactions;