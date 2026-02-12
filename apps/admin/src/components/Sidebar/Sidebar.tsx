import { useState } from 'react'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { NavLink, Stack, Text, Box, Divider } from '@mantine/core'
import {
  IconLayoutDashboard,
  IconUsers,
  IconTopologyRing,
  IconPigMoney,
  IconChartLine,
  IconShieldCheck,
  IconReceipt,
  IconSettings,
} from '@tabler/icons-react'

const mainLinks = [
  { label: 'Dashboard', icon: IconLayoutDashboard, path: '/' },
  { label: 'Manage Users', icon: IconUsers, path: '/manage-users' },
  { label: 'Manage ROSCA', icon: IconTopologyRing, path: '/manage-rosca' },
]

const savingsChildren = [
  { label: 'Investment', icon: IconChartLine, path: '/savings/investment' },
  { label: 'Insurance', icon: IconShieldCheck, path: '/savings/insurance' },
]

const bottomLinks = [
  { label: 'Transactions', icon: IconReceipt, path: '/transactions' },
  { label: 'Settings & Logs', icon: IconSettings, path: '/settings-logs' },
]

const PRIMARY = '#0b6b55'

export function Sidebar() {
  const location = useLocation()
  const [savingsOpened, setSavingsOpened] = useState(
    location.pathname.startsWith('/savings'),
  )

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box px="lg" py="md">
        <Text fw={900} fz={22} style={{ color: PRIMARY, letterSpacing: 1 }}>
          AJOTI
        </Text>
      </Box>

      <Divider />

      {/* Nav links */}
      <Stack gap={2} px="xs" py="md" style={{ flex: 1 }}>
        {mainLinks.map((link) => (
          <NavLink
            key={link.path}
            component={RouterNavLink}
            to={link.path}
            label={link.label}
            leftSection={<link.icon size={19} stroke={1.5} />}
            active={isActive(link.path)}
            styles={{
              root: {
                borderRadius: 8,
                fontWeight: isActive(link.path) ? 600 : 400,
              },
            }}
          />
        ))}

        <NavLink
          label="Savings"
          leftSection={<IconPigMoney size={19} stroke={1.5} />}
          childrenOffset={24}
          opened={savingsOpened}
          onChange={() => setSavingsOpened((o) => !o)}
          active={location.pathname.startsWith('/savings')}
          styles={{ root: { borderRadius: 8 } }}
        >
          {savingsChildren.map((child) => (
            <NavLink
              key={child.path}
              component={RouterNavLink}
              to={child.path}
              label={child.label}
              leftSection={<child.icon size={17} stroke={1.5} />}
              active={location.pathname === child.path}
              styles={{ root: { borderRadius: 8 } }}
            />
          ))}
        </NavLink>

        <Divider my="xs" />

        {bottomLinks.map((link) => (
          <NavLink
            key={link.path}
            component={RouterNavLink}
            to={link.path}
            label={link.label}
            leftSection={<link.icon size={19} stroke={1.5} />}
            active={isActive(link.path)}
            styles={{
              root: {
                borderRadius: 8,
                fontWeight: isActive(link.path) ? 600 : 400,
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  )
}
