import { Title, Stack, Tabs, Paper, Text, Group, Switch, Select, Divider, Box, NumberInput } from '@mantine/core';
import { SecurityLogs } from '@/components/securityLogs';
import { useState } from 'react';

export function SettingsLogs() {
  const [activeTab, setActiveTab] = useState<string | null>('general');
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Security settings state
  const [enable2FA, setEnable2FA] = useState(false);
  const [autoLogout, setAutoLogout] = useState('30 mins');
  const [failedLogins, setFailedLogins] = useState(5);

  return (
    <Stack gap="md">
      <Title order={2}>Settings & Logs</Title>
      
      <Paper withBorder radius="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="security">Security</Tabs.Tab>
          </Tabs.List>

          <Box p="md">
            {/* General Settings Tab */}
            <Tabs.Panel value="general">
              <Stack gap="md">
                {/* General Section */}
                <div>
                  <Text fw={600} size="lg" mb="md">General</Text>
                  
                  {/* Enable Registration */}
                    <Group justify="space-between">
                      <Text fw={500}>Enable Registration</Text>
                      <Switch
                        checked={enableRegistration}
                        onChange={(event) => setEnableRegistration(event.currentTarget.checked)}
                        size="md"
                        color="#066F5B"
                      />
                    </Group>

                  {/* Default Timezone */}
                    <div>
                      <Text fw={500} mb="xs">Default Time zone</Text>
                      <Select
                        placeholder="Select timezone"
                        data={[
                          { value: 'UTC', label: '(GMT + 00:00) UTC' },
                          { value: 'WAT', label: '(GMT +01:00) West Africa Time' },
                          { value: 'EST', label: '(GMT -05:00) Eastern Time' },
                          { value: 'PST', label: '(GMT -08:00) Pacific Time' },
                          { value: 'CET', label: '(GMT +01:00) Central European Time' },
                          { value: 'IST', label: '(GMT +05:30) Indian Standard Time' },
                        ]}
                        defaultValue="UTC"
                        size="md"
                      />
                    </div>
                </div>

                <Divider />

                {/* Maintenance Mode Section */}
                <div>
                  <Group justify="space-between" align="center">
                    <Text fw={600} size="lg" >Maintenance Mode</Text>
                    <Switch
                      checked={maintenanceMode}
                      onChange={(event) => setMaintenanceMode(event.currentTarget.checked)}
                      size="md"
                      color="#066F5B"
                    />
                  </Group>
                </div>


                {/* Language Section */}
                <div>
                  <Text fw={600} size="lg" mb="md">Default Language</Text>
                  
                    <Select
                      placeholder="Select language"
                      data={[
                        { value: 'en', label: 'English' },
                        { value: 'fr', label: 'French' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'pt', label: 'Portuguese' },
                        { value: 'sw', label: 'Swahili' },
                        { value: 'yo', label: 'Yoruba' },
                        { value: 'ha', label: 'Hausa' },
                        { value: 'ig', label: 'Igbo' },
                      ]}
                      defaultValue="en"
                      size="md"
                    />
                </div>
              </Stack>
            </Tabs.Panel>

            {/* Security Settings Tab */}
            <Tabs.Panel value="security">
              <Stack gap="md">
                {/* Security Section Title */}
                <Text fw={600} size="lg">Security</Text>
                
                {/* Password Policy */}
                  <Text fw={500}>Password Policy</Text>
                  <Select
                    placeholder="Select password policy"
                    data={[
                      { value: 'standard', label: 'Standard (8 characters, 1 number)' },
                      { value: 'strong', label: 'Strong (10 characters, 1 uppercase, 1 number, 1 special)' },
                      { value: 'very-strong', label: 'Very Strong (12 characters, mix of cases, numbers, special)' },
                    ]}
                    defaultValue="standard"
                  />

                {/* Enable 2FA */}
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>Enable 2FA</Text>
                    </div>
                    <Switch
                      checked={enable2FA}
                      onChange={(event) => setEnable2FA(event.currentTarget.checked)}
                      size="md"
                      color="#066F5B"
                    />
                  </Group>

                {/* Auto logout after inactivity */}
                  <div>
                    <Text fw={500} mb="xs">Auto logout after inactivity</Text>
                    <Select
                      placeholder="Select duration"
                      data={[
                        { value: '15 mins', label: '15 minutes' },
                        { value: '30 mins', label: '30 minutes' },
                        { value: '1 hour', label: '1 hour' },
                        { value: '2 hours', label: '2 hours' },
                        { value: '4 hours', label: '4 hours' },
                      ]}
                      value={autoLogout}
                      onChange={(value) => setAutoLogout(value || '30 mins')}
                    />
                  </div>

                {/* Lock Account after X failed logins */}
                  <Group justify="space-between" align="flex-end">
                    <div style={{ flex: 1 }}>
                      <Text fw={500} mb="xs">Lock Account after X failed logins</Text>
                      <NumberInput
                        placeholder="Number of attempts"
                        value={failedLogins}
                        onChange={(val) => setFailedLogins(Number(val) || 5)}
                        min={1}
                        max={10}
                        rightSection={<Text size="sm" c="dimmed">times</Text>}
                      />
                    </div>
                  </Group>
              </Stack>
            </Tabs.Panel>
          </Box>
        </Tabs>
      </Paper>

      {/* Security Logs - Always visible below tabs */}
      <SecurityLogs />
    </Stack>
  );
}