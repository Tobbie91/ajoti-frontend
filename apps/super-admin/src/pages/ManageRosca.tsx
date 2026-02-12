import {
  Container,
  Group,
  Text,
  Title,
  Tabs,
  Table,
  Paper,
  Button,
  Pagination,
  Stack,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';

const requests = [
  {
    name: 'Ogunrinde Ayomide',
    email: 'mide@domain.com',
    reason: "I've managed local thrift groups",
    submitted: 'Jun 20, 2025',
    idProvided: 'Yes',
    action: 'approve',
  },
  {
    name: 'Ogunrinde Ayomide',
    email: 'mide@domain.com',
    reason: "I've managed local thrift groups",
    submitted: 'Jun 20, 2025',
    idProvided: 'No',
    action: 'reject',
  },
];

export function ManageRosca() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Back */}
        <Group gap="xs">
          <IconArrowLeft size={18} />
          <Text fw={500}>Back</Text>
        </Group>

        {/* Header */}
        <Text c="dimmed">Manage ROSCA</Text>

        <Group justify="space-between" align="center">
          <Title order={2}>Pending Requests</Title>

          <Tabs defaultValue="pending">
            <Tabs.List>
              <Tabs.Tab value="pending">Pending</Tabs.Tab>
              <Tabs.Tab value="approved">Approved</Tabs.Tab>
              <Tabs.Tab value="rejected">Rejected</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Group>

        {/* Table */}
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
                <Table.Th c="white">Name</Table.Th>
                <Table.Th c="white">Email</Table.Th>
                <Table.Th c="white">Reason</Table.Th>
                <Table.Th c="white">Submitted</Table.Th>
                <Table.Th c="white">ID Provided</Table.Th>
                <Table.Th c="white">Action</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {requests.map((req, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{req.name}</Table.Td>
                  <Table.Td>{req.email}</Table.Td>
                  <Table.Td>{req.reason}</Table.Td>
                  <Table.Td>{req.submitted}</Table.Td>
                  <Table.Td>{req.idProvided}</Table.Td>
                  <Table.Td>
                    {req.action === 'approve' ? (
                      <Button color="#00C853" radius="md">
                        Approve
                      </Button>
                    ) : (
                      <Button color="#DF0307" radius="md">
                        Reject
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {/* Footer */}
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing 1–7 of 15 Admins
            </Text>
            <Pagination total={2} />
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
}