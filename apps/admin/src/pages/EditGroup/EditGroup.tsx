import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  TextInput,
  NumberInput,
  Select,
  Alert,
  Skeleton,
} from '@mantine/core'
import { IconChevronDown, IconArrowLeft, IconAlertCircle, IconLock } from '@tabler/icons-react'
import { getAdminCircleDetail, getCircleJoinRequests, updateRoscaCircle, type RoscaCircle } from '@/utils/api'

const PRIMARY = '#0b6b55'

const FREQUENCY_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Open to All' },
  { value: 'PRIVATE', label: 'Invite Only' },
]

const inputStyles = {
  input: { border: '1px solid #dee2e6' },
}

export function EditGroup() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [circle, setCircle] = useState<RoscaCircle | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [contributionAmount, setContributionAmount] = useState<number | ''>('')
  const [frequency, setFrequency] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<string | null>(null)
  const [maxSlots, setMaxSlots] = useState<number | ''>('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    Promise.all([getAdminCircleDetail(id), getCircleJoinRequests(id).catch(() => [])])
      .then(([data, joinRequests]) => {
        setCircle(data)
        setPendingCount(joinRequests.length)
        setGroupName(data.name)
        setGroupDescription(data.description ?? '')
        setContributionAmount(Number(data.contributionAmount ?? 0) / 100)
        setFrequency(data.frequency)
        setVisibility(data.visibility)
        setMaxSlots(data.maxSlots)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Failed to load group'))
      .finally(() => setLoading(false))
  }, [id])

  const isDraft = circle?.status === 'DRAFT'
  const filledSlots = circle?.filledSlots ?? 0
  // Real minimum for maxSlots: approved members + still-pending join requests —
  // approveMember doesn't re-check capacity, so the backend enforces this same
  // floor (see updateCircle's pending-aware guard); mirrored here so the admin
  // sees the real constraint before submitting, not just a server rejection.
  const minSlots = filledSlots + pendingCount

  async function handleSave() {
    if (!id || !circle) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateRoscaCircle(id, {
        name: groupName,
        description: groupDescription,
        contributionAmount: String(Math.round(Number(contributionAmount) * 100)),
        maxSlots: Number(maxSlots),
        frequency: frequency as 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY',
        visibility: visibility ?? undefined,
      })
      navigate(`/rosca/groups/${id}`)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Stack gap="lg">
        <Skeleton h={20} w={80} />
        <Skeleton h={220} radius="md" />
        <Skeleton h={140} radius="md" />
      </Stack>
    )
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

      {loadError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {loadError}
        </Alert>
      )}

      {circle && !isDraft && (
        <Alert icon={<IconLock size={16} />} color="orange" radius="md" variant="light">
          <Text fw={600} fz="sm">This group is live and can no longer be edited</Text>
          <Text fz="xs" mt={4}>
            Once a group's cycle has started, its configuration is locked to protect members who
            already joined at these terms. The fields below are shown for reference only.
          </Text>
        </Alert>
      )}

      {circle && (
        <>
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
                disabled={!isDraft}
              />
              <TextInput
                label="Group Description"
                placeholder="Enter group description"
                size="sm"
                radius="md"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.currentTarget.value)}
                styles={inputStyles}
                disabled={!isDraft}
              />
            </Stack>
          </Paper>

          {/* Contribution Settings */}
          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Text fw={600} fz="md" mb="md">Contribution Settings</Text>
            <Group grow gap="sm">
              <NumberInput
                label="Contribution Amount (₦)"
                placeholder="0"
                size="sm"
                radius="md"
                min={0.01}
                decimalScale={2}
                thousandSeparator=","
                value={contributionAmount}
                onChange={(v) => setContributionAmount(typeof v === 'number' ? v : '')}
                styles={inputStyles}
                disabled={!isDraft}
                description={
                  isDraft && minSlots > 0
                    ? 'Locked once a member holds reserved collateral — remove pending/active members first to change this'
                    : undefined
                }
              />
              <Select
                label="Contribution Frequency"
                data={FREQUENCY_OPTIONS}
                value={frequency}
                onChange={setFrequency}
                size="sm"
                radius="md"
                rightSection={<IconChevronDown size={14} />}
                styles={inputStyles}
                allowDeselect={false}
                disabled={!isDraft}
              />
            </Group>
          </Paper>

          {/* Payout Order — managed from the group detail page, not here */}
          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Text fw={600} fz="md" mb="xs">Payout Order</Text>
            <Text fz="sm" c="dimmed" mb="sm">
              Current: <strong>{circle.payoutLogic}</strong>. Payout order has its own dedicated
              settings, validated separately from the rest of this form — manage it from the
              group's detail page.
            </Text>
            <Button
              variant="outline"
              size="sm"
              radius="md"
              onClick={() => navigate(`/rosca/groups/${id}`)}
              style={{ borderColor: '#dee2e6', color: '#495057' }}
            >
              Go to Payout Order settings
            </Button>
          </Paper>

          {/* Trust & Control */}
          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Text fw={600} fz="md" mb="md">Trust & Control</Text>
            <Select
              label="Privacy Access"
              data={VISIBILITY_OPTIONS}
              value={visibility}
              onChange={setVisibility}
              size="sm"
              radius="md"
              rightSection={<IconChevronDown size={14} />}
              styles={inputStyles}
              allowDeselect={false}
              disabled={!isDraft}
            />
          </Paper>

          {/* Membership Rules */}
          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Text fw={600} fz="md" mb="md">Membership Rules</Text>
            <NumberInput
              label="Max Members Allowed"
              placeholder="0"
              size="sm"
              radius="md"
              min={minSlots}
              step={1}
              value={maxSlots}
              onChange={(v) => setMaxSlots(typeof v === 'number' ? v : '')}
              styles={inputStyles}
              disabled={!isDraft}
              description={`Cannot be set below ${minSlots} (${filledSlots} current member${filledSlots === 1 ? '' : 's'}${pendingCount > 0 ? ` + ${pendingCount} pending request${pendingCount === 1 ? '' : 's'}` : ''})`}
            />
          </Paper>

          {saveError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {saveError}
            </Alert>
          )}

          {/* Action Buttons */}
          {isDraft && (
            <Group gap="sm">
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY }}
                loading={saving}
                onClick={handleSave}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                radius="md"
                size="sm"
                onClick={() => navigate(`/rosca/groups/${id}`)}
                style={{ borderColor: '#dee2e6', color: '#495057' }}
                disabled={saving}
              >
                Cancel
              </Button>
            </Group>
          )}
        </>
      )}
    </Stack>
  )
}
