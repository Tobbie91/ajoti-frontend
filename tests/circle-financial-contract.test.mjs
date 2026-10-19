import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatKobo, kobo, sumKobo, koboPercent } from '../apps/admin/src/utils/kobo.ts'
import { contributionDeadline, followingWatPayout, watCutoffTime } from '../apps/admin/src/utils/deadline-extension.ts'

test('kobo formatting preserves cents above the safe integer range and negative balances', () => {
  assert.equal(formatKobo('900719925474099399'), '₦9,007,199,254,740,993.99')
  assert.equal(formatKobo('-101'), '-₦1.01')
  assert.equal(sumKobo(['999999999999999999', '1']), 1000000000000000000n)
  assert.equal(koboPercent('249999', '500000'), 49.99)
})
test('unavailable and malformed financial values never become zero', () => {
  for (const value of [undefined, null, '', '1.5', '1e5', Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(kobo(value), null)
    assert.equal(formatKobo(value), 'Unavailable')
  }
  assert.equal(sumKobo(['0', null]), null)
  assert.equal(koboPercent('0', '0'), null)
  assert.equal(formatKobo('0'), '₦0.00')
})
test('extensions preserve the explicit WAT cutoff and derive the following calendar day', () => {
  const watTimestamp = (iso) => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso))
  assert.equal(watCutoffTime('2030-10-16T17:00:00Z'), '18:00:00')
  assert.equal(contributionDeadline('2030-10-16', '18:00'), '2030-10-16T18:00:00+01:00')
  const endOfDayDeadline = '2030-10-16T23:59:59+01:00'
  const endOfDayPayout = followingWatPayout(endOfDayDeadline)
  assert.equal(endOfDayPayout, '2030-10-16T23:00:00.000Z')
  assert.equal(watTimestamp(endOfDayPayout), '17/10/2030, 00:00:00')
  assert.equal(Date.parse(endOfDayPayout) - Date.parse(endOfDayDeadline), 1000)
  const midnightDeadline = '2030-10-17T00:00:00+01:00'
  const midnightPayout = followingWatPayout(midnightDeadline)
  assert.equal(midnightPayout, '2030-10-17T23:00:00.000Z')
  assert.equal(watTimestamp(midnightPayout), '18/10/2030, 00:00:00')
  assert.equal(Date.parse(midnightPayout) - Date.parse(midnightDeadline), 86400000)
  assert.equal(followingWatPayout('2032-02-29T18:00:00+01:00'), '2032-02-29T23:00:00.000Z')
  assert.equal(followingWatPayout('2030-12-31T18:00:00+01:00'), '2030-12-31T23:00:00.000Z')
  assert.equal(contributionDeadline('2030-02-30', '18:00:00'), null)
  assert.equal(contributionDeadline('2030-10-16', '24:00:00'), null)
})
