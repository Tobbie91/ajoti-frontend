import React, { useState, useMemo } from 'react';
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
  Menu,
  ActionIcon,
} from '@mantine/core';
import {
  IconDownload,
  IconFilter,
  IconArrowUpRight,
  IconArrowDownRight,
  IconRefresh,
  IconCurrencyNaira,
  IconCheck,
  IconCalendar,
} from '@tabler/icons-react';
import { TransactionMiniStats } from '@/components/StatsCard/transactionMiniStats';
import dayjs from 'dayjs';

// Define transaction data type
interface Transaction {
  id: number;
  dateTime: string;
  type: 'Wallet Top-up' | 'Withdrawal';
  amount: string;
  amountValue: number; // Add numeric value for calculations
  user: string;
  timeframe: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: Date; // Add actual timestamp for filtering
}

// Helper function to parse date string
const parseDate = (dateStr: string): Date => {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [time, period] = [timePart.slice(0, -3), timePart.slice(-2)];
  const [hours, minutes] = time.split(':');
  
  let hour = parseInt(hours);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(minutes));
};

const transactionsData: Transaction[] = [
  {
    id: 1,
    dateTime: '20/05/2025 09:10 AM',
    type: 'Wallet Top-up',
    amount: '₦ 10,100',
    amountValue: 10100,
    user: 'Okeh Benita benny@domain.com',
    timeframe: '2 mins ago',
    status: 'success',
    timestamp: new Date(2025, 4, 20, 9, 10), // May 20, 2025
  },
  {
    id: 2,
    dateTime: '20/05/2025 09:10 AM',
    type: 'Withdrawal',
    amount: '₦ 30,500',
    amountValue: 30500,
    user: 'Ajakaye John john@domain.com',
    timeframe: '2 mins ago',
    status: 'success',
    timestamp: new Date(2025, 4, 20, 9, 10),
  },
  {
    id: 3,
    dateTime: '19/05/2025 02:30 PM',
    type: 'Withdrawal',
    amount: '₦ 2,900',
    amountValue: 2900,
    user: 'Peter Praise pope@domain.com',
    timeframe: '1 day ago',
    status: 'success',
    timestamp: new Date(2025, 4, 19, 14, 30),
  },
  {
    id: 4,
    dateTime: '18/05/2025 11:15 AM',
    type: 'Wallet Top-up',
    amount: '₦ 1,500',
    amountValue: 1500,
    user: 'Abel Ojetunde ab@domain.com',
    timeframe: '2 days ago',
    status: 'success',
    timestamp: new Date(2025, 4, 18, 11, 15),
  },
  {
    id: 5,
    dateTime: '15/05/2025 04:45 PM',
    type: 'Wallet Top-up',
    amount: '₦ 10,100',
    amountValue: 10100,
    user: 'Ayo Ifeoluwa ayo@domain.com',
    timeframe: '5 days ago',
    status: 'pending',
    timestamp: new Date(2025, 4, 15, 16, 45),
  },
  {
    id: 6,
    dateTime: '10/05/2025 10:30 AM',
    type: 'Withdrawal',
    amount: '₦ 50,000',
    amountValue: 50000,
    user: 'Chioma Okonkwo chioma@domain.com',
    timeframe: '2 weeks ago',
    status: 'success',
    timestamp: new Date(2025, 4, 10, 10, 30),
  },
  {
    id: 7,
    dateTime: '05/05/2025 01:20 PM',
    type: 'Wallet Top-up',
    amount: '₦ 25,000',
    amountValue: 25000,
    user: 'Emeka Okafor emeka@domain.com',
    timeframe: '3 weeks ago',
    status: 'success',
    timestamp: new Date(2025, 4, 5, 13, 20),
  },
  {
    id: 8,
    dateTime: '01/05/2025 09:00 AM',
    type: 'Withdrawal',
    amount: '₦ 75,000',
    amountValue: 75000,
    user: 'Folake Coker folake@domain.com',
    timeframe: '1 month ago',
    status: 'success',
    timestamp: new Date(2025, 4, 1, 9, 0),
  },
];

// Date filter options
type DateFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth';

