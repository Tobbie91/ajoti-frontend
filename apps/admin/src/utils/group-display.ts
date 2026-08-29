import type { RoscaCircle } from '@/utils/api'

export type GroupDisplayStatus = 'Not Ready' | 'Ready' | 'Active' | 'Completed'

export function getGroupDisplayStatus(circle: Pick<RoscaCircle, 'status' | 'filledSlots' | 'maxSlots' | 'totalSlots'>): GroupDisplayStatus {
  const rawStatus = (circle.status ?? '').toUpperCase()
  if (rawStatus === 'COMPLETED') return 'Completed'
  if (rawStatus === 'ACTIVE' || rawStatus === 'STARTED') return 'Active'

  const filled = circle.filledSlots ?? 0
  const total = circle.maxSlots ?? circle.totalSlots ?? 0
  return rawStatus === 'DRAFT' && total > 0 && filled >= total ? 'Ready' : 'Not Ready'
}

export function canInviteToCircle(circle: Pick<RoscaCircle, 'status'>): boolean {
  return (circle.status ?? '').toUpperCase() === 'DRAFT'
}

export function groupStatusDescription(status: GroupDisplayStatus): string {
  switch (status) {
    case 'Not Ready':
      return 'Waiting for enough members before this group can start.'
    case 'Ready':
      return 'All required member slots are filled. This group is ready to start.'
    case 'Active':
      return 'This group has started and contributions are in progress.'
    case 'Completed':
      return 'This group has finished all of its cycles.'
  }
}
