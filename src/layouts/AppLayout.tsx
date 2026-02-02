import { AppShell, Avatar, Burger, Drawer, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { useState } from 'react'
import type { ReactNode, ReactNode as ReactNodeType } from 'react'
import { useAuth } from '@/utils/auth'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ME'

  return (
    <AppShell
      header={{ height: { base: 120, sm: 106 } }}
      padding="md"
    >
      <AppShell.Header
        style={{
          background: '#FFFFFF',
          boxShadow: '0px 4px 12px 0px rgba(209, 217, 230, 0.25)',
        }}
      >
        <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-10 sm:py-0">
          <div className="flex items-center justify-between sm:w-auto">
            <Text fw={700} size="xl" c="#0B6B55" className="tracking-wide">
              AJOTI
            </Text>
            <Burger
              opened={isMenuOpen}
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label="Toggle navigation"
              className="sm:hidden"
              color="#0B6B55"
              size="sm"
            />
          </div>

          <Group gap={24} visibleFrom="lg">
            <NavItem icon={<HomeIcon />} label="Home" muted />
            <NavItem icon={<SavingsIcon />} label="Savings" caret muted />
            <NavItem icon={<RoscaIcon />} label="ROSCA" active />
            <NavItem icon={<InvestmentsIcon />} label="Investments" muted />
          </Group>

          <Group gap={12} visibleFrom="sm" className="w-full justify-between sm:w-auto sm:justify-start">
            <UnstyledButton
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E6F4EF]"
            >
              <BellIcon />
            </UnstyledButton>
            <Group gap={10} className="min-w-0 hidden sm:flex">
              <Avatar radius="xl" size={36} src={user?.picture} color="green">
                {user?.picture ? null : initials}
              </Avatar>
              <div className="leading-tight">
                <Text size="sm" c="#111827" fw={600} className="hidden sm:block">
                  {user?.name || 'My account'}
                </Text>
                <Text size="xs" c="#6B7280" className="hidden sm:block">
                  {user?.email || 'Signed in'}
                </Text>
              </div>
            </Group>
          </Group>
        </div>
      </AppShell.Header>

      <AppShell.Main>{children}</AppShell.Main>

      <Drawer
        opened={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="Menu"
        padding="md"
        size="xs"
        className="sm:hidden"
        withOverlay={false}
        overlayProps={{ opacity: 0, blur: 0 }}
      >
        <Stack gap="sm">
          <NavItem icon={<HomeIcon />} label="Home" muted />
          <NavItem icon={<SavingsIcon />} label="Savings" caret muted />
          <NavItem icon={<RoscaIcon />} label="ROSCA" active />
          <NavItem icon={<InvestmentsIcon />} label="Investments" muted />
        </Stack>
      </Drawer>
    </AppShell>
  )
}

interface NavItemProps {
  label: string
  icon: ReactNodeType
  active?: boolean
  caret?: boolean
  muted?: boolean
}

function NavItem({ label, icon, active, caret, muted }: NavItemProps) {
  const color = active ? '#0B6B55' : muted ? '#9CA3AF' : '#111827'

  return (
    <UnstyledButton className="flex items-center gap-2 text-sm font-medium">
      <span className="flex items-center" style={{ color }}>
        {icon}
      </span>
      <span style={{ color }}>{label}</span>
      {caret ? <CaretIcon color={color} /> : null}
    </UnstyledButton>
  )
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}

function SavingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
    </svg>
  )
}

function RoscaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4a8 8 0 1 0 0 16" />
      <path d="M12 4a8 8 0 0 1 0 16" />
    </svg>
  )
}

function InvestmentsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V9" />
      <path d="M10 20V4" />
      <path d="M16 20v-6" />
      <path d="M20 10l-5 5-3-3-4 4" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B6B55" strokeWidth="2">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}


function CaretIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
