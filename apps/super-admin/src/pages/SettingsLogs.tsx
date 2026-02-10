import { Title, Stack } from '@mantine/core'
import { SecurityLogs } from '@/components/securityLogs'

export function SettingsLogs() {
  return (
    <Stack gap="md">
      <Title order={2}>Settings & Logs</Title>
      <SecurityLogs />
    </Stack>
  )
}
