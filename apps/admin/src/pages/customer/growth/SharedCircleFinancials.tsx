import { watDate } from '@/utils/wat-date'
import { useEffect, useState, type ReactNode } from 'react'
import { Alert, Badge, Button, Group, Loader, Paper, Select, SimpleGrid, Stack, Table, Text } from '@mantine/core'
import { getPayoutHistory } from '@/utils/api'
import { getSharedHealth, getSharedProgress, getContributionSummary, getSharedDisbursements, getRatingSummary } from '@/utils/api/shared-circle'
import { formatKobo, sumKobo } from '@/utils/kobo'

function ReadSection<T>({ id, title, read, cycle, refreshVersion, children }: {
  id: string; title: string; read: (id: string, cycle?: number) => Promise<T>; cycle?: number; refreshVersion: number; children: (data: T) => ReactNode
}) {
  const [data, setData] = useState<T | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setData(null); setFailed(false)
    read(id, cycle).then(value => { if (active) setData(value) }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [id, read, cycle, refreshVersion, retry])
  return <Paper withBorder radius="md" p="md"><Stack gap="sm">
    <Text fw={700}>{title}</Text>
    {failed ? <Alert color="red" role="alert">Unable to load {title.toLowerCase()}. <Button size="xs" variant="subtle" onClick={() => setRetry(value => value + 1)}>Try again</Button></Alert>
      : data === null ? <Group role="status"><Loader size="sm" /><Text>Loading {title.toLowerCase()}…</Text></Group> : children(data)}
  </Stack></Paper>
}
function Rows({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return rows.length === 0 ? <Text c="dimmed">No records available.</Text> : <Table.ScrollContainer minWidth={560}><Table striped>
    <Table.Thead><Table.Tr>{headers.map(header => <Table.Th key={header}>{header}</Table.Th>)}</Table.Tr></Table.Thead>
    <Table.Tbody>{rows.map((row, index) => <Table.Tr key={index}>{row.map((cell, i) => <Table.Td key={i}>{cell}</Table.Td>)}</Table.Tr>)}</Table.Tbody>
  </Table></Table.ScrollContainer>
}
export function SharedCircleFinancials({ circleId, view, currentCycle = 1, cycleNumbers = [], refreshVersion = 0 }: {
  circleId: string; view: 'overview' | 'payouts' | 'ratings'; currentCycle?: number; cycleNumbers?: number[]; refreshVersion?: number
}) {
  const [cycle, setCycle] = useState(String(currentCycle))
  useEffect(() => { setCycle(String(currentCycle)) }, [circleId, currentCycle])
  const numbers = [...new Set([...cycleNumbers, currentCycle])].sort((a, b) => a - b)
  if (view === 'ratings') return <ReadSection id={circleId} title="Aggregate peer ratings" read={getRatingSummary} refreshVersion={refreshVersion}>{ratings => <>
    <Text size="sm" c="dimmed">Ratings use a 1–5 scale. Individual reviews and reviewer identities are private.</Text>
    <Rows headers={['Member', 'Average rating', 'Review count']} rows={ratings.map(item => [item.name, item.totalReviews > 0 && typeof item.averageRating === 'number' && Number.isFinite(item.averageRating) ? `${item.averageRating.toFixed(1)} / 5` : 'Not rated', String(item.totalReviews)])} />
  </>}</ReadSection>
  if (view === 'payouts') return <Stack>
    <ReadSection id={circleId} title="Payout schedule" read={getSharedDisbursements} refreshVersion={refreshVersion}>{data => <Rows headers={['Cycle', 'Recipient', 'Contribution deadline', 'Scheduled payout', 'Settlement', 'Paid out']} rows={data.schedules.map(item => [item.cycleNumber, item.recipientName ?? 'Unassigned', watDate(item.contributionDeadline), watDate(item.payoutDate), item.payoutStatus ?? item.scheduleStatus, item.amountPaidOut == null ? 'Not settled' : formatKobo(item.amountPaidOut)])} />}</ReadSection>
    <ReadSection id={circleId} title="Payout history" read={getPayoutHistory} refreshVersion={refreshVersion}>{items => <Rows headers={['Cycle', 'Recipient', 'Amount', 'Status', 'Processed']} rows={items.map(item => [item.cycleNumber, item.recipientName ?? 'Unavailable', formatKobo(item.amount), <Badge color={item.status === 'FAILED' ? 'red' : 'teal'}>{item.status}</Badge>, watDate(item.processedAt)])} />}</ReadSection>
  </Stack>
  return <Stack>
    <ReadSection id={circleId} title="Group financial health" read={getSharedHealth} refreshVersion={refreshVersion}>{health => <>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        {[['Total collected', formatKobo(health.totalCollected)], ['Expected contributions', formatKobo(sumKobo(health.cycles.map(item => item.expectedPot))?.toString())], ['Outstanding contributions', formatKobo(sumKobo(health.cycles.map(item => item.outstanding))?.toString())]].map(([label, value]) => <div key={label}><Text size="sm" c="dimmed">{label}</Text><Text fw={700}>{value}</Text></div>)}
      </SimpleGrid>
      <Text size="xs" c="dimmed">Group balance remaining is unavailable in the member-safe API. Collected contributions are not an available wallet balance.</Text>
      <Rows headers={['Cycle', 'Deadline', 'Expected', 'Collected', 'Outstanding', 'Paid / expected', 'Status']} rows={health.cycles.map(item => [item.cycleNumber, watDate(item.contributionDeadline), formatKobo(item.expectedPot), formatKobo(item.collected), formatKobo(item.outstanding), `${item.collectedCount} / ${item.expectedCount}`, item.scheduleStatus])} />
    </>}</ReadSection>
    <ReadSection id={circleId} title="Member cycle progress" read={getSharedProgress} refreshVersion={refreshVersion}>{data => <Rows headers={['Member', 'Completed cycles', 'Payout position', 'Payout status']} rows={data.members.map(item => [item.name, `${item.completedCycles} / ${item.durationCycles}`, item.payoutPosition ?? 'Unassigned', item.payoutStatus])} />}</ReadSection>
    <Select label="Contribution summary cycle" value={cycle} onChange={value => { if (value) setCycle(value) }} data={numbers.map(number => ({ value: String(number), label: `Cycle ${number}` }))} />
    <ReadSection id={circleId} title="Contribution summary" read={getContributionSummary} cycle={Number(cycle)} refreshVersion={refreshVersion}>{data => <>
      <Text>Cycle {data.cycleNumber} collected: <strong>{formatKobo(data.totalCollected)}</strong></Text>
      <Rows headers={['Member', 'Amount received', 'Paid at']} rows={data.contributions.map(item => [item.memberName, formatKobo(item.amount), watDate(item.paidAt)])} />
      <Text size="xs" c="dimmed">These are recorded payments. Missing names do not establish unpaid or defaulted status.</Text>
    </>}</ReadSection>
  </Stack>
}
