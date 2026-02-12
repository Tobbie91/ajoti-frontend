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
  } from '@mantine/core';
  import { IconArrowLeft, IconSearch, IconUpload } from '@tabler/icons-react';
  
  const data = [
    {
      name: 'Esther Idowu',
      role: 'Regular User',
      amount: '₦50,000',
      duration: '6 months',
      interest: '₦30,000',
      date: 'Jun 01, 2025',
      method: 'Wallet',
    },
    {
      name: 'Ayomide Ife',
      role: 'Regular User',
      amount: '₦25,000',
      duration: '3 months',
      interest: '₦7,500',
      date: 'May 29, 2025',
      method: 'Wallet',
    },
    {
      name: 'Gbenga Adesuji',
      role: 'Regular User',
      amount: '₦32,000',
      duration: '6 months',
      interest: '₦19,200',
      date: 'May 29, 2025',
      method: 'Wallet',
    },
  ];
  
  export function FixedSavings() {
    return (
      <Container size="xl" py="xl">
        <Stack gap="lg">
          {/* Page title */}
          <Title order={3}>Total Interest Accrued</Title>
  
          {/* Back */}
          <Group gap="xs">
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
              w={420}
            />
  
            <Group>
              <Button
                leftSection={<IconUpload size={16} />}
                variant="outline"
                color="teal"
              >
                Export
              </Button>
  
              <Select
                placeholder="Role"
                data={['Regular User', 'Admin']}
                w={120}
              />
  
              <Select
                placeholder="Status"
                data={['Matured', 'Pending']}
                w={120}
              />
            </Group>
          </Group>
  
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
                {data.map((row, index) => (
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
                      <Badge color="#120DAA" radius="sm" style={{ padding: '20px' }}>
                        Matured
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
  
            {/* Footer */}
            <Group justify="space-between" p="md">
              <Text size="sm" c="dimmed">
                Showing 1–10 of 21 matured entries
              </Text>
  
              <Pagination total={3} />
            </Group>
          </Paper>
        </Stack>
      </Container>
    );
  }
  