export function Transactions() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [filterMenuOpened, setFilterMenuOpened] = useState(false);

  // Filter transactions based on date
  const filteredTransactions = useMemo(() => {
    const now = dayjs();
    
    return transactionsData.filter(transaction => {
      const transactionDate = dayjs(transaction.timestamp);
      
      switch (dateFilter) {
        case 'today':
          return transactionDate.isSame(now, 'day');
        
        case 'thisWeek':
          return transactionDate.isSame(now, 'week');
        
        case 'thisMonth':
          return transactionDate.isSame(now, 'month');
        
        case 'all':
        default:
          return true;
      }
    });
  }, [dateFilter]);

  // Calculate summary stats based on filtered transactions
  const stats = useMemo(() => {
    const inflow = filteredTransactions
      .filter(t => t.type === 'Wallet Top-up')
      .reduce((sum, t) => sum + t.amountValue, 0);
    
    const outflow = filteredTransactions
      .filter(t => t.type === 'Withdrawal')
      .reduce((sum, t) => sum + t.amountValue, 0);
    
    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netBalance: inflow - outflow,
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get filter label for display
  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'thisWeek': return 'This Week';
      case 'thisMonth': return 'This Month';
      default: return 'All Time';
    }
  };

  const rows = filteredTransactions.map((transaction) => (
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
              {formatCurrency(stats.totalInflow)}
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
              {formatCurrency(stats.totalOutflow)}
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
              {formatCurrency(stats.netBalance)}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <TransactionMiniStats/>

      <Group justify="space-between" mb="xl">
        <div>
          <Text c="dimmed" mt={4}>Showing {filteredTransactions.length} transactions</Text>
        </div>
        
        {/* Action Buttons */}
        <Group>
          <Button
            leftSection={<IconDownload size={16} />}
            variant="outline"
          >
            Export
          </Button>
          
          {/* Date Filter Dropdown */}
          <Menu
            opened={filterMenuOpened}
            onChange={setFilterMenuOpened}
            position="bottom-end"
            shadow="md"
          >
            <Menu.Target>
              <Button
                leftSection={<IconFilter size={16} />}
                variant={dateFilter !== 'all' ? "filled" : "outline"}
                color={dateFilter !== 'all' ? "#066F5B" : undefined}
                rightSection={<IconCalendar size={14} />}
              >
                {getFilterLabel()}
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Filter by Date</Menu.Label>
              <Menu.Item
                leftSection={dateFilter === 'all' ? <IconCheck size={14} /> : null}
                onClick={() => {
                  setDateFilter('all');
                  setFilterMenuOpened(false);
                }}
                style={{ fontWeight: dateFilter === 'all' ? 600 : 400 }}
              >
                All Time
              </Menu.Item>
              <Menu.Item
                leftSection={dateFilter === 'today' ? <IconCheck size={14} /> : null}
                onClick={() => {
                  setDateFilter('today');
                  setFilterMenuOpened(false);
                }}
                style={{ fontWeight: dateFilter === 'today' ? 600 : 400 }}
              >
                Today
              </Menu.Item>
              <Menu.Item
                leftSection={dateFilter === 'thisWeek' ? <IconCheck size={14} /> : null}
                onClick={() => {
                  setDateFilter('thisWeek');
                  setFilterMenuOpened(false);
                }}
                style={{ fontWeight: dateFilter === 'thisWeek' ? 600 : 400 }}
              >
                This Week
              </Menu.Item>
              <Menu.Item
                leftSection={dateFilter === 'thisMonth' ? <IconCheck size={14} /> : null}
                onClick={() => {
                  setDateFilter('thisMonth');
                  setFilterMenuOpened(false);
                }}
                style={{ fontWeight: dateFilter === 'thisMonth' ? 600 : 400 }}
              >
                This Month
              </Menu.Item>

              {dateFilter !== 'all' && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    onClick={() => {
                      setDateFilter('all');
                      setFilterMenuOpened(false);
                    }}
                  >
                    Clear Filter
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
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
            <Table.Tbody>
              {rows.length > 0 ? rows : (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" py="xl" c="dimmed">
                      No transactions found for this period
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </Container>
  );
}

export default Transactions;