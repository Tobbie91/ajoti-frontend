const IDLE_TIMEOUT_MS = 3 * 60 * 1000
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel', 'scroll',
]

/** Coordinate one customer's inactivity deadline across same-origin tabs. */
export function watchCustomerInactivity(userId: string, onIdle: () => void): () => void {
  const key = `ajoti:customer-last-activity:${userId}`
  let lastActivity = Date.now()
  let lastPublished = 0
  let publishTimeout: number | undefined
  let timeout: number
  let stopped = false

  const publishActivity = () => {
    publishTimeout = undefined
    if (stopped) return
    try { localStorage.setItem(key, String(lastActivity)) } catch { /* Use local activity. */ }
    lastPublished = Date.now()
  }

  const latestActivity = () => {
    try {
      const shared = Number(localStorage.getItem(key))
      if (Number.isFinite(shared) && shared > 0 && shared <= Date.now()) {
        lastActivity = Math.max(lastActivity, shared)
      }
    } catch { /* The local deadline still works if browser storage is unavailable. */ }
    return lastActivity
  }

  const schedule = () => {
    window.clearTimeout(timeout)
    const remaining = IDLE_TIMEOUT_MS - (Date.now() - latestActivity())
    timeout = window.setTimeout(checkDeadline, Math.max(0, remaining))
  }

  function checkDeadline() {
    if (stopped) return
    // Re-read shared state here as well: background tabs may receive storage
    // events late or wake with a timer that was scheduled before sibling activity.
    if (Date.now() - latestActivity() < IDLE_TIMEOUT_MS) {
      schedule()
      return
    }
    stopped = true
    onIdle()
  }

  const activity = () => {
    if (stopped) return
    lastActivity = Date.now()
    // Pointer movement can fire hundreds of times a second. Publish at most
    // once per second; the current tab retains its exact local timestamp.
    if (lastActivity - lastPublished >= 1000) {
      window.clearTimeout(publishTimeout)
      publishActivity()
    } else if (publishTimeout === undefined) {
      // Publish the final event in a burst too, keeping the shared deadline
      // accurate when the user stops moving just after a throttled write.
      publishTimeout = window.setTimeout(publishActivity, 1000 - (lastActivity - lastPublished))
    }
    schedule()
  }

  const sharedActivity = (event: StorageEvent) => {
    if (!stopped && event.key === key) schedule()
  }
  const checkOnResume = () => {
    if (!stopped && document.visibilityState === 'visible') checkDeadline()
  }

  ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, activity, { passive: true }))
  window.addEventListener('storage', sharedActivity)
  document.addEventListener('visibilitychange', checkOnResume)
  activity()

  return () => {
    stopped = true
    window.clearTimeout(timeout)
    window.clearTimeout(publishTimeout)
    ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, activity))
    window.removeEventListener('storage', sharedActivity)
    document.removeEventListener('visibilitychange', checkOnResume)
  }
}
