import { Box, Group, Paper, Progress, Text } from '@mantine/core'

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
  const known = !loading && collectedKobo !== null && remainingKobo !== null
  const collected = known ? BigInt(collectedKobo) : 0n
  const remaining = known ? BigInt(remainingKobo) : 0n
  const percentage = collected > 0n ? Number(remaining * 10000n / collected) / 100 : 0
  const fill = Math.min(100, Math.max(0, percentage))
  const remainingLabel = formatKobo(remainingKobo, loading)
  const collectedLabel = formatKobo(collectedKobo, loading)
  return (
    <Box style={{ flex: '1 1 420px', minWidth: 0 }}>
      <Paper p="lg" radius="md" style={{ background: '#eef8f4', border: '1px solid #d2e9df' }}>
        <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
          <Box>
            <Text fz="sm" c="#34584d">Group balance remaining</Text>
            <Text fz={30} fw={700} c="#0b6b55" mt={4} style={{ overflowWrap: 'anywhere' }}>{remainingLabel}</Text>
          </Box>
          <Box>
            <Text fz="xs" c="#34584d">Total contributions collected</Text>
            <Text fz="lg" fw={600} c="#34584d" mt={4}>{collectedLabel}</Text>
          </Box>
        </Group>
        <Progress
          mt="md" size={18} radius="xl" color="#0b6b55" value={fill}
          aria-label="Group funds remaining"
          aria-valuenow={known ? fill : undefined}
          aria-valuetext={known ? `${remainingLabel} remaining out of ${collectedLabel} collected` : remainingLabel}
          aria-busy={loading}
          styles={{ root: { background: '#d5e5de' } }}
        />
        <Text fz="sm" fw={500} c="#0b6b55" mt={8}>
          {!known ? remainingLabel : collected === 0n ? 'No contributions yet' : `${fill.toLocaleString('en-NG', { maximumFractionDigits: 1 })}% of collected contributions remains`}
        </Text>
        <Text fz="xs" c="#34584d" mt={4}>The filled bar shows money left after payouts and deductions.</Text>
      </Paper>
      <Text fz="xs" c="dimmed" mt={8}>Wallet top-ups and reserved collateral are separate.</Text>
    </Box>
  )
}
