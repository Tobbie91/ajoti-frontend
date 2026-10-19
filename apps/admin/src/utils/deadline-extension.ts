export function watCutoffTime(iso: string | undefined): string {
  const timestamp = iso ? Date.parse(iso) : NaN
  return Number.isFinite(timestamp) ? new Date(timestamp + 3600000).toISOString().slice(11, 19) : ''
}
export function contributionDeadline(date: string | null, time: string): string | null {
  if (!date || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return null
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  const value = `${date.slice(0, 10)}T${normalizedTime}+01:00`
  const instant = Date.parse(value)
  return Number.isFinite(instant) && new Date(instant + 3600000).toISOString().slice(0, 19) === value.slice(0, 19) ? value : null
}
export function followingWatPayout(deadline: string): string | null {
  const timestamp = Date.parse(deadline)
  if (!Number.isFinite(timestamp)) return null
  const day = new Date(timestamp + 3600000)
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + 1, -1)).toISOString()
}
