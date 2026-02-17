import { useState } from 'react'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { NavLink, Stack, Text, Box } from '@mantine/core'
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
  { label: 'Manage User', icon: IconUsers, path: '/manage-users' },
  { label: 'Manage ROSCA', icon: IconTopologyRing, path: '/manage-rosca' },
]

const savingsChildren = [
  { label: 'Fixed Savings', icon: IconChartLine, path: '/savings/FixedSavings' },
  { label: 'Target Savings', icon: IconShieldCheck, path: '/savings/TargetSavings' },
]

const bottomLinks = [
  { label: 'Transactions', icon: IconReceipt, path: '/transactions' },
  { label: 'Settings & Logs', icon: IconSettings, path: '/settings-logs' },
]

export function Sidebar() {
  const location = useLocation()
  const [savingsOpened, setSavingsOpened] = useState(
    location.pathname.startsWith('/savings'),
  )

  return (
    <Box>
      <Box p="md" mb="md">
        <Text fw={800} fz={22} c="primary.5">
          Ajoti
        </Text>
      </Box>

      <Stack gap={4} px="xs">
        {mainLinks.map((link) => (
          <NavLink
            key={link.path}
            component={RouterNavLink}
            to={link.path}
            label={link.label}
            leftSection={<link.icon size={20} stroke={1.5} />}
            active={location.pathname === link.path}
          />
        ))}

        <NavLink
          label="Savings"
          leftSection={<IconPigMoney size={20} stroke={1.5} />}
          childrenOffset={28}
          opened={savingsOpened}
          onChange={() => setSavingsOpened((o) => !o)}
          active={location.pathname.startsWith('/savings')}
        >
          {savingsChildren.map((child) => (
            <NavLink
              key={child.path}
              component={RouterNavLink}
              to={child.path}
              label={child.label}
              leftSection={<child.icon size={18} stroke={1.5} />}
              active={location.pathname === child.path}
            />
          ))}
        </NavLink>

        {bottomLinks.map((link) => (
          <NavLink
            key={link.path}
            component={RouterNavLink}
            to={link.path}
            label={link.label}
            leftSection={<link.icon size={20} stroke={1.5} />}
            active={location.pathname === link.path}
          />
        ))}
      </Stack>
    </Box>
  )
}
