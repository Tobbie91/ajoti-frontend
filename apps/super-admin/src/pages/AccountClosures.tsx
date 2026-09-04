import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Group, Loader, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { completeAccountClosure, listAccountClosures, placeAccountClosureLegalHold, retryAccountClosureCleanup, type AccountClosure } from '@/utils/api'

export function AccountClosures() {
  const [items, setItems] = useState<AccountClosure[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [holdReasons, setHoldReasons] = useState<Record<string, string>>({})
  const load = useCallback(async () => { setLoading(true); try { setItems(await listAccountClosures()) } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const act = async (id: string, operation: () => Promise<unknown>, message: string) => {
    setBusy(id); try { await operation(); notifications.show({ color: 'green', message }); await load() }
    catch (error) { notifications.show({ color: 'red', message: error instanceof Error ? error.message : 'Action failed' }) }
    finally { setBusy(null) }
  }
  if (loading) return <Loader />
  return <Stack>
    <Title order={2}>Account closure queue</Title>
    <Alert color="orange">Closing customer access does not erase identity, KYC, transaction, ledger, fraud, or audit records. A legal hold closes access while preserving the case; it is not a rejection of the customer’s request.</Alert>
    {items.length === 0 && <Text c="dimmed">No closure requests.</Text>}
    <SimpleGrid cols={{ base: 1, lg: 2 }}>
      {items.map(item => <Card key={item.id} withBorder>
        <Stack gap="xs">
          <Group justify="space-between"><Text fw={700}>{item.user.firstName} {item.user.lastName}</Text><Badge>{item.status}</Badge></Group>
          <Text size="sm">{item.user.email} · {item.user.phone}</Text>
          <Text size="sm">KYC: {item.user.kyc?.status ?? 'not submitted'} · Provider cleanup: {item.providerCleanupStatus}</Text>
          {item.isEmptyAccount && <Badge color="green" variant="light">Expedited: blank pre-KYC account</Badge>}
          {item.reason && <Text size="sm">Customer reason: {item.reason}</Text>}
          {item.providerCleanupError && <Text size="sm" c="red">{item.providerCleanupError}</Text>}
          <Group>
            {item.providerCleanupStatus === 'FAILED' && <Button loading={busy === item.id} onClick={() => void act(item.id, () => retryAccountClosureCleanup(item.id), 'Provider cleanup completed')}>Retry provider cleanup</Button>}
            {!['COMPLETED', 'LEGAL_HOLD'].includes(item.status) && <Button color="green" loading={busy === item.id} disabled={['PENDING', 'FAILED'].includes(item.providerCleanupStatus)} onClick={() => void act(item.id, () => completeAccountClosure(item.id), 'Closure completed')}>Complete closure</Button>}
          </Group>
          {!['COMPLETED', 'LEGAL_HOLD'].includes(item.status) && <Group align="end"><TextInput style={{ flex: 1 }} label="Legal-hold reason" value={holdReasons[item.id] ?? ''} onChange={e => setHoldReasons(v => ({ ...v, [item.id]: e.currentTarget.value }))}/><Button color="red" variant="light" disabled={!holdReasons[item.id]?.trim()} loading={busy === item.id} onClick={() => void act(item.id, () => placeAccountClosureLegalHold(item.id, holdReasons[item.id]), 'Legal hold recorded; customer access remains closed')}>Place hold</Button></Group>}
        </Stack>
      </Card>)}
    </SimpleGrid>
  </Stack>
}
