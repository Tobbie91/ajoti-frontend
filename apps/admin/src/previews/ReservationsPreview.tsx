import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Badge, Button, Container, Group, MantineProvider, Stack, Text } from '@mantine/core'
import '@mantine/core/styles.css'
import '../index.css'
import { ReservationSummary } from '../components/WalletReservations'

function Preview() {
  const [hidden, setHidden] = useState(false)
  return <Container size="sm" py="xl"><Stack gap="lg">
    <Group justify="space-between"><Text fw={700} c="#0b6b55" size="xl">AJOTI</Text><Badge color="orange">Sample data</Badge></Group>
    <Text>Dashboard · Reserved money</Text>
    <Button variant="light" color="teal" onClick={() => setHidden(value => !value)}>{hidden ? 'Show amounts' : 'Hide amounts'}</Button>
    <ReservationSummary total="2250000" hidden={hidden} items={[
      { id: 'huawei', name: 'Huawei Group', kind: 'ROSCA collateral', amount: '500000', href: '/rosca/huawei' },
      { id: 'diamond', name: 'Diamond Group', kind: 'ROSCA collateral', amount: '750000', href: '/rosca/diamond' },
      { id: 'school', name: 'School fees', kind: 'Target Savings', amount: '1000000', href: '/target-savings#target-plan-school' },
    ]} />
  </Stack></Container>
}
createRoot(document.getElementById('root')!).render(<MantineProvider><BrowserRouter><Preview /></BrowserRouter></MantineProvider>)
