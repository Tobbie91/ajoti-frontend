import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Stack,
  Text,
  Box,
  Group,
  Button,
  Paper,
  TextInput,
  Select,
  Switch,
} from '@mantine/core'
import { IconChevronDown, IconArrowLeft, IconPlus } from '@tabler/icons-react'

const PRIMARY = '#0b6b55'

export function EditGroup() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Group Information
  const [groupName, setGroupName] = useState('50k Monthly Squad')
  const [groupDescription, setGroupDescription] = useState('50k Monthly Squad')
  const [tagline, setTagline] = useState('Together, we can do this')

  // Contribution Settings
  const [contributionAmount, setContributionAmount] = useState('10,000')
  const [contributionFrequency, setContributionFrequency] = useState<string | null>('monthly')
  const [payoutOrder, setPayoutOrder] = useState<string | null>('sequential')

  // Trust & Control
  const [privacyAccess, setPrivacyAccess] = useState<string | null>('open')
  const [groupRules, setGroupRules] = useState('')

  // Payment Automation
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(false)
  const [autoDebitDay, setAutoDebitDay] = useState('')
  const [nextPaymentDate, setNextPaymentDate] = useState('')

  // Membership Rules
  const [maxMembers, setMaxMembers] = useState('10')
  const [allowMidCycle, setAllowMidCycle] = useState<string | null>('no')

  const inputStyles = {
    input: { border: '1px solid #dee2e6' },
  }

  return (
    <Stack gap="lg">
      {/* Back link */}
      <Group
        gap={6}
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/rosca/groups/${id}`)}
      >
        <IconArrowLeft size={16} stroke={1.5} color="#868e96" />
        <Text fz="sm" c="dimmed">Back</Text>
      </Group>

      <Text fz={22} fw={700}>Edit Group</Text>

      {/* Group Information */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Text fw={600} fz="md" mb="md">Group Information</Text>
        <Stack gap="sm">
          <TextInput
            label="Group Name"
            placeholder="Enter group name"
            size="sm"
            radius="md"
            value={groupName}
            onChange={(e) => setGroupName(e.currentTarget.value)}
            styles={inputStyles}
          />
          <TextInput
            label="Group Description"
            placeholder="Enter group description"
            size="sm"
            radius="md"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.currentTarget.value)}
            styles={inputStyles}
          />
          <TextInput
            label="Tagline"
            placeholder="Enter tagline"
            size="sm"
            radius="md"
            value={tagline}
            onChange={(e) => setTagline(e.currentTarget.value)}
            styles={inputStyles}
          />
        </Stack>
      </Paper>

      {/* Contribution Settings */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Text fw={600} fz="md" mb="md">Contribution Settings</Text>
        <Group grow gap="sm">
          <TextInput
            label="Contribution Amount Per Month"
            placeholder="0"
            size="sm"
            radius="md"
            value={contributionAmount}
            onChange={(e) => setContributionAmount(e.currentTarget.value)}
            styles={inputStyles}
          />
          <Select
            label="Contribution Frequency"
            data={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: 'Bi-Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            value={contributionFrequency}
            onChange={setContributionFrequency}
            size="sm"
            radius="md"
            rightSection={<IconChevronDown size={14} />}
            styles={inputStyles}
            allowDeselect={false}
          />
          <Select
            label="Payout Order"
            data={[
              { value: 'sequential', label: 'Sequential' },
              { value: 'random', label: 'Random' },
              { value: 'bidding', label: 'Bidding' },
            ]}
            value={payoutOrder}
            onChange={setPayoutOrder}
            size="sm"
            radius="md"
            rightSection={<IconChevronDown size={14} />}
            styles={inputStyles}
            allowDeselect={false}
          />
        </Group>
      </Paper>

      {/* Trust & Control */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Text fw={600} fz="md" mb="md">Trust & Control</Text>
        <Stack gap="sm">
          <Select
            label="Privacy Access"
            data={[
              { value: 'open', label: 'Open to All' },
              { value: 'invite', label: 'Invite Only' },
              { value: 'approval', label: 'Requires Approval' },
            ]}
            value={privacyAccess}
            onChange={setPrivacyAccess}
            size="sm"
            radius="md"
            rightSection={<IconChevronDown size={14} />}
            styles={inputStyles}
            allowDeselect={false}
          />
          <Box>
            <Text fz="sm" fw={500} mb={4}>Group Rules</Text>
            <Button
              variant="outline"
              size="sm"
              radius="md"
              leftSection={<IconPlus size={14} />}
              style={{ borderColor: '#dee2e6', color: '#495057' }}
            >
              Add New
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Payment Automation */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Text fw={600} fz="md" mb="md">Payment Automation</Text>
        <Stack gap="sm">
          <Group gap="md" align="center">
            <Text fz="sm" fw={500}>Enable Auto-Debit</Text>
            <Switch
              checked={autoDebitEnabled}
              onChange={(e) => setAutoDebitEnabled(e.currentTarget.checked)}
              color={PRIMARY}
              size="md"
            />
          </Group>
          {autoDebitEnabled && (
            <TextInput
              label="Auto-Debit Day"
              placeholder="dd/mm"
              size="sm"
              radius="md"
              value={autoDebitDay}
              onChange={(e) => setAutoDebitDay(e.currentTarget.value)}
              styles={inputStyles}
            />
          )}
          <TextInput
            label="Next Payment Date"
            placeholder="Select Start Date"
            size="sm"
            radius="md"
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.currentTarget.value)}
            styles={inputStyles}
          />
        </Stack>
      </Paper>

      {/* Membership Rules */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Text fw={600} fz="md" mb="md">Membership Rules</Text>
        <Group grow gap="sm">
          <TextInput
            label="Max Member Allowed"
            placeholder="0"
            size="sm"
            radius="md"
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.currentTarget.value)}
            styles={inputStyles}
          />
          <Select
            label="Allow New Members Mid-Cycle?"
            data={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={allowMidCycle}
            onChange={setAllowMidCycle}
            size="sm"
            radius="md"
            rightSection={<IconChevronDown size={14} />}
            styles={inputStyles}
            allowDeselect={false}
          />
        </Group>
      </Paper>

      {/* Action Buttons */}
      <Group gap="sm">
        <Button
          radius="md"
          size="sm"
          style={{ background: PRIMARY }}
        >
          Save Changes
        </Button>
        <Button
          variant="outline"
          radius="md"
          size="sm"
          onClick={() => navigate(`/rosca/groups/${id}`)}
          style={{ borderColor: '#dee2e6', color: '#495057' }}
        >
          Cancel
        </Button>
      </Group>
    </Stack>
  )
}
