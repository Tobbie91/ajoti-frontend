import React, { useState } from 'react';
import {
  Container,
  Title,
  Card,
  Text,
  Tabs,
  Switch,
  Select,
  Group,
  Stack,
  Paper,
  Divider,
  rem,
  Box,
} from '@mantine/core';
import { SecurityLogs } from '@/components/securityLogs/SecurityLogs';



export function SettingsLogs() {
  const [activeTab, setActiveTab] = useState<string | null>('general');
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} fw={700}>Settings</Title>
        </div>
      </Group>

      {/* Main Content */}
      <Paper withBorder radius="md">
        {/* Tab List - Simple horizontal tabs */}
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          defaultValue="general"
        >
          <Tabs.List>
            <Tabs.Tab value="general">
              <Text fw={500}>General</Text>
            </Tabs.Tab>
            <Tabs.Tab value="security">
              <Text fw={500}>Security</Text>
            </Tabs.Tab>
          </Tabs.List>

          <Divider />

          {/* Tab Panels */}
          <Box p="xl">
            {/* General Settings Tab */}
            {/* Security Settings Tab */}
            <Tabs.Panel value="general">
              <Stack gap="xl">
                <Title order={2} size="h3">
                  General
                </Title>

                <Paper withBorder radius="md" p="xl">
                  <Group align="flex-start" grow>
                    {/* LEFT COLUMN */}
                    <Stack gap="xl">
                      {/* Password Policy */}
                      <Group justify="space-between">
                        <Text fw={500}>Enable Registration</Text>
                        <Switch size="lg" />
                      </Group>

                      {/* Auto logout */}
                      <Stack gap={6}>
                        <Text fw={500}>Default Time Zone</Text>
                        <Select
                          data={[
                            { value: 'UTC', label: '(GMT +00:00) UTC' },
                            { value: 'WAT', label: '(GMT +01:00) West Africa Time' },
                            { value: 'GMT', label: '(GMT +00:00) Greenwich Mean Time' },
                            { value: 'EST', label: '(GMT -05:00) Eastern Time (US & Canada)' },
                            { value: 'CET', label: '(GMT +01:00) Central European Time' },
                          ]}
                          defaultValue="WAT"
                          w={220}
                        />
                      </Stack>
                    </Stack>

                    {/* RIGHT COLUMN */}
                    <Stack gap="xl">
                      {/* Enable 2FA */}
                      <Group justify="space-between">
                        <Text fw={500}>Maintenance Mode</Text>
                        <Switch size="lg" />
                      </Group>

                      {/* Lock account */}
                      <Stack gap={6}>
                        <Text fw={500}>Default Language</Text>
                        <Select
                          data={[
                            { value: 'English', label: 'English' },
                            { value: 'French', label: 'French' },
                            { value: 'Spanish', label: 'Spanish' },
                          ]}
                          defaultValue="English"
                          w={220}
                        />
                      </Stack>
                    </Stack>
                  </Group>
                </Paper>
              </Stack>
            </Tabs.Panel>


            {/* Security Settings Tab - Simple placeholder */}
            {/* Security Settings Tab */}
              <Tabs.Panel value="security">
                <Stack gap="xl">
                  <Title order={2} size="h3">
                    Security
                  </Title>

                  <Paper withBorder radius="md" p="xl">
                    <Group align="flex-start" grow>
                      {/* LEFT COLUMN */}
                      <Stack gap="xl">
                        {/* Password Policy */}
                        <Group justify="space-between">
                          <Text fw={500}>Password Policy</Text>
                          <Switch size="lg" />
                        </Group>

                        {/* Auto logout */}
                        <Stack gap={6}>
                          <Text fw={500}>Auto logout after inactivity</Text>
                          <Select
                            data={[
                              { value: '15', label: '15 mins' },
                              { value: '30', label: '30 mins' },
                              { value: '60', label: '1 hour' },
                            ]}
                            defaultValue="30"
                            w={220}
                          />
                        </Stack>
                      </Stack>

                      {/* RIGHT COLUMN */}
                      <Stack gap="xl">
                        {/* Enable 2FA */}
                        <Group justify="space-between">
                          <Text fw={500}>Enable 2FA</Text>
                          <Switch size="lg" />
                        </Group>

                        {/* Lock account */}
                        <Stack gap={6}>
                          <Text fw={500}>Lock Account after X failed logins</Text>
                          <Select
                            data={[
                              { value: '3', label: '3 times' },
                              { value: '5', label: '5 times' },
                              { value: '10', label: '10 times' },
                            ]}
                            defaultValue="5"
                            w={220}
                          />
                        </Stack>
                      </Stack>
                    </Group>
                  </Paper>
                </Stack>
              </Tabs.Panel>

            </Box>
        </Tabs>
      </Paper>

      <SecurityLogs />

    </Container>
  );
}

export default SettingsLogs;