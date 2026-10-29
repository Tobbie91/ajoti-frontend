import './customer-theme.css'
import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

export function AdminLayout() {
  const [opened, { toggle, close }] = useDisclosure()

  return (
    <AppShell
      className="customer-shell"
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          backgroundColor: 'var(--customer-cream)',
        },
        navbar: {
          backgroundColor: 'var(--customer-forest)',
          borderRight: '1px solid var(--customer-forest)',
        },
      }}
    >
      <AppShell.Header>
        <Header opened={opened} onToggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar>
        <Sidebar onClose={close} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
