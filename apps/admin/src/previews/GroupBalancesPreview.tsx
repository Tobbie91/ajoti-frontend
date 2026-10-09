import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Badge, Box, Container, Group, MantineProvider, Paper, SegmentedControl, Stack, Tabs, Text, ThemeIcon } from '@mantine/core'
import { IconTopologyRing } from '@tabler/icons-react'
import '@mantine/core/styles.css'
import '../index.css'
import { GroupFinancialSummary } from '../pages/GroupDetail/GroupFinancialSummary'

const examples = {
  partial: { collectedKobo: '62500000', remainingKobo: '37500000', description: '₦625,000 collected. ₦250,000 already paid out, including deductions. ₦375,000 remains.' },
  before: { collectedKobo: '25000000', remainingKobo: '25000000', description: '₦250,000 collected. No payout yet, so the full ₦250,000 remains.' },
  paid: { collectedKobo: '125000000', remainingKobo: '0', description: '₦1,250,000 collected over the group’s lifetime. Everything has been paid out, so the remaining balance is ₦0.' },
  empty: { collectedKobo: '0', remainingKobo: '0', description: 'No contributions yet. Both figures correctly show ₦0.' },
}

function GroupBalancesPreview() {
  const [scenario, setScenario] = useState<keyof typeof examples>('partial')
  const example = examples[scenario]
  return (
    <Box bg="#f7f9fb" mih="100vh" py="xl">
      <Container size="lg">
        <Stack gap="lg">
          <Group justify="space-between">
            <Text fw={700} c="#0b6b55" size="xl">AJOTI</Text>
            <Badge color="orange" variant="light">Preview · sample data</Badge>
          </Group>
          <Paper p="md" radius="md" withBorder>
            <Text fw={600}>Issue 1: see both totals without calculating</Text>
            <Text size="sm" c="dimmed" mt={4}>Choose a situation to see the proposed group header. This preview needs no login or backend.</Text>
            <SegmentedControl mt="md" fullWidth value={scenario} onChange={value => setScenario(value as keyof typeof examples)} data={[
              { value: 'partial', label: 'After a payout' }, { value: 'before', label: 'Before payouts' },
              { value: 'paid', label: 'Fully paid out' }, { value: 'empty', label: 'No payments' },
            ]} styles={{ root: { flexWrap: 'wrap' }, label: { whiteSpace: 'normal' } }} />
          </Paper>
          <Paper p="lg" radius="md" withBorder>
            <Group align="center" gap="xl" wrap="wrap">
              <Group gap="md" style={{ flex: '0 1 300px' }}>
                <ThemeIcon size={64} radius="xl" color="#0b6b55"><IconTopologyRing size={32} /></ThemeIcon>
                <Box>
                  <Group gap="xs"><Text fw={700} size="xl">Huawei Group</Text><Badge color="teal" variant="light">Active</Badge></Group>
                  <Text size="sm" c="dimmed" mt={4}>Monthly · ₦50,000 · 5/5 members</Text>
                </Box>
              </Group>
              <GroupFinancialSummary collectedKobo={example.collectedKobo} remainingKobo={example.remainingKobo} />
            </Group>
          </Paper>
          <Tabs defaultValue="payments" color="teal">
            <Tabs.List>
              <Tabs.Tab value="members">Member Management</Tabs.Tab>
              <Tabs.Tab value="payments">Payment Oversight</Tabs.Tab>
              <Tabs.Tab value="payouts">Payouts</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="payments" pt="lg"><Paper p="lg" withBorder radius="md"><Text fw={600}>What these figures mean</Text><Text mt="sm">{example.description}</Text></Paper></Tabs.Panel>
            <Tabs.Panel value="members" pt="lg"><Text c="dimmed">The member management screen stays below this shared group header.</Text></Tabs.Panel>
            <Tabs.Panel value="payouts" pt="lg"><Text c="dimmed">Payout records stay below this shared group header.</Text></Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
    </Box>
  )
}

createRoot(document.getElementById('root')!).render(<MantineProvider><GroupBalancesPreview /></MantineProvider>)
