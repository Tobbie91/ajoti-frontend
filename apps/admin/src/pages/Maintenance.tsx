import { Stack, Title, Text, ThemeIcon, Button } from '@mantine/core'
import { IconTools } from '@tabler/icons-react'

export function Maintenance() {
  return (
    <Stack align="center" justify="center" mih="100vh" gap="lg" p="xl">
      <ThemeIcon size={64} radius="xl" variant="light" color="orange">
        <IconTools size={32} />
      </ThemeIcon>
      <Stack align="center" gap={4}>
        <Title order={2}>Scheduled Maintenance</Title>
        <Text c="dimmed" ta="center" maw={400}>
          The Ajoti admin panel is temporarily unavailable. Please check back shortly.
        </Text>
      </Stack>
      <Button variant="subtle" onClick={() => window.location.reload()}>
        Refresh
      </Button>
    </Stack>
  )
}
