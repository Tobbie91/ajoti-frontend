import { useState } from 'react'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { NavLink, Stack, Text, Box, Badge } from '@mantine/core'
import {
  IconLayoutDashboard,
  IconUsers,
  IconTopologyRing,
  IconPigMoney,
  IconChartLine,
  IconTarget,
  IconReceipt,
  IconSettings,
  IconShieldCheck,
  IconAward,
  IconTestPipe,
  IconWallet,
} from '@tabler/icons-react'

const mainLinks = [
  { label: 'Dashboard', icon: IconLayoutDashboard, path: '/' },
  { label: 'Manage Users', icon: IconUsers, path: '/manage-users' },
  { label: 'KYC Approvals', icon: IconShieldCheck, path: '/kyc-approvals' },
  { label: 'Manage ROSCA', icon: IconTopologyRing, path: '/manage-rosca' },
  { label: 'Wallets', icon: IconWallet, path: '/wallets' },
  { label: 'Trust Scores', icon: IconAward, path: '/trust-scores' },
  { label: 'Simulations', icon: IconTestPipe, path: '/simulations' },
]

const savingsChildren = [
  { label: 'Fixed Savings', icon: IconChartLine, path: '/savings/FixedSavings', comingSoon: true },
  { label: 'Target Savings', icon: IconTarget, path: '/savings/TargetSavings', comingSoon: true },
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
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {child.label}
                  {child.comingSoon && (
                    <Badge size="xs" variant="light" color="gray">
                      Soon
                    </Badge>
                  )}
                </span>
              }
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
