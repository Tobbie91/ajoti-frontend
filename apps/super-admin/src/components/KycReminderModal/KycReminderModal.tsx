// src/components/KycReminderModal.tsx
import { Modal, Stack, Text, Group, Button, Checkbox, Badge, Select, Textarea, Paper, Alert, Radio, Loader, Progress, Table } from '@mantine/core';
import { IconInfoCircle, IconEye, IconBell, IconMail, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';

interface User {
  name: string;
  email: string;
}

interface KycReminderModalProps {
  opened: boolean;
  onClose: () => void;
  selectedUsers: User[];
  onConfirm: (reminderType: string, message: string, sendAs: string) => void;
}

export function KycReminderModal({ opened, onClose, selectedUsers, onConfirm }: KycReminderModalProps) {
  const [reminderType, setReminderType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sendAs, setSendAs] = useState('in-app');
  const [usersModalOpened, setUsersModalOpened] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reminderComplete, setReminderComplete] = useState(false);

  const handleConfirm = () => {
    if (reminderType && selectedUsers.length > 0) {
      setShowProgress(true);
      
      // Simulate progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(interval);
          setReminderComplete(true);
        }
      }, 200);
    }
  };

  const handleClose = () => {
    setShowProgress(false);
    setReminderComplete(false);
    setProgress(0);
    setReminderType(null);
    setMessage('');
    setSendAs('in-app');
    onClose();
  };

  const handleFinalConfirm = () => {
    if (reminderType && selectedUsers.length > 0) {
      onConfirm(reminderType, message, sendAs);
      handleClose();
    }
  };

  // Get display text for selected users
  const getSelectedUsersText = () => {
    if (!selectedUsers || selectedUsers.length === 0) return '';
    if (selectedUsers.length === 1) return selectedUsers[0].name;
    
    const firstName = selectedUsers[0]?.name?.split(' ')[0] || 'User';
    const secondName = selectedUsers[1]?.name?.split(' ')[0] || 'User';
    return `${selectedUsers[0].name}, ${selectedUsers[1].name} +${selectedUsers.length - 2}`;
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
      return 'KYC reminder sent successfully.';
    }
    
    if (selectedUsers.length === 1) {
      const firstName = selectedUsers[0]?.name?.split(' ')[0] || 'User';
      return `KYC reminder sent to ${firstName} successfully.`;
    }
    
    return `KYC reminder sent to ${selectedUsers.length} users successfully.`;
  };

  return (
    <>
      {/* Main KYC Reminder Modal */}
      <Modal
        opened={opened && !showProgress && !reminderComplete}
        onClose={handleClose}
        title="Send KYC Reminder"
        size="lg"
        radius="md"
        padding="xl"
      >
        <Stack gap="lg">
          {/* Info Alert */}
          <Alert
            icon={<IconInfoCircle size={16} />}
            color="#066F5B"
            variant="light"
          >
            <Text size="sm">
              Send a reminder to selected user(s) to complete or update their KYC verification. 
              This notification will be delivered as an in-app alert.
            </Text>
          </Alert>

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

          {/* KYC Reminder Type */}
          <div>
            <Text fw={500} mb="xs">KYC Reminder Type <span style={{ color: 'red' }}>*</span></Text>
            <Select
              placeholder="Select reminder type"
              data={[
                { value: 'incomplete', label: 'Incomplete KYC' },
                { value: 'expired', label: 'Expired Documents' },
                { value: 'pending', label: 'Pending Verification' },
                { value: 'update', label: 'Update Required' },
                { value: 'additional', label: 'Additional Documents Needed' },
              ]}
              value={reminderType}
              onChange={setReminderType}
              size="md"
              required
            />
          </div>

          {/* Message */}
          <div>
            <Text fw={500} mb="xs">Message</Text>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(event) => setMessage(event.currentTarget.value)}
              minRows={4}
              size="md"
            />
          </div>

          {/* Send As */}
          <div>
            <Text fw={500} mb="xs">Send As</Text>
            <Radio.Group
              value={sendAs}
              onChange={setSendAs}
            >
              <Group mt="xs">
                <Radio 
                  value="in-app" 
                  label="In-app Notification" 
                />
                <Radio 
                  value="email" 
                  label="Email" 
                />
                <Radio 
                  value="both" 
                  label="Both" 
                />
              </Group>
            </Radio.Group>
          </div>

          {/* Action Buttons */}
          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              color="#066F5B"
              onClick={handleConfirm}
              disabled={!reminderType || selectedUsers.length === 0}
            >
              Send Reminder
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Progress Modal */}
      <Modal
        opened={showProgress && !reminderComplete}
        onClose={() => {}}
        withCloseButton={false}
        size="md"
        centered
      >
        <Stack gap="xl" py="xl" align="center">
          <Loader size="lg" color="#066F5B" />
          <Text size="lg" fw={500}>Sending Notification</Text>
          <Text size="sm" c="dimmed">Please wait. Do not close this window.</Text>
          <Progress 
            value={progress} 
            color="#066F5B" 
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
        opened={reminderComplete}
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
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {selectedUsers.map((user, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Text fw={500}>{truncateName(user.name)}</Text>
                </Table.Td>
                <Table.Td>{user.email}</Table.Td>
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