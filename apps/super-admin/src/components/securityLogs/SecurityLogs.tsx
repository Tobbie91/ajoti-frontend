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
  } from '@mantine/core';
  
  const userLogs = Array.from({ length: 10 }).map(() => ({
    date: 'Apr 25, 2025',
    time: '10:01 AM',
    name: 'Ayomide Emmanuel',
    email: 'mide@domain.com',
    ip: '104.98.129',
    device: 'Samsung',
    location: 'Lagos',
    activity: 'Signed In',
  }));

  const adminLogs = [
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
  ];
  
  
  export function SecurityLogs() {
    return (
      <Stack mt="xl" gap="lg">
        <Group justify="space-between">
          <Title order={3}>Login & Security Logs</Title>
  
          <Select
            placeholder="Filter"
            data={['Today', 'Last 7 days', 'Last 30 days']}
            w={160}
          />
        </Group>
  
        <Tabs defaultValue="user">
          <Tabs.List>
            <Tabs.Tab value="user">User Activity</Tabs.Tab>
            <Tabs.Tab value="admin">Admin Activity</Tabs.Tab>
          </Tabs.List>
  
          <Tabs.Panel value="user" pt="md">
            <Paper withBorder radius="md">
              <Table striped highlightOnHover styles={{
                    th: {
                    padding: '16px 20px',
                    },
                    td: {
                    padding: '16px 20px',
                    },
                }}>
              <Table.Thead>
                <Table.Tr bg="#066F5B">
                    <Table.Th c="white" style={{ padding: '16px 20px' }}>
                    Time Stamp
                  </Table.Th>
                  <Table.Th c="white" style={{ padding: '16px 20px' }}>
                    User
                  </Table.Th>
                    <Table.Th c="white" style={{ padding: '16px 20px' }}>
                    IP Address
                  </Table.Th>
                  <Table.Th c="white" style={{ padding: '16px 20px' }}>
                    Device
                  </Table.Th>
                  <Table.Th c="white" style={{ padding: '16px 20px' }}>
                    Activity
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
  
                <Table.Tbody>
                  {userLogs.map((log, index) => (
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
  
                      <Table.Td>{log.ip}</Table.Td>
  
                      <Table.Td>
                        <Text fw={500}>{log.device}</Text>
                        <Text size="sm" c="dimmed">
                          {log.location}
                        </Text>
                      </Table.Td>
  
                      <Table.Td>{log.activity}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
  
              {/* Pagination */}
              <Group justify="space-between" p="md">
                <Text size="sm" c="dimmed">
                  Showing 1–10 of 101 entries
                </Text>
                <Pagination total={3} />
              </Group>
            </Paper>
          </Tabs.Panel>
  
          <Tabs.Panel value="admin" pt="md">
            <Paper withBorder radius="md">
                <Table
                striped
                highlightOnHover
                styles={{
                    th: { padding: '16px 20px' },
                    td: { padding: '16px 20px' },
                }}
                >
                <Table.Thead>
                    <Table.Tr bg="#066F5B">
                    <Table.Th c="white">Time Stamp</Table.Th>
                    <Table.Th c="white">Admin</Table.Th>
                    <Table.Th c="white">IP Address</Table.Th>
                    <Table.Th c="white">Device</Table.Th>
                    <Table.Th c="white">Activity</Table.Th>
                    </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                    {adminLogs.map((log, index) => (
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

                        <Table.Td>{log.ip}</Table.Td>

                        <Table.Td>
                        <Text fw={500}>{log.device}</Text>
                        <Text size="sm" c="dimmed">
                            {log.location}
                        </Text>
                        </Table.Td>

                        <Table.Td>{log.activity}</Table.Td>
                    </Table.Tr>
                    ))}
                </Table.Tbody>
                </Table>

                {/* Footer */}
                <Group justify="space-between" p="md">
                <Text size="sm" c="dimmed">
                    Showing 1–10 of 101 entries
                </Text>
                <Pagination total={3} />
                </Group>
            </Paper>
            </Tabs.Panel>

        </Tabs>
      </Stack>
    );
  }
  