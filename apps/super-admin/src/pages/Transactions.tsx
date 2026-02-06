import { Title, Text, Card, Stack } from '@mantine/core'

export function Transactions() {
  return (
    <Stack gap="md">
      <Title order={2}>Transactions</Title>
      <Card withBorder p="xl">
        <Text c="dimmed">Transaction history interface coming soon.</Text>
      </Card>
    </Stack>
  )
}
