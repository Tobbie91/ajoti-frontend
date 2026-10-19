import assert from 'node:assert/strict'
import { test } from 'node:test'
import { circleAccess } from '../apps/admin/src/utils/circle-access.ts'

const circle = { status: 'ACTIVE', members: [{ userId: 'me', status: 'ACTIVE' }] }
test('approved members share visibility without management', () => {
  assert.deepEqual(circleAccess(circle, 'me'), { approvedMember: true, view: true, manage: false, sendChat: true })
})
test('organiser membership retains member capabilities', () => {
  assert.equal(circleAccess({ ...circle, isRequestingUserAdmin: true }, 'me').approvedMember, true)
  assert.equal(circleAccess({ ...circle, isRequestingUserAdmin: true }, 'me').manage, true)
  assert.equal(circleAccess({ ...circle, isRequestingUserAdmin: true }, 'other').sendChat, false)
})
test('completed membership retains visibility and cannot send', () => {
  assert.deepEqual(circleAccess({ ...circle, userMembershipStatus: 'COMPLETED' }, 'me'), { approvedMember: true, view: true, manage: false, sendChat: false })
  assert.equal(circleAccess({ ...circle, status: 'COMPLETED' }, 'me').sendChat, false)
})
test('explicit unapproved status overrides a stale roster and previews fail closed', () => {
  for (const userMembershipStatus of ['PENDING', 'REJECTED', 'REMOVED']) {
    assert.equal(circleAccess({ ...circle, userMembershipStatus }, 'me').view, false)
    assert.equal(circleAccess({ ...circle, userMembershipStatus }, 'me').sendChat, false)
  }
  assert.equal(circleAccess({ ...circle, previewOnly: true, isRequestingUserAdmin: true }, 'me').view, false)
  assert.equal(circleAccess(circle, 'other').view, false)
})
