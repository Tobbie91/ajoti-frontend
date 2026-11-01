import { useEffect, useState } from 'react'
import { Button, Group, Paper, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { getMyDebts } from '@/utils/api'
import { kobo, formatKobo } from '@/utils/kobo'

/** Private account summary: never derived from a circle roster or public data. */
export function OwnDebtNotice({ hidden }: { hidden: boolean }) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState<{ loading: boolean; error: boolean; total: bigint | null }>({ loading: true, error: false, total: null })

  useEffect(() => {
    let active = true
    setState({ loading: true, error: false, total: null })
    getMyDebts().then(rows => {
      if (!Array.isArray(rows)) throw new Error('Debt balance unavailable')
      let total = 0n
      for (const row of rows) {
        const amount = kobo(row.outstandingTotal)
        if (amount === null || amount < 0n) throw new Error('Debt balance unavailable')
        total += amount
      }
      if (active) setState({ loading: false, error: false, total })
    }).catch(() => {
      if (active) setState({ loading: false, error: true, total: null })
    })
    return () => { active = false }
  }, [version])

  if (state.total === 0n && !state.loading && !state.error) return null
  return (
    <Paper component="section" aria-label="Your outstanding debt" withBorder radius="md" p="md" style={{ borderColor: '#F5C36C', background: '#FFFBEB' }}>
      <Group justify="space-between" gap="sm" wrap="wrap">
        <div>
          <Text fw={700}>{state.loading ? 'Checking your debt balance…' : state.error ? 'Debt balance unavailable' : `Your outstanding debt: ${hidden ? '••••••' : formatKobo(state.total?.toString())}`}</Text>
          {state.total !== null && state.total > 0n && <Text size="sm">Incoming available money repays your debts across all circles before new cycle contributions.</Text>}
          {state.error && <Text size="sm">We could not confirm your outstanding balance. Try again.</Text>}
        </div>
        <Group gap="sm">
          {state.error && <Button size="xs" variant="light" onClick={() => setVersion(value => value + 1)}>Retry debt balance</Button>}
          <Text component={Link} to="/debts" fw={600} size="sm">View your debts</Text>
        </Group>
      </Group>
    </Paper>
  )
}
