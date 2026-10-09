import { useEffect, useState } from 'react'
import { getRoscaJoinEligibility, type RoscaJoinEligibility } from '@/utils/api'

export function useRoscaJoinEligibility() {
  const [eligibility, setEligibility] = useState<RoscaJoinEligibility | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    setEligibility(null)
    setError(null)
    getRoscaJoinEligibility().then(result => {
      if (active) setEligibility(result)
    }).catch((failure: unknown) => {
      if (active) setError(failure instanceof Error ? failure.message : 'Could not check your group participation limit.')
    })
    return () => { active = false }
  }, [version])
  return { eligibility, error, reload: () => setVersion(previous => previous + 1) }
}
