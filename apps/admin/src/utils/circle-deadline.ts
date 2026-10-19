export type CircleDeadlineState = 'upcoming' | 'overdue' | 'completed' | 'planned' | 'unavailable' | 'failed'

export function getCircleDeadlineState({
  circleStatus,
  deadline,
  failed = false,
  now = Date.now(),
}: {
  circleStatus?: string | null
  deadline?: string | null
  failed?: boolean
  now?: number
}): CircleDeadlineState {
  if (failed) return 'failed'
  const status = (circleStatus ?? '').toUpperCase()
  if (status === 'COMPLETED') return 'completed'
  if (status === 'DRAFT') return 'planned'
  const timestamp = deadline ? Date.parse(deadline) : NaN
  if (!Number.isFinite(timestamp)) return 'unavailable'
  return timestamp <= now ? 'overdue' : 'upcoming'
}

export const circleDeadlineLabel: Record<CircleDeadlineState, string> = {
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  completed: 'Completed',
  planned: 'Planned',
  unavailable: 'Unavailable',
  failed: 'Failed to load',
}
