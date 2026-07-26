import { useState, useEffect } from 'react'
import { Stack, Text, Box, Group, Button, Paper, Badge, Textarea, Table, Avatar, Modal, Loader } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import {
  getMemberProgress,
  notifyMissingContributors,
  getCircleReviews,
  submitPeerReview,
  type MemberProgress,
} from '@/utils/api'

const PRIMARY = '#0b6b55'

type ApiMemberBasic = { userId: string; name: string; status: string; position: number | null; joinedAt: string }

interface ReviewRow {
  userId: string
  name: string
  rating: number
  comment: string
}

export function GroupNotificationsTab({ circleId, members }: { circleId: string; members: ApiMemberBasic[] }) {
  const activeMembers = members.filter((m) => m.status === 'ACTIVE')

  // Notifications
  const [notifMessage, setNotifMessage] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [sendingAll, setSendingAll] = useState(false)
  const [sendingOne, setSendingOne] = useState<string | null>(null)
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null)
  const [notifError, setNotifError] = useState<string | null>(null)

  // Member progress
  const [progress, setProgress] = useState<MemberProgress[]>([])
  const [progressLoading, setProgressLoading] = useState(false)

  useEffect(() => {
    if (!circleId) return
    setProgressLoading(true)
    getMemberProgress(circleId).then((data) => setProgress(Array.isArray(data) ? data : (data as any)?.data ?? [])).catch(() => {}).finally(() => setProgressLoading(false))
  }, [circleId])

  function toggleMember(userId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  async function handleRemindAll() {
    if (!notifMessage.trim()) return
    setSendingAll(true)
    setNotifError(null)
    try {
      const allMemberIds = activeMembers.map((m) => m.userId)
      const res = await notifyMissingContributors(circleId, { memberIds: allMemberIds, message: notifMessage.trim() })
      const count = res.notified ?? activeMembers.length
      setNotifSuccess(`Reminder sent to ${count} member${count !== 1 ? 's' : ''}`)
      setNotifMessage('')
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : 'Failed to send reminder')
    } finally {
      setSendingAll(false)
      setTimeout(() => { setNotifSuccess(null); setNotifError(null) }, 4000)
    }
  }

  async function handleRemindSelected() {
    if (!notifMessage.trim() || selectedMemberIds.length === 0) return
    setSendingOne('selected')
    setNotifError(null)
    try {
      const res = await notifyMissingContributors(circleId, { memberIds: selectedMemberIds, message: notifMessage.trim() })
      const count = res.notified ?? selectedMemberIds.length
      setNotifSuccess(`Reminder sent to ${count} member${count !== 1 ? 's' : ''}`)
      setNotifMessage('')
      setSelectedMemberIds([])
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : 'Failed to send reminder')
    } finally {
      setSendingOne(null)
      setTimeout(() => { setNotifSuccess(null); setNotifError(null) }, 4000)
    }
  }

  // Peer Review — real data, via POST/GET /rosca/:circleId/reviews
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [adminReviewMember, setAdminReviewMember] = useState<ApiMemberBasic | null>(null)
  const [adminRating, setAdminRating] = useState(0)
  const [adminComment, setAdminComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    if (!circleId) return
    setReviewsLoading(true)
    getCircleReviews(circleId)
      .then((data) => setReviews(data.map((r) => ({ userId: r.revieweeId, name: r.revieweeName, rating: r.rating, comment: r.comment ?? '' }))))
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [circleId])

  async function handleSubmitReview() {
    if (!adminReviewMember || adminRating === 0) return
    setSubmittingReview(true)
    setReviewError(null)
    try {
      await submitPeerReview(circleId, {
        revieweeId: adminReviewMember.userId,
        rating: adminRating,
        comment: adminComment.trim() || undefined,
      })
      setReviews((prev) => [
        ...prev.filter((r) => r.userId !== adminReviewMember.userId),
        { userId: adminReviewMember.userId, name: adminReviewMember.name, rating: adminRating, comment: adminComment },
      ])
      setReviewSuccess(true)
      setAdminReviewMember(null)
      setAdminRating(0)
      setAdminComment('')
      setTimeout(() => setReviewSuccess(false), 3000)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <Stack gap="lg">
      {/* ── Notifications Section ── */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" mb="md">
          <Box>
            <Text fw={700} fz="md">Send Reminder</Text>
            <Text fz="xs" c="dimmed" mt={2}>Notify all members or select specific ones</Text>
          </Box>
        </Group>

        <Textarea
          placeholder="Type your reminder message..."
          radius="md"
          minRows={3}
          value={notifMessage}
          onChange={(e) => setNotifMessage(e.currentTarget.value)}
          styles={{ input: { border: '1px solid #dee2e6' } }}
          mb="md"
        />

        {notifSuccess && (
          <Paper p="sm" radius="md" mb="md" style={{ background: '#e6f5f1', border: '1px solid #b2dfdb' }}>
            <Group gap="xs">
              <IconCheck size={16} color={PRIMARY} />
              <Text fz="sm" fw={500} style={{ color: PRIMARY }}>{notifSuccess}</Text>
            </Group>
          </Paper>
        )}
        {notifError && (
          <Paper p="sm" radius="md" mb="md" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
            <Text fz="sm" fw={500} c="red">{notifError}</Text>
          </Paper>
        )}

        {/* Member selection */}
        <Text fz="xs" fw={600} c="dimmed" mb="xs">SELECT MEMBERS (optional — leave empty to remind all)</Text>
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
          {activeMembers.map((m) => (
            <Box
              key={m.userId}
              onClick={() => toggleMember(m.userId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${selectedMemberIds.includes(m.userId) ? PRIMARY : '#dee2e6'}`,
                background: selectedMemberIds.includes(m.userId) ? '#e6f5f1' : 'white',
                cursor: 'pointer',
              }}
            >
              <Avatar size={28} radius="xl" color="gray">{(m.name || '?').charAt(0)}</Avatar>
              <Text fz="sm" fw={500} style={{ color: selectedMemberIds.includes(m.userId) ? PRIMARY : '#0F172A' }}>
                {m.name}
              </Text>
            </Box>
          ))}
          {activeMembers.length === 0 && (
            <Text fz="sm" c="dimmed">No active members</Text>
          )}
        </Box>

        <Group gap="sm">
          <Button
            size="sm"
            radius="md"
            style={{ background: PRIMARY }}
            loading={sendingAll}
            disabled={!notifMessage.trim() || sendingOne !== null}
            onClick={handleRemindAll}
          >
            Remind All
          </Button>
          {selectedMemberIds.length > 0 && (
            <Button
              size="sm"
              radius="md"
              variant="outline"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
              loading={sendingOne === 'selected'}
              disabled={!notifMessage.trim() || sendingAll}
              onClick={handleRemindSelected}
            >
              Remind Selected ({selectedMemberIds.length})
            </Button>
          )}
        </Group>
      </Paper>

      {/* ── Member Progress ── */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Box>
            <Text fw={700} fz="md">Member Lifecycle Progress</Text>
            <Text fz="xs" c="dimmed" mt={2}>Contribution status per member across all rounds</Text>
          </Box>
          {progressLoading && <Loader size="xs" color={PRIMARY} />}
        </Group>
        <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 480 }}>
          <Table.Thead>
            <Table.Tr style={{ background: '#f8f9fa' }}>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Member</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Rounds Paid</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Late Payments</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Payout Position</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#495057' }}>Payout Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {progress.length === 0 && !progressLoading && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="xl" fz="sm">No progress data available</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {progress.map((p) => {
              const isPaid = (p.status ?? '').toUpperCase() === 'PAID'
              const hasMissed = Number(p.missedPayments ?? 0) > 0
              return (
                <Table.Tr key={p.userId}>
                  <Table.Td>
                    <Group gap="sm" align="center">
                      <Avatar size={28} radius="xl" color="gray">{(p.name || '?').charAt(0)}</Avatar>
                      <Text fz="sm" fw={500}>{p.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm">{p.roundsPaid ?? 0} / {p.totalRounds ?? '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c={hasMissed ? 'red' : 'dimmed'}>{p.missedPayments ?? 0}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="dimmed">#{p.payoutPosition ?? '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      radius="sm"
                      style={{
                        background: isPaid ? '#e6f5f1' : '#fdf3e7',
                        color: isPaid ? PRIMARY : '#e67e22',
                        border: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {isPaid ? 'Paid Out' : 'Upcoming'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table></div>
      </Paper>

      {/* ── Peer Review Section ── */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Box>
            <Text fw={700} fz="md">Peer Reviews</Text>
            <Text fz="xs" c="dimmed" mt={2}>Member reviews after each cycle — admin can also submit</Text>
          </Box>
          {reviewsLoading && <Loader size="xs" color={PRIMARY} />}
          {reviewSuccess && (
            <Group gap="xs">
              <IconCheck size={14} color={PRIMARY} />
              <Text fz="xs" fw={500} style={{ color: PRIMARY }}>Review submitted</Text>
            </Group>
          )}
        </Group>

        <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 480 }}>
          <Table.Thead>
            <Table.Tr style={{ background: '#f8f9fa' }}>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Member</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Rating</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Comment</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {activeMembers.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" py="xl" fz="sm">No active members to review</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {activeMembers.map((m) => {
              const review = reviews.find((r) => r.userId === m.userId)
              return (
                <Table.Tr key={m.userId}>
                  <Table.Td>
                    <Group gap="sm" align="center">
                      <Avatar size={28} radius="xl" color="gray">{(m.name || '?').charAt(0)}</Avatar>
                      <Text fz="sm" fw={500}>{m.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {review ? (
                      <Group gap={2}>
                        {[1,2,3,4,5].map((s) => (
                          <span key={s} style={{ color: s <= review.rating ? '#F59E0B' : '#D1D5DB', fontSize: 16 }}>★</span>
                        ))}
                      </Group>
                    ) : (
                      <Text fz="xs" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="dimmed">{review?.comment || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      variant="subtle"
                      size="xs"
                      style={{ color: PRIMARY }}
                      px="xs"
                      onClick={() => {
                        setReviewError(null)
                        setAdminReviewMember(m)
                        setAdminRating(review?.rating ?? 0)
                        setAdminComment(review?.comment ?? '')
                      }}
                    >
                      {review ? 'Edit Review' : 'Add Review'}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table></div>
      </Paper>

      {/* Review Modal */}
      {adminReviewMember && (
        <Modal
          opened={!!adminReviewMember}
          onClose={() => setAdminReviewMember(null)}
          centered
          radius="md"
          size="sm"
          title={<Text fw={700} fz="md">Review: {adminReviewMember.name}</Text>}
        >
          <Stack gap="md">
            <Box>
              <Text fz="sm" fw={500} mb={8}>Rating</Text>
              <Group gap={8}>
                {[1,2,3,4,5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setAdminRating(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: s <= adminRating ? '#F59E0B' : '#D1D5DB', padding: 0 }}
                  >
                    ★
                  </button>
                ))}
              </Group>
            </Box>
            <Textarea
              label="Comment (optional)"
              placeholder="e.g. Consistently paid on time, great group member..."
              radius="md"
              minRows={3}
              value={adminComment}
              onChange={(e) => setAdminComment(e.currentTarget.value)}
              styles={{ input: { border: '1px solid #dee2e6' } }}
            />
            {reviewError && (
              <Text fz="sm" c="red">{reviewError}</Text>
            )}
            <Group justify="flex-end" gap="sm">
              <Button variant="default" radius="md" size="sm" onClick={() => setAdminReviewMember(null)}>Cancel</Button>
              <Button
                radius="md"
                size="sm"
                style={{ background: PRIMARY }}
                loading={submittingReview}
                disabled={adminRating === 0}
                onClick={handleSubmitReview}
              >
                Submit Review
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Stack>
  )
}
