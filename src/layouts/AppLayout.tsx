import { AppShell, Burger, Group, Text, UnstyledButton, SimpleGrid, Paper, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={600} size="lg">
              Ajoti
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <NavLink label="Home" href="/" />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
          
          {/* Wallet Card */}
          <Paper p="xl" radius="md" style={{ 
            background: 'linear-gradient(135deg,  #066f5B 0%,  #10b981 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Stack gap={0}>
              <Text size="sm" opacity={0.8}>Wallet Balance</Text>
              <Text size="xl" fw={700}>₦0.00</Text>
            </Stack>
          </Paper>

          {/* Savings Card */}
          <Paper p="xl" radius="md" style={{ 
            background: 'linear-gradient(135deg, #9bb1da 0%, #ccd8f0 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">My Savings</Text>
              <Text size="xl" fw={700}>₦0.00</Text>
            </Stack>
          </Paper>

          {/* Goals Card */}
          <Paper p="xl" radius="md" style={{ 
            background: 'linear-gradient(135deg, #a8d0b2 0%, #d1e8d7 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Stack gap={0}>
              <Text size="sm" c="dimmed">My Goals</Text>
              <Text size="xl" fw={700}>₦0.00</Text>
            </Stack>
          </Paper>

        </SimpleGrid>
        
        
        
        



        {children}
      </AppShell.Main>
    </AppShell>
  )
}

interface NavLinkProps {
  label: string
  href: string
}

function NavLink({ label, href }: NavLinkProps) {
  return (
    <UnstyledButton
      component="a"
      href={href}
      className="block w-full rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100"
    >
      {label}
    </UnstyledButton>
  )
}
