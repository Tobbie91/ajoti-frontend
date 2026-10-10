import { Container, Group, Text } from '@mantine/core'
import { WalletReservations } from '@/components/WalletReservations'

export function WalletReservationsPage() {
  return (
    <Container size="md" py="md">
      <Group gap="xs" mb="md" align="baseline">
        <Text fw={700} fz="xl">Where your money is reserved</Text>
      </Group>
      <Text fz="sm" c="dimmed" mb="lg">
        A breakdown of every pot of money currently locked for an ajo circle or a target savings plan.
      </Text>
      <WalletReservations />
    </Container>
  )
}
