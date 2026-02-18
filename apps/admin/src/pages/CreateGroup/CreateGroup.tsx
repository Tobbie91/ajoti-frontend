import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Text,
  Box,
  Group,
  TextInput,
  Textarea,
  Button,
  Stepper,
  Paper,
  ActionIcon,
  Select,
  Checkbox,
  Radio,
  Switch,
  NumberInput,
  Modal,
  Alert,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconPlus,
  IconArrowLeft,
  IconUpload,
  IconAlertTriangle,
  IconEdit,
  IconCheck,
} from '@tabler/icons-react'

const PRIMARY = '#0b6b55'

export function CreateGroup() {
  const navigate = useNavigate()
  const [active, setActive] = useState(0)

  const [groupName, setGroupName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')

  // Step 2 state
  const [currency, setCurrency] = useState<string | null>('NGN')
  const [amount, setAmount] = useState('10,000')
  const [frequency, setFrequency] = useState<string[]>([])
  const [payoutStructure, setPayoutStructure] = useState<string[]>([])

  // Step 3 state
  const [privacyAccess, setPrivacyAccess] = useState('open')
  const [participants, setParticipants] = useState<number | string>(10)
  const [enableTrustFilters, setEnableTrustFilters] = useState(false)
  const [enableDirectDebit, setEnableDirectDebit] = useState(false)

  // Rules modal
  const [rulesOpened, { open: openRules, close: closeRules }] = useDisclosure(false)
  const [selectedRules, setSelectedRules] = useState<string[]>([])

  return (
    <Stack gap="lg">
      {/* Back + Title */}
      <Group gap="sm">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          radius="xl"
          onClick={() => navigate('/dashboard')}
        >
          <IconArrowLeft size={20} stroke={1.5} />
        </ActionIcon>
        <Text fz={22} fw={700}>
          Create New ROSCA Group
        </Text>
      </Group>

      {/* Stepper */}
      <Stepper
        active={active}
        onStepClick={setActive}
        color={PRIMARY}
        size="sm"
        styles={{
          separator: { marginLeft: 4, marginRight: 4 },
          stepIcon: { borderWidth: 2 },
        }}
      >
        <Stepper.Step label="Group Details" />
        <Stepper.Step label="Contribution & Payouts" />
        <Stepper.Step label="Trust & Controls" />
      </Stepper>

      {/* Step content */}
      {active === 0 && (
        <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef' }}>
          <Group align="flex-start" gap="xl" wrap="nowrap">
            {/* Left: Form fields */}
            <Stack gap="md" style={{ flex: 1 }}>
              <TextInput
                label="Group Name"
                placeholder="e.g. Hustle, Grind & Win"
                value={groupName}
                onChange={(e) => setGroupName(e.currentTarget.value)}
                styles={{
                  label: { fontWeight: 600, marginBottom: 4 },
                  input: { border: '1px solid #dee2e6' },
                }}
              />
              <TextInput
                label="Tagline"
                placeholder="Short Sentences"
                value={tagline}
                onChange={(e) => setTagline(e.currentTarget.value)}
                styles={{
                  label: { fontWeight: 600, marginBottom: 4 },
                  input: { border: '1px solid #dee2e6' },
                }}
              />
              <Textarea
                label="Description"
                placeholder="You can describe the group"
                minRows={4}
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                styles={{
                  label: { fontWeight: 600, marginBottom: 4 },
                  input: { border: '1px solid #dee2e6' },
                }}
              />
            </Stack>

            {/* Right: Image upload */}
            <Box
              style={{
                width: 220,
                height: 220,
                border: '2px dashed #dee2e6',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                background: '#f8f9fa',
                flexShrink: 0,
              }}
            >
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#e6f5f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconUpload size={22} color={PRIMARY} stroke={1.5} />
              </Box>
              <Text fz="xs" c="dimmed" ta="center" px="md">
                Drag & drop or click to upload group image
              </Text>
              <Button
                variant="outline"
                size="xs"
                radius="md"
                style={{ borderColor: PRIMARY, color: PRIMARY }}
              >
                Upload Image
              </Button>
            </Box>
          </Group>
        </Paper>
      )}

      {active === 1 && (
        <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef' }}>
          <Text fw={700} fz="md" mb="lg">
            Contribution Setup
          </Text>

          <Stack gap="md">
            <Select
              label="Which Currency?"
              placeholder="Select currency"
              value={currency}
              onChange={setCurrency}
              data={[
                { value: 'NGN', label: '🇳🇬 NGN — Nigerian Naira' },
                { value: 'USD', label: '🇺🇸 USD — US Dollar' },
                { value: 'GBP', label: '🇬🇧 GBP — British Pound' },
              ]}
              styles={{
                label: { fontWeight: 600, marginBottom: 4 },
                input: { border: '1px solid #dee2e6' },
              }}
            />

            <TextInput
              label="Amount"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.currentTarget.value)}
              leftSection={
                <Text fz="sm" fw={600} c="dimmed">
                  ₦
                </Text>
              }
              styles={{
                label: { fontWeight: 600, marginBottom: 4 },
                input: { border: '1px solid #dee2e6' },
              }}
            />

            <Box>
              <Text fw={600} fz="sm" mb="xs">
                Frequency
              </Text>
              <Group gap="lg">
                <Checkbox
                  label="Weekly"
                  checked={frequency.includes('weekly')}
                  onChange={(e) => {
                    const isChecked = e.currentTarget.checked
                    setFrequency((prev) =>
                      isChecked ? [...prev, 'weekly'] : prev.filter((f) => f !== 'weekly'),
                    )
                  }}
                  color={PRIMARY}
                  styles={{ label: { fontWeight: 400 } }}
                />
                <Checkbox
                  label="Bi-weekly"
                  checked={frequency.includes('biweekly')}
                  onChange={(e) => {
                    const isChecked = e.currentTarget.checked
                    setFrequency((prev) =>
                      isChecked ? [...prev, 'biweekly'] : prev.filter((f) => f !== 'biweekly'),
                    )
                  }}
                  color={PRIMARY}
                  styles={{ label: { fontWeight: 400 } }}
                />
                <Checkbox
                  label="Monthly"
                  checked={frequency.includes('monthly')}
                  onChange={(e) => {
                    const isChecked = e.currentTarget.checked
                    setFrequency((prev) =>
                      isChecked ? [...prev, 'monthly'] : prev.filter((f) => f !== 'monthly'),
                    )
                  }}
                  color={PRIMARY}
                  styles={{ label: { fontWeight: 400 } }}
                />
              </Group>
            </Box>

            <Box>
              <Text fw={600} fz="sm" mb="xs">
                Payout Structure
              </Text>
              <Stack gap="xs">
                <Checkbox
                  label="Sequential order"
                  checked={payoutStructure.includes('sequential')}
                  onChange={(e) => {
                    const isChecked = e.currentTarget.checked
                    setPayoutStructure((prev) =>
                      isChecked ? [...prev, 'sequential'] : prev.filter((p) => p !== 'sequential'),
                    )
                  }}
                  color={PRIMARY}
                  styles={{ label: { fontWeight: 400 } }}
                />
                <Checkbox
                  label="Random order"
                  checked={payoutStructure.includes('random')}
                  onChange={(e) => {
                    const isChecked = e.currentTarget.checked
                    setPayoutStructure((prev) =>
                      isChecked ? [...prev, 'random'] : prev.filter((p) => p !== 'random'),
                    )
                  }}
                  color={PRIMARY}
                  styles={{ label: { fontWeight: 400 } }}
                />
                <Checkbox
                  label="Auto assign slots"
                  checked={payoutStructure.includes('auto')}
                  onChange={(e) => {
                    const isChecked = e.currentTarget.checked
                    setPayoutStructure((prev) =>
                      isChecked ? [...prev, 'auto'] : prev.filter((p) => p !== 'auto'),
                    )
                  }}
                  color={PRIMARY}
                  styles={{ label: { fontWeight: 400 } }}
                />
              </Stack>
            </Box>
          </Stack>
        </Paper>
      )}

      {active === 2 && (
        <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef' }}>
          <Stack gap="lg">
            {/* Privacy Access Type */}
            <Box>
              <Text fw={600} fz="sm" mb="xs">
                Privacy Access Type
              </Text>
              <Radio.Group value={privacyAccess} onChange={setPrivacyAccess}>
                <Stack gap="xs">
                  <Radio
                    value="open"
                    label="Open to All"
                    color={PRIMARY}
                    styles={{ label: { fontWeight: 400 } }}
                  />
                  <Radio
                    value="request"
                    label="Request to Join"
                    color={PRIMARY}
                    styles={{ label: { fontWeight: 400 } }}
                  />
                  <Radio
                    value="referral"
                    label="Referral Only"
                    color={PRIMARY}
                    styles={{ label: { fontWeight: 400 } }}
                  />
                </Stack>
              </Radio.Group>
            </Box>

            {/* Number of Participants */}
            <NumberInput
              label="Number of Participants"
              value={participants}
              onChange={setParticipants}
              min={2}
              max={100}
              leftSection={
                <Text fz="xs" fw={600} c="dimmed">
                  + Admin
                </Text>
              }
              leftSectionWidth={65}
              styles={{
                label: { fontWeight: 600, marginBottom: 4 },
                input: { border: '1px solid #dee2e6' },
              }}
            />

            {/* Trust Filters */}
            <Box>
              <Text fw={600} fz="sm" mb="xs">
                Trust Filters
              </Text>
              <Stack gap="sm">
                <Switch
                  label="Enable Trust Filters"
                  checked={enableTrustFilters}
                  onChange={(e) => setEnableTrustFilters(e.currentTarget.checked)}
                  color={PRIMARY}
                  styles={{ label: { fontWeight: 400 } }}
                />
                <Switch
                  label="Enable Direct Debit"
                  checked={enableDirectDebit}
                  onChange={(e) => setEnableDirectDebit(e.currentTarget.checked)}
                  color={PRIMARY}
                  styles={{ label: { fontWeight: 400 } }}
                />
              </Stack>
            </Box>

            {/* Add Rules */}
            <Button
              variant="subtle"
              leftSection={<IconPlus size={16} stroke={1.5} />}
              style={{ color: PRIMARY, alignSelf: 'flex-start' }}
              px={0}
              onClick={openRules}
            >
              Add Rules
            </Button>

            {/* Selected rules displayed on the page */}
            {selectedRules.length > 0 && (
              <Box>
                <Text fw={600} fz="sm" mb="xs">
                  Group Rules
                </Text>
                <Stack gap="xs">
                  {selectedRules.map((rule) => (
                    <Checkbox
                      key={rule}
                      label={rule}
                      checked={true}
                      onChange={() => {}}
                      color={PRIMARY}
                      styles={{
                        label: { fontWeight: 400, fontSize: 13 },
                        body: { alignItems: 'flex-start' },
                        input: { cursor: 'default' },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      )}

      {/* Rules Modal */}
      <Modal
        opened={rulesOpened}
        onClose={closeRules}
        title={
          <Text fw={700} fz="lg">
            Group Rules
          </Text>
        }
        size="lg"
        radius="md"
        centered
      >
        <Stack gap="md">
          <Text fz="sm" c="dimmed">
            Select or enter rules that members must agree to.
          </Text>

          <Stack gap="xs">
            {[
              'Late payment incurs a 5% penalty.',
              'All contribution must be available for DEBIT THIRD week of every months.',
              'Payout order is final and cannot be changed.',
              'Members must acknowledge their assigned payout slot before the group starts.',
              'The group admin has final say in resolving any disputes and managing participation.',
            ].map((rule) => (
              <Checkbox
                key={rule}
                label={rule}
                checked={selectedRules.includes(rule)}
                onChange={(e) => {
                  const isChecked = e.currentTarget.checked
                  setSelectedRules((prev) =>
                    isChecked
                      ? [...prev, rule]
                      : prev.filter((r) => r !== rule),
                  )
                }}
                color={PRIMARY}
                styles={{
                  label: { fontWeight: 400, fontSize: 13 },
                  body: { alignItems: 'flex-start' },
                }}
              />
            ))}
          </Stack>

          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="red"
            variant="outline"
            radius="md"
          >
            <Text fz="xs" fw={500}>
              Custom privilege rules prohibited
            </Text>
          </Alert>

          <Group justify="space-between" mt="sm">
            <Button variant="default" radius="md" onClick={closeRules}>
              Back
            </Button>
            <Button radius="md" style={{ background: PRIMARY }} onClick={closeRules}>
              Next
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Step 4: Review */}
      {active === 3 && (
        <Stack gap="md">
          <Box>
            <Text fz={20} fw={700} mb={4}>
              Review Your Group Setup
            </Text>
            <Text fz="sm" c="dimmed">
              Confirm the details below before creating your ROSCA group.
            </Text>
          </Box>

          {/* Group Details */}
          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Group justify="space-between" mb="md">
              <Text fw={700} fz="md">
                Group Details
              </Text>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconEdit size={14} stroke={1.5} />}
                style={{ color: PRIMARY }}
                onClick={() => setActive(0)}
              >
                Edit
              </Button>
            </Group>
            <Group align="flex-start" gap="xl" wrap="nowrap">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Box>
                  <Text fz="xs" c="dimmed">Group Name</Text>
                  <Text fz="sm" fw={500}>{groupName || '—'}</Text>
                </Box>
                <Box>
                  <Text fz="xs" c="dimmed">Tagline</Text>
                  <Text fz="sm" fw={500}>{tagline || '—'}</Text>
                </Box>
                <Box>
                  <Text fz="xs" c="dimmed">Description</Text>
                  <Text fz="sm" fw={500}>{description || '—'}</Text>
                </Box>
              </Stack>
              <Box
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  background: '#f1f3f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconUpload size={24} color="#adb5bd" stroke={1.5} />
              </Box>
            </Group>
          </Paper>

          {/* Contribution & Payout */}
          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Group justify="space-between" mb="md">
              <Text fw={700} fz="md">
                Contribution & Payout
              </Text>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconEdit size={14} stroke={1.5} />}
                style={{ color: PRIMARY }}
                onClick={() => setActive(1)}
              >
                Edit
              </Button>
            </Group>
            <Group gap="xl">
              <Box>
                <Text fz="xs" c="dimmed">Amount</Text>
                <Text fz="sm" fw={500}>₦{amount}</Text>
              </Box>
              <Box>
                <Text fz="xs" c="dimmed">Frequency</Text>
                <Text fz="sm" fw={500}>{frequency.length > 0 ? frequency.join(', ') : '—'}</Text>
              </Box>
              <Box>
                <Text fz="xs" c="dimmed">Payout Order</Text>
                <Text fz="sm" fw={500}>{payoutStructure.length > 0 ? payoutStructure.join(', ') : '—'}</Text>
              </Box>
            </Group>
          </Paper>

          {/* Trust & Control */}
          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Group justify="space-between" mb="md">
              <Text fw={700} fz="md">
                Trust & Control
              </Text>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconEdit size={14} stroke={1.5} />}
                style={{ color: PRIMARY }}
                onClick={() => setActive(2)}
              >
                Edit
              </Button>
            </Group>
            <Group gap="xl">
              <Box>
                <Text fz="xs" c="dimmed">Access Type</Text>
                <Text fz="sm" fw={500}>
                  {privacyAccess === 'open' ? 'Open to All' : privacyAccess === 'request' ? 'Request to Join' : 'Referral Only'}
                </Text>
              </Box>
              <Box>
                <Text fz="xs" c="dimmed">Participants</Text>
                <Text fz="sm" fw={500}>{participants} + Admin</Text>
              </Box>
              <Box>
                <Text fz="xs" c="dimmed">Trust Filter</Text>
                <Text fz="sm" fw={500}>{enableTrustFilters ? 'Enabled' : 'Disabled'}</Text>
              </Box>
              <Box>
                <Text fz="xs" c="dimmed">Direct Debit</Text>
                <Text fz="sm" fw={500}>{enableDirectDebit ? 'Enabled' : 'Disabled'}</Text>
              </Box>
            </Group>
          </Paper>

          {/* Group Rules */}
          {selectedRules.length > 0 && (
            <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
              <Text fw={700} fz="md" mb="md">
                Group Rules
              </Text>
              <Stack gap="xs">
                {selectedRules.map((rule) => (
                  <Group key={rule} gap="xs" align="flex-start" wrap="nowrap">
                    <IconCheck size={16} color={PRIMARY} stroke={2} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text fz="sm">{rule}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      {/* Bottom buttons */}
      <Group justify="space-between">
        {active === 3 ? (
          <>
            <Button
              variant="default"
              radius="md"
              onClick={() => setActive(0)}
            >
              Back to Edit
            </Button>
            <Button
              radius="md"
              style={{ background: PRIMARY }}
              onClick={() => {
                // TODO: submit group creation
              }}
            >
              Create Group
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="default"
              radius="md"
              onClick={() => {
                if (active > 0) setActive(active - 1)
                else navigate('/dashboard')
              }}
            >
              Back
            </Button>
            <Button
              radius="md"
              style={{ background: PRIMARY }}
              onClick={() => setActive(active + 1)}
            >
              Save & Continue
            </Button>
          </>
        )}
      </Group>
    </Stack>
  )
}
