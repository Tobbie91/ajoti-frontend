import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconChartLine } from '@tabler/icons-react'

export function FixedSavings() {
  return (
    <Center h={400}>
      <Stack align="center" gap="md">
        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
          <IconChartLine size={32} stroke={1.5} />
        </ThemeIcon>
        <Text fw={600} size="lg" c="dimmed">
          Fixed Savings
        </Text>
        <Text size="sm" c="dimmed" ta="center" maw={320}>
          This feature is coming soon. Fixed savings management will be available in a future release.
        </Text>
      </Stack>
    </Center>
  )
}
