import {
  Alert,
  Button,
  Divider,
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
  getPayoutFeeSettings,
  updatePayoutFeeSettings,
  type PayoutFeeSettings,
} from '@/utils/api'

function fmtNaira(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// Mirrors the write-time validation in PayoutFeeSettingsService — kept in sync
// deliberately so users see the same rule client-side before ever hitting the server.
function validate(values: {
  flatFeeNaira: number | ''
  adminShareNaira: number | ''
  platformShareNaira: number | ''
  minimumFloorNaira: number | ''
}): string | null {
  const { flatFeeNaira, adminShareNaira, platformShareNaira, minimumFloorNaira } = values

  if (
    flatFeeNaira === '' || adminShareNaira === '' ||
    platformShareNaira === '' || minimumFloorNaira === ''
  ) {
    return 'All fields are required.'
  }
  if (flatFeeNaira <= 0 || adminShareNaira <= 0 || platformShareNaira <= 0 || minimumFloorNaira <= 0) {
    return 'All values must be positive.'
  }
  // Compare in kobo (integer) to avoid floating-point drift from naira decimals.
  const flatFeeKobo = Math.round(flatFeeNaira * 100)
  const adminShareKobo = Math.round(adminShareNaira * 100)
  const platformShareKobo = Math.round(platformShareNaira * 100)
  if (adminShareKobo + platformShareKobo !== flatFeeKobo) {
    return `Admin share (₦${adminShareNaira}) + platform share (₦${platformShareNaira}) must equal the flat fee (₦${flatFeeNaira}). Currently ₦${(adminShareKobo + platformShareKobo) / 100}.`
  }
  return null
}

export function PayoutFeeSettings() {
  const [current, setCurrent] = useState<PayoutFeeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [flatFeeNaira, setFlatFeeNaira] = useState<number | ''>('')
  const [adminShareNaira, setAdminShareNaira] = useState<number | ''>('')
  const [platformShareNaira, setPlatformShareNaira] = useState<number | ''>('')
  const [minimumFloorNaira, setMinimumFloorNaira] = useState<number | ''>('')

  const [validationError, setValidationError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmOpened, setConfirmOpened] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  function load() {
    setLoading(true)
    setLoadError(null)
    getPayoutFeeSettings()
      .then((res) => {
        setCurrent(res.data)
        setFlatFeeNaira(res.data.flatFeeKobo / 100)
        setAdminShareNaira(res.data.adminShareKobo / 100)
        setPlatformShareNaira(res.data.platformShareKobo / 100)
        setMinimumFloorNaira(res.data.minimumFloorKobo / 100)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Failed to load payout fee settings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function handleReviewChanges() {
    setServerError(null)
    const error = validate({ flatFeeNaira, adminShareNaira, platformShareNaira, minimumFloorNaira })
    setValidationError(error)
    if (error) return
    setConfirmOpened(true)
  }

  async function handleConfirmSave() {
    setSaving(true)
    setServerError(null)
    try {
      const res = await updatePayoutFeeSettings({
        flatFeeKobo: Math.round(Number(flatFeeNaira) * 100),
        adminShareKobo: Math.round(Number(adminShareNaira) * 100),
        platformShareKobo: Math.round(Number(platformShareNaira) * 100),
        minimumFloorKobo: Math.round(Number(minimumFloorNaira) * 100),
      })
      setCurrent(res.data)
      setConfirmOpened(false)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 4000)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Failed to update payout fee settings')
    } finally {
      setSaving(false)
    }
  }

  const dirty = current !== null && (
    Math.round(Number(flatFeeNaira) * 100) !== current.flatFeeKobo ||
    Math.round(Number(adminShareNaira) * 100) !== current.adminShareKobo ||
    Math.round(Number(platformShareNaira) * 100) !== current.platformShareKobo ||
    Math.round(Number(minimumFloorNaira) * 100) !== current.minimumFloorKobo
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
      <Title order={3}>Payout Fee Settings</Title>
      <Text size="sm" c="dimmed">
        The flat fee charged per ROSCA payout, split between the Group Admin and Ajoti, plus the
        minimum payout floor enforced at circle creation. Takes effect on the very next payout
        processed — no restart required.
      </Text>

      {loadError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {loadError}
        </Alert>
      )}

      {savedNotice && (
        <Alert color="green" radius="md" variant="light">
          Payout fee settings updated.
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
              label="Flat fee (₦)"
              description="Total charged per payout"
              min={0.01}
              decimalScale={2}
              thousandSeparator=","
              value={flatFeeNaira}
              onChange={(v) => setFlatFeeNaira(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.flatFeeKobo.updatedAt)}
              {current.meta.flatFeeKobo.updatedBy ? ` by ${current.meta.flatFeeKobo.updatedBy}` : ' (seeded default)'}
            </Text>

            <NumberInput
              label="Group Admin share (₦)"
              description="Portion credited to the ROSCA Group Admin's wallet"
              min={0.01}
              decimalScale={2}
              thousandSeparator=","
              value={adminShareNaira}
              onChange={(v) => setAdminShareNaira(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.adminShareKobo.updatedAt)}
              {current.meta.adminShareKobo.updatedBy ? ` by ${current.meta.adminShareKobo.updatedBy}` : ' (seeded default)'}
            </Text>

            <NumberInput
              label="Ajoti share (₦)"
              description="Portion credited to Platform Revenue"
              min={0.01}
              decimalScale={2}
              thousandSeparator=","
              value={platformShareNaira}
              onChange={(v) => setPlatformShareNaira(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.platformShareKobo.updatedAt)}
              {current.meta.platformShareKobo.updatedBy ? ` by ${current.meta.platformShareKobo.updatedBy}` : ' (seeded default)'}
            </Text>

            <Divider />

            <NumberInput
              label="Minimum payout floor (₦)"
              description="Circles projecting a pot below this are rejected at creation"
              min={0.01}
              decimalScale={2}
              thousandSeparator=","
              value={minimumFloorNaira}
              onChange={(v) => setMinimumFloorNaira(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.minimumFloorKobo.updatedAt)}
              {current.meta.minimumFloorKobo.updatedBy ? ` by ${current.meta.minimumFloorKobo.updatedBy}` : ' (seeded default)'}
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
        title="Confirm payout fee changes"
        centered
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">
            These values take effect on the <strong>next payout processed</strong> — immediately,
            with no restart. Review before saving:
          </Text>
          <Stack gap={4}>
            <Group justify="space-between"><Text size="sm" c="dimmed">Flat fee</Text><Text size="sm" fw={600}>{fmtNaira(Math.round(Number(flatFeeNaira) * 100))}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Group Admin share</Text><Text size="sm" fw={600}>{fmtNaira(Math.round(Number(adminShareNaira) * 100))}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Ajoti share</Text><Text size="sm" fw={600}>{fmtNaira(Math.round(Number(platformShareNaira) * 100))}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Minimum floor</Text><Text size="sm" fw={600}>{fmtNaira(Math.round(Number(minimumFloorNaira) * 100))}</Text></Group>
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
