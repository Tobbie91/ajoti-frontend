import { useState } from 'react'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { NavLink, Stack, Text, Box, Badge, ScrollArea } from '@mantine/core'
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
  IconHeadset,
  IconUsersGroup,
  IconBuildingBank,
} from '@tabler/icons-react'
import { type Permission, getStaffRoleFromStorage, hasPermission } from '@/utils/permissions'

type NavLink_ = { label: string; icon: React.FC<{ size?: number; stroke?: number }>; path: string; permission: Permission | null }

const mainLinks: NavLink_[] = [
  { label: 'Dashboard',     icon: IconLayoutDashboard, path: '/',              permission: null },
  { label: 'Manage Users',  icon: IconUsers,            path: '/manage-users', permission: null },
  { label: 'KYC Approvals', icon: IconShieldCheck,      path: '/kyc-approvals',permission: 'MANAGE_KYC' },
  { label: 'Manage ROSCA',  icon: IconTopologyRing,     path: '/manage-rosca', permission: 'MANAGE_CIRCLES' },
  { label: 'Wallets',       icon: IconWallet,            path: '/wallets',      permission: 'VIEW_LEDGER' },
  { label: 'Platform Accounts', icon: IconBuildingBank,  path: '/system-accounts', permission: 'VIEW_SYSTEM_ACCOUNTS' },
  { label: 'Trust Scores',  icon: IconAward,             path: '/trust-scores', permission: null },
  { label: 'Simulations',   icon: IconTestPipe,          path: '/simulations',  permission: 'MANAGE_CIRCLES' },
  { label: 'Support',       icon: IconHeadset,           path: '/support',      permission: 'MANAGE_TICKETS' },
]

const savingsChildren = [
  { label: 'Fixed Savings',  icon: IconChartLine, path: '/savings/FixedSavings',  comingSoon: true },
  { label: 'Target Savings', icon: IconTarget,    path: '/savings/TargetSavings', comingSoon: true },
]

const bottomLinks: NavLink_[] = [
  { label: 'Transactions',    icon: IconReceipt,     path: '/transactions',  permission: 'VIEW_LEDGER' },
  { label: 'Staff Management',icon: IconUsersGroup,  path: '/staff',         permission: 'MANAGE_ADMIN_ACCOUNTS' },
  { label: 'Settings & Logs', icon: IconSettings,    path: '/settings-logs', permission: 'VIEW_AUDIT_LOGS' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const [savingsOpened, setSavingsOpened] = useState(
    location.pathname.startsWith('/savings'),
  )

  const staffRole = getStaffRoleFromStorage()
  const visibleMain = mainLinks.filter((l) => !l.permission || hasPermission(staffRole, l.permission))
  const visibleBottom = bottomLinks.filter((l) => !l.permission || hasPermission(staffRole, l.permission))

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box p="md" mb="md" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text fw={800} fz={22} c="primary.5">
          Ajoti
        </Text>
        <Badge size="xs" variant="light" color="green" radius="sm">BETA</Badge>
      </Box>

      <ScrollArea style={{ flex: 1 }} type="auto" scrollbarSize={6} offsetScrollbars>
      <Stack gap={4} px="xs" pb="md">
        {visibleMain.map((link) => (
          <NavLink
            key={link.path}
            component={RouterNavLink}
            to={link.path}
            label={link.label}
            leftSection={<link.icon size={20} stroke={1.5} />}
            active={location.pathname === link.path}
            onClick={onClose}
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
              onClick={onClose}
            />
          ))}
        </NavLink>

        {visibleBottom.map((link) => (
          <NavLink
            key={link.path}
            component={RouterNavLink}
            to={link.path}
            label={link.label}
            leftSection={<link.icon size={20} stroke={1.5} />}
            active={location.pathname === link.path}
            onClick={onClose}
          />
        ))}
      </Stack>
      </ScrollArea>
    </Box>
  )
}
