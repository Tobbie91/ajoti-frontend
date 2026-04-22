import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Drawer,
  Group,
  NumberInput,
  Pagination,
  Paper,
  Progress,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconRefresh,
  IconShield,
  IconBolt,
} from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import {
  getAllTrustStats,
  getTrustStatsFull,
  fireTrustEvent,
  type TrustStatsRow,
  type TrustStatsFull,
  type PaginatedResponse,
} from '@/utils/api'

// ── helpers ───────────────────────────────────────────────────────────────────

function scoreColor(display: number) {
  if (display >= 80) return 'green'
  if (display >= 65) return 'teal'
  if (display >= 50) return 'yellow'
  if (display >= 35) return 'orange'
  return 'red'
}

function scoreLabel(display: number) {
  if (display >= 80) return 'Excellent'
  if (display >= 65) return 'Good'
  if (display >= 50) return 'Fair'
  if (display >= 35) return 'Poor'
  return 'Very Poor'
}

function ScoreBar({ display }: { display: number }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Progress value={display} color={scoreColor(display)} size="sm" style={{ flex: 1, minWidth: 80 }} />
      <Text size="sm" fw={700} c={scoreColor(display)} style={{ minWidth: 36 }}>
        {display}
      </Text>
    </Group>
  )
}

const EVENT_OPTIONS = [
  { value: 'contribution_on_time', label: 'Contribution On Time' },
  { value: 'contribution_late', label: 'Contribution Late' },
  { value: 'missed_payment', label: 'Missed Payment' },
  { value: 'missed_payment_post_payout', label: 'Missed Payment (Post-Payout)' },
  { value: 'missed_payment_post_payout_default', label: 'Missed Payment Default (Post-Payout)' },
  { value: 'peer_rating', label: 'Peer Rating (1-5)' },
  { value: 'cycle_reset', label: 'Cycle Reset' },
]

const LIMIT = 20

// ── User detail drawer ────────────────────────────────────────────────────────

