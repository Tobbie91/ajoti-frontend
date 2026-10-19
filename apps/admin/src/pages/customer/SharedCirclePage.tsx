import { useEffect, useState } from 'react'
import { Alert, Button, Loader, Stack } from '@mantine/core'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { getRoscaCircle, type RoscaCircle } from '@/utils/api'
import { circleAccess } from '@/utils/circle-access'
import { GroupDetail } from '../GroupDetail'
import { GroupDetails } from './GroupDetails'
import { GrowthActivities } from './GrowthActivities'

export function LegacyCircleRedirect({ management = false }: { management?: boolean }) {
  const { id } = useParams()
  const [params] = useSearchParams()
  const next = new URLSearchParams(params)
  if (management) next.set('view', 'manage')
  return <Navigate replace to={`/rosca/${id}${next.size ? `?${next}` : ''}`} />
}

export function SharedCirclePage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const [circle, setCircle] = useState<RoscaCircle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    setCircle(null)
    setError(null)
    if (id) getRoscaCircle(id).then(value => { if (active) setCircle(value) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load this group.') })
    return () => { active = false }
  }, [id, version])
  if (error) return <Stack><Alert role="alert" color="red">{error}</Alert><Button onClick={() => setVersion(v => v + 1)}>Try again</Button></Stack>
  if (!circle) return <Loader aria-label="Loading group" />
  let userId = ''
  try { const user = JSON.parse(localStorage.getItem('user') ?? '{}'); userId = user.id ?? user._id ?? '' } catch { /* no cached identity */ }
  const { manage: admin, view } = circleAccess(circle, userId)
  // The server's detail/preview decision remains authoritative; never promote a preview.
  if (!view) return <GroupDetails key={id} previewOnlyOverride />
  if (params.get('view') === 'manage' && admin) return <GroupDetail key={id} />
  return <GrowthActivities key={id} />
}
