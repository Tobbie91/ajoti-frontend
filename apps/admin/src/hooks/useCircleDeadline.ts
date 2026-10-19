import { useEffect, useState } from 'react'
import { getRoscaSchedules, type RoscaCircle } from '@/utils/api/rosca'
export interface CircleDeadline { circleId: string; groupName: string; cycleNumber: number; deadline: string }
/** Every candidate comes from a circle-scoped authorized schedule; never match groups by display name. */
export function useCircleDeadline(circles: RoscaCircle[], ready: boolean) {
  const [deadline, setDeadline] = useState<CircleDeadline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!ready) return
    let active = true
    setLoading(true); setError(false); setDeadline(null)
    const unique = [...new Map(circles.map(circle => [circle.id, circle])).values()]
    Promise.all(unique.filter(circle => ['ACTIVE', 'STARTED'].includes(circle.status.toUpperCase())).map(async circle => ({ circle, schedules: await getRoscaSchedules(circle.id) })))
      .then(results => {
        const candidates = results.flatMap(({ circle, schedules }) => schedules.filter(schedule =>
          ['UPCOMING', 'IN_PROGRESS'].includes(schedule.status.toUpperCase()) && schedule.cycleNumber != null && Number.isFinite(Date.parse(schedule.contributionDeadline ?? '')))
          .map(schedule => ({ circleId: circle.id, groupName: circle.name, cycleNumber: schedule.cycleNumber!, deadline: schedule.contributionDeadline! })))
          .sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))
        if (active) setDeadline(candidates[0] ?? null)
      }).catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [circles, ready])
  return { deadline, loading, error }
}
