import { Modal, Stack, Text, Group, Avatar, Divider, Badge, Button, Paper } from '@mantine/core';
import { IconMail, IconPhone, IconCalendar, IconUsers, IconMessage, IconShield } from '@tabler/icons-react';

interface AdminRequestModalProps {
  opened: boolean;
  onClose: () => void;
  requestData: {
    name: string;
    email: string;
    phone?: string;
    groupsJoined: number;
    dateJoined: string;
    reason: string;
    trustScore: number;
    idProvided?: string;
  };
  onApprove: () => void;
  onReject: () => void;
}

export function AdminRequestModal({ 
  opened, 
  onClose, 
  requestData, 
  onApprove, 
  onReject 
}: AdminRequestModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Admin Request"
      size="lg"
      radius="md"
      padding="xl"
    >
      <Stack gap="xl">
        {/* User Info */}
        <Group align="flex-start" gap="lg">
          <Avatar size={80} radius="md" color="#066F5B">
            {requestData.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          
          <Stack gap={4} style={{ flex: 1 }}>
            <Text size="xl" fw={700}>{requestData.name}</Text>
            <Group gap="xs">
              <IconMail size={16} color="#666" />
              <Text size="sm" c="dimmed">{requestData.email}</Text>
            </Group>
            {requestData.phone && (
              <Group gap="xs">
                <IconPhone size={16} color="#666" />
                <Text size="sm" c="dimmed">{requestData.phone}</Text>
              </Group>
            )}
          </Stack>
        </Group>

        <Divider />

        {/* Stats Grid */}
        <Group grow>
            <Stack align="start" gap="xs">
              <Text size="sm">Group Joined</Text>
              <Text size="sm">{requestData.groupsJoined}</Text>
            </Stack>

            <Stack align="start" gap="xs">
              <Text size="sm">Date Joined</Text>
              <Text size="sm">{requestData.dateJoined}</Text>
            </Stack>
        </Group>

        <Group grow align="stretch" gap="md">
        {/* Reason for Request Paper */}
        <Stack gap="sm">
          <Group gap="xs">
            <IconMessage size={18} color="#066F5B" />
            <Text fw={600}>Reason for Request</Text>
          </Group>
          <Text>{requestData.reason}</Text>
        </Stack>

        {/* Trust Score Paper */}
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconShield size={18} color="#066F5B" />
              <Text fw={600}>Trust Score</Text>
            </Group>
            <Badge 
              size="xl" 
              color={requestData.trustScore >= 70 ? 'green' : requestData.trustScore >= 40 ? 'yellow' : 'red'}
              style={{ padding: '8px 16px' }}
            >
              {requestData.trustScore}
            </Badge>
          </Group>
          
          {/* Progress bar */}
          <div style={{ 
            width: '100%', 
            height: 8, 
            backgroundColor: '#e9ecef', 
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${requestData.trustScore}%`, 
              height: 8, 
              backgroundColor: requestData.trustScore >= 70 ? '#40c057' : requestData.trustScore >= 40 ? '#fab005' : '#fa5252',
              borderRadius: 4
            }} />
          </div>
          
          <Text size="sm" c="dimmed" ta="right">
            Current Trust Score
          </Text>
        </Stack>
      </Group>


        {/* Action Buttons */}
        <Group justify="space-between" mt="md">
          <Button 
            variant="outline" 
            color="gray" 
            onClick={onClose}
            radius="md"
          >
            Cancel
          </Button>
          
          <Group>
            <Button 
              color="#DF0307" 
              onClick={onReject}
              radius="md"
              variant="filled"
            >
              Reject
            </Button>
            <Button 
              color="#00C853" 
              onClick={onApprove}
              radius="md"
              variant="filled"
            >
              Approve
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}