import type { RoscaCircle } from './api/rosca'

/** Presentation capabilities only. Every API must enforce authorization itself. */
export function circleAccess(circle: RoscaCircle, userId: string) {
  const membership = circle.userMembershipStatus
    ?? circle.members?.find(member => member.userId === userId)?.status
  const approvedMember = ['ACTIVE', 'COMPLETED'].includes(String(membership))
  const preview = circle.previewOnly === true
  const manage = !preview && circle.isRequestingUserAdmin === true
  return {
    approvedMember: !preview && approvedMember,
    view: !preview && (approvedMember || manage),
    manage,
    sendChat: !preview && membership === 'ACTIVE' && circle.status === 'ACTIVE',
  }
}
