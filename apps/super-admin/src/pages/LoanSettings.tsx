import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import {
  getLoanSettings,
  updateLoanSettings,
  type LoanSettings,
} from '@/utils/api'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// Mirrors the write-time validation in LoanSettingsService — kept in sync
// deliberately so users see the same rule client-side before ever hitting the server.
function validate(values: {
  maxPayoutRatioPercent: number | ''
  minCompletedCycles: number | ''
  maxLatePayments: number | ''
}): string | null {
  const { maxPayoutRatioPercent, minCompletedCycles, maxLatePayments } = values

  if (maxPayoutRatioPercent === '' || minCompletedCycles === '' || maxLatePayments === '') {
    return 'All fields are required.'
  }
  if (maxPayoutRatioPercent <= 0 || maxPayoutRatioPercent > 100) {
    return 'Max payout ratio must be between 0 and 100%.'
  }
  if (minCompletedCycles < 0 || maxLatePayments < 0) {
    return 'Cycle and late-payment thresholds must not be negative.'
  }
  return null
}

export function LoanSettings() {
  const [current, setCurrent] = useState<LoanSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [maxPayoutRatioPercent, setMaxPayoutRatioPercent] = useState<number | ''>('')
  const [minCompletedCycles, setMinCompletedCycles] = useState<number | ''>('')
  const [maxLatePayments, setMaxLatePayments] = useState<number | ''>('')

  const [validationError, setValidationError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmOpened, setConfirmOpened] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  function load() {
    setLoading(true)
    setLoadError(null)
    getLoanSettings()
      .then((res) => {
        setCurrent(res.data)
        setMaxPayoutRatioPercent(res.data.maxPayoutRatioBps / 100)
        setMinCompletedCycles(res.data.minCompletedCycles)
        setMaxLatePayments(res.data.maxLatePayments)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Failed to load loan settings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function handleReviewChanges() {
    setServerError(null)
    const error = validate({ maxPayoutRatioPercent, minCompletedCycles, maxLatePayments })
    setValidationError(error)
    if (error) return
    setConfirmOpened(true)
  }

  async function handleConfirmSave() {
    setSaving(true)
    setServerError(null)
    try {
      const res = await updateLoanSettings({
        maxPayoutRatioBps: Math.round(Number(maxPayoutRatioPercent) * 100),
        minCompletedCycles: Number(minCompletedCycles),
        maxLatePayments: Number(maxLatePayments),
      })
      setCurrent(res.data)
      setConfirmOpened(false)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 4000)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Failed to update loan settings')
    } finally {
      setSaving(false)
    }
  }

  const dirty = current !== null && (
    Math.round(Number(maxPayoutRatioPercent) * 100) !== current.maxPayoutRatioBps ||
    Number(minCompletedCycles) !== current.minCompletedCycles ||
    Number(maxLatePayments) !== current.maxLatePayments
  )

  if (loading) {
    return (
      <Stack mt="xl" gap="lg">
        <Skeleton h={32} w={280} />
        <Skeleton h={220} radius="md" />
      </Stack>
    )
  }

  return (
    <Stack mt="xl" gap="lg" maw={640}>
      <Title order={3}>Loan Settings</Title>
      <Text size="sm" c="dimmed">
        The maximum early-payout advance (as a share of a member's expected payout) and the
        per-circle eligibility thresholds. Takes effect on the very next loan application
        processed — no restart required.
      </Text>

      {loadError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {loadError}
        </Alert>
      )}

      {savedNotice && (
        <Alert color="green" radius="md" variant="light">
          Loan settings updated.
        </Alert>
      )}

      {current && (
        <Paper withBorder radius="md" p="md">
          {validationError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" mb="md">
              {validationError}
            </Alert>
          )}
          {serverError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light" mb="md">
              {serverError}
            </Alert>
          )}

          <Stack gap="md">
            <NumberInput
              label="Max payout ratio (%)"
              description="Maximum advance as a share of a member's expected payout"
              min={0.01}
              max={100}
              decimalScale={2}
              value={maxPayoutRatioPercent}
              onChange={(v) => setMaxPayoutRatioPercent(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.maxPayoutRatioBps.updatedAt)}
              {current.meta.maxPayoutRatioBps.updatedBy ? ` by ${current.meta.maxPayoutRatioBps.updatedBy}` : ' (seeded default)'}
            </Text>

            <NumberInput
              label="Minimum completed cycles"
              description="Cycles a member must have completed on the borrowing circle to be eligible"
              min={0}
              step={1}
              value={minCompletedCycles}
              onChange={(v) => setMinCompletedCycles(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.minCompletedCycles.updatedAt)}
              {current.meta.minCompletedCycles.updatedBy ? ` by ${current.meta.minCompletedCycles.updatedBy}` : ' (seeded default)'}
            </Text>

            <NumberInput
              label="Maximum late payments"
              description="Late payments on the borrowing circle allowed while remaining eligible"
              min={0}
              step={1}
              value={maxLatePayments}
              onChange={(v) => setMaxLatePayments(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.maxLatePayments.updatedAt)}
              {current.meta.maxLatePayments.updatedBy ? ` by ${current.meta.maxLatePayments.updatedBy}` : ' (seeded default)'}
            </Text>

            <Group justify="flex-end" mt="sm">
              <Button variant="default" disabled={!dirty || saving} onClick={load}>
                Reset
              </Button>
              <Button onClick={handleReviewChanges} disabled={!dirty || saving}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      <Modal
        opened={confirmOpened}
        onClose={() => !saving && setConfirmOpened(false)}
        title="Confirm loan settings changes"
        centered
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">
            These values take effect on the <strong>next loan application processed</strong> —
            immediately, with no restart. Review before saving:
          </Text>
          <Stack gap={4}>
            <Group justify="space-between"><Text size="sm" c="dimmed">Max payout ratio</Text><Text size="sm" fw={600}>{Number(maxPayoutRatioPercent)}%</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Minimum completed cycles</Text><Text size="sm" fw={600}>{Number(minCompletedCycles)}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Maximum late payments</Text><Text size="sm" fw={600}>{Number(maxLatePayments)}</Text></Group>
          </Stack>
          {serverError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {serverError}
            </Alert>
          )}
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setConfirmOpened(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmSave()} loading={saving}>
              Confirm & Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
