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
  getCircleRulesSettings,
  updateCircleRulesSettings,
  type CircleRulesSettings,
} from '@/utils/api'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// Mirrors the write-time validation in CircleRulesSettingsService - kept in sync
// deliberately so users see the same rule client-side before ever hitting the server.
function validate(values: {
  collateralRatioPercent: number | ''
  latePenaltyRatioPercent: number | ''
  minTrustScore: number | ''
  postStartExitPenaltyPercent: number | ''
}): string | null {
  const { collateralRatioPercent, latePenaltyRatioPercent, minTrustScore, postStartExitPenaltyPercent } = values

  if (
    collateralRatioPercent === '' || latePenaltyRatioPercent === '' ||
    minTrustScore === '' || postStartExitPenaltyPercent === ''
  ) {
    return 'All fields are required.'
  }
  if (collateralRatioPercent <= 0 || collateralRatioPercent > 100) {
    return 'Collateral ratio must be between 0 (exclusive) and 100%.'
  }
  if (latePenaltyRatioPercent < 0 || latePenaltyRatioPercent > 100) {
    return 'Late penalty ratio must be between 0 and 100%.'
  }
  if (!Number.isInteger(minTrustScore) || minTrustScore < 50 || minTrustScore > 100) {
    return 'Minimum trust score must be a whole number between 50 and 100.'
  }
  if (postStartExitPenaltyPercent < 0 || postStartExitPenaltyPercent > 100) {
    return 'Post-start exit penalty must be between 0 and 100%.'
  }
  return null
}

export function CircleRulesSettings() {
  const [current, setCurrent] = useState<CircleRulesSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [collateralRatioPercent, setCollateralRatioPercent] = useState<number | ''>('')
  const [latePenaltyRatioPercent, setLatePenaltyRatioPercent] = useState<number | ''>('')
  const [minTrustScore, setMinTrustScore] = useState<number | ''>('')
  const [postStartExitPenaltyPercent, setPostStartExitPenaltyPercent] = useState<number | ''>('')

  const [validationError, setValidationError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmOpened, setConfirmOpened] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  function load() {
    setLoading(true)
    setLoadError(null)
    getCircleRulesSettings()
      .then((res) => {
        setCurrent(res.data)
        setCollateralRatioPercent(res.data.collateralRatioBps / 100)
        setLatePenaltyRatioPercent(res.data.latePenaltyRatioBps / 100)
        setMinTrustScore(res.data.minTrustScore)
        setPostStartExitPenaltyPercent(res.data.postStartExitPenaltyBps / 100)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Failed to load circle rules'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function handleReviewChanges() {
    setServerError(null)
    const error = validate({ collateralRatioPercent, latePenaltyRatioPercent, minTrustScore, postStartExitPenaltyPercent })
    setValidationError(error)
    if (error) return
    setConfirmOpened(true)
  }

  async function handleConfirmSave() {
    setSaving(true)
    setServerError(null)
    try {
      const res = await updateCircleRulesSettings({
        collateralRatioBps: Math.round(Number(collateralRatioPercent) * 100),
        latePenaltyRatioBps: Math.round(Number(latePenaltyRatioPercent) * 100),
        minTrustScore: Number(minTrustScore),
        postStartExitPenaltyBps: Math.round(Number(postStartExitPenaltyPercent) * 100),
      })
      setCurrent(res.data)
      setConfirmOpened(false)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 4000)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Failed to update circle rules')
    } finally {
      setSaving(false)
    }
  }

  const dirty = current !== null && (
    Math.round(Number(collateralRatioPercent) * 100) !== current.collateralRatioBps ||
    Math.round(Number(latePenaltyRatioPercent) * 100) !== current.latePenaltyRatioBps ||
    Number(minTrustScore) !== current.minTrustScore ||
    Math.round(Number(postStartExitPenaltyPercent) * 100) !== current.postStartExitPenaltyBps
  )

  if (loading) {
    return (
      <Stack mt="xl" gap="lg">
        <Skeleton h={32} w={280} />
        <Skeleton h={320} radius="md" />
      </Stack>
    )
  }

  return (
    <Stack mt="xl" gap="lg" maw={640}>
      <Title order={3}>Circle Rules</Title>
      <Text size="sm" c="dimmed">
        Platform-wide rules for savings circles - collateral, late penalty, the minimum trust
        score to join a public circle, and the post-start exit forfeit. Ajoti-set (not per-circle).
        Takes effect on the very next join / contribution - no restart required.
      </Text>

      {loadError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {loadError}
        </Alert>
      )}

      {savedNotice && (
        <Alert color="green" radius="md" variant="light">
          Circle rules updated.
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
              label="Collateral ratio (%)"
              description="Collateral reserved from a member's wallet when they join, as a share of the contribution amount"
              min={0.01}
              max={100}
              decimalScale={2}
              value={collateralRatioPercent}
              onChange={(v) => setCollateralRatioPercent(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.collateralRatioBps.updatedAt)}
              {current.meta.collateralRatioBps.updatedByLabel ? ` by ${current.meta.collateralRatioBps.updatedByLabel}` : ' (seeded default)'}
            </Text>

            <NumberInput
              label="Late penalty ratio (%)"
              description="Penalty charged on a late contribution, as a share of the contribution amount"
              min={0}
              max={100}
              decimalScale={2}
              value={latePenaltyRatioPercent}
              onChange={(v) => setLatePenaltyRatioPercent(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.latePenaltyRatioBps.updatedAt)}
              {current.meta.latePenaltyRatioBps.updatedByLabel ? ` by ${current.meta.latePenaltyRatioBps.updatedByLabel}` : ' (seeded default)'}
            </Text>

            <NumberInput
              label="Minimum trust score (public circles)"
              description="Minimum trust score (50–100) a member needs to join a PUBLIC circle. Private invites bypass this."
              min={50}
              max={100}
              step={1}
              value={minTrustScore}
              onChange={(v) => setMinTrustScore(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.minTrustScore.updatedAt)}
              {current.meta.minTrustScore.updatedByLabel ? ` by ${current.meta.minTrustScore.updatedByLabel}` : ' (seeded default)'}
            </Text>

            <NumberInput
              label="Post-start exit penalty (%)"
              description="Share of reserved collateral a member forfeits if they leave after the circle has started (100% = full forfeit). Enforced by the post-start exit flow (ships separately)."
              min={0}
              max={100}
              decimalScale={2}
              value={postStartExitPenaltyPercent}
              onChange={(v) => setPostStartExitPenaltyPercent(typeof v === 'number' ? v : '')}
            />
            <Text size="xs" c="dimmed" mt={-8}>
              Last updated {fmtDate(current.meta.postStartExitPenaltyBps.updatedAt)}
              {current.meta.postStartExitPenaltyBps.updatedByLabel ? ` by ${current.meta.postStartExitPenaltyBps.updatedByLabel}` : ' (seeded default)'}
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
        title="Confirm circle rules changes"
        centered
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">
            These values take effect on the <strong>next join / contribution</strong> -
            immediately, with no restart. Review before saving:
          </Text>
          <Stack gap={4}>
            <Group justify="space-between"><Text size="sm" c="dimmed">Collateral ratio</Text><Text size="sm" fw={600}>{Number(collateralRatioPercent)}%</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Late penalty ratio</Text><Text size="sm" fw={600}>{Number(latePenaltyRatioPercent)}%</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Minimum trust score</Text><Text size="sm" fw={600}>{Number(minTrustScore)}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Post-start exit penalty</Text><Text size="sm" fw={600}>{Number(postStartExitPenaltyPercent)}%</Text></Group>
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
