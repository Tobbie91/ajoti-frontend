import { Stack, Group, Paper, Text, TextInput, Select, Button, RingProgress, Table, Avatar, Badge, Loader } from '@mantine/core'
import { IconChevronDown, IconSearch, IconRefresh } from '@tabler/icons-react'
import type { Payout, CircleInvite } from '@/utils/api'

const PRIMARY = '#0b6b55'

type ApiMember = { userId: string; name: string; status: string; position: number | null; joinedAt: string }

interface GroupMembersTabProps {
  isCompleted: boolean
  inviteName: string
  onInviteNameChange: (value: string) => void
  inviteContact: string
  onInviteContactChange: (value: string) => void
  inviteBy: string | null
  onInviteByChange: (value: string | null) => void
  onOpenInviteModal: () => void
  pendingJoinCount: number
  maxSlots: number | undefined
  memberSearch: string
  onMemberSearchChange: (value: string) => void
  filteredMembers: ApiMember[]
  payouts: Payout[]
  onAssignPosition: (member: { userId: string; name: string }) => void
  invites: CircleInvite[]
  invitesLoading: boolean
  onRefreshInvites: () => void
  revokingId: string | null
  onRevokeInvite: (inviteId: string) => void
}

export function GroupMembersTab({
  isCompleted,
  inviteName,
  onInviteNameChange,
  inviteContact,
  onInviteContactChange,
  inviteBy,
  onInviteByChange,
  onOpenInviteModal,
  pendingJoinCount,
  maxSlots,
  memberSearch,
  onMemberSearchChange,
  filteredMembers,
  payouts,
  onAssignPosition,
  invites,
  invitesLoading,
  onRefreshInvites,
  revokingId,
  onRevokeInvite,
}: GroupMembersTabProps) {
  return (
    <Stack gap="lg">
      {/* Invite Member + Pending Requests */}
      {!isCompleted && (
        <Group align="flex-start" gap="lg" wrap="wrap">
          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef', flex: '1 1 260px' }}>
            <Text fw={600} fz="md" mb="md">Invite Member</Text>
            <Stack gap="sm">
              <TextInput
                label="Name"
                placeholder="Enter name"
                size="sm"
                radius="md"
                value={inviteName}
                onChange={(e) => onInviteNameChange(e.currentTarget.value)}
                styles={{ input: { border: '1px solid #dee2e6' } }}
              />
              <Group gap="sm" grow>
                <TextInput
                  label="Email / Phone"
                  placeholder="Enter email or phone"
                  size="sm"
                  radius="md"
                  value={inviteContact}
                  onChange={(e) => onInviteContactChange(e.currentTarget.value)}
                  styles={{ input: { border: '1px solid #dee2e6' } }}
                />
                <Select
                  label="Invite by"
                  data={[
                    { value: 'email', label: 'Email' },
                    { value: 'phone', label: 'Phone (Coming Soon)', disabled: true },
                  ]}
                  value={inviteBy}
                  onChange={onInviteByChange}
                  size="sm"
                  radius="md"
                  rightSection={<IconChevronDown size={14} />}
                  styles={{ input: { border: '1px solid #dee2e6' } }}
                  allowDeselect={false}
                />
              </Group>
              <Button
                size="sm"
                radius="md"
                style={{ background: PRIMARY, alignSelf: 'flex-start' }}
                mt="xs"
                onClick={onOpenInviteModal}
              >
                Send Invite
              </Button>
            </Stack>
          </Paper>

          <Paper
            p="lg"
            radius="md"
            style={{
              border: '1px solid #e9ecef',
              flex: '1 1 200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RingProgress
              size={120}
              thickness={10}
              roundCaps
              sections={[{ value: Math.min((pendingJoinCount / (maxSlots ?? 1)) * 100, 100), color: PRIMARY }]}
              label={
                <Text ta="center" fz={22} fw={700} style={{ color: PRIMARY }}>
                  {pendingJoinCount}
                </Text>
              }
            />
            <Text fz="sm" fw={500} ta="center" mt="sm">
              Pending Join {pendingJoinCount === 1 ? 'Request' : 'Requests'}
            </Text>
          </Paper>
        </Group>
      )}

      {/* Manage Members */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" px="lg" py="md">
          <Text fw={600} fz="md">Manage Members</Text>
          <TextInput
            placeholder="Search by names"
            leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
            radius="md"
            size="sm"
            value={memberSearch}
            onChange={(e) => onMemberSearchChange(e.currentTarget.value)}
            styles={{ input: { border: '1px solid #dee2e6' } }}
            style={{ width: 260 }}
          />
        </Group>

        <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 560 }}>
          <Table.Thead>
            <Table.Tr style={{ background: PRIMARY }}>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Name</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Position</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Joined</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredMembers.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="xl" fz="sm">
                    {memberSearch ? 'No members match your search' : 'No members have joined this group yet'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {filteredMembers.map((member) => {
              const hasPayout = payouts.some(
                (p) => p.recipientId === member.userId &&
                  ['SUCCESS', 'COMPLETED', 'PAID'].includes((p.status ?? '').toUpperCase())
              )
              return (
              <Table.Tr key={member.userId}>
                <Table.Td>
                  <Group gap="sm" align="center">
                    <Avatar size={32} radius="xl" color="gray">
                      {member.name.charAt(0)}
                    </Avatar>
                    <Text fz="sm" fw={500}>{member.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td style={{ minWidth: 180 }}>
                  <Text fz="xs" c="dimmed">
                    Position: {member.position ?? 'Not assigned'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size="sm"
                    radius="sm"
                    style={{
                      background: member.status === 'ACTIVE' ? '#e6f5f1' : '#f1f3f5',
                      color: member.status === 'ACTIVE' ? PRIMARY : '#868e96',
                      border: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {member.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">
                    {new Date(member.joinedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="outline"
                    size="xs"
                    radius="md"
                    disabled={hasPayout}
                    title={hasPayout ? 'Position cannot be changed after payout' : undefined}
                    style={hasPayout ? { borderColor: '#dee2e6', color: '#adb5bd' } : { borderColor: PRIMARY, color: PRIMARY }}
                    onClick={() => !hasPayout && onAssignPosition({ userId: member.userId, name: member.name })}
                  >
                    {hasPayout ? 'Paid Out' : 'Assign Position'}
                  </Button>
                </Table.Td>
              </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table></div>
      </Paper>

      {/* Sent Invites */}
      {!isCompleted && (
        <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
          <Group justify="space-between" align="center" px="lg" py="md">
            <Text fw={600} fz="md">Sent Invites</Text>
            <Button
              variant="outline"
              size="xs"
              radius="md"
              leftSection={<IconRefresh size={13} />}
              style={{ borderColor: '#dee2e6', color: '#495057' }}
              onClick={onRefreshInvites}
            >
              Refresh
            </Button>
          </Group>
          <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 560 }}>
            <Table.Thead>
              <Table.Tr style={{ background: '#f8f9fa' }}>
                <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Name / Contact</Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Status</Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Sent</Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {invitesLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Loader size="sm" color={PRIMARY} />
                  </Table.Td>
                </Table.Tr>
              ) : invites.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center" py="lg" fz="sm">No invites sent yet</Text>
                  </Table.Td>
                </Table.Tr>
              ) : invites.map((inv) => (
                <Table.Tr key={inv.id}>
                  <Table.Td>
                    <Text fz="sm" fw={500}>{inv.name || '—'}</Text>
                    <Text fz="xs" c="dimmed">{inv.email || inv.phone || ''}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      radius="sm"
                      style={{
                        background: inv.status === 'ACCEPTED' ? '#e6f5f1' : inv.status === 'REVOKED' ? '#f1f3f5' : '#fdf3e7',
                        color: inv.status === 'ACCEPTED' ? PRIMARY : inv.status === 'REVOKED' ? '#868e96' : '#e67e22',
                        border: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {inv.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="dimmed">
                      {new Date(inv.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {inv.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="xs"
                        radius="md"
                        color="red"
                        loading={revokingId === inv.id}
                        onClick={() => onRevokeInvite(inv.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table></div>
        </Paper>
      )}
    </Stack>
  )
}
