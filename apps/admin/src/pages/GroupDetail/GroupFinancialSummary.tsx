import { Box, Paper, SimpleGrid, Text } from '@mantine/core'

interface GroupFinancialSummaryProps {
  collectedKobo: string | null
  remainingKobo: string | null
  loading?: boolean
}

function formatKobo(value: string | null, loading: boolean) {
  if (loading) return 'Loading…'
  if (value === null) return 'Unavailable'
  const amount = BigInt(value)
  const absolute = amount < 0n ? -amount : amount
  return `${amount < 0n ? '-' : ''}₦${(absolute / 100n).toLocaleString('en-NG')}.${(absolute % 100n).toString().padStart(2, '0')}`
}

export function GroupFinancialSummary({ collectedKobo, remainingKobo, loading = false }: GroupFinancialSummaryProps) {
  return (
    <Box style={{ flex: '1 1 420px', minWidth: 0 }}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <Paper p="md" radius="md" style={{ background: '#0b6b55' }}>
          <Text fz="sm" c="white">Group balance remaining</Text>
          <Text fz={28} fw={700} c="white" mt={6} style={{ overflowWrap: 'anywhere' }}>{formatKobo(remainingKobo, loading)}</Text>
          <Text fz="xs" c="white" mt={8} style={{ opacity: 0.85 }}>Money left after payouts and deductions.</Text>
        </Paper>
        <Paper p="md" radius="md" style={{ background: '#eef8f4', border: '1px solid #d2e9df' }}>
          <Text fz="sm" c="#34584d">Total contributions collected</Text>
          <Text fz={28} fw={700} c="#0b6b55" mt={6} style={{ overflowWrap: 'anywhere' }}>{formatKobo(collectedKobo, loading)}</Text>
          <Text fz="xs" c="#34584d" mt={8}>All contributions received, including amounts already paid out.</Text>
        </Paper>
      </SimpleGrid>
      <Text fz="xs" c="dimmed" mt={8}>Wallet top-ups and reserved collateral are separate.</Text>
    </Box>
  )
}
