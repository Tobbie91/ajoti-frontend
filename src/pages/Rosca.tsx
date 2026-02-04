import { Stack, Title, Text, Button } from '@mantine/core'
import { Link } from 'react-router-dom'

export function Rosca() {
  return (
    <div className="px-6 py-8">
      <Stack gap="xs">
        <Title order={2}>ROSCA</Title>
        <Text c="dimmed">
          This section is being finalized. You can return to the dashboard for now.
        </Text>
        <Button component={Link} to="/home" radius="md" w={180}>
          Back to Home
        </Button>
      </Stack>
    </div>
  )
}
