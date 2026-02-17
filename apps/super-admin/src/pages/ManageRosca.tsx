import { AdminRequestModal } from '@/components/AdminRequestModal/AdminRequestModal';
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
  Modal,
  Loader,
  Badge,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useState } from 'react';

interface AdminRequest {
  name: string;
  email: string;
  phone?: string;
  reason: string;
  submitted: string;
  idProvided: string;
  groupsJoined: number;
  dateJoined: string;
  trustScore: number;
  status: 'pending' | 'approved' | 'rejected'; // Add status field
  action: 'approve' | 'reject';
}

const initialRequests: AdminRequest[] = [
  {
    name: 'Ogunrinde Ayomide',
    email: 'mide@domain.com',
    reason: "I've managed local thrift groups",
    submitted: 'Jun 20, 2025',
    idProvided: 'Yes',
    action: 'approve',
    groupsJoined: 3,
    dateJoined: 'April 15, 2025',
    trustScore: 22,
    status: 'pending',
  },
  {
    name: 'Ogunrinde Ayomide',
    email: 'mide@domain.com',
    reason: "I've managed local thrift groups",
    submitted: 'Jun 20, 2025',
    idProvided: 'No',
    action: 'reject',
    groupsJoined: 1,
    dateJoined: 'March 10, 2025',
    trustScore: 15,
    status: 'pending',
  },
  {
    name: 'Adekunle Oluwaseun',
    email: 'seun@domain.com',
    reason: "10 years experience in financial management",
    submitted: 'Jun 18, 2025',
    idProvided: 'Yes',
    action: 'approve',
    groupsJoined: 5,
    dateJoined: 'Jan 10, 2025',
    trustScore: 85,
    status: 'approved', // Already approved
  },
  {
    name: 'Blessing Okafor',
    email: 'blessing@domain.com',
    reason: "Community leader with thrift group experience",
    submitted: 'Jun 15, 2025',
    idProvided: 'No',
    action: 'reject',
    groupsJoined: 0,
    dateJoined: 'Feb 20, 2025',
    trustScore: 10,
    status: 'rejected', // Already rejected
  },
];

