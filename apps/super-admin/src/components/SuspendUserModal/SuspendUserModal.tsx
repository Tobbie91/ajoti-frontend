import { Modal, Stack, Text, Group, Button, Checkbox, Badge, Avatar, Select, Alert, Table, ActionIcon, Loader, Progress, Paper } from '@mantine/core';
import { IconAlertCircle, IconInfoCircle, IconEye, IconX, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';

interface User {
  name: string;
  email: string;
  role?: string;
  status?: string;
}

interface SuspendUserModalProps {
  opened: boolean;
  onClose: () => void;
  selectedUsers: User[];
  onConfirm: (reason: string, notifyUser: boolean) => void;
}

export function SuspendUserModal({ opened, onClose, selectedUsers, onConfirm }: SuspendUserModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [notifyUser, setNotifyUser] = useState(true);
  const [usersModalOpened, setUsersModalOpened] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [suspensionComplete, setSuspensionComplete] = useState(false);

  const handleConfirm = () => {
    if (reason && selectedUsers.length > 0) {
      setShowProgress(true);
      
      // Simulate progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(interval);
          setSuspensionComplete(true);
        }
      }, 200);
    }
  };

  const handleClose = () => {
    setShowProgress(false);
    setSuspensionComplete(false);
    setProgress(0);
    setReason(null);
    setNotifyUser(true);
    onClose();
  };

  const handleFinalConfirm = () => {
    if (reason && selectedUsers.length > 0) {
      onConfirm(reason, notifyUser);
      handleClose();
    }
  };

  // Get display text for selected users
  const getSelectedUsersText = () => {
    if (!selectedUsers || selectedUsers.length === 0) return '';
    if (selectedUsers.length === 1) return selectedUsers[0].name;
    
    const firstName = selectedUsers[0]?.name?.split(' ')[0] || 'User';
    return `${firstName} and ${selectedUsers.length - 1} other${selectedUsers.length - 1 > 1 ? 's' : ''}`;
  };

  // Truncate name for display
  const truncateName = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return fullName;
  };

  // Get success message
  const getSuccessMessage = () => {
    if (!selectedUsers || selectedUsers.length === 0) {
      return 'Users have been suspended. Email notifications sent.';
    }
    
    if (selectedUsers.length === 1) {
      const firstName = selectedUsers[0]?.name?.split(' ')[0] || 'User';
      return `${firstName} has been suspended. Email notification sent.`;
    }
    
    const firstName = selectedUsers[0]?.name?.split(' ')[0] || 'Users';
    return `${firstName} and ${selectedUsers.length - 1} others have been suspended. Email notifications sent.`;
  };

  return (
    <>
      {/* Main Suspend Modal */}
      <Modal
        opened={opened && !showProgress && !suspensionComplete}
        onClose={handleClose}
        title="Suspend User Account"
        size="lg"
        radius="md"
        padding="xl"
      >
        <Stack gap="lg">
          {/* Warning Alert */}
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
          >
            <Text fw={500}>Are you sure you want to suspend account(s)?</Text>
          </Alert>

          {/* Suspension Effects */}
          <Stack gap="sm" p="md" style={{ backgroundColor: '#F9F9F9', borderRadius: 8 }}>
            <Group gap="xs">
              <IconInfoCircle size={18} color="#666" />
              <Text size="sm">Temporarily block user's access to the platform</Text>
            </Group>
            <Group gap="xs">
              <IconInfoCircle size={18} color="#666" />
              <Text size="sm">Pause their ongoing activities and transactions</Text>
            </Group>
            <Group gap="xs">
              <IconInfoCircle size={18} color="#666" />
              <Text size="sm">Notify them via email</Text>
            </Group>
          </Stack>

          {/* Reactivation Note */}
          <Text size="sm" c="dimmed" fs="italic">
            You can reactivate the account at any time.
          </Text>

          {/* Selected Users */}
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" align="center">
              <Group>
                <Badge color="#066F5B" size="lg">{selectedUsers.length} users selected</Badge>
                <Text size="sm" fw={500}>{getSelectedUsersText()}</Text>
              </Group>
              {selectedUsers.length > 2 && (
                <Button 
                  variant="subtle" 
                  size="xs" 
                  leftSection={<IconEye size={14} />}
                  onClick={() => setUsersModalOpened(true)}
                >
                  View all selected
                </Button>
              )}
            </Group>
          </Paper>

          {/* Reason for Suspension */}
          <div>
            <Text fw={500} mb="xs">Reason for Suspension <span style={{ color: 'red' }}>*</span></Text>
            <Select
              placeholder="Select reason"
              data={[
                { value: 'violation', label: 'Terms of Service Violation' },
                { value: 'fraud', label: 'Suspected Fraudulent Activity' },
                { value: 'inactive', label: 'Long-term Inactivity' },
                { value: 'complaint', label: 'User Complaint' },
                { value: 'other', label: 'Other' },
              ]}
              value={reason}
              onChange={setReason}
              size="md"
              required
            />
          </div>

          {/* Notify User Checkbox */}
          <Checkbox
            label="Notify user via email about this suspension"
            checked={notifyUser}
            onChange={(event) => setNotifyUser(event.currentTarget.checked)}
          />

          {/* Action Buttons */}
          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={handleConfirm}
              disabled={!reason || selectedUsers.length === 0}
            >
              Suspend Account
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Progress Modal */}
      <Modal
        opened={showProgress && !suspensionComplete}
        onClose={() => {}}
        withCloseButton={false}
        size="md"
        centered
      >
        <Stack gap="xl" py="xl" align="center">
          <Loader size="lg" color="red" />
          <Text size="lg" fw={500}>Suspending...</Text>
          <Text size="sm" c="dimmed">Please wait. Do not close this window.</Text>
          <Progress 
            value={progress} 
            color="red" 
            size="md" 
            w="100%" 
            striped
            animated
          />
          <Button 
            variant="subtle" 
            color="gray" 
            onClick={handleClose}
            size="xs"
          >
            Cancel
          </Button>
        </Stack>
      </Modal>

      {/* Success Modal */}
      <Modal
        opened={suspensionComplete}
        onClose={handleClose}
        withCloseButton={false}
        size="md"
        centered
      >
        <Stack gap="xl" py="xl" align="center">
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: '#d4edda',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconCheck size={30} color="#28a745" />
          </div>
          <Text size="lg" fw={500} ta="center">{getSuccessMessage()}</Text>
          <Button 
            color="gray" 
            onClick={handleClose}
            style={{ minWidth: 120 }}
          >
            Close
          </Button>
        </Stack>
      </Modal>

      {/* Selected Users List Modal */}
      <Modal
        opened={usersModalOpened}
        onClose={() => setUsersModalOpened(false)}
        title="Selected Users"
        size="lg"
        radius="md"
      >
        <Table striped highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#066F5B' }}>
            <Table.Tr>
              <Table.Th style={{ color: 'white' }}>Name</Table.Th>
              <Table.Th style={{ color: 'white' }}>Email address</Table.Th>
              <Table.Th style={{ color: 'white' }}>Role</Table.Th>
              <Table.Th style={{ color: 'white' }}>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {selectedUsers.map((user, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Text fw={500}>{truncateName(user.name)}</Text>
                </Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <Badge color="blue" variant="light">
                    {user.role || 'User'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge 
                    color={user.status === 'Active' ? 'green' : user.status === 'Suspended' ? 'orange' : 'red'} 
                    variant="filled"
                    size="sm"
                  >
                    {user.status || 'Active'}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={() => setUsersModalOpened(false)}>
            Close
          </Button>
        </Group>
      </Modal>
    </>
  );
}