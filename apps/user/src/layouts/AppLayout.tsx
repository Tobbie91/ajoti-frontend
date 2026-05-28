import { AppShell, Burger, Text, NavLink, Divider, Box, Avatar, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { ReactNode } from 'react'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader/AppHeader'
import {
  IconHome2,
  IconUsers,
  IconWallet,
  IconUser,
  IconReceipt2,
  IconLogout,
} from '@tabler/icons-react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure(false)
  const location = useLocation()

  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null
  const initials = user
    ? `${(user.firstName || user.firstname || '')[0] ?? ''}${(user.lastName || user.lastname || '')[0] ?? ''}`.toUpperCase()
    : ''
  const fullName = user
    ? `${user.firstName || user.firstname || ''} ${user.lastName || user.lastname || ''}`.trim()
    : 'My account'
  const email = user?.email ?? ''

  function handleLogout() {
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <AppShell
      header={{ height: { base: 70, sm: 106 } }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding={0}
    >
      <AppShell.Header style={{ padding: 0 }}>
        <Box pos="relative" h={{ base: 70, sm: 106 }}>
          <AppHeader initials={initials} accountLabel={fullName} />
          <Box pos="absolute" left={16} top={{ base: 22, sm: 36 }} hiddenFrom="sm">
            <Burger opened={opened} onClick={toggle} size="sm" color="#066F5B" />
          </Box>
        </Box>
      </AppShell.Header>

      <AppShell.Navbar style={{ borderRight: '1px solid #F3F4F6' }}>
        {/* User identity */}
        <Box p="lg" style={{ background: '#066F5B' }}>
          <div className="flex items-center gap-3">
            <Avatar radius="xl" size={44} style={{ background: '#fff', color: '#066F5B', fontWeight: 700 }}>
              {initials || '?'}
            </Avatar>
            <div className="min-w-0">
              <Text fw={700} fz={15} style={{ color: '#fff' }} truncate>
                {fullName}
              </Text>
              <Text fz={12} style={{ color: 'rgba(255,255,255,0.7)' }} truncate>
                {email}
              </Text>
            </div>
          </div>
        </Box>

        <AppShell.Section grow>
          <Stack gap={4} px="xs" pt="xs">
            <NavLink component={RouterNavLink} to="/home" onClick={close} label="Home" leftSection={<IconHome2 size={20} stroke={1.5} />} active={location.pathname === '/home'} />
            <NavLink component={RouterNavLink} to="/rosca" onClick={close} label="ROSCA" leftSection={<IconUsers size={20} stroke={1.5} />} active={location.pathname.startsWith('/rosca')} />
            <NavLink component={RouterNavLink} to="/create-wallet" onClick={close} label="Wallet" leftSection={<IconWallet size={20} stroke={1.5} />} active={location.pathname.startsWith('/create-wallet') || location.pathname.startsWith('/fund') || location.pathname.startsWith('/withdraw')} />
            <NavLink component={RouterNavLink} to="/transactions" onClick={close} label="Transactions" leftSection={<IconReceipt2 size={20} stroke={1.5} />} active={location.pathname === '/transactions'} />
            <Divider my={4} />
            <NavLink component={RouterNavLink} to="/profile" onClick={close} label="Profile" leftSection={<IconUser size={20} stroke={1.5} />} active={location.pathname === '/profile'} />
          </Stack>
        </AppShell.Section>

        <AppShell.Section px="xs" pb="xs" style={{ borderTop: '1px solid #F3F4F6' }}>
          <Stack gap={4} pt="xs">
            <NavLink onClick={handleLogout} label="Log out" leftSection={<IconLogout size={20} stroke={1.5} />} color="red" />
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <div style={{ overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  )
}