export function ManageRosca() {
  // Modals state
  const [detailsModalOpened, setDetailsModalOpened] = useState(false);
  const [confirmModalOpened, setConfirmModalOpened] = useState(false);
  const [loadingModalOpened, setLoadingModalOpened] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('pending');
  const [requests, setRequests] = useState<AdminRequest[]>(initialRequests);

  // Filter requests based on active tab
  const filteredRequests = requests.filter(req => {
    if (activeTab === 'pending') return req.status === 'pending';
    if (activeTab === 'approved') return req.status === 'approved';
    if (activeTab === 'rejected') return req.status === 'rejected';
    return true;
  });

  const handleViewRequest = (request: AdminRequest) => {
    setSelectedRequest(request);
    setDetailsModalOpened(true);
  };
  
  // When user clicks Approve from details modal
  const handleApproveClick = () => {
    setDetailsModalOpened(false);
    setConfirmModalOpened(true);
  };
  
  // When user clicks Reject from details modal
  const handleRejectClick = () => {
    setDetailsModalOpened(false);
    setLoadingMessage('Rejecting User');
    setLoadingModalOpened(true);
    
    // Simulate API call
    setTimeout(() => {
      if (selectedRequest) {
        // Update the request status
        setRequests(prev => prev.map(req => 
          req.email === selectedRequest.email && req.name === selectedRequest.name
            ? { ...req, status: 'rejected' as const }
            : req
        ));
        
        console.log('Rejected:', selectedRequest);
        setLoadingModalOpened(false);
        setSelectedRequest(null);
      }
    }, 2000);
  };
  
  // When user clicks Yes on confirmation modal
  const handleConfirmApprove = () => {
    setConfirmModalOpened(false);
    setLoadingMessage('Confirming User');
    setLoadingModalOpened(true);
    
    // Simulate API call
    setTimeout(() => {
      if (selectedRequest) {
        // Update the request status
        setRequests(prev => prev.map(req => 
          req.email === selectedRequest.email && req.name === selectedRequest.name
            ? { ...req, status: 'approved' as const }
            : req
        ));
        
        console.log('Approved:', selectedRequest);
        setLoadingModalOpened(false);
        setSelectedRequest(null);
      }
    }, 2000);
  };
  
  // When user clicks No on confirmation modal
  const handleCancelApprove = () => {
    setConfirmModalOpened(false);
    setDetailsModalOpened(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpened(false);
    setSelectedRequest(null);
  };

  // Get counts for tabs
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

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
          <Title order={2}>Admin Requests</Title>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="pending" rightSection={
                <Badge size="xs" circle>{pendingCount}</Badge>
              }>
                Pending
              </Tabs.Tab>
              <Tabs.Tab value="approved" rightSection={
                <Badge size="xs" circle color="green">{approvedCount}</Badge>
              }>
                Approved
              </Tabs.Tab>
              <Tabs.Tab value="rejected" rightSection={
                <Badge size="xs" circle color="red">{rejectedCount}</Badge>
              }>
                Rejected
              </Tabs.Tab>
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
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req, index) => (
                  <Table.Tr 
                    key={index} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => req.status === 'pending' && handleViewRequest(req)}
                  >
                    <Table.Td>{req.name}</Table.Td>
                    <Table.Td>{req.email}</Table.Td>
                    <Table.Td>{req.reason.substring(0, 50)}...</Table.Td>
                    <Table.Td>{req.submitted}</Table.Td>
                    <Table.Td>{req.idProvided}</Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      {req.status === 'pending' ? (
                        req.action === 'approve' ? (
                          <Button 
                            color="#00C853" 
                            radius="md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRequest(req);
                            }}
                          >
                            Approve
                          </Button>
                        ) : (
                          <Button 
                            color="#DF0307" 
                            radius="md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRequest(req);
                            }}
                          >
                            Reject
                          </Button>
                        )
                      ) : (
                        <Text size="sm" c="dimmed">
                          {req.status === 'approved' ? 'Approved' : 'Rejected'}
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">
                      No {activeTab} requests found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          {/* Footer */}
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing {filteredRequests.length} of {requests.length} requests
            </Text>
            <Pagination total={Math.ceil(filteredRequests.length / 7)} />
          </Group>
        </Paper>
      </Stack>

      {/* Details Modal */}
      {selectedRequest && (
        <AdminRequestModal
          opened={detailsModalOpened}
          onClose={handleCloseDetailsModal}
          requestData={selectedRequest}
          onApprove={handleApproveClick}
          onReject={handleRejectClick}
        />
      )}

      {/* Confirmation Modal */}
      <Modal
        opened={confirmModalOpened}
        onClose={() => setConfirmModalOpened(false)}
        size="md"
        centered
      >
        <Stack gap="xl" py="md">
          <Text size="lg" ta="center">
            Are you sure you want to upgrade this user to ROSCA Admin?
          </Text>
          
          <Group justify="center" gap="md">
            <Button 
              variant="outline" 
              color="gray" 
              size="lg"
              onClick={handleCancelApprove}
              style={{ minWidth: 100 }}
            >
              No
            </Button>
            <Button 
              color="#066F5B" 
              size="lg"
              onClick={handleConfirmApprove}
              style={{ minWidth: 100 }}
            >
              Yes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Loading Modal */}
      <Modal
        opened={loadingModalOpened}
        onClose={() => {}}
        withCloseButton={false}
        size="md"
        centered
      >
        <Stack gap="xl" py="xl" align="center">
          <Loader size="lg" color="#066F5B" />
          <Text size="lg" fw={500}>{loadingMessage}</Text>
          <Text size="sm" c="dimmed">Please wait...</Text>
        </Stack>
      </Modal>
    </Container>
  );
}