function TrustDrawer({
  userId,
  onClose,
}: {
  userId: string | null
  onClose: () => void
}) {
  const [full, setFull] = useState<TrustStatsFull | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [eventType, setEventType] = useState<string | null>(null)
  const [rating, setRating] = useState<number | string>(3)
  const [isPostPayout, setIsPostPayout] = useState(false)
  const [firing, setFiring] = useState(false)
  const [fireResult, setFireResult] = useState<{ newTrustScore: number; newDisplayScore: number } | null>(null)
  const [fireError, setFireError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { setFull(null); return }
    setLoading(true)
    setError(null)
    setFull(null)
    setFireResult(null)
    getTrustStatsFull(userId)
      .then(setFull)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [userId])

  async function handleFireEvent() {
    if (!userId || !eventType) return
    setFiring(true)
    setFireResult(null)
    setFireError(null)
    try {
      const dto: { eventType: string; rating?: number; isPostPayout?: boolean } = { eventType }
      if (eventType === 'peer_rating') dto.rating = Number(rating)
      if (isPostPayout) dto.isPostPayout = true
      const res = await fireTrustEvent(userId, dto)
      setFireResult(res)
      // Reload
      getTrustStatsFull(userId).then(setFull).catch(() => null)
    } catch (e) {
      setFireError(e instanceof Error ? e.message : 'Failed to fire event')
    } finally {
      setFiring(false)
    }
  }

  const breakdown = full?.atiBreakdown

  return (
    <Drawer
      opened={!!userId}
      onClose={onClose}
      title={
        full ? (
          <div>
            <Text fw={700}>{full.user.firstName} {full.user.lastName}</Text>
            <Text size="xs" c="dimmed">{full.user.email}</Text>
          </div>
        ) : 'Trust Score Details'
      }
      position="right"
      size="md"
    >
      {loading && (
        <Stack gap="sm">
          <Skeleton height={80} radius="md" />
          <Skeleton height={120} radius="md" />
          <Skeleton height={200} radius="md" />
        </Stack>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
          {error}
        </Alert>
      )}

      {full && (
        <Stack gap="md">
          {/* Score hero */}
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600}>ATI Score</Text>
              <Badge color={scoreColor(full.displayScore)} variant="filled" size="lg">
                {full.displayScore} — {scoreLabel(full.displayScore)}
              </Badge>
            </Group>
            <Progress
              value={full.displayScore}
              color={scoreColor(full.displayScore)}
              size="lg"
              radius="xl"
            />
            <Group justify="space-between" mt={4}>
              <Text size="xs" c="dimmed">0</Text>
              <Text size="xs" c="dimmed">100</Text>
            </Group>
          </Paper>

          {/* Breakdown */}
          <Paper withBorder radius="md" p="md">
            <Text size="sm" fw={600} mb="sm">Score Breakdown</Text>
            <Stack gap="xs">
              {breakdown && (
                <>
                  {[
                    { label: 'Recent Behaviour', val: breakdown.recentBehavior },
                    { label: 'History Behaviour', val: breakdown.historyBehavior },
                    { label: 'Payout Reliability', val: breakdown.payoutReliability },
                    { label: 'Peer Score', val: breakdown.peerScore },
                    { label: 'History Length', val: breakdown.historyLength },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <Group justify="space-between" mb={2}>
                        <Text size="xs">{label}</Text>
                        <Text size="xs" fw={600}>{val.toFixed(1)}</Text>
                      </Group>
                      <Progress value={val} color="teal" size="xs" />
                    </div>
                  ))}
                </>
              )}
            </Stack>
          </Paper>

          {/* Stats */}
          <Paper withBorder radius="md" p="md">
            <Text size="sm" fw={600} mb="sm">Contribution Stats</Text>
            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Total Contributions</Text>
                <Text size="xs" fw={600}>{full.totalContributions}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">On Time</Text>
                <Text size="xs" fw={600} c="green">{full.onTimeContributions}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Late</Text>
                <Text size="xs" fw={600} c="orange">{full.lateContributions}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Missed</Text>
                <Text size="xs" fw={600} c="red">{full.missedContributions}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Payout Received</Text>
                <Badge size="xs" color={full.payoutReceived ? 'green' : 'gray'} variant="light">
                  {full.payoutReceived ? 'Yes' : 'No'}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Defaulted Post-Payout</Text>
                <Badge size="xs" color={full.defaultedPostPayout ? 'red' : 'green'} variant="light">
                  {full.defaultedPostPayout ? 'Yes' : 'No'}
                </Badge>
              </Group>
              {full.peerRatingCount > 0 && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Peer Rating</Text>
                  <Text size="xs" fw={600}>{full.peerRatingAvg.toFixed(1)} / 5 ({full.peerRatingCount} ratings)</Text>
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Fire event */}
          <Paper withBorder radius="md" p="md">
            <Group gap="xs" mb="sm">
              <IconBolt size={16} />
              <Text size="sm" fw={600}>Fire Trust Event</Text>
            </Group>
            <Stack gap="sm">
              <Select
                label="Event Type"
                placeholder="Select event..."
                data={EVENT_OPTIONS}
                value={eventType}
                onChange={setEventType}
                size="sm"
                radius="md"
              />
              {eventType === 'peer_rating' && (
                <NumberInput
                  label="Rating (1–5)"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={setRating}
                  size="sm"
                  radius="md"
                />
              )}
              {(eventType === 'missed_payment' || eventType === 'missed_payment_post_payout') && (
                <Group gap="xs">
                  <input
                    type="checkbox"
                    id="postpayout"
                    checked={isPostPayout}
                    onChange={(e) => setIsPostPayout(e.currentTarget.checked)}
                  />
                  <Text component="label" htmlFor="postpayout" size="xs">Mark as post-payout</Text>
                </Group>
              )}
              <Button
                size="sm"
                loading={firing}
                disabled={!eventType}
                onClick={handleFireEvent}
                leftSection={<IconBolt size={14} />}
              >
                Fire Event
              </Button>
              {fireError && (
                <Alert icon={<IconAlertCircle size={14} />} color="red" radius="md" variant="light">
                  {fireError}
                </Alert>
              )}
              {fireResult && (
                <Alert color="green" radius="md" variant="light">
                  New score: <strong>{fireResult.newDisplayScore}</strong> (internal: {fireResult.newTrustScore})
                </Alert>
              )}
            </Stack>
          </Paper>
        </Stack>
      )}
    </Drawer>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function TrustScores() {
  const [data, setData] = useState<PaginatedResponse<TrustStatsRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [minScore, setMinScore] = useState<number | string>('')
  const [maxScore, setMaxScore] = useState<number | string>('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    getAllTrustStats({
      page,
      limit: LIMIT,
      ...(minScore !== '' ? { minScore: Number(minScore) } : {}),
      ...(maxScore !== '' ? { maxScore: Number(maxScore) } : {}),
    })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load trust scores'))
      .finally(() => setLoading(false))
  }, [page, minScore, maxScore])

  useEffect(() => { fetchData() }, [fetchData])

  const rows = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 1

  return (
    <Stack gap="lg" p="xl">
      <Group justify="space-between">
        <div>
          <Title order={2} fw={700}>Trust Scores</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Ajoti Trust Index (ATI) — 300 to 850 scale.
          </Text>
        </div>
        <ActionIcon variant="default" size="lg" radius="md" onClick={fetchData} title="Refresh">
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>

      {/* Filters */}
      <Group gap="sm">
        <NumberInput
          placeholder="Min score (e.g. 300)"
          value={minScore}
          onChange={(v) => { setMinScore(v); setPage(1) }}
          min={300}
          max={850}
          style={{ width: 180 }}
          radius="md"
          size="sm"
          leftSection={<IconShield size={14} />}
        />
        <NumberInput
          placeholder="Max score (e.g. 850)"
          value={maxScore}
          onChange={(v) => { setMaxScore(v); setPage(1) }}
          min={300}
          max={850}
          style={{ width: 180 }}
          radius="md"
          size="sm"
          leftSection={<IconShield size={14} />}
        />
        <TextInput
          placeholder="Filters applied above"
          disabled
          style={{ flex: 1, maxWidth: 200 }}
          radius="md"
          size="sm"
          value={data ? `${data.meta.total} users` : ''}
        />
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {error}
        </Alert>
      )}

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={700}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr bg="#066F5B">
                <Table.Th c="white">User</Table.Th>
                <Table.Th c="white">ATI Score</Table.Th>
                <Table.Th c="white">Contributions</Table.Th>
                <Table.Th c="white">On Time / Late / Missed</Table.Th>
                <Table.Th c="white">Peer Rating</Table.Th>
                <Table.Th c="white">Payout</Table.Th>
                <Table.Th c="white"></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <Table.Tr key={i}>
                    {[...Array(7)].map((__, j) => (
                      <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">No trust score records found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr key={row.userId}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{row.user.firstName} {row.user.lastName}</Text>
                      <Text size="xs" c="dimmed">{row.user.email}</Text>
                    </Table.Td>
                    <Table.Td style={{ minWidth: 160 }}>
                      <ScoreBar display={row.displayScore} />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{row.totalContributions}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="On time">
                          <Badge size="xs" color="green" variant="light">{row.onTimeContributions}</Badge>
                        </Tooltip>
                        <Tooltip label="Late">
                          <Badge size="xs" color="orange" variant="light">{row.lateContributions}</Badge>
                        </Tooltip>
                        <Tooltip label="Missed">
                          <Badge size="xs" color="red" variant="light">{row.missedContributions}</Badge>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {row.peerRatingCount > 0 ? (
                        <Text size="sm">{row.peerRatingAvg.toFixed(1)} <Text span size="xs" c="dimmed">/ 5</Text></Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Badge size="xs" color={row.payoutReceived ? 'green' : 'gray'} variant="light">
                          {row.payoutReceived ? 'Received' : 'None'}
                        </Badge>
                        {row.defaultedPostPayout && (
                          <Badge size="xs" color="red" variant="filled">Defaulted</Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => setSelectedUserId(row.userId)}
                      >
                        Details
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            {data ? `${data.meta.total.toLocaleString()} users` : ''}
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      </Paper>

      <TrustDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </Stack>
  )
}

export default TrustScores
