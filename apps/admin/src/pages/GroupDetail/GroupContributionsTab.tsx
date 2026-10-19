import { useEffect, useState } from 'react'
import { Alert, Button, Loader, Paper, Select, Stack, Table, Text } from '@mantine/core'
import { getAllCircleContributions, getRoscaSchedules, type Contribution, type RoscaSchedule } from '@/utils/api'
import { formatKobo } from '@/utils/kobo'
import { watDate } from '@/utils/wat-date'

export function GroupContributionsTab({ circleId, isActive }: { circleId: string | undefined; isActive: boolean }) {
  const [rows, setRows] = useState<Contribution[] | null>(null)
  const [schedules, setSchedules] = useState<RoscaSchedule[]>([])
  const [error, setError] = useState(false)
  const [scheduleError, setScheduleError] = useState(false)
  const [cycle, setCycle] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!circleId || !isActive) return
    let active = true
    setSchedules([]); setScheduleError(false)
    getRoscaSchedules(circleId).then(value => { if (active) setSchedules(value) }).catch(() => { if (active) setScheduleError(true) })
    return () => { active = false }
  }, [circleId, isActive, version])
  useEffect(() => {
    if (!isActive || !circleId) return
    let active = true
    setRows(null); setError(false)
    getAllCircleContributions(circleId, cycle == null ? undefined : Number(cycle)).then(value => { if (active) setRows(value) }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [circleId, isActive, cycle, version])
  return <Paper withBorder p="md" radius="md"><Stack>
    <Text fw={700}>Contribution History</Text>
    <Button variant="outline" size="xs" onClick={() => setVersion(value => value + 1)}>Refresh contributions</Button>
    {scheduleError && <Alert color="red">Unable to load historical cycle selection. Refresh to try again.</Alert>}
    <Select label="Contribution history cycle" placeholder="Current cycle" clearable value={cycle} onChange={setCycle} data={schedules.filter(item => item.cycleNumber != null).map(item => ({ value: String(item.cycleNumber), label: `Cycle ${item.cycleNumber}` }))} />
    {error ? <Alert role="alert" color="red">Unable to load contribution history. Refresh to try again.</Alert> : rows === null ? <Loader aria-label="Loading contribution history" /> : rows.length === 0 ? <Text>No recorded contributions for this cycle.</Text> :
      <Table.ScrollContainer minWidth={480}><Table><Table.Thead><Table.Tr>{['Member', 'Cycle', 'Amount received', 'Paid at'].map(label => <Table.Th key={label}>{label}</Table.Th>)}</Table.Tr></Table.Thead>
        <Table.Tbody>{rows.map((row, index) => <Table.Tr key={index}><Table.Td>{row.memberName}</Table.Td><Table.Td>Cycle {row.cycleNumber}</Table.Td><Table.Td>{formatKobo(row.amount)}</Table.Td><Table.Td>{watDate(row.paidAt)}</Table.Td></Table.Tr>)}</Table.Tbody>
      </Table></Table.ScrollContainer>}
    <Text size="xs" c="dimmed">Recorded payments only. Personal penalties, collateral and debt information are private.</Text>
  </Stack></Paper>
}
