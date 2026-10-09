import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useWalletPrivacy } from '@/hooks/useWalletPrivacy'
import { getWalletBuckets, type WalletBucket } from '@/utils/api/member-wallet'
import { getWalletBalance } from '@/utils/api'
import { getMyTargetSavings } from '@/utils/targetSavingsApi'

export type Reservation = { id: string; name: string; kind: string; amount: string; href?: string }
function money(value: string) {
  const amount = BigInt(value)
  return `₦${(amount / 100n).toLocaleString('en-NG')}.${(amount % 100n).toString().padStart(2, '0')}`
}

export function ReservationSummary({ items, total, hidden = false, loading = false, error, onRefresh }: {
  items: Reservation[]; total: string | null; hidden?: boolean; loading?: boolean; error?: string; onRefresh?: () => void
}) {
  const amount = (value: string) => hidden ? '••••••' : money(value)
  return <Card withBorder radius="xl" p="lg" component="section" aria-label="Reserved money breakdown">
    <Group justify="space-between" align="flex-start">
      <div><Text fw={700} size="lg">Where your money is reserved</Text>
        <Text size="sm" c="dimmed">Held for your groups and savings plans</Text></div>
      {onRefresh && <Button variant="subtle" color="teal" size="xs" onClick={onRefresh}>Refresh reservations</Button>}
    </Group>
    <Text size="sm" c="dimmed" mt="md">Total reserved</Text>
    <Text size="xl" fw={700} c="#0b6b55">{loading ? 'Loading…' : total === null ? 'Unavailable' : amount(total)}</Text>
    {error && <Alert color="orange" mt="md" role="status">{error}</Alert>}
    {!loading && <Stack gap={0} mt="md">
      {items.map(item => <Group key={item.id} justify="space-between" wrap="wrap" py="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <div><Text fw={600}>{item.name}</Text><Badge variant="light" color={item.kind === 'Target Savings' ? 'blue' : 'teal'} mt={4}>{item.kind}</Badge></div>
        <div style={{ textAlign: 'right' }}><Text fw={700}>{amount(item.amount)}</Text>
          {item.href && <Button component={Link} to={item.href} variant="subtle" color="teal" size="xs" px={0} aria-label={`Open ${item.name}`}>Open →</Button>}</div>
      </Group>)}
      {!error && total !== null && items.length === 0 && <Text size="sm" c="dimmed">No money is currently reserved.</Text>}
    </Stack>}
    <Text size="xs" c="dimmed" mt="md">Reserved money is included in your wallet balance but is unavailable to spend.</Text>
  </Card>
}

function reservation(bucket: WalletBucket, names: Map<string, string>): Reservation {
  if (bucket.bucketType === 'ROSCA') return { id: bucket.id, amount: bucket.reservedAmount, kind: 'ROSCA collateral',
    name: bucket.rosca?.circleName ?? 'ROSCA group unavailable', href: bucket.rosca ? `/rosca/${bucket.rosca.circleId}` : undefined }
  if (bucket.bucketType === 'TARGET') return { id: bucket.id, amount: bucket.reservedAmount, kind: 'Target Savings',
    name: names.get(bucket.sourceId) ?? 'Savings plan unavailable', href: names.has(bucket.sourceId) ? `/target-savings#target-plan-${bucket.sourceId}` : undefined }
  return { id: bucket.id, amount: bucket.reservedAmount, kind: 'Other reservation', name: 'Other wallet reservation' }
}

export function WalletReservations() {
  const { hidden } = useWalletPrivacy()
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState<{ items: Reservation[]; total: string | null; error?: string }>({ items: [], total: null })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.allSettled([getWalletBuckets(), getWalletBalance(), getMyTargetSavings()]).then(([buckets, balance, plans]) => {
      if (!active) return
      const names = new Map(plans.status === 'fulfilled' ? plans.value.map(p => [p.id, p.name]) : [])
      const items = buckets.status === 'fulfilled'
        ? buckets.value.filter(b => BigInt(b.reservedAmount) > 0n).map(b => reservation(b, names)) : []
      const total = balance.status === 'fulfilled' ? String(balance.value.reserved) : null
      const listed = items.reduce((sum, item) => sum + BigInt(item.amount), 0n)
      let error = buckets.status === 'rejected' ? 'Could not load the reservation breakdown. Please refresh.'
        : balance.status === 'rejected' ? 'Could not load the reserved total. Please refresh.' : undefined
      if (plans.status === 'rejected' && items.some(item => item.kind === 'Target Savings')) error = 'Savings plan names could not be loaded. Please refresh.'
      if (buckets.status === 'fulfilled' && total !== null && BigInt(total) > listed) items.push({ id: 'unattributed', name: 'Other wallet reservations', kind: 'Other reservation', amount: (BigInt(total) - listed).toString() })
      if (total !== null && listed > BigInt(total)) error = 'The reservation breakdown and wallet total differ. Please refresh or contact support.'
      setData({ items, total, error })
      setLoading(false)
    })
    return () => { active = false }
  }, [refresh])
  return <ReservationSummary {...data} hidden={hidden} loading={loading} onRefresh={() => setRefresh(value => value + 1)} />
}
