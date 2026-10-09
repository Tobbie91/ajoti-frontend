import { Button, Text } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useRoscaJoinEligibility } from '@/hooks/useRoscaJoinEligibility'

export function RoscaJoinAction({ circleId, label = 'Request to Join', unavailableReason }: {
  circleId: string; label?: string; unavailableReason?: string
}) {
  const navigate = useNavigate()
  const { eligibility, error, reload } = useRoscaJoinEligibility()
  return (
    <div>
      <Button color="teal" radius="md" disabled={Boolean(unavailableReason) || !eligibility?.canJoin}
        onClick={() => navigate(`/rosca/${circleId}/join`)}>{label}</Button>
      <Text size="xs" c="dimmed" mt={6}>
        {unavailableReason ?? (error ? 'Could not check your participation limit.' : eligibility
          ? eligibility.canJoin
            ? `${eligibility.ongoingMemberships} of ${eligibility.limit} ongoing groups joined or pending.`
            : `You can join up to ${eligibility.limit} ongoing groups at a time. Pending requests count toward this limit.`
          : 'Checking your participation limit…')}
      </Text>
      {error && <Button size="xs" variant="subtle" onClick={reload}>Check again</Button>}
    </div>
  )
}
